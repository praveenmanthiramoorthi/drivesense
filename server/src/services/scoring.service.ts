// ============================================================
// DriveSense AI — Score Fusion Service
// ============================================================
// Combines AI Score (60) + RTO Score (40) = Final Score (100)
// ============================================================

import { v4 as uuid } from 'uuid';
import { getDb } from '../database/connection';
import { config } from '../config';

export interface ScoreFusionResult {
  id: string;
  ai_score: number;
  rto_score: number;
  final_score: number;
  pass_threshold: number;
  status: 'pass' | 'fail';
}

export function calculateFinalScore(drivingTestId: string): ScoreFusionResult | null {
  const db = getDb();

  // Get AI evaluation
  const aiEval = db.prepare(`
    SELECT total_score FROM ai_evaluations
    WHERE driving_test_id = ? AND status = 'completed'
    ORDER BY analyzed_at DESC LIMIT 1
  `).get(drivingTestId) as { total_score: number } | undefined;

  // Get RTO evaluation
  const rtoEval = db.prepare(`
    SELECT total_score FROM rto_evaluations
    WHERE driving_test_id = ?
    ORDER BY submitted_at DESC LIMIT 1
  `).get(drivingTestId) as { total_score: number } | undefined;

  if (!aiEval || !rtoEval) {
    return null;
  }

  const aiScore = Math.round(aiEval.total_score * 10) / 10;
  const rtoScore = Math.round(rtoEval.total_score * 10) / 10;
  const finalScore = Math.round((aiScore + rtoScore) * 10) / 10;
  const passThreshold = config.passThreshold;
  const status: 'pass' | 'fail' = finalScore >= passThreshold ? 'pass' : 'fail';

  const resultId = uuid();

  // Check if result already exists
  const existing = db.prepare(`
    SELECT id FROM final_results WHERE driving_test_id = ?
  `).get(drivingTestId) as { id: string } | undefined;

  if (existing) {
    // Update existing result
    db.prepare(`
      UPDATE final_results SET
        ai_score = ?, rto_score = ?, final_score = ?,
        pass_threshold = ?, status = ?, generated_at = datetime('now')
      WHERE driving_test_id = ?
    `).run(aiScore, rtoScore, finalScore, passThreshold, status, drivingTestId);

    return {
      id: existing.id,
      ai_score: aiScore,
      rto_score: rtoScore,
      final_score: finalScore,
      pass_threshold: passThreshold,
      status,
    };
  }

  // Create new result
  db.prepare(`
    INSERT INTO final_results (id, driving_test_id, ai_score, rto_score, final_score, pass_threshold, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(resultId, drivingTestId, aiScore, rtoScore, finalScore, passThreshold, status);

  // Update driving test status
  db.prepare(`
    UPDATE driving_tests SET status = 'completed' WHERE id = ?
  `).run(drivingTestId);

  // Update applicant status
  const test = db.prepare(`
    SELECT applicant_id FROM driving_tests WHERE id = ?
  `).get(drivingTestId) as { applicant_id: string };

  if (test) {
    db.prepare(`
      UPDATE applicants SET driving_licence_status = ? WHERE id = ?
    `).run(status === 'pass' ? 'passed' : 'failed', test.applicant_id);
  }

  return {
    id: resultId,
    ai_score: aiScore,
    rto_score: rtoScore,
    final_score: finalScore,
    pass_threshold: passThreshold,
    status,
  };
}
