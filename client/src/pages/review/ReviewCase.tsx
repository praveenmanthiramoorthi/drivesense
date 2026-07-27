import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, ClipboardCheck, Scale, CheckCircle, AlertTriangle, Clock, Video, User, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import { formatDateTime, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function ReviewCase() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [modifiedScore, setModifiedScore] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadCase();
  }, [reviewId]);

  const loadCase = async () => {
    try {
      const res = await api.get(`/review/case/${reviewId}`);
      setData(res.data);
      // Load audit trail
      if (res.data.drivingTest?.id) {
        const auditRes = await api.get(`/audit/driving-test/${res.data.drivingTest.id}`);
        setAuditLogs(auditRes.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      await api.post(`/review/decide/${reviewId}`, {
        decision,
        comments,
        modifiedScore: decision === 'modified' ? modifiedScore : undefined,
      });
      await loadCase();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const review = data?.review;
  const fr = data?.finalResult;
  const ai = data?.aiEval;
  const rto = data?.rtoEval;
  const video = data?.video;
  const test = data?.drivingTest;
  const violations = ai ? JSON.parse(ai.violations_json || '[]') : [];
  const isResolved = ['upheld', 'modified', 'reassessment'].includes(review?.status);

  const aiBreakdown = ai ? [
    { name: 'Lane', score: ai.lane_discipline },
    { name: 'Traffic', score: ai.traffic_compliance },
    { name: 'Speed', score: ai.speed_management },
    { name: 'Braking', score: ai.braking_acceleration },
    { name: 'Steering', score: ai.steering_control },
    { name: 'Safety', score: ai.safe_behaviour },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/review')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="font-semibold text-primary-900 text-sm">Review Case: {review?.applicant_name}</span>
          <span className={getStatusColor(review?.status)}>{getStatusLabel(review?.status)}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Applicant Complaint */}
        <div className="card p-6 border-amber-200 bg-amber-50/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900">Applicant Review Request</h3>
              <p className="text-sm text-slate-500 mt-1">
                <strong>{review?.applicant_name}</strong> ({review?.application_id}) — Filed {formatDateTime(review?.created_at)}
              </p>
              <div className="mt-3">
                <p className="text-sm"><strong>Reason:</strong> {review?.reason}</p>
                <p className="text-sm text-slate-600 mt-1">{review?.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="card p-6">
          <h3 className="font-semibold text-primary-900 mb-4">Assessment Summary</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-accent-50 rounded-lg">
              <p className="text-xs text-accent-600">AI Score</p>
              <p className="text-2xl font-bold text-accent-700">{fr?.ai_score}/60</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-xs text-primary-600">RTO Score</p>
              <p className="text-2xl font-bold text-primary-700">{fr?.rto_score}/40</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Final Score</p>
              <p className={`text-2xl font-bold ${fr?.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>{fr?.final_score}/100</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Status</p>
              <p className={`text-2xl font-bold ${fr?.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>{fr?.status?.toUpperCase()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Test: {test?.test_date} at {test?.test_time} • Center: {test?.center_name} • Threshold: {fr?.pass_threshold}/100
          </p>
        </div>

        {/* AI Analysis */}
        {ai && (
          <div className="card p-6">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent-500" /> AI Analysis Review
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={aiBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 10, fill: '#475569' }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} / 10`, 'Score']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Bar dataKey="score" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Detected Violations</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {violations.map((v: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-xs">
                      <span className="font-mono text-slate-400">{v.timestamp}</span>
                      <span className={`badge ${v.severity === 'high' ? 'badge-danger' : v.severity === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>
                        {v.severity}
                      </span>
                      <span className="text-slate-600 flex-1">{v.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RTO Evaluation */}
        {rto && (
          <div className="card p-6">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary-500" /> RTO Evaluation
            </h3>
            <div className="grid sm:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Vehicle Control</p>
                <p className="text-xl font-bold">{rto.vehicle_control}/10</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Manoeuvring</p>
                <p className="text-xl font-bold">{rto.manoeuvring}/10</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Observation</p>
                <p className="text-xl font-bold">{rto.observation_awareness}/10</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Overall</p>
                <p className="text-xl font-bold">{rto.overall_performance}/10</p>
              </div>
            </div>
            {rto.comments && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Officer Comments:</p>
                <p className="text-sm text-slate-600">{rto.comments}</p>
                <p className="text-xs text-slate-400 mt-1">— {rto.officer_name}</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Trail */}
        {auditLogs.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" /> Audit Trail
            </h3>
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-3 max-h-64 overflow-y-auto">
              {auditLogs.map((log: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-white border-2 border-slate-300"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-900">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(log.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision */}
        {!isResolved ? (
          <div className="card p-6 border-amber-200">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-500" /> Review Decision
            </h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { value: 'upheld', label: 'Uphold Result', desc: 'Original assessment stands', color: 'border-green-300 bg-green-50' },
                  { value: 'modified', label: 'Modify Result', desc: 'Adjust the final score', color: 'border-amber-300 bg-amber-50' },
                  { value: 'reassessment', label: 'Request Reassessment', desc: 'Schedule a new test', color: 'border-red-300 bg-red-50' },
                ].map((d) => (
                  <button key={d.value} onClick={() => setDecision(d.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      decision === d.value ? d.color + ' ring-2 ring-offset-1 ring-amber-400' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <p className="text-sm font-semibold">{d.label}</p>
                    <p className="text-xs text-slate-500">{d.desc}</p>
                  </button>
                ))}
              </div>

              {decision === 'modified' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modified Final Score</label>
                  <input type="number" min={0} max={100} value={modifiedScore || fr?.final_score || 0}
                    onChange={(e) => setModifiedScore(Number(e.target.value))}
                    className="input-field w-32" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Review Comments</label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="Provide detailed reasoning for your decision..." />
              </div>

              <button onClick={handleDecision} disabled={!decision || submitting} className="btn-primary">
                {submitting ? 'Submitting...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-6 border-green-200 bg-green-50/30">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Review Complete
            </h3>
            <p className="text-sm text-green-700">Decision: <strong>{getStatusLabel(review?.status)}</strong></p>
            {review?.reviewer_comments && (
              <p className="text-sm text-green-600 mt-1">{review.reviewer_comments}</p>
            )}
            <p className="text-xs text-green-500 mt-2">Resolved: {formatDateTime(review?.resolved_at)}</p>
          </div>
        )}
      </main>
    </div>
  );
}
