import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAudit } from '../services/audit.service';

const router = Router();

// GET /api/booking/centers
router.get('/centers', authMiddleware, (_req: Request, res: Response) => {
  const db = getDb();
  const centers = db.prepare('SELECT * FROM test_centers').all();
  res.json({ centers });
});

// GET /api/booking/slots?centerId=&date=
router.get('/slots', authMiddleware, (req: Request, res: Response) => {
  const { centerId, date } = req.query;
  const db = getDb();

  let query = `
    SELECT ts.*, tc.name as center_name
    FROM test_slots ts
    JOIN test_centers tc ON ts.center_id = tc.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (centerId) {
    query += ' AND ts.center_id = ?';
    params.push(centerId);
  }
  if (date) {
    query += ' AND ts.date = ?';
    params.push(date);
  }

  query += ' ORDER BY ts.date, ts.time';

  const slots = db.prepare(query).all(...params);
  res.json({ slots });
});

// POST /api/booking/book
router.post('/book', authMiddleware, requireRole('applicant'), (req: Request, res: Response) => {
  const { slotId } = req.body;

  if (!slotId) {
    res.status(400).json({ error: 'Slot ID is required' });
    return;
  }

  const db = getDb();
  const applicant = db.prepare(`
    SELECT * FROM applicants WHERE user_id = ?
  `).get(req.user!.userId) as any;

  if (!applicant) {
    res.status(404).json({ error: 'Applicant not found' });
    return;
  }

  // Check learner test passed
  if (applicant.learner_licence_status !== 'passed') {
    res.status(400).json({ error: 'You must pass the learner licence e-test before booking a driving test' });
    return;
  }

  // Check slot availability
  const slot = db.prepare('SELECT * FROM test_slots WHERE id = ?').get(slotId) as any;
  if (!slot) {
    res.status(404).json({ error: 'Slot not found' });
    return;
  }
  if (slot.booked_count >= slot.max_candidates) {
    res.status(400).json({ error: 'This slot is fully booked' });
    return;
  }

  // Check if applicant already has an active booking
  const existingBooking = db.prepare(`
    SELECT id FROM bookings WHERE applicant_id = ? AND status = 'confirmed'
  `).get(applicant.id);

  if (existingBooking) {
    res.status(400).json({ error: 'You already have an active booking. Cancel it before booking a new slot.' });
    return;
  }

  // Create booking
  const bookingId = uuid();
  const bookingNum = `BK-2026-${Math.floor(Math.random() * 900) + 100}`;
  const candidateNum = `CND-${Math.floor(Math.random() * 900) + 100}`;

  db.prepare(`
    INSERT INTO bookings (id, applicant_id, slot_id, booking_id, candidate_id, status)
    VALUES (?, ?, ?, ?, ?, 'confirmed')
  `).run(bookingId, applicant.id, slotId, bookingNum, candidateNum);

  // Update slot count
  const newCount = slot.booked_count + 1;
  const newStatus = newCount >= slot.max_candidates ? 'full'
    : newCount >= slot.max_candidates - 1 ? 'almost_full' : 'available';

  db.prepare(`
    UPDATE test_slots SET booked_count = ?, status = ? WHERE id = ?
  `).run(newCount, newStatus, slotId);

  // Update applicant status
  db.prepare(`
    UPDATE applicants SET driving_licence_status = 'test_scheduled' WHERE id = ?
  `).run(applicant.id);

  // Create driving test entry
  const testId = uuid();
  // Assign to an RTO officer at the same center
  const slotCenter = db.prepare(`
    SELECT tc.name FROM test_centers tc
    JOIN test_slots ts ON ts.center_id = tc.id
    WHERE ts.id = ?
  `).get(slotId) as any;

  let officerId: string | null = null;
  if (slotCenter) {
    const officer = db.prepare(`
      SELECT id FROM rto_officers WHERE rto_center = ?
    `).get(slotCenter.name) as any;
    if (officer) officerId = officer.id;
  }

  // If no center match, assign first officer
  if (!officerId) {
    const anyOfficer = db.prepare('SELECT id FROM rto_officers LIMIT 1').get() as any;
    if (anyOfficer) officerId = anyOfficer.id;
  }

  db.prepare(`
    INSERT INTO driving_tests (id, booking_id, applicant_id, officer_id, status)
    VALUES (?, ?, ?, ?, 'scheduled')
  `).run(testId, bookingId, applicant.id, officerId);

  logAudit(
    req.user!.userId,
    'SLOT_BOOKED',
    'booking',
    bookingId,
    `Booked slot at ${slotCenter?.name || 'Unknown'} on ${slot.date} at ${slot.time}`,
    req.ip || ''
  );

  // Get full booking details
  const booking = db.prepare(`
    SELECT b.*, ts.date, ts.time, tc.name as center_name, tc.address as center_address
    FROM bookings b
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
    WHERE b.id = ?
  `).get(bookingId);

  res.status(201).json({ booking, drivingTestId: testId });
});

// GET /api/booking/my-booking
router.get('/my-booking', authMiddleware, requireRole('applicant'), (req: Request, res: Response) => {
  const db = getDb();
  const applicant = db.prepare(`
    SELECT id FROM applicants WHERE user_id = ?
  `).get(req.user!.userId) as any;

  if (!applicant) {
    res.status(404).json({ error: 'Applicant not found' });
    return;
  }

  const booking = db.prepare(`
    SELECT b.*, ts.date, ts.time, tc.name as center_name, tc.address as center_address
    FROM bookings b
    JOIN test_slots ts ON b.slot_id = ts.id
    JOIN test_centers tc ON ts.center_id = tc.id
    WHERE b.applicant_id = ?
    ORDER BY b.created_at DESC LIMIT 1
  `).get(applicant.id);

  res.json({ booking });
});

export default router;
