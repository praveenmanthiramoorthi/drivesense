import { Router, Request, Response } from 'express';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// GET /api/rto/dashboard
router.get('/dashboard', authMiddleware, requireRole('rto_officer', 'review_officer'), (req: Request, res: Response) => {
  const db = getDb();

  // Get officer info
  const officer = db.prepare(`
    SELECT * FROM rto_officers WHERE user_id = ?
  `).get(req.user!.userId) as any;

  // Dashboard metrics
  const today = new Date().toISOString().split('T')[0];

  const todayTests = db.prepare(`
    SELECT COUNT(*) as count FROM driving_tests dt
    JOIN bookings b ON dt.booking_id = b.id
    JOIN test_slots ts ON b.slot_id = ts.id
    WHERE ts.date = ?
  `).get(today) as any;

  const pendingAI = db.prepare(`
    SELECT COUNT(*) as count FROM driving_tests
    WHERE status IN ('scheduled', 'in_progress', 'video_uploaded')
  `).get() as any;

  const pendingRTO = db.prepare(`
    SELECT COUNT(*) as count FROM driving_tests
    WHERE status = 'ai_analyzed'
  `).get() as any;

  const completed = db.prepare(`
    SELECT COUNT(*) as count FROM driving_tests
    WHERE status = 'completed'
  `).get() as any;

  const passCount = db.prepare(`
    SELECT COUNT(*) as count FROM final_results WHERE status = 'pass'
  `).get() as any;

  const totalResults = db.prepare(`
    SELECT COUNT(*) as count FROM final_results
  `).get() as any;

  const passRate = totalResults.count > 0
    ? Math.round((passCount.count / totalResults.count) * 100) : 0;

  res.json({
    officer,
    metrics: {
      todayTests: todayTests.count,
      pendingAI: pendingAI.count,
      pendingRTO: pendingRTO.count,
      completed: completed.count,
      passRate,
    },
  });
});

// GET /api/rto/candidates
router.get('/candidates', authMiddleware, requireRole('rto_officer', 'review_officer'), (req: Request, res: Response) => {
  const db = getDb();
  const { status } = req.query;

  let query = `
    SELECT dt.id, dt.status, dt.created_at,
      b.booking_id, b.candidate_id,
      ts.date as test_date, ts.time as test_time,
      tc.name as center_name,
      u.name as candidate_name, u.email as candidate_email,
      a.application_id,
      CASE WHEN ae.id IS NOT NULL THEN ae.status ELSE 'pending' END as ai_status,
      ae.total_score as ai_score,
      CASE WHEN re.id IS NOT NULL THEN 'completed' ELSE 'pending' END as rto_status,
      re.total_score as rto_score,
      CASE WHEN fr.id IS NOT NULL THEN fr.status ELSE 'pending' END as final_status,
      fr.final_score
    FROM driving_tests dt
    JOIN bookings b ON dt.booking_id = b.id
    JOIN applicants a ON dt.applicant_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
    LEFT JOIN ai_evaluations ae ON ae.driving_test_id = dt.id
    LEFT JOIN rto_evaluations re ON re.driving_test_id = dt.id
    LEFT JOIN final_results fr ON fr.driving_test_id = dt.id
  `;

  const params: any[] = [];
  if (status && status !== 'all') {
    query += ' WHERE dt.status = ?';
    params.push(status);
  }

  query += ' ORDER BY ts.date DESC, ts.time DESC';

  const candidates = db.prepare(query).all(...params);
  res.json({ candidates });
});

// GET /api/rto/candidate/:testId
router.get('/candidate/:testId', authMiddleware, requireRole('rto_officer', 'review_officer'), (req: Request, res: Response) => {
  const db = getDb();
  const { testId } = req.params;

  const test = db.prepare(`
    SELECT dt.*,
      b.booking_id, b.candidate_id,
      ts.date as test_date, ts.time as test_time,
      tc.name as center_name, tc.address as center_address,
      u.name as candidate_name, u.email as candidate_email, u.phone as candidate_phone,
      a.application_id, a.identity_verified, a.learner_licence_status
    FROM driving_tests dt
    JOIN bookings b ON dt.booking_id = b.id
    JOIN applicants a ON dt.applicant_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
    WHERE dt.id = ?
  `).get(testId);

  if (!test) {
    res.status(404).json({ error: 'Test not found' });
    return;
  }

  const video = db.prepare(`
    SELECT * FROM videos WHERE driving_test_id = ? ORDER BY uploaded_at DESC LIMIT 1
  `).get(testId);

  const aiEval = db.prepare(`
    SELECT * FROM ai_evaluations WHERE driving_test_id = ? ORDER BY analyzed_at DESC LIMIT 1
  `).get(testId);

  const rtoEval = db.prepare(`
    SELECT re.*, u.name as officer_name
    FROM rto_evaluations re
    JOIN rto_officers ro ON re.officer_id = ro.id
    JOIN users u ON ro.user_id = u.id
    WHERE re.driving_test_id = ?
    ORDER BY re.submitted_at DESC LIMIT 1
  `).get(testId);

  const finalResult = db.prepare(`
    SELECT * FROM final_results WHERE driving_test_id = ?
  `).get(testId);

  const reviewRequest = finalResult ? db.prepare(`
    SELECT rr.*, u.name as applicant_name
    FROM review_requests rr
    JOIN applicants a ON rr.applicant_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE rr.final_result_id = ?
    ORDER BY rr.created_at DESC LIMIT 1
  `).get((finalResult as any).id) : null;

  res.json({
    test,
    video,
    aiEval,
    rtoEval,
    finalResult,
    reviewRequest,
  });
});

export default router;
