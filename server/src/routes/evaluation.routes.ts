import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAudit } from '../services/audit.service';
import { calculateFinalScore } from '../services/scoring.service';

const router = Router();

// POST /api/evaluation/rto-submit/:testId
router.post('/rto-submit/:testId', authMiddleware, requireRole('rto_officer'), (req: Request, res: Response) => {
  const testId = req.params.testId as string;
  const { vehicle_control, manoeuvring, observation_awareness, overall_performance, comments } = req.body;

  // Validate scores
  const scores = [
    { name: 'vehicle_control', value: vehicle_control, max: 10 },
    { name: 'manoeuvring', value: manoeuvring, max: 10 },
    { name: 'observation_awareness', value: observation_awareness, max: 10 },
    { name: 'overall_performance', value: overall_performance, max: 10 },
  ];

  for (const score of scores) {
    if (score.value === undefined || score.value < 0 || score.value > score.max) {
      res.status(400).json({
        error: `${score.name} must be between 0 and ${score.max}`,
      });
      return;
    }
  }

  const db = getDb();

  // Get officer
  const officer = db.prepare(`
    SELECT * FROM rto_officers WHERE user_id = ?
  `).get(req.user!.userId) as any;

  if (!officer) {
    res.status(403).json({ error: 'RTO officer profile not found' });
    return;
  }

  // Verify test exists and AI analysis is done
  const test = db.prepare('SELECT * FROM driving_tests WHERE id = ?').get(testId) as any;
  if (!test) {
    res.status(404).json({ error: 'Driving test not found' });
    return;
  }

  const totalScore = vehicle_control + manoeuvring + observation_awareness + overall_performance;

  // Check if already evaluated
  const existing = db.prepare(`
    SELECT id FROM rto_evaluations WHERE driving_test_id = ?
  `).get(testId) as any;

  if (existing) {
    // Update existing
    db.prepare(`
      UPDATE rto_evaluations SET
        vehicle_control = ?, manoeuvring = ?, observation_awareness = ?,
        overall_performance = ?, total_score = ?, comments = ?,
        submitted_at = datetime('now')
      WHERE id = ?
    `).run(vehicle_control, manoeuvring, observation_awareness, overall_performance, totalScore, comments || '', existing.id);
  } else {
    const evalId = uuid();
    db.prepare(`
      INSERT INTO rto_evaluations (id, driving_test_id, officer_id, vehicle_control, manoeuvring, observation_awareness, overall_performance, total_score, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(evalId, testId, officer.id, vehicle_control, manoeuvring, observation_awareness, overall_performance, totalScore, comments || '');
  }

  // Update test status
  db.prepare(`
    UPDATE driving_tests SET status = 'rto_evaluated', officer_id = ? WHERE id = ?
  `).run(officer.id, testId);

  logAudit(
    req.user!.userId,
    'RTO_EVALUATION_SUBMITTED',
    'rto_evaluation',
    existing?.id || '',
    `RTO Score: ${totalScore}/40`,
    (req.ip as string) || ''
  );

  // Auto-calculate final score if AI evaluation is complete
  const aiEval = db.prepare(`
    SELECT * FROM ai_evaluations WHERE driving_test_id = ? AND status = 'completed'
  `).get(testId);

  let finalResult = null;
  if (aiEval) {
    finalResult = calculateFinalScore(testId);
    if (finalResult) {
      logAudit(
        null,
        'RESULT_GENERATED',
        'final_result',
        finalResult.id,
        `Final Score: ${finalResult.final_score}/100 - ${finalResult.status.toUpperCase()}`,
        req.ip || ''
      );
    }
  }

  // Get full RTO evaluation
  const rtoEval = db.prepare(`
    SELECT * FROM rto_evaluations WHERE driving_test_id = ? ORDER BY submitted_at DESC LIMIT 1
  `).get(testId);

  res.json({
    rtoEval,
    finalResult,
    message: finalResult
      ? `Evaluation submitted. Final Score: ${finalResult.final_score}/100 — ${finalResult.status.toUpperCase()}`
      : 'RTO evaluation submitted successfully',
  });
});

// GET /api/evaluation/result/:testId
router.get('/result/:testId', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const testId = req.params.testId as string;

  const finalResult = db.prepare(`
    SELECT * FROM final_results WHERE driving_test_id = ?
  `).get(testId);

  const aiEval = db.prepare(`
    SELECT * FROM ai_evaluations WHERE driving_test_id = ? AND status = 'completed'
  `).get(testId);

  const rtoEval = db.prepare(`
    SELECT re.*, u.name as officer_name
    FROM rto_evaluations re
    JOIN rto_officers ro ON re.officer_id = ro.id
    JOIN users u ON ro.user_id = u.id
    WHERE re.driving_test_id = ?
  `).get(testId);

  const test = db.prepare(`
    SELECT dt.*,
      b.booking_id, b.candidate_id,
      ts.date as test_date, ts.time as test_time,
      tc.name as center_name,
      u.name as candidate_name,
      a.application_id
    FROM driving_tests dt
    JOIN bookings b ON dt.booking_id = b.id
    JOIN applicants a ON dt.applicant_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
    WHERE dt.id = ?
  `).get(testId);

  res.json({ finalResult, aiEval, rtoEval, test });
});

export default router;
