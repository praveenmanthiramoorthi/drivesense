import { Router, Request, Response } from 'express';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// GET /api/applicant/profile
router.get('/profile', authMiddleware, requireRole('applicant'), (req: Request, res: Response) => {
  const db = getDb();
  const applicant = db.prepare(`
    SELECT a.*, u.name, u.email, u.phone
    FROM applicants a
    JOIN users u ON a.user_id = u.id
    WHERE a.user_id = ?
  `).get(req.user!.userId) as any;

  if (!applicant) {
    res.status(404).json({ error: 'Applicant profile not found' });
    return;
  }

  res.json({ applicant });
});

// GET /api/applicant/dashboard
router.get('/dashboard', authMiddleware, requireRole('applicant'), (req: Request, res: Response) => {
  const db = getDb();
  const userId = req.user!.userId;

  const applicant = db.prepare(`
    SELECT a.*, u.name, u.email, u.phone
    FROM applicants a
    JOIN users u ON a.user_id = u.id
    WHERE a.user_id = ?
  `).get(userId) as any;

  if (!applicant) {
    res.status(404).json({ error: 'Applicant not found' });
    return;
  }

  // Get latest learner test
  const learnerTest = db.prepare(`
    SELECT * FROM learner_tests
    WHERE applicant_id = ?
    ORDER BY started_at DESC LIMIT 1
  `).get(applicant.id);

  // Get booking
  const booking = db.prepare(`
    SELECT b.*, ts.date, ts.time, tc.name as center_name
    FROM bookings b
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
    WHERE b.applicant_id = ?
    ORDER BY b.created_at DESC LIMIT 1
  `).get(applicant.id);

  // Get driving test
  const drivingTest = db.prepare(`
    SELECT dt.*, 
      CASE WHEN v.id IS NOT NULL THEN 1 ELSE 0 END as has_video,
      CASE WHEN ae.id IS NOT NULL THEN ae.status ELSE NULL END as ai_status,
      CASE WHEN re.id IS NOT NULL THEN 1 ELSE 0 END as has_rto_eval
    FROM driving_tests dt
    LEFT JOIN videos v ON v.driving_test_id = dt.id
    LEFT JOIN ai_evaluations ae ON ae.driving_test_id = dt.id
    LEFT JOIN rto_evaluations re ON re.driving_test_id = dt.id
    WHERE dt.applicant_id = ?
    ORDER BY dt.created_at DESC LIMIT 1
  `).get(applicant.id);

  // Get final result
  let finalResult = null;
  if (drivingTest) {
    finalResult = db.prepare(`
      SELECT * FROM final_results WHERE driving_test_id = ?
    `).get((drivingTest as any).id);
  }

  // Get review request
  let reviewRequest = null;
  if (finalResult) {
    reviewRequest = db.prepare(`
      SELECT * FROM review_requests WHERE final_result_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).get((finalResult as any).id);
  }

  res.json({
    applicant,
    learnerTest,
    booking,
    drivingTest,
    finalResult,
    reviewRequest,
  });
});

// GET /api/applicant/result/:drivingTestId
router.get('/result/:drivingTestId', authMiddleware, requireRole('applicant'), (req: Request, res: Response) => {
  const db = getDb();
  const { drivingTestId } = req.params;

  // Verify this test belongs to the applicant
  const applicant = db.prepare(`
    SELECT id FROM applicants WHERE user_id = ?
  `).get(req.user!.userId) as any;

  const test = db.prepare(`
    SELECT * FROM driving_tests WHERE id = ? AND applicant_id = ?
  `).get(drivingTestId, applicant?.id) as any;

  if (!test) {
    res.status(404).json({ error: 'Test not found' });
    return;
  }

  const aiEval = db.prepare(`
    SELECT * FROM ai_evaluations WHERE driving_test_id = ? AND status = 'completed'
  `).get(drivingTestId);

  const rtoEval = db.prepare(`
    SELECT * FROM rto_evaluations WHERE driving_test_id = ?
  `).get(drivingTestId);

  const finalResult = db.prepare(`
    SELECT * FROM final_results WHERE driving_test_id = ?
  `).get(drivingTestId);

  const booking = db.prepare(`
    SELECT b.*, ts.date, ts.time, tc.name as center_name
    FROM bookings b
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
    WHERE b.id = ?
  `).get(test.booking_id);

  res.json({
    test,
    aiEval,
    rtoEval,
    finalResult,
    booking,
  });
});

export default router;
