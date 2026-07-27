import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, ArrowLeft, Clock, CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';

interface Question {
  id: number;
  question: string;
  options: string[];
  category: string;
}

export default function LearnerTest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [status, setStatus] = useState<'loading' | 'ready' | 'testing' | 'submitted'>('loading');
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (status !== 'testing') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const loadQuestions = async () => {
    try {
      const res = await api.get('/learner-test/questions');
      setQuestions(res.data.questions);
      setStatus('ready');
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answerArray = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] ?? -1,
      }));
      const res = await api.post('/learner-test/submit', { answers: answerArray });
      setResult(res.data);
      setStatus('submitted');
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, submitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = Object.keys(answers).length / questions.length * 100;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (status === 'submitted' && result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card max-w-lg w-full p-8 text-center animate-fade-in">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            result.status === 'passed' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result.status === 'passed' 
              ? <CheckCircle className="w-10 h-10 text-green-500" />
              : <XCircle className="w-10 h-10 text-red-500" />
            }
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            {result.status === 'passed' ? 'Congratulations!' : 'Better Luck Next Time'}
          </h2>
          <p className="text-slate-500 mb-6">{result.message}</p>
          
          <div className={`text-5xl font-bold mb-2 ${result.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
            {result.score}/{result.total}
          </div>
          <span className={`text-lg font-semibold ${result.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
            {result.status === 'passed' ? 'PASS' : 'FAIL'}
          </span>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-5 gap-2">
              {result.results?.map((r: any, i: number) => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  r.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100"></span> Correct</span>
            <span className="inline-flex items-center gap-1 ml-4"><span className="w-3 h-3 rounded bg-red-100"></span> Incorrect</span>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <button onClick={() => navigate('/applicant')} className="btn-primary">
              Back to Dashboard
            </button>
            {result.status === 'passed' && (
              <button onClick={() => navigate('/applicant/book-slot')} className="btn-accent">
                Book Driving Test <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="prototype-label mx-auto mt-6 w-fit">
            Prototype — Simulated Learner Licence E-Test
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/applicant')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-500">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-primary-900 text-sm">Learner Licence E-Test</span>
          </div>
          {status === 'testing' && (
            <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-primary-700'}`}>
              <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {status === 'ready' && (
          <div className="card p-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Learner Licence E-Test</h2>
            <p className="text-slate-500 mb-2">10 multiple-choice questions on traffic rules, road safety, and driving etiquette.</p>
            <p className="text-sm text-slate-400 mb-6">Time limit: 15 minutes | Pass mark: 7/10</p>
            <button onClick={() => setStatus('testing')} className="btn-primary text-lg px-10 py-3">
              Start Test
            </button>
            <div className="prototype-label mx-auto mt-6 w-fit">
              Prototype — Simulated E-Test Module
            </div>
          </div>
        )}

        {status === 'testing' && questions.length > 0 && (
          <div className="animate-fade-in">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span>Question {currentQ + 1} of {questions.length}</span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            {/* Question */}
            <div className="card p-6 mb-6">
              <span className="badge-info mb-3">{questions[currentQ].category}</span>
              <h3 className="text-lg font-semibold text-primary-900 mb-5">{questions[currentQ].question}</h3>
              <div className="space-y-3">
                {questions[currentQ].options.map((option, i) => (
                  <button key={i} onClick={() => handleAnswer(questions[currentQ].id, i)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers[questions[currentQ].id] === i
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-sm font-medium mr-3 ${
                      answers[questions[currentQ].id] === i
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
                className="btn-secondary text-sm">
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary text-sm">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn-accent text-sm">
                  {submitting ? 'Submitting...' : 'Submit Test'} <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Question navigator */}
            <div className="mt-6 card p-4">
              <p className="text-xs text-slate-400 mb-2">Question Navigator</p>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => (
                  <button key={i} onClick={() => setCurrentQ(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      i === currentQ ? 'bg-primary-500 text-white' :
                      answers[q.id] !== undefined ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
