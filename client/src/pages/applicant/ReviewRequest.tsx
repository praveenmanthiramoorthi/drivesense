import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Send, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

const REASONS = [
  'Incorrect AI detection',
  'Incorrect RTO evaluation',
  'Technical issue during test',
  'Video quality / recording issue',
  'Other',
];

export default function ReviewRequest() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setLoading(true);
    try {
      await api.post('/review/request', {
        finalResultId: resultId,
        reason,
        description,
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit review request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Review Request Submitted</h2>
          <p className="text-slate-500 mb-6">
            Your request for human review has been submitted. A review officer will examine your assessment
            and make a decision.
          </p>
          <button onClick={() => navigate('/applicant')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-500">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">Request Human Review</h2>
              <p className="text-sm text-slate-500">Submit your reason for review and a review officer will examine your case</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Review</label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    reason === r ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input type="radio" name="reason" value={r} checked={reason === r}
                      onChange={(e) => setReason(e.target.value)} className="accent-primary-500" />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                className="input-field h-32 resize-none"
                placeholder="Provide details about why you believe the assessment should be reviewed..."
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading || !reason}>
              {loading ? 'Submitting...' : 'Submit Review Request'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
