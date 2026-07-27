// ============================================================
// DriveSense AI — Shared TypeScript Types
// ============================================================

export type UserRole = 'applicant' | 'rto_officer' | 'review_officer' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  phone: string;
  created_at: string;
}

export interface Applicant {
  id: string;
  user_id: string;
  application_id: string;
  identity_verified: number; // SQLite boolean
  learner_licence_status: 'not_applied' | 'applied' | 'passed' | 'failed';
  driving_licence_status: 'not_applied' | 'test_scheduled' | 'test_completed' | 'passed' | 'failed';
  licence_number: string | null;
  licence_class: string | null;
  issue_date: string | null;
  expiry_date: string | null;
}

export interface RTOOfficer {
  id: string;
  user_id: string;
  officer_id: string;
  rto_center: string;
  designation: string;
}

export interface LearnerTest {
  id: string;
  applicant_id: string;
  score: number;
  total: number;
  status: 'in_progress' | 'passed' | 'failed';
  answers_json: string;
  started_at: string;
  completed_at: string | null;
}

export interface TestCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
}

export interface TestSlot {
  id: string;
  center_id: string;
  date: string;
  time: string;
  max_candidates: number;
  booked_count: number;
  status: 'available' | 'almost_full' | 'full';
}

export interface Booking {
  id: string;
  applicant_id: string;
  slot_id: string;
  booking_id: string;
  candidate_id: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

export interface DrivingTest {
  id: string;
  booking_id: string;
  applicant_id: string;
  officer_id: string | null;
  status: 'scheduled' | 'in_progress' | 'video_uploaded' | 'ai_analyzed' | 'rto_evaluated' | 'completed';
  created_at: string;
}

export interface Video {
  id: string;
  driving_test_id: string;
  filename: string;
  original_name: string;
  size: number;
  duration: number | null;
  uploaded_at: string;
}

export interface AIEvaluation {
  id: string;
  driving_test_id: string;
  video_id: string;
  lane_discipline: number;
  traffic_compliance: number;
  speed_management: number;
  braking_acceleration: number;
  steering_control: number;
  safe_behaviour: number;
  total_score: number;
  violations_json: string;
  confidence: number;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  analyzed_at: string | null;
}

export interface RTOEvaluation {
  id: string;
  driving_test_id: string;
  officer_id: string;
  vehicle_control: number;
  manoeuvring: number;
  observation_awareness: number;
  overall_performance: number;
  total_score: number;
  comments: string;
  submitted_at: string;
}

export interface FinalResult {
  id: string;
  driving_test_id: string;
  ai_score: number;
  rto_score: number;
  final_score: number;
  pass_threshold: number;
  status: 'pass' | 'fail';
  generated_at: string;
}

export interface ReviewRequest {
  id: string;
  final_result_id: string;
  applicant_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'in_review' | 'upheld' | 'modified' | 'reassessment';
  reviewer_id: string | null;
  decision: string | null;
  reviewer_comments: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

// Violation object for AI analysis
export interface Violation {
  timestamp: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

// JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

// Express request extension
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
