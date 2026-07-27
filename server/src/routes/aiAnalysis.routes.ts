import { Router, Request, Response } from 'express';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { runAIAnalysis, getAIEvaluation } from '../services/ai-analysis.service';
import { logAudit } from '../services/audit.service';

const router = Router();

// POST /api/ai-analysis/run/:testId
router.post('/run/:testId', authMiddleware, requireRole('rto_officer'), async (req: Request, res: Response) => {
  const testId = req.params.testId as string;
  const db = getDb();

  // Get video for this test
  const video = db.prepare(`
    SELECT * FROM videos WHERE driving_test_id = ? ORDER BY uploaded_at DESC LIMIT 1
  `).get(testId) as any;

  if (!video) {
    res.status(400).json({ error: 'No video uploaded for this test' });
    return;
  }

  // Check if analysis already exists
  const existing = db.prepare(`
    SELECT * FROM ai_evaluations WHERE driving_test_id = ? AND status = 'completed'
  `).get(testId);

  if (existing) {
    res.json({
      message: 'AI analysis already completed',
      evaluation: existing,
      prototype: true,
    });
    return;
  }

  try {
    logAudit(
      req.user!.userId,
      'AI_ANALYSIS_STARTED',
      'driving_test',
      testId,
      'AI analysis initiated',
      (req.ip as string) || ''
    );

    const evalId = await runAIAnalysis(testId, video.id);

    const evaluation = db.prepare(`
      SELECT * FROM ai_evaluations WHERE id = ?
    `).get(evalId);

    logAudit(
      null,
      'AI_ANALYSIS_COMPLETED',
      'ai_evaluation',
      evalId,
      `AI Score: ${(evaluation as any)?.total_score}/60`,
      (req.ip as string) || ''
    );

    res.json({
      message: 'AI analysis completed (Prototype — Simulated Analysis)',
      evaluation,
      prototype: true,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/ai-analysis/:testId
router.get('/:testId', authMiddleware, (req: Request, res: Response) => {
  const testId = req.params.testId as string;
  const evaluation = getAIEvaluation(testId);
  res.json({ evaluation, prototype: true });
});

export default router;
