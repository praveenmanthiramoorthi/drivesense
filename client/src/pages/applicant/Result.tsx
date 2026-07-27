import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Shield, Car, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/utils';

export default function ApplicantResult() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [testId]);

  const loadResult = async () => {
    try {
      const res = await api.get(`/applicant/result/${testId}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load result:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // Using jsPDF for PDF generation
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const fr = data.finalResult;
      const ai = data.aiEval;
      const rto = data.rtoEval;
      const booking = data.booking;

      doc.setFontSize(20);
      doc.text('DriveSense AI — Assessment Report', 20, 20);
      doc.setFontSize(10);
      doc.text('Prototype — AI-Assisted Driving Assessment', 20, 28);

      doc.setFontSize(12);
      doc.text(`Candidate: ${data.test?.candidate_name || 'N/A'}`, 20, 45);
      doc.text(`Application ID: ${data.test?.application_id || 'N/A'}`, 20, 53);
      doc.text(`Test Date: ${formatDate(booking?.date)}`, 20, 61);
      doc.text(`RTO Center: ${booking?.center_name || 'N/A'}`, 20, 69);

      doc.setFontSize(14);
      doc.text('Score Summary', 20, 85);
      doc.setFontSize(11);
      doc.text(`AI Score: ${fr?.ai_score}/60`, 20, 95);
      doc.text(`RTO Score: ${fr?.rto_score}/40`, 20, 103);
      doc.text(`Final Score: ${fr?.final_score}/100`, 20, 111);
      doc.text(`Status: ${fr?.status?.toUpperCase()}`, 20, 119);
      doc.text(`Pass Threshold: ${fr?.pass_threshold}/100`, 20, 127);

      if (ai) {
        doc.setFontSize(14);
        doc.text('AI Evaluation Breakdown', 20, 145);
        doc.setFontSize(10);
        doc.text(`Lane Discipline: ${ai.lane_discipline}/10`, 20, 155);
        doc.text(`Traffic Compliance: ${ai.traffic_compliance}/10`, 20, 163);
        doc.text(`Speed Management: ${ai.speed_management}/10`, 20, 171);
        doc.text(`Braking & Acceleration: ${ai.braking_acceleration}/10`, 20, 179);
        doc.text(`Steering Control: ${ai.steering_control}/10`, 20, 187);
        doc.text(`Safe Behaviour: ${ai.safe_behaviour}/10`, 20, 195);
      }

      if (rto?.comments) {
        doc.setFontSize(14);
        doc.text('RTO Comments', 20, 215);
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(rto.comments, 170);
        doc.text(lines, 20, 225);
      }

      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toISOString()}`, 20, 280);
      doc.text('This is a prototype assessment report. AI does not issue a driving licence.', 20, 286);

      doc.save(`DriveSense_Report_${data.test?.application_id || 'report'}.pdf`);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!data?.finalResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="card p-8 text-center">
          <p className="text-slate-500">Result not available yet.</p>
          <button onClick={() => navigate('/applicant')} className="btn-primary mt-4">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const fr = data.finalResult;
  const ai = data.aiEval;
  const rto = data.rtoEval;
  const violations = ai ? JSON.parse(ai.violations_json || '[]') : [];

  const pieData = [
    { name: 'AI Score', value: fr.ai_score, color: '#06b6d4' },
    { name: 'RTO Score', value: fr.rto_score, color: '#1e40af' },
  ];

  const aiBreakdown = ai ? [
    { name: 'Lane', score: ai.lane_discipline, max: 10 },
    { name: 'Traffic', score: ai.traffic_compliance, max: 10 },
    { name: 'Speed', score: ai.speed_management, max: 10 },
    { name: 'Braking', score: ai.braking_acceleration, max: 10 },
    { name: 'Steering', score: ai.steering_control, max: 10 },
    { name: 'Safety', score: ai.safe_behaviour, max: 10 },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/applicant')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-500">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="font-semibold text-primary-900 text-sm">Assessment Report</span>
          <button onClick={handleDownloadPDF} className="btn-secondary text-xs">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Result Header */}
        <div className={`card p-6 mb-6 ${fr.status === 'pass' ? 'border-green-200' : 'border-red-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-primary-900">Driving Assessment Result</h1>
              <p className="text-sm text-slate-500">{data.test?.candidate_name} • {data.test?.application_id}</p>
            </div>
            <div className={`text-3xl font-bold px-6 py-2 rounded-xl ${fr.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {fr.status === 'pass' ? 'PASS' : 'FAIL'}
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <ScoreCard label="AI Evaluation" score={fr.ai_score} max={60} color="text-accent-600" />
            <ScoreCard label="RTO Evaluation" score={fr.rto_score} max={40} color="text-primary-600" />
            <ScoreCard label="Final Score" score={fr.final_score} max={100} color={fr.status === 'pass' ? 'text-green-600' : 'text-red-600'} />
            <ScoreCard label="Threshold" score={fr.pass_threshold} max={100} color="text-slate-500" />
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="font-semibold text-primary-900 mb-2">Score Composition</h3>
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} ${name === 'AI Score' ? '/ 60' : '/ 40'}`,
                      name,
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                    itemStyle={{ color: '#67e8f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-primary-900">{fr.final_score}</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">out of 100</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-accent-50/50 border border-accent-100">
                <span className="w-3 h-3 rounded-full bg-accent-500 flex-shrink-0"></span>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">AI Score (60%)</p>
                  <p className="text-sm font-bold text-accent-700">{fr.ai_score} <span className="text-xs font-normal text-slate-400">/ 60</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary-50/50 border border-primary-100">
                <span className="w-3 h-3 rounded-full bg-primary-600 flex-shrink-0"></span>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">RTO Score (40%)</p>
                  <p className="text-sm font-bold text-primary-700">{fr.rto_score} <span className="text-xs font-normal text-slate-400">/ 40</span></p>
                </div>
              </div>
            </div>
          </div>

          {ai && (
            <div className="card p-6">
              <h3 className="font-semibold text-primary-900 mb-4">AI Evaluation Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={aiBreakdown} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                  <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} / 10`, 'Score']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Bar dataKey="score" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Violations */}
        {violations.length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Detected Events
            </h3>
            <div className="prototype-label mb-3 w-fit">Prototype — Simulated AI Detections</div>
            <div className="space-y-2">
              {violations.map((v: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-mono text-slate-400 w-16">{v.timestamp}</span>
                  <span className={`badge ${v.severity === 'high' ? 'badge-danger' : v.severity === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>
                    {v.severity}
                  </span>
                  <span className="text-sm text-slate-700 flex-1">{v.description}</span>
                  <span className="text-xs text-slate-400">{(v.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RTO Comments */}
        {rto?.comments && (
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-primary-900 mb-3">RTO Officer Comments</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{rto.comments}</p>
            {rto.officer_name && <p className="text-xs text-slate-400 mt-2">— {rto.officer_name}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleDownloadPDF} className="btn-secondary">
            <Download className="w-4 h-4" /> Download Report
          </button>
          <button onClick={() => navigate(`/applicant/review-request/${fr.id}`)} className="btn-ghost text-amber-600">
            <Shield className="w-4 h-4" /> Request Human Review
          </button>
        </div>
      </main>
    </div>
  );
}

function ScoreCard({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  return (
    <div className="text-center p-4 bg-slate-50 rounded-lg">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {score}<span className="text-sm text-slate-400">/{max}</span>
      </p>
    </div>
  );
}
