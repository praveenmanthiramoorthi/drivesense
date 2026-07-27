import { useNavigate } from 'react-router-dom';
import { Shield, Brain, Users, Eye, CheckCircle, ArrowRight, Car, FileCheck, Video, BarChart3, Scale, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';

const workflowSteps = [
  { icon: Shield, label: 'Secure Login', color: 'bg-blue-500' },
  { icon: FileCheck, label: 'Learner Licence', color: 'bg-indigo-500' },
  { icon: ClipboardCheck, label: 'E-Test', color: 'bg-violet-500' },
  { icon: Car, label: 'Book Driving Test', color: 'bg-purple-500' },
  { icon: Brain, label: 'AI Assessment', color: 'bg-cyan-500' },
  { icon: Users, label: 'RTO Assessment', color: 'bg-teal-500' },
  { icon: BarChart3, label: '60:40 Score Fusion', color: 'bg-emerald-500' },
  { icon: CheckCircle, label: 'Result', color: 'bg-green-500' },
  { icon: Scale, label: 'Human Review', color: 'bg-amber-500' },
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Evaluation',
    description: 'Computer vision analyzes driving videos for lane discipline, traffic compliance, speed management, and safe driving behaviour.',
  },
  {
    icon: Eye,
    title: 'Transparent Scoring',
    description: '60:40 AI + RTO score fusion ensures objective, standardized evaluation with full breakdown visibility.',
  },
  {
    icon: Shield,
    title: 'Anti-Corruption Design',
    description: 'Complete audit trail, tamper-proof scoring, and human review mechanism ensure integrity at every step.',
  },
  {
    icon: Scale,
    title: 'Human Review',
    description: 'Applicants can appeal results. Review officers examine video evidence, AI analysis, and RTO scores for fair decisions.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-900">DriveSense <span className="text-accent-500">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate(
                user.role === 'applicant' ? '/applicant' :
                user.role === 'rto_officer' ? '/rto' :
                user.role === 'admin' ? '/admin' : '/review'
              )} className="btn-primary text-sm">
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn-ghost text-sm">Log In</button>
                <button onClick={() => navigate('/login')} className="btn-primary text-sm">Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-50 border border-accent-200 text-accent-700 text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            AI-Assisted Driving Assessment Ecosystem
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary-900 mb-6 leading-tight">
            DriveSense <span className="text-accent-500">AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-600 font-medium mb-4">
            Transparent. Intelligent. Fair Driving Assessment.
          </p>
          <p className="text-base text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            An AI-assisted driving assessment ecosystem combining computer vision and standardized RTO evaluation
            to create transparent and auditable driving test results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button onClick={() => navigate('/login')} className="btn-primary text-base px-8 py-3">
              Applicant Login <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary text-base px-8 py-3">
              RTO Officer Login
            </button>
          </div>
          <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-slate-500 hover:text-primary-500 transition-colors">
            View How It Works ↓
          </button>
        </div>
      </section>

      {/* Workflow */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-primary-900 mb-3">How It Works</h2>
            <p className="text-slate-500">Complete end-to-end driving licence assessment workflow</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:gap-1">
            {workflowSteps.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-3 md:px-4">
                  <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center shadow-lg`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-600 text-center whitespace-nowrap">{step.label}</span>
                </div>
                {i < workflowSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-primary-900 mb-3">Why DriveSense AI?</h2>
            <p className="text-slate-500">Making driving assessment transparent, fair, and accountable</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card-hover p-6">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Evaluation Section */}
      <section className="py-20 px-6 bg-primary-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">AI Evaluation Criteria</h2>
              <p className="text-primary-200 mb-8">
                Our AI system evaluates six key dimensions of driving performance, each scored out of 10, for a total AI score of 60.
              </p>
              <div className="space-y-3">
                {['Lane Discipline', 'Traffic Rule Compliance', 'Speed Management', 'Braking & Acceleration', 'Steering & Vehicle Control', 'Safe Driving Behaviour'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                    <span className="text-primary-400 text-xs ml-auto">/ 10 marks</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-slate-500">Score Fusion Model</p>
                <p className="text-3xl font-bold text-primary-900 mt-1">60 : 40</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-accent-700">AI Assessment</span>
                    <span className="text-slate-500">60 marks</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-primary-700">RTO Assessment</span>
                    <span className="text-slate-500">40 marks</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-primary-900">Final Score</span>
                    <span className="font-semibold text-primary-900">100 marks</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Pass Threshold: 70/100</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Quick Access */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="prototype-label mx-auto mb-6 w-fit">
            ⚡ Hackathon Prototype — Demo Quick Access
          </div>
          <h2 className="text-3xl font-bold text-primary-900 mb-4">Try the Demo</h2>
          <p className="text-slate-500 mb-8">
            Experience the full DriveSense AI workflow with pre-loaded demo data.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DemoCard role="applicant" desc="Applicant with a scheduled driving test" />
            <DemoCard role="rto_officer" desc="RTO Officer at Chennai Central" />
            <DemoCard role="review_officer" desc="Review Officer / Appeals" />
            <DemoCard role="admin" desc="Manage users, status & delete accounts" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-primary-900">DriveSense AI</span>
          </div>
          <p className="text-xs text-slate-400">
            Prototype — AI does not issue a driving licence. Final licensing decisions remain with the authorized authority.
          </p>
        </div>
      </footer>
    </div>
  );
}

function DemoCard({ role, desc }: { role: string; desc: string }) {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();

  const handleDemo = async () => {
    try {
      await demoLogin(role);
      navigate(
        role === 'applicant' ? '/applicant' :
        role === 'rto_officer' ? '/rto' :
        role === 'admin' ? '/admin' : '/review'
      );
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  const roleLabel = role === 'applicant' ? 'Applicant' : role === 'rto_officer' ? 'RTO Officer' : role === 'admin' ? 'System Admin' : 'Review Officer';
  const iconColor = role === 'applicant' ? 'bg-blue-500' : role === 'rto_officer' ? 'bg-teal-500' : role === 'admin' ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className="card-hover p-5 text-left cursor-pointer" onClick={handleDemo}>
      <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center mb-3`}>
        <Users className="w-5 h-5 text-white" />
      </div>
      <p className="font-semibold text-primary-900 text-base mb-1">{roleLabel}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );
}
