import { v4 as uuid } from 'uuid';
import { getDb } from '../database/connection';

export function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string = '',
  details: string = '',
  ipAddress: string | string[] = ''
): void {
  try {
    const db = getDb();
    const ipStr = Array.isArray(ipAddress) ? ipAddress[0] : (ipAddress || '');
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuid(), userId, action, entityType, entityId, details, ipStr);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export function getAuditLogs(entityType?: string, entityId?: string, limit: number = 50) {
  const db = getDb();

  if (entityType && entityId) {
    return db.prepare(`
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = ? AND al.entity_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `).all(entityType, entityId, limit);
  }

  if (entityType) {
    return db.prepare(`
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `).all(entityType, limit);
  }

  return db.prepare(`
    SELECT al.*, u.name as user_name, u.role as user_role
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(limit);
}

export function getAuditLogsForUser(userId: string, limit: number = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT al.*, u.name as user_name, u.role as user_role
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.user_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

export function getAuditLogsForDrivingTest(drivingTestId: string) {
  const db = getDb();
  return db.prepare(`
    SELECT al.*, u.name as user_name, u.role as user_role
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.entity_id = ?
       OR al.entity_id IN (
         SELECT id FROM videos WHERE driving_test_id = ?
       )
       OR al.entity_id IN (
         SELECT id FROM ai_evaluations WHERE driving_test_id = ?
       )
       OR al.entity_id IN (
         SELECT id FROM rto_evaluations WHERE driving_test_id = ?
       )
       OR al.entity_id IN (
         SELECT id FROM final_results WHERE driving_test_id = ?
       )
       OR al.entity_id IN (
         SELECT b.id FROM bookings b
         JOIN driving_tests dt ON dt.booking_id = b.id
         WHERE dt.id = ?
       )
    ORDER BY al.created_at ASC
  `).all(drivingTestId, drivingTestId, drivingTestId, drivingTestId, drivingTestId, drivingTestId);
}
