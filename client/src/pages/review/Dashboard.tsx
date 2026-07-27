import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, LogOut, Scale, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import { formatDateTime, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function ReviewDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      const res = await api.get(`/review/requests?status=${filter}`);
      setRequests(res.data.requests);
    } catch (err) {
      console.error('Failed to load review requests:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-amber-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">DriveSense <span className="text-amber-300">AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-amber-300">Review Officer</p>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors flex items-center gap-1.5">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-primary-900 mb-6">Review Officer Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{requests.filter(r => r.status === 'pending').length}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{requests.filter(r => r.status === 'in_review').length}</p>
              <p className="text-xs text-slate-500">In Review</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{requests.filter(r => ['upheld', 'modified', 'reassessment'].includes(r.status)).length}</p>
              <p className="text-xs text-slate-500">Resolved</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{requests.length}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'in_review', 'upheld', 'modified', 'reassessment'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {f === 'all' ? 'All' : getStatusLabel(f)}
            </button>
          ))}
        </div>

        {/* Review Requests */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            </div>
          ) : requests.length > 0 ? requests.map((req) => (
            <div key={req.id} className="card-hover p-5 cursor-pointer" onClick={() => navigate(`/review/case/${req.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-primary-900">{req.applicant_name}</p>
                  <p className="text-xs text-slate-400">{req.application_id} • {req.center_name}</p>
                </div>
                <span className={getStatusColor(req.status)}>{getStatusLabel(req.status)}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-2">
                <span>Reason: <strong>{req.reason}</strong></span>
                <span>Score: <strong>{req.final_score}/100</strong> ({req.result_status?.toUpperCase()})</span>
                <span>Date: {formatDateTime(req.created_at)}</span>
              </div>
              <p className="text-xs text-slate-400 truncate">{req.description}</p>
            </div>
          )) : (
            <div className="card p-8 text-center text-slate-400">No review requests found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
