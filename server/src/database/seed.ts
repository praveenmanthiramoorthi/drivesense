import bcryptjs from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb } from './connection';
import { initializeSchema } from './schema';

// Helper to get tomorrow's date
function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getDayAfter(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export async function seedDatabase(): Promise<void> {
  const db = getDb();
  initializeSchema();

  // Check if already seeded
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existing.count > 0) {
    // Ensure admin user has 'admin' role in existing database
    db.prepare("UPDATE users SET role = 'admin', name = 'System Admin' WHERE email = 'admin@drivesense.com'").run();

    // Ensure reviewer user exists in existing database
    const reviewerExists = db.prepare("SELECT id FROM users WHERE email = 'reviewer@drivesense.com'").get();
    if (!reviewerExists) {
      const passwordHash = bcryptjs.hashSync('demo123', 10);
      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, phone)
        VALUES (?, 'reviewer@drivesense.com', ?, 'Review Officer', 'review_officer', '9876543231')
      `).run(uuid(), passwordHash);
    }
    console.log('ℹ️  Database user roles updated.');
    return;
  }

  const passwordHash = bcryptjs.hashSync('demo123', 10);
  const tomorrow = getTomorrow();

  // ============================================================
  // USERS
  // ============================================================
  const userIds = {
    aarav: uuid(),
    meera: uuid(),
    rohit: uuid(),
    ananya: uuid(),
    vikram: uuid(),
    priya: uuid(),
    rajesh: uuid(),
    admin: uuid(),
    reviewer: uuid(),
  };

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(userIds.aarav, 'aarav@demo.com', passwordHash, 'Aarav Kumar', 'applicant', '9876543210');
  insertUser.run(userIds.meera, 'meera@demo.com', passwordHash, 'Meera Patel', 'applicant', '9876543211');
  insertUser.run(userIds.rohit, 'rohit@demo.com', passwordHash, 'Rohit Singh', 'applicant', '9876543212');
  insertUser.run(userIds.ananya, 'ananya@demo.com', passwordHash, 'Ananya Reddy', 'applicant', '9876543213');
  insertUser.run(userIds.vikram, 'vikram@demo.com', passwordHash, 'Vikram Joshi', 'applicant', '9876543214');
  insertUser.run(userIds.priya, 'priya@rto.com', passwordHash, 'Priya Sharma', 'rto_officer', '9876543220');
  insertUser.run(userIds.rajesh, 'rajesh@rto.com', passwordHash, 'Rajesh Menon', 'rto_officer', '9876543221');
  insertUser.run(userIds.admin, 'admin@drivesense.com', passwordHash, 'System Admin', 'admin', '9876543230');
  insertUser.run(userIds.reviewer, 'reviewer@drivesense.com', passwordHash, 'Review Officer', 'review_officer', '9876543231');

  // ============================================================
  // APPLICANTS
  // ============================================================
  const applicantIds = {
    aarav: uuid(),
    meera: uuid(),
    rohit: uuid(),
    ananya: uuid(),
    vikram: uuid(),
  };

  const insertApplicant = db.prepare(`
    INSERT INTO applicants (id, user_id, application_id, identity_verified, learner_licence_status, driving_licence_status, licence_number, licence_class, issue_date, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertApplicant.run(applicantIds.aarav, userIds.aarav, 'DS-2026-001', 1, 'passed', 'test_scheduled', null, null, null, null);
  insertApplicant.run(applicantIds.meera, userIds.meera, 'DS-2026-002', 1, 'passed', 'passed', 'TN-01-2026-001234', 'LMV', '2026-06-15', '2046-06-14');
  insertApplicant.run(applicantIds.rohit, userIds.rohit, 'DS-2026-003', 1, 'passed', 'test_completed', null, null, null, null);
  insertApplicant.run(applicantIds.ananya, userIds.ananya, 'DS-2026-004', 1, 'passed', 'test_completed', null, null, null, null);
  insertApplicant.run(applicantIds.vikram, userIds.vikram, 'DS-2026-005', 0, 'not_applied', 'not_applied', null, null, null, null);

  // ============================================================
  // RTO OFFICERS
  // ============================================================
  const officerIds = {
    priya: uuid(),
    rajesh: uuid(),
  };

  const insertOfficer = db.prepare(`
    INSERT INTO rto_officers (id, user_id, officer_id, rto_center, designation)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertOfficer.run(officerIds.priya, userIds.priya, 'RTO-CHN-001', 'Chennai Central RTO', 'Senior Motor Vehicle Inspector');
  insertOfficer.run(officerIds.rajesh, userIds.rajesh, 'RTO-CHN-002', 'Chennai South RTO', 'Motor Vehicle Inspector');

  // ============================================================
  // LEARNER TESTS
  // ============================================================
  const insertLearnerTest = db.prepare(`
    INSERT INTO learner_tests (id, applicant_id, score, total, status, answers_json, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLearnerTest.run(uuid(), applicantIds.aarav, 9, 10, 'passed', '[]', '2026-07-20T10:00:00Z', '2026-07-20T10:15:00Z');
  insertLearnerTest.run(uuid(), applicantIds.meera, 8, 10, 'passed', '[]', '2026-06-10T09:00:00Z', '2026-06-10T09:12:00Z');
  insertLearnerTest.run(uuid(), applicantIds.rohit, 10, 10, 'passed', '[]', '2026-07-18T11:00:00Z', '2026-07-18T11:10:00Z');
  insertLearnerTest.run(uuid(), applicantIds.ananya, 7, 10, 'passed', '[]', '2026-07-19T14:00:00Z', '2026-07-19T14:18:00Z');

  // ============================================================
  // TEST CENTERS
  // ============================================================
  const centerIds = {
    central: uuid(),
    south: uuid(),
    west: uuid(),
  };

  const insertCenter = db.prepare(`
    INSERT INTO test_centers (id, name, address, city, capacity)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCenter.run(centerIds.central, 'Chennai Central RTO', '234 Anna Salai, Guindy', 'Chennai', 20);
  insertCenter.run(centerIds.south, 'Chennai South RTO', '56 Rajaji Bhavan, Besant Nagar', 'Chennai', 15);
  insertCenter.run(centerIds.west, 'Chennai West RTO', '78 Arcot Road, Vadapalani', 'Chennai', 18);

  // ============================================================
  // TEST SLOTS
  // ============================================================
  const slotIds: Record<string, string> = {};
  const insertSlot = db.prepare(`
    INSERT INTO test_slots (id, center_id, date, time, max_candidates, booked_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const times = ['09:00', '10:30', '12:00', '14:00', '15:30'];
  const dates = [tomorrow, getDayAfter(2), getDayAfter(3)];

  let slotIndex = 0;
  for (const centerId of Object.values(centerIds)) {
    for (const date of dates) {
      for (const time of times) {
        const slotId = uuid();
        const key = `slot_${slotIndex}`;
        slotIds[key] = slotId;
        const booked = Math.floor(Math.random() * 4);
        const status = booked >= 4 ? 'full' : booked >= 3 ? 'almost_full' : 'available';
        insertSlot.run(slotId, centerId, date, time, 5, booked, status);
        slotIndex++;
      }
    }
  }

  // ============================================================
  // BOOKINGS
  // ============================================================
  const bookingIds = {
    aarav: uuid(),
    meera: uuid(),
    rohit: uuid(),
    ananya: uuid(),
    vikram: uuid(),
  };

  const insertBooking = db.prepare(`
    INSERT INTO bookings (id, applicant_id, slot_id, booking_id, candidate_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Aarav has a scheduled test for tomorrow
  insertBooking.run(bookingIds.aarav, applicantIds.aarav, slotIds['slot_1'], 'BK-2026-001', 'CND-001', 'confirmed', '2026-07-25T12:00:00Z');
  // Meera completed
  insertBooking.run(bookingIds.meera, applicantIds.meera, slotIds['slot_5'], 'BK-2026-002', 'CND-002', 'completed', '2026-06-12T10:00:00Z');
  // Rohit completed
  insertBooking.run(bookingIds.rohit, applicantIds.rohit, slotIds['slot_8'], 'BK-2026-003', 'CND-003', 'completed', '2026-07-22T09:00:00Z');
  // Ananya completed
  insertBooking.run(bookingIds.ananya, applicantIds.ananya, slotIds['slot_12'], 'BK-2026-004', 'CND-004', 'completed', '2026-07-23T11:00:00Z');
  // Vikram scheduled
  insertBooking.run(bookingIds.vikram, applicantIds.vikram, slotIds['slot_2'], 'BK-2026-005', 'CND-005', 'confirmed', '2026-07-26T14:00:00Z');

  // ============================================================
  // DRIVING TESTS
  // ============================================================
  const testIds = {
    aarav: uuid(),
    meera: uuid(),
    rohit: uuid(),
    ananya: uuid(),
    vikram: uuid(),
  };

  const insertTest = db.prepare(`
    INSERT INTO driving_tests (id, booking_id, applicant_id, officer_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTest.run(testIds.aarav, bookingIds.aarav, applicantIds.aarav, officerIds.priya, 'scheduled', '2026-07-25T12:00:00Z');
  insertTest.run(testIds.meera, bookingIds.meera, applicantIds.meera, officerIds.priya, 'completed', '2026-06-15T09:00:00Z');
  insertTest.run(testIds.rohit, bookingIds.rohit, applicantIds.rohit, officerIds.rajesh, 'completed', '2026-07-22T10:30:00Z');
  insertTest.run(testIds.ananya, bookingIds.ananya, applicantIds.ananya, officerIds.priya, 'completed', '2026-07-23T14:00:00Z');
  insertTest.run(testIds.vikram, bookingIds.vikram, applicantIds.vikram, null, 'scheduled', '2026-07-26T14:00:00Z');

  // ============================================================
  // VIDEOS (for completed tests)
  // ============================================================
  const videoIds = {
    meera: uuid(),
    rohit: uuid(),
    ananya: uuid(),
  };

  const insertVideo = db.prepare(`
    INSERT INTO videos (id, driving_test_id, filename, original_name, size, duration, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertVideo.run(videoIds.meera, testIds.meera, 'meera_drive_test.mp4', 'driving_test_meera.mp4', 52428800, 600, '2026-06-15T09:45:00Z');
  insertVideo.run(videoIds.rohit, testIds.rohit, 'rohit_drive_test.mp4', 'driving_test_rohit.mp4', 48234567, 540, '2026-07-22T11:15:00Z');
  insertVideo.run(videoIds.ananya, testIds.ananya, 'ananya_drive_test.mp4', 'driving_test_ananya.mp4', 55123456, 630, '2026-07-23T14:45:00Z');

  // ============================================================
  // AI EVALUATIONS (for completed tests)
  // ============================================================
  const aiEvalIds = {
    meera: uuid(),
    rohit: uuid(),
    ananya: uuid(),
  };

  const insertAI = db.prepare(`
    INSERT INTO ai_evaluations (id, driving_test_id, video_id, lane_discipline, traffic_compliance, speed_management, braking_acceleration, steering_control, safe_behaviour, total_score, violations_json, confidence, status, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAI.run(aiEvalIds.meera, testIds.meera, videoIds.meera,
    9, 10, 9, 8, 9, 9, 54,
    JSON.stringify([
      { timestamp: '00:03:21', type: 'harsh_braking', description: 'Sudden braking detected at intersection', severity: 'medium', confidence: 0.87 },
      { timestamp: '00:07:45', type: 'speed_variation', description: 'Speed dropped below minimum in clear zone', severity: 'low', confidence: 0.72 }
    ]),
    0.91, 'completed', '2026-06-15T10:00:00Z');

  insertAI.run(aiEvalIds.rohit, testIds.rohit, videoIds.rohit,
    9, 10, 8, 8, 9, 8, 52,
    JSON.stringify([
      { timestamp: '00:02:31', type: 'lane_departure', description: 'Vehicle crossed lane marking briefly', severity: 'medium', confidence: 0.89 },
      { timestamp: '00:05:42', type: 'harsh_braking', description: 'Emergency braking near pedestrian crossing', severity: 'high', confidence: 0.94 },
      { timestamp: '00:08:17', type: 'speed_exceeded', description: 'Speed exceeded 40 km/h limit by 5 km/h', severity: 'medium', confidence: 0.85 }
    ]),
    0.88, 'completed', '2026-07-22T11:30:00Z');

  insertAI.run(aiEvalIds.ananya, testIds.ananya, videoIds.ananya,
    6, 7, 5, 6, 5, 6, 35,
    JSON.stringify([
      { timestamp: '00:01:15', type: 'lane_departure', description: 'Persistent lane departure on curve', severity: 'high', confidence: 0.92 },
      { timestamp: '00:03:00', type: 'signal_violation', description: 'Did not stop at amber signal', severity: 'high', confidence: 0.96 },
      { timestamp: '00:04:30', type: 'speed_exceeded', description: 'Speed exceeded limit by 15 km/h', severity: 'high', confidence: 0.91 },
      { timestamp: '00:06:20', type: 'harsh_braking', description: 'Multiple harsh braking events', severity: 'medium', confidence: 0.88 },
      { timestamp: '00:08:10', type: 'unsafe_overtaking', description: 'Overtaking on blind curve', severity: 'high', confidence: 0.93 },
      { timestamp: '00:09:45', type: 'steering_instability', description: 'Steering corrections excessive', severity: 'medium', confidence: 0.80 }
    ]),
    0.85, 'completed', '2026-07-23T15:00:00Z');

  // ============================================================
  // RTO EVALUATIONS
  // ============================================================
  const rtoEvalIds = {
    meera: uuid(),
    rohit: uuid(),
    ananya: uuid(),
  };

  const insertRTO = db.prepare(`
    INSERT INTO rto_evaluations (id, driving_test_id, officer_id, vehicle_control, manoeuvring, observation_awareness, overall_performance, total_score, comments, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRTO.run(rtoEvalIds.meera, testIds.meera, officerIds.priya,
    9, 9, 8, 9, 35,
    'Excellent vehicle control. Smooth gear transitions. Good awareness of surroundings. Minor hesitation at roundabout.',
    '2026-06-15T10:30:00Z');

  insertRTO.run(rtoEvalIds.rohit, testIds.rohit, officerIds.rajesh,
    8, 8, 9, 9, 34,
    'Good overall performance. Confident driving. Needs slight improvement in braking smoothness. Very aware of pedestrians.',
    '2026-07-22T12:00:00Z');

  insertRTO.run(rtoEvalIds.ananya, testIds.ananya, officerIds.priya,
    5, 6, 5, 5, 21,
    'Significant concerns with vehicle control. Multiple instances of unsafe driving. Not recommended for license at this time. Suggest additional practice hours.',
    '2026-07-23T15:30:00Z');

  // ============================================================
  // FINAL RESULTS
  // ============================================================
  const resultIds = {
    meera: uuid(),
    rohit: uuid(),
    ananya: uuid(),
  };

  const insertResult = db.prepare(`
    INSERT INTO final_results (id, driving_test_id, ai_score, rto_score, final_score, pass_threshold, status, generated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertResult.run(resultIds.meera, testIds.meera, 54, 35, 89, 70, 'pass', '2026-06-15T10:35:00Z');
  insertResult.run(resultIds.rohit, testIds.rohit, 52, 34, 86, 70, 'pass', '2026-07-22T12:05:00Z');
  insertResult.run(resultIds.ananya, testIds.ananya, 35, 21, 56, 70, 'fail', '2026-07-23T15:35:00Z');

  // ============================================================
  // REVIEW REQUESTS
  // ============================================================
  const insertReview = db.prepare(`
    INSERT INTO review_requests (id, final_result_id, applicant_id, reason, description, status, reviewer_id, decision, reviewer_comments, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(uuid(), resultIds.ananya, applicantIds.ananya,
    'Incorrect AI detection',
    'I believe the AI system incorrectly flagged several events. The amber signal violation was actually a yellow light that I safely proceeded through. The curve overtaking was on a clear road with full visibility. I request a human review of the dashcam footage.',
    'pending', null, null, null, '2026-07-24T09:00:00Z', null);

  // ============================================================
  // AUDIT LOGS
  // ============================================================
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Meera's journey
  insertAudit.run(uuid(), userIds.meera, 'LOGIN', 'user', userIds.meera, 'Applicant login', '192.168.1.10', '2026-06-10T08:55:00Z');
  insertAudit.run(uuid(), userIds.meera, 'LEARNER_TEST_COMPLETED', 'learner_test', '', 'Score: 8/10 - PASSED', '192.168.1.10', '2026-06-10T09:12:00Z');
  insertAudit.run(uuid(), userIds.meera, 'SLOT_BOOKED', 'booking', bookingIds.meera, 'Booked driving test slot', '192.168.1.10', '2026-06-12T10:00:00Z');
  insertAudit.run(uuid(), userIds.priya, 'VIDEO_UPLOADED', 'video', videoIds.meera, 'Driving test video uploaded', '10.0.0.5', '2026-06-15T09:45:00Z');
  insertAudit.run(uuid(), null, 'AI_ANALYSIS_COMPLETED', 'ai_evaluation', aiEvalIds.meera, 'AI Score: 54/60', '10.0.0.1', '2026-06-15T10:00:00Z');
  insertAudit.run(uuid(), userIds.priya, 'RTO_EVALUATION_SUBMITTED', 'rto_evaluation', rtoEvalIds.meera, 'RTO Score: 35/40', '10.0.0.5', '2026-06-15T10:30:00Z');
  insertAudit.run(uuid(), null, 'RESULT_GENERATED', 'final_result', resultIds.meera, 'Final Score: 89/100 - PASS', '10.0.0.1', '2026-06-15T10:35:00Z');

  // Rohit's journey
  insertAudit.run(uuid(), userIds.rohit, 'LOGIN', 'user', userIds.rohit, 'Applicant login', '192.168.1.15', '2026-07-18T10:55:00Z');
  insertAudit.run(uuid(), userIds.rohit, 'LEARNER_TEST_COMPLETED', 'learner_test', '', 'Score: 10/10 - PASSED', '192.168.1.15', '2026-07-18T11:10:00Z');
  insertAudit.run(uuid(), userIds.rohit, 'SLOT_BOOKED', 'booking', bookingIds.rohit, 'Booked driving test slot', '192.168.1.15', '2026-07-20T09:00:00Z');
  insertAudit.run(uuid(), userIds.rajesh, 'VIDEO_UPLOADED', 'video', videoIds.rohit, 'Driving test video uploaded', '10.0.0.8', '2026-07-22T11:15:00Z');
  insertAudit.run(uuid(), null, 'AI_ANALYSIS_COMPLETED', 'ai_evaluation', aiEvalIds.rohit, 'AI Score: 52/60', '10.0.0.1', '2026-07-22T11:30:00Z');
  insertAudit.run(uuid(), userIds.rajesh, 'RTO_EVALUATION_SUBMITTED', 'rto_evaluation', rtoEvalIds.rohit, 'RTO Score: 34/40', '10.0.0.8', '2026-07-22T12:00:00Z');
  insertAudit.run(uuid(), null, 'RESULT_GENERATED', 'final_result', resultIds.rohit, 'Final Score: 86/100 - PASS', '10.0.0.1', '2026-07-22T12:05:00Z');

  // Ananya's journey
  insertAudit.run(uuid(), userIds.ananya, 'LOGIN', 'user', userIds.ananya, 'Applicant login', '192.168.1.20', '2026-07-19T13:55:00Z');
  insertAudit.run(uuid(), userIds.ananya, 'LEARNER_TEST_COMPLETED', 'learner_test', '', 'Score: 7/10 - PASSED', '192.168.1.20', '2026-07-19T14:18:00Z');
  insertAudit.run(uuid(), userIds.ananya, 'SLOT_BOOKED', 'booking', bookingIds.ananya, 'Booked driving test slot', '192.168.1.20', '2026-07-21T11:00:00Z');
  insertAudit.run(uuid(), userIds.priya, 'VIDEO_UPLOADED', 'video', videoIds.ananya, 'Driving test video uploaded', '10.0.0.5', '2026-07-23T14:45:00Z');
  insertAudit.run(uuid(), null, 'AI_ANALYSIS_COMPLETED', 'ai_evaluation', aiEvalIds.ananya, 'AI Score: 35/60', '10.0.0.1', '2026-07-23T15:00:00Z');
  insertAudit.run(uuid(), userIds.priya, 'RTO_EVALUATION_SUBMITTED', 'rto_evaluation', rtoEvalIds.ananya, 'RTO Score: 21/40', '10.0.0.5', '2026-07-23T15:30:00Z');
  insertAudit.run(uuid(), null, 'RESULT_GENERATED', 'final_result', resultIds.ananya, 'Final Score: 56/100 - FAIL', '10.0.0.1', '2026-07-23T15:35:00Z');
  insertAudit.run(uuid(), userIds.ananya, 'REVIEW_REQUESTED', 'review_request', '', 'Reason: Incorrect AI detection', '192.168.1.20', '2026-07-24T09:00:00Z');

  // Aarav's partial journey
  insertAudit.run(uuid(), userIds.aarav, 'LOGIN', 'user', userIds.aarav, 'Applicant login', '192.168.1.5', '2026-07-20T09:55:00Z');
  insertAudit.run(uuid(), userIds.aarav, 'LEARNER_TEST_COMPLETED', 'learner_test', '', 'Score: 9/10 - PASSED', '192.168.1.5', '2026-07-20T10:15:00Z');
  insertAudit.run(uuid(), userIds.aarav, 'SLOT_BOOKED', 'booking', bookingIds.aarav, 'Booked driving test slot', '192.168.1.5', '2026-07-25T12:00:00Z');

  console.log('✅ Database seeded with demo data');
  console.log('');
  console.log('Demo Accounts:');
  console.log('──────────────────────────────────────');
  console.log('Applicant:      aarav@demo.com / demo123');
  console.log('Applicant:      meera@demo.com / demo123');
  console.log('Applicant:      rohit@demo.com / demo123');
  console.log('Applicant:      ananya@demo.com / demo123');
  console.log('Applicant:      vikram@demo.com / demo123');
  console.log('RTO Officer:    priya@rto.com / demo123');
  console.log('RTO Officer:    rajesh@rto.com / demo123');
  console.log('Review Officer: admin@drivesense.com / demo123');
}

// Run directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(console.error);
}
