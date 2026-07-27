import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, LogOut, User, FileCheck, ClipboardCheck, Calendar, BarChart3, Award, ExternalLink, Shield, CheckCircle, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function ApplicantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/applicant/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const applicant = data?.applicant;
  const learnerTest = data?.learnerTest;
  const booking = data?.booking;
  const drivingTest = data?.drivingTest;
  const finalResult = data?.finalResult;
  const reviewRequest = data?.reviewRequest;
  const isExistingHolder = applicant?.licence_number;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-primary-900">DriveSense <span className="text-accent-500">AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-primary-900">{user?.name}</p>
              <p className="text-xs text-slate-400">Applicant</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-sm text-slate-500 px-3">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-primary-900 mb-1">Welcome back, {user?.name}!</h1>
          <p className="text-slate-500 text-sm">Your driving licence application dashboard</p>
        </div>

        {/* Profile Card */}
        <div className="card p-6 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-7 h-7 text-primary-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-primary-900">{applicant?.name}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-sm text-slate-500">
                <span>Application ID: <strong className="text-primary-700">{applicant?.application_id}</strong></span>
                <span>Email: {applicant?.email}</span>
                {applicant?.phone && <span>Phone: {applicant.phone}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${applicant?.identity_verified ? 'badge-success' : 'badge-warning'}`}>
                {applicant?.identity_verified ? '✓ Identity Verified' : 'Unverified'}
              </span>
              <span className={getStatusColor(applicant?.learner_licence_status || 'not_applied')}>
                LL: {getStatusLabel(applicant?.learner_licence_status || 'not_applied')}
              </span>
              <span className={getStatusColor(applicant?.driving_licence_status || 'not_applied')}>
                DL: {getStatusLabel(applicant?.driving_licence_status || 'not_applied')}
              </span>
            </div>
          </div>
        </div>

        {/* E-Licence (for existing holders) */}
        {isExistingHolder && (
          <div className="card p-6 mb-6 bg-gradient-to-r from-primary-900 to-primary-700 text-white animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-primary-200 text-sm">Driving Licence</p>
                <p className="text-2xl font-bold mt-1">{applicant.licence_number}</p>
              </div>
              <Award className="w-10 h-10 text-primary-300" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-primary-300">Name</p>
                <p className="font-medium">{applicant.name}</p>
              </div>
              <div>
                <p className="text-primary-300">Class</p>
                <p className="font-medium">{applicant.licence_class}</p>
              </div>
              <div>
                <p className="text-primary-300">Issue Date</p>
                <p className="font-medium">{formatDate(applicant.issue_date)}</p>
              </div>
              <div>
                <p className="text-primary-300">Expiry Date</p>
                <p className="font-medium">{formatDate(applicant.expiry_date)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Learner Licence */}
          <div className="card-hover p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900">Learner Licence</p>
                <span className={getStatusColor(applicant?.learner_licence_status || 'not_applied')}>
                  {getStatusLabel(applicant?.learner_licence_status || 'not_applied')}
                </span>
              </div>
            </div>
            {learnerTest ? (
              <p className="text-sm text-slate-500">Score: {learnerTest.score}/{learnerTest.total}</p>
            ) : (
              <p className="text-xs text-slate-400">Take the e-test to get your learner licence</p>
            )}
            {applicant?.learner_licence_status !== 'passed' && (
              <button onClick={() => navigate('/applicant/learner-test')} className="btn-primary text-xs mt-3 px-4 py-1.5">
                {learnerTest?.status === 'failed' ? 'Retake E-Test' : 'Start E-Test'}
              </button>
            )}
          </div>

          {/* E-Test Result */}
          <div className="card-hover p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900">E-Test</p>
                {learnerTest && (
                  <span className={getStatusColor(learnerTest.status)}>
                    {learnerTest.score}/{learnerTest.total} — {getStatusLabel(learnerTest.status)}
                  </span>
                )}
              </div>
            </div>
            {learnerTest ? (
              <p className="text-xs text-slate-400">Completed on {formatDate(learnerTest.completed_at)}</p>
            ) : (
              <p className="text-xs text-slate-400">Not attempted yet</p>
            )}
          </div>

          {/* Driving Test Booking */}
          <div className="card-hover p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900">Driving Test</p>
                {booking ? (
                  <span className={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</span>
                ) : (
                  <span className="badge-neutral">Not Booked</span>
                )}
              </div>
            </div>
            {booking ? (
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>📍 {booking.center_name}</p>
                <p>📅 {formatDate(booking.date)} at {booking.time}</p>
                <p>Booking: {booking.booking_id}</p>
              </div>
            ) : applicant?.learner_licence_status === 'passed' ? (
              <button onClick={() => navigate('/applicant/book-slot')} className="btn-primary text-xs mt-2 px-4 py-1.5">
                Book Driving Test
              </button>
            ) : (
              <p className="text-xs text-slate-400">Pass the e-test first</p>
            )}
          </div>
        </div>

        {/* Final Result */}
        {finalResult && (
          <div className={`card p-6 mb-6 animate-fade-in ${finalResult.status === 'pass' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-primary-900">Your Driving Assessment Result</h3>
                <p className="text-sm text-slate-500">Assessment completed on {formatDate(finalResult.generated_at)}</p>
              </div>
              <span className={`text-xl font-bold px-4 py-1 rounded-lg ${finalResult.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {finalResult.status === 'pass' ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-1">AI Evaluation</p>
                <p className="text-2xl font-bold text-accent-600">{finalResult.ai_score}<span className="text-sm text-slate-400">/60</span></p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-1">RTO Evaluation</p>
                <p className="text-2xl font-bold text-primary-600">{finalResult.rto_score}<span className="text-sm text-slate-400">/40</span></p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-1">Final Score</p>
                <p className={`text-2xl font-bold ${finalResult.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                  {finalResult.final_score}<span className="text-sm text-slate-400">/100</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate(`/applicant/result/${drivingTest.id}`)} className="btn-secondary text-sm">
                <BarChart3 className="w-4 h-4" /> View Detailed Report
              </button>
              {!reviewRequest && (
                <button onClick={() => navigate(`/applicant/review-request/${finalResult.id}`)} className="btn-ghost text-sm text-amber-600">
                  <Shield className="w-4 h-4" /> Request Human Review
                </button>
              )}
            </div>
            {reviewRequest && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                <p className="font-medium text-amber-700">Human Review: <span className={getStatusColor(reviewRequest.status)}>{getStatusLabel(reviewRequest.status)}</span></p>
                {reviewRequest.reviewer_comments && (
                  <p className="text-amber-600 mt-1 text-xs">Decision: {reviewRequest.reviewer_comments}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Current Application Status (no result yet) */}
        {!finalResult && drivingTest && (
          <div className="card p-6 mb-6 animate-fade-in">
            <h3 className="text-lg font-bold text-primary-900 mb-4">Current Application Status</h3>
            <div className="flex flex-wrap gap-2">
              <StatusStep done label="Application Submitted" />
              <StatusStep done={applicant?.identity_verified} label="Identity Verified" />
              <StatusStep done={applicant?.learner_licence_status === 'passed'} label="Learner Test Passed" />
              <StatusStep done={!!booking} label="Test Booked" />
              <StatusStep done={drivingTest?.has_video === 1} label="Video Uploaded" />
              <StatusStep done={drivingTest?.ai_status === 'completed'} label="AI Analysis" />
              <StatusStep done={drivingTest?.has_rto_eval === 1} label="RTO Evaluation" />
              <StatusStep done={!!finalResult} label="Result Generated" />
            </div>
          </div>
        )}

        {/* New Applicant CTA */}
        {!isExistingHolder && applicant?.learner_licence_status === 'not_applied' && !learnerTest && (
          <div className="card p-8 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">Start Your Driving Licence Journey</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Begin by taking the Learner Licence E-Test, or apply through the official Parivahan Sewa portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/applicant/learner-test')} className="btn-primary">
                <ClipboardCheck className="w-4 h-4" /> Take Learner E-Test
              </button>
              <a href="https://parivahan.gov.in/" target="_blank" rel="noopener noreferrer"
                className="btn-secondary">
                <ExternalLink className="w-4 h-4" /> Parivahan Sewa Portal
                <span className="text-[10px] text-slate-400">(External)</span>
              </a>
            </div>
            <div className="prototype-label mx-auto mt-4 w-fit">
              External Government Portal — Prototype Redirect
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusStep({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
      done ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'
    }`}>
      {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      {label}
    </div>
  );
}
