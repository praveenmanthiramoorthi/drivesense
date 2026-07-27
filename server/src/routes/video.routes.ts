import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAudit } from '../services/audit.service';
import { config } from '../config';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.webm', '.avi'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MOV, WebM, AVI) are allowed'));
    }
  },
});

// POST /api/video/upload/:testId
router.post('/upload/:testId', authMiddleware, requireRole('rto_officer'), upload.single('video'), (req: Request, res: Response) => {
  const { testId } = req.params;

  if (!req.file) {
    res.status(400).json({ error: 'No video file uploaded' });
    return;
  }

  const db = getDb();

  // Verify test exists
  const test = db.prepare('SELECT * FROM driving_tests WHERE id = ?').get(testId) as any;
  if (!test) {
    res.status(404).json({ error: 'Driving test not found' });
    return;
  }

  // Save video record
  const videoId = uuid();
  db.prepare(`
    INSERT INTO videos (id, driving_test_id, filename, original_name, size, duration)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(videoId, testId, req.file.filename, req.file.originalname, req.file.size, null);

  // Update test status
  db.prepare(`
    UPDATE driving_tests SET status = 'video_uploaded' WHERE id = ?
  `).run(testId);

  logAudit(
    req.user!.userId,
    'VIDEO_UPLOADED',
    'video',
    videoId,
    `Video uploaded: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`,
    req.ip || ''
  );

  res.json({
    video: {
      id: videoId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
});

// GET /api/video/:videoId
router.get('/:videoId', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.videoId) as any;

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  const filePath = path.join(uploadDir, video.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Video file not found on disk' });
    return;
  }

  res.sendFile(filePath);
});

export default router;
