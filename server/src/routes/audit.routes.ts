import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getAuditLogs, getAuditLogsForUser, getAuditLogsForDrivingTest } from '../services/audit.service';

const router = Router();

// GET /api/audit/logs
router.get('/logs', authMiddleware, (req: Request, res: Response) => {
  const { entityType, entityId, limit } = req.query;
  const logs = getAuditLogs(
    entityType as string | undefined,
    entityId as string | undefined,
    parseInt(limit as string) || 50
  );
  res.json({ logs });
});

// GET /api/audit/user/:userId
router.get('/user/:userId', authMiddleware, (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const logs = getAuditLogsForUser(userId);
  res.json({ logs });
});

// GET /api/audit/driving-test/:testId
router.get('/driving-test/:testId', authMiddleware, (req: Request, res: Response) => {
  const testId = req.params.testId as string;
  const logs = getAuditLogsForDrivingTest(testId);
  res.json({ logs });
});

export default router;
