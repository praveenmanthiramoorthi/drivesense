import { getDb } from './connection';

export function initializeSchema(): void {
  const db = getDb();

  // Check if users table needs constraint migration to include 'admin'
  try {
    const tableSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as any)?.sql || '';
    if (tableSql && !tableSql.includes('admin')) {
      db.exec('PRAGMA foreign_keys = OFF;');
      db.exec(`
        CREATE TABLE users_migration (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('applicant', 'rto_officer', 'review_officer', 'admin')),
          phone TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO users_migration SELECT id, email, password_hash, name, role, phone, created_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_migration RENAME TO users;
        PRAGMA foreign_keys = ON;
      `);
      console.log('✅ Migrated users table constraint to allow admin role');
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('applicant', 'rto_officer', 'review_officer', 'admin')),
      phone TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applicants (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      application_id TEXT NOT NULL UNIQUE,
      identity_verified INTEGER DEFAULT 0,
      learner_licence_status TEXT DEFAULT 'not_applied' 
        CHECK(learner_licence_status IN ('not_applied', 'applied', 'passed', 'failed')),
      driving_licence_status TEXT DEFAULT 'not_applied'
        CHECK(driving_licence_status IN ('not_applied', 'test_scheduled', 'test_completed', 'passed', 'failed')),
      licence_number TEXT,
      licence_class TEXT,
      issue_date TEXT,
      expiry_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rto_officers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      officer_id TEXT NOT NULL UNIQUE,
      rto_center TEXT NOT NULL,
      designation TEXT DEFAULT 'Motor Vehicle Inspector',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS learner_tests (
      id TEXT PRIMARY KEY,
      applicant_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      total INTEGER DEFAULT 10,
      status TEXT DEFAULT 'in_progress'
        CHECK(status IN ('in_progress', 'passed', 'failed')),
      answers_json TEXT DEFAULT '[]',
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id)
    );

    CREATE TABLE IF NOT EXISTS test_centers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      capacity INTEGER DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS test_slots (
      id TEXT PRIMARY KEY,
      center_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      max_candidates INTEGER DEFAULT 5,
      booked_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available'
        CHECK(status IN ('available', 'almost_full', 'full')),
      FOREIGN KEY (center_id) REFERENCES test_centers(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      applicant_id TEXT NOT NULL,
      slot_id TEXT NOT NULL,
      booking_id TEXT NOT NULL UNIQUE,
      candidate_id TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed'
        CHECK(status IN ('confirmed', 'cancelled', 'completed')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (applicant_id) REFERENCES applicants(id),
      FOREIGN KEY (slot_id) REFERENCES test_slots(id)
    );

    CREATE TABLE IF NOT EXISTS driving_tests (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      applicant_id TEXT NOT NULL,
      officer_id TEXT,
      status TEXT DEFAULT 'scheduled'
        CHECK(status IN ('scheduled', 'in_progress', 'video_uploaded', 'ai_analyzed', 'rto_evaluated', 'completed')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (applicant_id) REFERENCES applicants(id),
      FOREIGN KEY (officer_id) REFERENCES rto_officers(id)
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      driving_test_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      duration REAL,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (driving_test_id) REFERENCES driving_tests(id)
    );

    CREATE TABLE IF NOT EXISTS ai_evaluations (
      id TEXT PRIMARY KEY,
      driving_test_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      lane_discipline REAL DEFAULT 0,
      traffic_compliance REAL DEFAULT 0,
      speed_management REAL DEFAULT 0,
      braking_acceleration REAL DEFAULT 0,
      steering_control REAL DEFAULT 0,
      safe_behaviour REAL DEFAULT 0,
      total_score REAL DEFAULT 0,
      violations_json TEXT DEFAULT '[]',
      confidence REAL DEFAULT 0,
      status TEXT DEFAULT 'pending'
        CHECK(status IN ('pending', 'analyzing', 'completed', 'failed')),
      analyzed_at TEXT,
      FOREIGN KEY (driving_test_id) REFERENCES driving_tests(id),
      FOREIGN KEY (video_id) REFERENCES videos(id)
    );

    CREATE TABLE IF NOT EXISTS rto_evaluations (
      id TEXT PRIMARY KEY,
      driving_test_id TEXT NOT NULL,
      officer_id TEXT NOT NULL,
      vehicle_control REAL DEFAULT 0,
      manoeuvring REAL DEFAULT 0,
      observation_awareness REAL DEFAULT 0,
      overall_performance REAL DEFAULT 0,
      total_score REAL DEFAULT 0,
      comments TEXT DEFAULT '',
      submitted_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (driving_test_id) REFERENCES driving_tests(id),
      FOREIGN KEY (officer_id) REFERENCES rto_officers(id)
    );

    CREATE TABLE IF NOT EXISTS final_results (
      id TEXT PRIMARY KEY,
      driving_test_id TEXT NOT NULL UNIQUE,
      ai_score REAL DEFAULT 0,
      rto_score REAL DEFAULT 0,
      final_score REAL DEFAULT 0,
      pass_threshold INTEGER DEFAULT 70,
      status TEXT DEFAULT 'fail'
        CHECK(status IN ('pass', 'fail')),
      generated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (driving_test_id) REFERENCES driving_tests(id)
    );

    CREATE TABLE IF NOT EXISTS review_requests (
      id TEXT PRIMARY KEY,
      final_result_id TEXT NOT NULL,
      applicant_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending'
        CHECK(status IN ('pending', 'in_review', 'upheld', 'modified', 'reassessment')),
      reviewer_id TEXT,
      decision TEXT,
      reviewer_comments TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (final_result_id) REFERENCES final_results(id),
      FOREIGN KEY (applicant_id) REFERENCES applicants(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT DEFAULT '',
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('✅ Database schema initialized');
}
