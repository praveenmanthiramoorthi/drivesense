import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, LogOut, BarChart3, Users, Clock, CheckCircle, Brain, ClipboardCheck, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import { getStatusColor, getStatusLabel } from '../../lib/utils';

export default function RTODashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [filter]);

  const loadData = async () => {
    try {
      const res = await api.get('/rto/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    try {
      const res = await api.get(`/rto/candidates?status=${filter}`);
      setCandidates(res.data.candidates);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const officer = data?.officer;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-primary-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">DriveSense <span className="text-accent-400">AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-primary-300">{officer?.rto_center || 'RTO Officer'}</p>
            </div>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors flex items-center gap-1.5">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-primary-900 mb-6">RTO Officer Dashboard</h1>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard icon={Calendar} label="Today's Tests" value={metrics?.todayTests} color="bg-blue-500" />
          <MetricCard icon={Brain} label="Pending AI" value={metrics?.pendingAI} color="bg-cyan-500" />
          <MetricCard icon={ClipboardCheck} label="Pending RTO" value={metrics?.pendingRTO} color="bg-amber-500" />
          <MetricCard icon={CheckCircle} label="Completed" value={metrics?.completed} color="bg-green-500" />
          <MetricCard icon={TrendingUp} label="Pass Rate" value={`${metrics?.passRate}%`} color="bg-indigo-500" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'all', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'video_uploaded', label: 'Video Uploaded' },
            { value: 'ai_analyzed', label: 'AI Analyzed' },
            { value: 'rto_evaluated', label: 'RTO Evaluated' },
            { value: 'completed', label: 'Completed' },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.value ? 'bg-primary-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Candidates Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Test Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">AI Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">RTO Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Final</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-primary-900">{c.candidate_name}</p>
                      <p className="text-xs text-slate-400">{c.candidate_id} • {c.application_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{c.test_date}</p>
                      <p className="text-xs text-slate-400">{c.test_time} • {c.center_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusColor(c.ai_status)}>{getStatusLabel(c.ai_status)}</span>
                      {c.ai_score !== null && <p className="text-xs text-slate-400 mt-0.5">{c.ai_score}/60</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusColor(c.rto_status)}>{getStatusLabel(c.rto_status)}</span>
                      {c.rto_score !== null && <p className="text-xs text-slate-400 mt-0.5">{c.rto_score}/40</p>}
                    </td>
                    <td className="px-4 py-3">
                      {c.final_score !== null ? (
                        <>
                          <span className={`text-sm font-bold ${c.final_status === 'pass' ? 'text-green-600' : c.final_status === 'fail' ? 'text-red-600' : 'text-slate-400'}`}>
                            {c.final_score}/100
                          </span>
                          <p className="text-xs">
                            <span className={getStatusColor(c.final_status)}>{getStatusLabel(c.final_status)}</span>
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/rto/candidate/${c.id}`)}
                        className="text-sm text-primary-500 hover:text-primary-700 font-medium">
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                      No candidates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-primary-900">{value ?? 0}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
