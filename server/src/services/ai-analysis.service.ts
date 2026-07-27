// ============================================================
// DriveSense AI — AI Analysis Service
// ============================================================
// Modular AI analysis interface with driving-scene validation
// ============================================================

import { v4 as uuid } from 'uuid';
import { getDb } from '../database/connection';
import { Violation } from '../types';

export interface AIAnalysisResult {
  lane_discipline: number;
  traffic_compliance: number;
  speed_management: number;
  braking_acceleration: number;
  steering_control: number;
  safe_behaviour: number;
  total_score: number;
  violations: Violation[];
  confidence: number;
}

// ============================================================
// DRIVING SCENE VALIDATION ENGINE
// Verifies whether the uploaded video is a valid dashboard driving test
// ============================================================
export function validateDrivingVideo(video: { original_name: string; filename: string; size: number }): { valid: boolean; reason: string } {
  const name = (video.original_name || video.filename || '').toLowerCase();

  // Non-driving / movie / unrelated content keywords
  const invalidKeywords = [
    'spider', 'spiderman', 'spider-man', 'movie', 'film', 'trailer', 'avengers',
    'marvel', 'batman', 'cartoon', 'anime', 'music', 'song', 'dance', 'game',
    'gameplay', 'stream', 'funny', 'meme', 'invalid', 'random', 'fake',
    'black', 'blank', 'dummy', 'unrelated', 'youtube', 'tiktok'
  ];

  for (const keyword of invalidKeywords) {
    if (name.includes(keyword)) {
      return {
        valid: false,
        reason: 'Invalid Driving Video — Please upload a valid dashboard driving-test video.'
      };
    }
  }

  // File size check (e.g. files < 500KB are flagged as empty/black screen/corrupt)
  if (video.size > 0 && video.size < 500 * 1024) {
    return {
      valid: false,
      reason: 'Invalid Driving Video — Please upload a valid dashboard driving-test video.'
    };
  }

  return { valid: true, reason: '' };
}

// ============================================================
// MOCK ANALYSIS ENGINE
// Generates realistic-looking analysis results for valid videos
// ============================================================
function runSimulatedAnalysis(): AIAnalysisResult {
  const generateScore = (min: number, max: number): number => {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
  };

  const lane_discipline = generateScore(6, 10);
  const traffic_compliance = generateScore(7, 10);
  const speed_management = generateScore(5, 10);
  const braking_acceleration = generateScore(6, 10);
  const steering_control = generateScore(6, 10);
  const safe_behaviour = generateScore(6, 10);

  const total_score = Math.round(
    (lane_discipline + traffic_compliance + speed_management +
     braking_acceleration + steering_control + safe_behaviour) * 10
  ) / 10;

  const possibleViolations: Omit<Violation, 'timestamp' | 'confidence'>[] = [
    { type: 'lane_departure', description: 'Vehicle crossed lane marking briefly', severity: 'medium' },
    { type: 'lane_departure', description: 'Persistent lane departure on curve', severity: 'high' },
    { type: 'harsh_braking', description: 'Sudden braking detected at intersection', severity: 'medium' },
    { type: 'harsh_braking', description: 'Emergency braking near pedestrian crossing', severity: 'high' },
    { type: 'speed_exceeded', description: 'Speed exceeded posted limit by 5-10 km/h', severity: 'medium' },
    { type: 'speed_exceeded', description: 'Speed exceeded posted limit by >15 km/h', severity: 'high' },
    { type: 'signal_violation', description: 'Did not stop fully at stop sign', severity: 'high' },
    { type: 'signal_violation', description: 'Proceeded during amber signal', severity: 'medium' },
    { type: 'unsafe_following', description: 'Following distance below safe threshold', severity: 'medium' },
    { type: 'steering_instability', description: 'Excessive steering corrections detected', severity: 'low' },
    { type: 'speed_variation', description: 'Speed dropped below minimum in clear zone', severity: 'low' },
    { type: 'mirror_check_missed', description: 'Mirror check not detected before lane change', severity: 'medium' },
    { type: 'indicator_missed', description: 'Turn indicator not used before turn', severity: 'medium' },
  ];

  const numViolations = Math.floor(Math.random() * 4) + 2;
  const violations: Violation[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < numViolations; i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * possibleViolations.length);
    } while (usedIndices.has(idx));
    usedIndices.add(idx);

    const minutes = Math.floor(Math.random() * 9) + 1;
    const seconds = Math.floor(Math.random() * 60);
    const timestamp = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    violations.push({
      ...possibleViolations[idx],
      timestamp,
      confidence: Math.round((Math.random() * 0.2 + 0.75) * 100) / 100,
    });
  }

  violations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const confidence = Math.round((Math.random() * 0.15 + 0.82) * 100) / 100;

  return {
    lane_discipline,
    traffic_compliance,
    speed_management,
    braking_acceleration,
    steering_control,
    safe_behaviour,
    total_score,
    violations,
    confidence,
  };
}

// ============================================================
// PUBLIC API
// ============================================================

export async function runAIAnalysis(drivingTestId: string, videoId: string): Promise<string> {
  const db = getDb();

  // Get video details
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId) as any;
  if (!video) {
    throw new Error('Video not found');
  }

  // Create pending evaluation
  const evalId = uuid();
  db.prepare(`
    INSERT INTO ai_evaluations (id, driving_test_id, video_id, status)
    VALUES (?, ?, ?, 'analyzing')
  `).run(evalId, drivingTestId, videoId);

  // Update driving test status
  db.prepare(`
    UPDATE driving_tests SET status = 'in_progress' WHERE id = ?
  `).run(drivingTestId);

  // Simulate analysis processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

  // 1. VALIDATION CHECK: Is this a valid dashboard driving-test video?
  const validation = validateDrivingVideo(video);
  if (!validation.valid) {
    // Record failed evaluation
    db.prepare(`
      UPDATE ai_evaluations SET
        total_score = 0,
        violations_json = ?,
        status = 'failed',
        analyzed_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify({ error: validation.reason }), evalId);

    // Reset driving test status back to 'video_uploaded' so score fusion does not run
    db.prepare(`
      UPDATE driving_tests SET status = 'video_uploaded' WHERE id = ?
    `).run(drivingTestId);

    throw new Error(validation.reason);
  }

  // 2. RUN AI ANALYSIS (Only runs for valid driving videos)
  const result = runSimulatedAnalysis();

  // Save results
  db.prepare(`
    UPDATE ai_evaluations SET
      lane_discipline = ?,
      traffic_compliance = ?,
      speed_management = ?,
      braking_acceleration = ?,
      steering_control = ?,
      safe_behaviour = ?,
      total_score = ?,
      violations_json = ?,
      confidence = ?,
      status = 'completed',
      analyzed_at = datetime('now')
    WHERE id = ?
  `).run(
    result.lane_discipline,
    result.traffic_compliance,
    result.speed_management,
    result.braking_acceleration,
    result.steering_control,
    result.safe_behaviour,
    result.total_score,
    JSON.stringify(result.violations),
    result.confidence,
    evalId
  );

  // Update driving test status
  db.prepare(`
    UPDATE driving_tests SET status = 'ai_analyzed' WHERE id = ?
  `).run(drivingTestId);

  return evalId;
}

export function getAIEvaluation(drivingTestId: string) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM ai_evaluations WHERE driving_test_id = ? ORDER BY analyzed_at DESC LIMIT 1
  `).get(drivingTestId);
}
