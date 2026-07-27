import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ApplicantDashboard from './pages/applicant/Dashboard';
import LearnerTest from './pages/applicant/LearnerTest';
import BookSlot from './pages/applicant/BookSlot';
import ApplicantResult from './pages/applicant/Result';
import ReviewRequest from './pages/applicant/ReviewRequest';
import RTODashboard from './pages/rto/Dashboard';
import CandidateView from './pages/rto/CandidateView';
import ReviewDashboard from './pages/review/Dashboard';
import ReviewCase from './pages/review/ReviewCase';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={
        user.role === 'applicant' ? '/applicant' :
        user.role === 'rto_officer' ? '/rto' :
        user.role === 'admin' ? '/admin' : '/review'
      } replace /> : <Login />} />
      
      {/* Applicant Routes */}
      <Route path="/applicant" element={
        <ProtectedRoute roles={['applicant']}><ApplicantDashboard /></ProtectedRoute>
      } />
      <Route path="/applicant/learner-test" element={
        <ProtectedRoute roles={['applicant']}><LearnerTest /></ProtectedRoute>
      } />
      <Route path="/applicant/book-slot" element={
        <ProtectedRoute roles={['applicant']}><BookSlot /></ProtectedRoute>
      } />
      <Route path="/applicant/result/:testId" element={
        <ProtectedRoute roles={['applicant']}><ApplicantResult /></ProtectedRoute>
      } />
      <Route path="/applicant/review-request/:resultId" element={
        <ProtectedRoute roles={['applicant']}><ReviewRequest /></ProtectedRoute>
      } />

      {/* RTO Routes */}
      <Route path="/rto" element={
        <ProtectedRoute roles={['rto_officer']}><RTODashboard /></ProtectedRoute>
      } />
      <Route path="/rto/candidate/:testId" element={
        <ProtectedRoute roles={['rto_officer', 'review_officer', 'admin']}><CandidateView /></ProtectedRoute>
      } />

      {/* Review Officer Routes */}
      <Route path="/review" element={
        <ProtectedRoute roles={['review_officer', 'admin']}><ReviewDashboard /></ProtectedRoute>
      } />
      <Route path="/review/case/:reviewId" element={
        <ProtectedRoute roles={['review_officer', 'admin']}><ReviewCase /></ProtectedRoute>
      } />

      {/* Admin Panel Route */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin', 'review_officer']}><AdminDashboard /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
