import { Router, Request, Response } from 'express';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAudit } from '../services/audit.service';

const router = Router();

// Require admin or review_officer role for admin endpoints
const adminAuth = [authMiddleware, requireRole('admin', 'review_officer')];

// GET /api/admin/stats — Overview counts
router.get('/stats', adminAuth, (_req: Request, res: Response) => {
  const db = getDb();

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const totalApplicants = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'applicant'").get() as any).count;
  const totalOfficers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'rto_officer'").get() as any).count;
  const totalReviewers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('review_officer', 'admin')").get() as any).count;
  const passedLicences = (db.prepare("SELECT COUNT(*) as count FROM applicants WHERE driving_licence_status = 'passed'").get() as any).count;
  const pendingTests = (db.prepare("SELECT COUNT(*) as count FROM driving_tests WHERE status != 'completed'").get() as any).count;

  res.json({
    stats: {
      totalUsers,
      totalApplicants,
      totalOfficers,
      totalReviewers,
      passedLicences,
      pendingTests,
    },
  });
});

// GET /api/admin/users — List all users with full application status details
router.get('/users', adminAuth, (req: Request, res: Response) => {
  const db = getDb();
  const { role, search } = req.query;

  let query = `
    SELECT u.id, u.email, u.name, u.role, u.phone, u.created_at,
      a.id as applicant_id, a.application_id, a.identity_verified,
      a.learner_licence_status, a.driving_licence_status,
      a.licence_number, a.licence_class, a.issue_date, a.expiry_date,
      lt.score as learner_test_score,
      fr.final_score, fr.status as final_result_status,
      ro.rto_center, ro.officer_id
    FROM users u
    LEFT JOIN applicants a ON a.user_id = u.id
    LEFT JOIN learner_tests lt ON lt.applicant_id = a.id AND lt.id = (
      SELECT id FROM learner_tests WHERE applicant_id = a.id ORDER BY started_at DESC LIMIT 1
    )
    LEFT JOIN driving_tests dt ON dt.applicant_id = a.id AND dt.id = (
      SELECT id FROM driving_tests WHERE applicant_id = a.id ORDER BY created_at DESC LIMIT 1
    )
    LEFT JOIN final_results fr ON fr.driving_test_id = dt.id
    LEFT JOIN rto_officers ro ON ro.user_id = u.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (role && role !== 'all') {
    query += ' AND u.role = ?';
    params.push(role);
  }

  if (search) {
    query += ' AND (u.name LIKE ? OR u.email LIKE ? OR a.application_id LIKE ? OR u.phone LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY u.created_at DESC';

  const users = db.prepare(query).all(...params);
  res.json({ users });
});

// PUT /api/admin/users/:userId — Update user details or application status
router.post('/users/:userId/update', adminAuth, (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { name, email, role, phone, learner_licence_status, driving_licence_status, identity_verified } = req.body;

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Update user table
  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      role = COALESCE(?, role),
      phone = COALESCE(?, phone)
    WHERE id = ?
  `).run(name, email, role, phone, userId);

  // If applicant, update applicant table
  const applicant = db.prepare('SELECT id FROM applicants WHERE user_id = ?').get(userId) as any;
  if (applicant) {
    db.prepare(`
      UPDATE applicants SET
        learner_licence_status = COALESCE(?, learner_licence_status),
        driving_licence_status = COALESCE(?, driving_licence_status),
        identity_verified = COALESCE(?, identity_verified)
      WHERE id = ?
    `).run(learner_licence_status, driving_licence_status, identity_verified !== undefined ? (identity_verified ? 1 : 0) : null, applicant.id);
  }

  logAudit(
    req.user!.userId,
    'ADMIN_USER_UPDATED',
    'user',
    userId,
    `Updated user details for ${user.email}`,
    (req.ip as string) || ''
  );

  res.json({ message: 'User updated successfully' });
});

// DELETE /api/admin/users/:userId — Delete user and all associated records
router.delete('/users/:userId', adminAuth, (req: Request, res: Response) => {
  const userId = req.params.userId as string;

  if (req.user!.userId === userId) {
    res.status(400).json({ error: 'You cannot delete your own admin account' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Clean up dependent tables safely
  db.transaction(() => {
    // Check applicant records
    const applicant = db.prepare('SELECT id FROM applicants WHERE user_id = ?').get(userId) as any;
    if (applicant) {
      const applicantId = applicant.id;
      // Get driving tests for applicant
      const tests = db.prepare('SELECT id, booking_id FROM driving_tests WHERE applicant_id = ?').all(applicantId) as any[];

      for (const t of tests) {
        db.prepare('DELETE FROM review_requests WHERE final_result_id IN (SELECT id FROM final_results WHERE driving_test_id = ?)').run(t.id);
        db.prepare('DELETE FROM final_results WHERE driving_test_id = ?').run(t.id);
        db.prepare('DELETE FROM rto_evaluations WHERE driving_test_id = ?').run(t.id);
        db.prepare('DELETE FROM ai_evaluations WHERE driving_test_id = ?').run(t.id);
        db.prepare('DELETE FROM videos WHERE driving_test_id = ?').run(t.id);
        db.prepare('DELETE FROM driving_tests WHERE id = ?').run(t.id);
        if (t.booking_id) {
          db.prepare('DELETE FROM bookings WHERE id = ?').run(t.booking_id);
        }
      }

      db.prepare('DELETE FROM review_requests WHERE applicant_id = ?').run(applicantId);
      db.prepare('DELETE FROM bookings WHERE applicant_id = ?').run(applicantId);
      db.prepare('DELETE FROM learner_tests WHERE applicant_id = ?').run(applicantId);
      db.prepare('DELETE FROM applicants WHERE id = ?').run(applicantId);
    }

    // Check RTO officer records
    const officer = db.prepare('SELECT id FROM rto_officers WHERE user_id = ?').get(userId) as any;
    if (officer) {
      db.prepare('UPDATE driving_tests SET officer_id = NULL WHERE officer_id = ?').run(officer.id);
      db.prepare('DELETE FROM rto_officers WHERE id = ?').run(officer.id);
    }

    // Delete audit logs for user
    db.prepare('DELETE FROM audit_logs WHERE user_id = ?').run(userId);

    // Finally delete user
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  })();

  logAudit(
    req.user!.userId,
    'ADMIN_USER_DELETED',
    'user',
    userId,
    `Deleted user ${user.name} (${user.email})`,
    (req.ip as string) || ''
  );

  res.json({ message: `User ${user.name} deleted successfully` });
});

export default router;
