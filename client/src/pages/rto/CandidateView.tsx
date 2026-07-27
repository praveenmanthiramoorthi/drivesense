import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Brain, ClipboardCheck, BarChart3, Play, AlertTriangle, CheckCircle, Send, Clock, FileVideo, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import { formatDate, formatDateTime, getStatusColor, getStatusLabel, formatFileSize } from '../../lib/utils';

export default function CandidateView() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'ai' | 'rto' | 'result' | 'audit'>('overview');
  
  // RTO evaluation form
  const [rtoForm, setRtoForm] = useState({
    vehicle_control: 8,
    manoeuvring: 8,
    observation_awareness: 8,
    overall_performance: 8,
    comments: '',
  });
  const [submittingRTO, setSubmittingRTO] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [testId]);

  const loadData = async () => {
    try {
      const res = await api.get(`/rto/candidate/${testId}`);
      setData(res.data);
      if (res.data.aiEval?.status === 'failed') {
        try {
          const parsed = JSON.parse(res.data.aiEval.violations_json || '{}');
          if (parsed.error) setAiError(parsed.error);
        } catch {
          setAiError('Invalid Driving Video — Please upload a valid dashboard driving-test video.');
        }
      } else {
        setAiError(null);
      }

      // Pre-fill RTO form if evaluation exists
      if (res.data.rtoEval) {
        setRtoForm({
          vehicle_control: res.data.rtoEval.vehicle_control,
          manoeuvring: res.data.rtoEval.manoeuvring,
          observation_awareness: res.data.rtoEval.observation_awareness,
          overall_performance: res.data.rtoEval.overall_performance,
          comments: res.data.rtoEval.comments || '',
        });
      }
      // Load audit logs
      const auditRes = await api.get(`/audit/driving-test/${testId}`);
      setAuditLogs(auditRes.data.logs || []);
    } catch (err) {
      console.error('Failed to load candidate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setAiError(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      await api.post(`/video/upload/${testId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      await loadData();
      setTab('overview');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRunAI = async () => {
    setAnalyzing(true);
    setAiError(null);
    try {
      await api.post(`/ai-analysis/run/${testId}`);
      await loadData();
      setTab('ai');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'AI analysis failed';
      setAiError(errMsg);
      await loadData();
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitRTO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRTO(true);
    try {
      await api.post(`/evaluation/rto-submit/${testId}`, rtoForm);
      await loadData();
      setTab('result');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Submit failed');
    } finally {
      setSubmittingRTO(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const test = data?.test;
  const video = data?.video;
  const aiEval = data?.aiEval;
  const rtoEval = data?.rtoEval;
  const finalResult = data?.finalResult;
  const rawViolations = aiEval ? aiEval.violations_json : '[]';
  let violations: any[] = [];
  try {
    const parsed = JSON.parse(rawViolations);
    if (Array.isArray(parsed)) violations = parsed;
  } catch {}

  const rtoTotal = rtoForm.vehicle_control + rtoForm.manoeuvring + rtoForm.observation_awareness + rtoForm.overall_performance;

  const aiBreakdown = (aiEval && aiEval.status === 'completed') ? [
    { name: 'Lane Discipline', score: aiEval.lane_discipline },
    { name: 'Traffic Compliance', score: aiEval.traffic_compliance },
    { name: 'Speed Management', score: aiEval.speed_management },
    { name: 'Braking', score: aiEval.braking_acceleration },
    { name: 'Steering', score: aiEval.steering_control },
    { name: 'Safe Behaviour', score: aiEval.safe_behaviour },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/rto')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-500">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="font-semibold text-primary-900 text-sm">
            Assessment: {test?.candidate_name} ({test?.candidate_id})
          </span>
          <span className={getStatusColor(test?.status)}>{getStatusLabel(test?.status)}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Hidden File Input */}
        <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".mp4,.mov,.webm,.avi" className="hidden" />

        {/* Candidate Info */}
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <p className="text-lg font-semibold text-primary-900">{test?.candidate_name}</p>
            <p className="text-xs text-slate-400">
              {test?.application_id} • {test?.candidate_id} • {test?.candidate_email}
            </p>
          </div>
          <div className="text-sm text-slate-600">
            📍 {test?.center_name} • 📅 {test?.test_date} • 🕐 {test?.test_time}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'ai', label: 'AI Analysis', icon: Brain },
            { id: 'rto', label: 'RTO Evaluation', icon: ClipboardCheck },
            { id: 'result', label: 'Result', icon: CheckCircle },
            { id: 'audit', label: 'Audit Trail', icon: Clock },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-primary-500 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Invalid Video Banner Alert */}
        {aiError && (
          <div className="p-5 rounded-xl bg-red-50 border-2 border-red-200 text-red-800 mb-6 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-900 text-base">Invalid Driving Video Detected</h4>
                <p className="mt-1 text-sm text-red-700 font-medium">{aiError}</p>
                <p className="text-xs text-red-500 mt-2">
                  The AI verification system rejected non-driving/movie content. No AI score was generated. Please upload a valid dashboard driving-test video.
                </p>
                <button onClick={() => fileInputRef.current?.click()} className="btn-danger text-xs mt-4 px-4 py-2">
                  <Upload className="w-4 h-4" /> Upload Valid Driving Video
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {tab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Video Upload */}
            <div className="card p-6">
              <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-primary-500" /> Driving Test Video
              </h3>
              {video ? (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Play className="w-8 h-8 text-primary-500" />
                      <div>
                        <p className="text-sm font-medium text-primary-900">{video.original_name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(video.size)} • Uploaded {formatDateTime(video.uploaded_at)}</p>
                      </div>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs">
                      Re-upload Video
                    </button>
                  </div>
                  {(!aiEval || aiEval.status === 'failed') && (
                    <button onClick={handleRunAI} disabled={analyzing} className="btn-accent text-sm mt-2">
                      {analyzing ? (
                        <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Analyzing Video...</>
                      ) : (
                        <><Brain className="w-4 h-4" /> Run AI Analysis</>
                      )}
                    </button>
                  )}
                  {aiEval?.status === 'completed' && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-4 h-4" /> AI Analysis Complete — Score: {aiEval.total_score}/60
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="btn-primary">
                    <Upload className="w-4 h-4" /> {uploading ? `Uploading ${uploadProgress}%...` : 'Upload Driving Test Video'}
                  </button>
                  {uploading && (
                    <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">Accept: MP4, MOV, WebM, AVI (max 500MB)</p>
                </div>
              )}
            </div>

            {/* Quick Status */}
            <div className="grid sm:grid-cols-3 gap-4">
              <StatusCard label="AI Analysis"
                status={aiEval?.status === 'failed' ? 'failed' : (aiEval?.status || 'pending')}
                score={aiEval?.status === 'completed' ? aiEval?.total_score : undefined}
                max={60}
                onClick={() => aiEval && setTab('ai')} />
              <StatusCard label="RTO Evaluation" status={rtoEval ? 'completed' : 'pending'} score={rtoEval?.total_score} max={40} onClick={() => setTab('rto')} />
              <StatusCard label="Final Result" status={finalResult?.status || 'pending'} score={finalResult?.final_score} max={100} onClick={() => finalResult && setTab('result')} />
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div className="space-y-6 animate-fade-in">
            {(!aiEval || aiEval.status === 'failed') ? (
              <div className="card p-8 text-center">
                <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-primary-900 mb-1">
                  {aiEval?.status === 'failed' ? 'AI Analysis Failed — Invalid Video' : 'AI Analysis Pending'}
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
                  {aiError || 'Run AI analysis to evaluate driving scene metrics.'}
                </p>
                {video && (
                  <button onClick={handleRunAI} disabled={analyzing} className="btn-accent text-sm">
                    {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-accent-500" /> AI Driving Analysis
                    </h3>
                    <div className="prototype-label">AI Driving Scene Verified</div>
                  </div>
                  <div className="text-center mb-6">
                    <p className="text-sm text-slate-400">AI Score</p>
                    <p className="text-5xl font-bold text-accent-600">{aiEval.total_score}<span className="text-xl text-slate-400"> / 60</span></p>
                    <p className="text-xs text-slate-400 mt-1">Confidence: {(aiEval.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={aiBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} />
                      <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 10, fill: '#475569' }} />
                      <Tooltip
                        formatter={(value: any) => [`${value} / 10`, 'Score']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                      />
                      <Bar dataKey="score" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Criterion Details */}
                <div className="card p-6">
                  <h3 className="font-semibold text-primary-900 mb-4">Score Breakdown</h3>
                  <div className="space-y-3">
                    {aiBreakdown.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-40">{item.name}</span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-500 rounded-full transition-all" style={{ width: `${item.score * 10}%` }}></div>
                        </div>
                        <span className="text-sm font-semibold text-primary-900 w-12 text-right">{item.score}/10</span>
                      </div>
                    ))}
                  </div>
                </div>

                {violations.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" /> Detected Events ({violations.length})
                    </h3>
                    <div className="space-y-2">
                      {violations.map((v: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200">{v.timestamp}</span>
                          <span className={`badge ${v.severity === 'high' ? 'badge-danger' : v.severity === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>
                            {v.severity}
                          </span>
                          <span className="text-sm text-slate-700 flex-1">{v.description}</span>
                          <span className="text-xs text-slate-400">{(v.confidence * 100).toFixed(0)}% conf.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'rto' && (
          <div className="animate-fade-in">
            <div className="card p-6">
              <h3 className="font-semibold text-primary-900 mb-6 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary-500" /> RTO Human Evaluation
              </h3>
              <form onSubmit={handleSubmitRTO} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <ScoreInput label="Practical Vehicle Control" max={10} value={rtoForm.vehicle_control}
                    onChange={(v) => setRtoForm({ ...rtoForm, vehicle_control: v })} />
                  <ScoreInput label="Manoeuvring" max={10} value={rtoForm.manoeuvring}
                    onChange={(v) => setRtoForm({ ...rtoForm, manoeuvring: v })} />
                  <ScoreInput label="Observation & Awareness" max={10} value={rtoForm.observation_awareness}
                    onChange={(v) => setRtoForm({ ...rtoForm, observation_awareness: v })} />
                  <ScoreInput label="Overall Driving Performance" max={10} value={rtoForm.overall_performance}
                    onChange={(v) => setRtoForm({ ...rtoForm, overall_performance: v })} />
                </div>

                <div className="p-4 bg-primary-50 rounded-lg text-center">
                  <p className="text-sm text-primary-600">RTO Total Score</p>
                  <p className="text-3xl font-bold text-primary-900">{rtoTotal}<span className="text-lg text-slate-400"> / 40</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Officer Comments & Observations</label>
                  <textarea value={rtoForm.comments} onChange={(e) => setRtoForm({ ...rtoForm, comments: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter observations, comments, and notes about the driving test..."
                  />
                </div>

                <button type="submit" className="btn-primary w-full" disabled={submittingRTO}>
                  {submittingRTO ? 'Submitting...' : 'Submit RTO Evaluation'}
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'result' && (
          <div className="animate-fade-in">
            {finalResult ? (
              <div className="space-y-6">
                <div className={`card p-6 ${finalResult.status === 'pass' ? 'border-green-200' : 'border-red-200'}`}>
                  <div className="text-center mb-6">
                    <p className="text-sm text-slate-400">Final Assessment Result</p>
                    <p className={`text-6xl font-bold mt-2 ${finalResult.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {finalResult.final_score}<span className="text-2xl text-slate-400">/100</span>
                    </p>
                    <span className={`text-2xl font-bold mt-2 inline-block ${finalResult.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {finalResult.status === 'pass' ? '✓ PASS' : '✗ FAIL'}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-accent-50 rounded-lg text-center border border-accent-200">
                      <p className="text-xs text-accent-600">AI Assessment (60%)</p>
                      <p className="text-2xl font-bold text-accent-700">{finalResult.ai_score}/60</p>
                    </div>
                    <div className="p-4 bg-primary-50 rounded-lg text-center border border-primary-200">
                      <p className="text-xs text-primary-600">RTO Assessment (40%)</p>
                      <p className="text-2xl font-bold text-primary-700">{finalResult.rto_score}/40</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-4">
                    Pass Threshold: {finalResult.pass_threshold}/100 • Generated: {formatDateTime(finalResult.generated_at)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-slate-500">Result not yet generated. Complete both AI and RTO evaluations first.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div className="card p-6 animate-fade-in">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" /> Audit Trail
            </h3>
            {auditLogs.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
                {auditLogs.map((log: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-white border-2 border-primary-400"></div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-primary-900">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(log.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{log.details}</p>
                      {log.user_name && <p className="text-xs text-slate-400 mt-1">By: {log.user_name} ({log.user_role})</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No audit logs found for this test.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusCard({ label, status, score, max, onClick }: { label: string; status: string; score?: number; max: number; onClick: () => void }) {
  return (
    <div className="card-hover p-5 cursor-pointer" onClick={onClick}>
      <p className="text-sm font-semibold text-primary-900 mb-1">{label}</p>
      <span className={getStatusColor(status)}>{getStatusLabel(status)}</span>
      {score !== undefined && score !== null && (
        <p className="text-2xl font-bold text-primary-900 mt-2">{score}<span className="text-sm text-slate-400">/{max}</span></p>
      )}
    </div>
  );
}

function ScoreInput({ label, max, value, onChange }: { label: string; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label} <span className="text-slate-400">(max {max})</span></label>
      <div className="flex items-center gap-3">
        <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary-500" />
        <input type="number" min={0} max={max} value={value} onChange={(e) => {
          const v = Math.min(max, Math.max(0, Number(e.target.value)));
          onChange(v);
        }} className="w-16 input-field text-center font-bold" />
      </div>
    </div>
  );
}
