import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/connection';
import { config } from '../config';
import { logAudit } from '../services/audit.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const validPassword = bcryptjs.compareSync(password, user.password_hash);
  if (!validPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  logAudit(user.id, 'LOGIN', 'user', user.id, `${user.role} login`, req.ip || '');

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
  });
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { email, password, name, phone, role } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const userId = uuid();
  const passwordHash = bcryptjs.hashSync(password, 10);
  const userRole = role || 'applicant';

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, email, passwordHash, name, userRole, phone || '');

  // Create applicant profile if role is applicant
  if (userRole === 'applicant') {
    const applicantId = uuid();
    const appNum = Math.floor(Math.random() * 900) + 100;
    const applicationId = `DS-2026-${appNum}`;
    db.prepare(`
      INSERT INTO applicants (id, user_id, application_id)
      VALUES (?, ?, ?)
    `).run(applicantId, userId, applicationId);
  }

  const token = jwt.sign(
    { userId, email, role: userRole, name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  logAudit(userId, 'REGISTER', 'user', userId, `New ${userRole} registration`, req.ip || '');

  res.status(201).json({
    token,
    user: {
      id: userId,
      email,
      name,
      role: userRole,
      phone: phone || '',
    },
  });
});

// POST /api/auth/demo-login — Quick demo login by role
router.post('/demo-login', (req: Request, res: Response) => {
  const { role } = req.body;

  const db = getDb();
  let email: string;

  switch (role) {
    case 'applicant':
      email = 'aarav@demo.com';
      break;
    case 'rto_officer':
      email = 'priya@rto.com';
      break;
    case 'review_officer':
      email = 'reviewer@drivesense.com';
      break;
    case 'admin':
      email = 'admin@drivesense.com';
      break;
    default:
      res.status(400).json({ error: 'Invalid role' });
      return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    res.status(500).json({ error: 'Demo data not seeded' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  logAudit(user.id, 'DEMO_LOGIN', 'user', user.id, `Demo ${user.role} login`, req.ip || '');

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
  });
});

// POST /api/auth/digilocker-mock — Simulate DigiLocker OAuth
router.post('/digilocker-mock', (req: Request, res: Response) => {
  // Simulate a DigiLocker verification
  // PROTOTYPE: This is a mock integration
  const { aadhaar_last4, name } = req.body;

  // Simulate verification delay
  setTimeout(() => {
    res.json({
      verified: true,
      prototype: true,
      message: 'Identity verification successful (Prototype Simulation)',
      data: {
        name: name || 'Verified User',
        aadhaar_masked: `XXXX-XXXX-${aadhaar_last4 || '1234'}`,
        verification_id: `DL-VER-${uuid().substring(0, 8).toUpperCase()}`,
        verified_at: new Date().toISOString(),
      },
    });
  }, 1000);
});

// GET /api/auth/me — Get current user
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
