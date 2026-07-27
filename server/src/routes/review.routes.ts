import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAudit } from '../services/audit.service';

const router = Router();

// POST /api/review/request
router.post('/request', authMiddleware, requireRole('applicant'), (req: Request, res: Response) => {
  const { finalResultId, reason, description } = req.body;

  if (!finalResultId || !reason) {
    res.status(400).json({ error: 'Result ID and reason are required' });
    return;
  }

  const db = getDb();
  const applicant = db.prepare(`
    SELECT id FROM applicants WHERE user_id = ?
  `).get(req.user!.userId) as any;

  if (!applicant) {
    res.status(404).json({ error: 'Applicant not found' });
    return;
  }

  // Verify result belongs to this applicant
  const result = db.prepare(`
    SELECT fr.* FROM final_results fr
    JOIN driving_tests dt ON fr.driving_test_id = dt.id
    WHERE fr.id = ? AND dt.applicant_id = ?
  `).get(finalResultId, applicant.id);

  if (!result) {
    res.status(404).json({ error: 'Result not found or does not belong to you' });
    return;
  }

  // Check if review already requested
  const existing = db.prepare(`
    SELECT id FROM review_requests WHERE final_result_id = ? AND status IN ('pending', 'in_review')
  `).get(finalResultId);

  if (existing) {
    res.status(409).json({ error: 'A review request already exists for this result' });
    return;
  }

  const reviewId = uuid();
  db.prepare(`
    INSERT INTO review_requests (id, final_result_id, applicant_id, reason, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(reviewId, finalResultId, applicant.id, reason, description || '');

  logAudit(
    req.user!.userId,
    'REVIEW_REQUESTED',
    'review_request',
    reviewId,
    `Reason: ${reason}`,
    req.ip || ''
  );

  res.status(201).json({
    reviewId,
    message: 'Human review request submitted successfully',
  });
});

// GET /api/review/requests — For review officers
router.get('/requests', authMiddleware, requireRole('review_officer'), (req: Request, res: Response) => {
  const db = getDb();
  const { status } = req.query;

  let query = `
    SELECT rr.*,
      u.name as applicant_name, u.email as applicant_email,
      a.application_id,
      fr.final_score, fr.ai_score, fr.rto_score, fr.status as result_status,
      dt.id as driving_test_id,
      ts.date as test_date, ts.time as test_time,
      tc.name as center_name
    FROM review_requests rr
    JOIN applicants a ON rr.applicant_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN final_results fr ON rr.final_result_id = fr.id
    JOIN driving_tests dt ON fr.driving_test_id = dt.id
    JOIN bookings b ON dt.booking_id = b.id
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
  `;

  const params: any[] = [];
  if (status && status !== 'all') {
    query += ' WHERE rr.status = ?';
    params.push(status);
  }

  query += ' ORDER BY rr.created_at DESC';

  const requests = db.prepare(query).all(...params);
  res.json({ requests });
});

// GET /api/review/case/:reviewId — Full case details
router.get('/case/:reviewId', authMiddleware, requireRole('review_officer'), (req: Request, res: Response) => {
  const db = getDb();
  const { reviewId } = req.params;

  const review = db.prepare(`
    SELECT rr.*,
      u.name as applicant_name, u.email as applicant_email, u.phone as applicant_phone,
      a.application_id
    FROM review_requests rr
    JOIN applicants a ON rr.applicant_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE rr.id = ?
  `).get(reviewId) as any;

  if (!review) {
    res.status(404).json({ error: 'Review request not found' });
    return;
  }

  const finalResult = db.prepare(`
    SELECT * FROM final_results WHERE id = ?
  `).get(review.final_result_id) as any;

  const drivingTest = db.prepare(`
    SELECT dt.*,
      b.booking_id, b.candidate_id,
      ts.date as test_date, ts.time as test_time,
      tc.name as center_name
    FROM driving_tests dt
    JOIN bookings b ON dt.booking_id = b.id
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
    WHERE dt.id = ?
  `).get(finalResult?.driving_test_id);

  const video = finalResult ? db.prepare(`
    SELECT * FROM videos WHERE driving_test_id = ?
  `).get(finalResult.driving_test_id) : null;

  const aiEval = finalResult ? db.prepare(`
    SELECT * FROM ai_evaluations WHERE driving_test_id = ? AND status = 'completed'
  `).get(finalResult.driving_test_id) : null;

  const rtoEval = finalResult ? db.prepare(`
    SELECT re.*, u.name as officer_name
    FROM rto_evaluations re
    JOIN rto_officers ro ON re.officer_id = ro.id
    JOIN users u ON ro.user_id = u.id
    WHERE re.driving_test_id = ?
  `).get(finalResult.driving_test_id) : null;

  res.json({
    review,
    finalResult,
    drivingTest,
    video,
    aiEval,
    rtoEval,
  });
});

// POST /api/review/decide/:reviewId
router.post('/decide/:reviewId', authMiddleware, requireRole('review_officer'), (req: Request, res: Response) => {
  const reviewId = req.params.reviewId as string;
  const { decision, comments, modifiedScore } = req.body;

  if (!decision || !['upheld', 'modified', 'reassessment'].includes(decision)) {
    res.status(400).json({ error: 'Valid decision required: upheld, modified, or reassessment' });
    return;
  }

  const db = getDb();

  const review = db.prepare('SELECT * FROM review_requests WHERE id = ?').get(reviewId) as any;
  if (!review) {
    res.status(404).json({ error: 'Review request not found' });
    return;
  }

  db.prepare(`
    UPDATE review_requests SET
      status = ?,
      reviewer_id = ?,
      decision = ?,
      reviewer_comments = ?,
      resolved_at = datetime('now')
    WHERE id = ?
  `).run(decision, req.user!.userId, decision, comments || '', reviewId);

  // If modified, update the final result
  if (decision === 'modified' && modifiedScore !== undefined) {
    const result = db.prepare('SELECT * FROM final_results WHERE id = ?').get(review.final_result_id) as any;
    if (result) {
      const newStatus = modifiedScore >= result.pass_threshold ? 'pass' : 'fail';
      db.prepare(`
        UPDATE final_results SET final_score = ?, status = ?, generated_at = datetime('now')
        WHERE id = ?
      `).run(modifiedScore, newStatus, review.final_result_id);
    }
  }

  logAudit(
    req.user!.userId,
    'REVIEW_DECISION',
    'review_request',
    reviewId,
    `Decision: ${decision}. ${comments || ''}`,
    (req.ip as string) || ''
  );

  res.json({ message: `Review decision: ${decision}`, decision });
});

export default router;
