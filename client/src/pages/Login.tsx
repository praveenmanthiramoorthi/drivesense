import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Mail, Lock, Phone, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'digilocker'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [digilockerStep, setDigilockerStep] = useState(0);
  const navigate = useNavigate();
  const { login, register, demoLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/applicant');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ email, password, name, phone });
      navigate('/applicant');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(role);
      navigate(
        role === 'applicant' ? '/applicant' :
        role === 'rto_officer' ? '/rto' :
        role === 'admin' ? '/admin' : '/review'
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDigilocker = () => {
    setMode('digilocker');
    setDigilockerStep(0);
    // Simulate OAuth flow
    setTimeout(() => setDigilockerStep(1), 1500);
    setTimeout(() => setDigilockerStep(2), 3000);
    setTimeout(() => {
      setDigilockerStep(3);
      // Auto-login as demo applicant
      handleDemoLogin('applicant');
    }, 4000);
  };

  if (mode === 'digilocker') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="prototype-label mx-auto mb-6 w-fit">
            ⚠️ Prototype Integration — Government API connection required for production
          </div>
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-primary-900 mb-2">DigiLocker Identity Verification</h2>
          <p className="text-sm text-slate-500 mb-8">(Prototype Simulation)</p>

          <div className="space-y-4 text-left">
            <StepItem done={digilockerStep >= 1} active={digilockerStep === 0} label="Connecting to DigiLocker..." />
            <StepItem done={digilockerStep >= 2} active={digilockerStep === 1} label="Verifying identity documents..." />
            <StepItem done={digilockerStep >= 3} active={digilockerStep === 2} label="Identity verification successful" />
          </div>

          {digilockerStep < 3 && (
            <div className="mt-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          )}

          <button onClick={() => setMode('login')} className="text-sm text-slate-400 mt-6 hover:text-primary-500">
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DriveSense <span className="text-accent-400">AI</span></span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-4">
            Welcome to DriveSense AI
          </h2>
          <p className="text-primary-200 leading-relaxed">
            Transparent, intelligent, and fair driving assessment powered by AI.
            Log in to access your dashboard.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-primary-300 text-sm">Demo Accounts:</p>
          <p className="text-primary-400 text-xs">Applicant: aarav@demo.com / demo123</p>
          <p className="text-primary-400 text-xs">RTO Officer: priya@rto.com / demo123</p>
          <p className="text-primary-400 text-xs">Review Officer: admin@drivesense.com / demo123</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-900">DriveSense <span className="text-accent-500">AI</span></span>
          </Link>

          <h2 className="text-2xl font-bold text-primary-900 mb-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {mode === 'login' ? 'Enter your credentials to access your dashboard' : 'Register as a new applicant'}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field" placeholder="Enter your full name" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10" placeholder="name@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10" placeholder="Enter password" required />
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="input-field pl-10" placeholder="Mobile number" />
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4">
            <button onClick={handleDigilocker} className="w-full py-2.5 px-6 rounded-lg border-2 border-orange-300 bg-orange-50 text-orange-700 font-medium text-sm hover:bg-orange-100 transition-colors flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Continue with DigiLocker
              <span className="text-[10px] text-orange-400 ml-1">(Prototype)</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <button onClick={() => setMode('register')} className="text-sm text-primary-500 hover:underline">
                Don't have an account? Register
              </button>
            ) : (
              <button onClick={() => setMode('login')} className="text-sm text-primary-500 hover:underline">
                Already have an account? Sign In
              </button>
            )}
          </div>

          {/* Demo Quick Login */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => handleDemoLogin('applicant')} disabled={loading}
                className="py-2 px-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors">
                Applicant
              </button>
              <button onClick={() => handleDemoLogin('rto_officer')} disabled={loading}
                className="py-2 px-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium hover:bg-teal-100 transition-colors">
                RTO Officer
              </button>
              <button onClick={() => handleDemoLogin('review_officer')} disabled={loading}
                className="py-2 px-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors">
                Reviewer
              </button>
              <button onClick={() => handleDemoLogin('admin')} disabled={loading}
                className="py-2 px-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors">
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${done ? 'bg-green-50' : active ? 'bg-blue-50' : 'bg-slate-50'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
        done ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
      }`}>
        {done ? '✓' : active ? '...' : '○'}
      </div>
      <span className={`text-sm ${done ? 'text-green-700' : active ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}
