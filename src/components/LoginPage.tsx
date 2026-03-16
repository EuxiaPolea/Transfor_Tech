import { useState } from 'react';
import { UserIcon, ShieldCheckIcon, ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

type LoginPageProps = {
  onStudentLogin: (studentId: string, password: string) => Promise<void>;
  onAdminLogin: (email: string, password: string) => Promise<void>;
  onStudentRegister: () => void;
  onAdminRegister: () => void;
  onForgotPassword: (role: 'student' | 'admin') => void;
};

type LoginStep = 'select' | 'student' | 'admin';

export default function LoginPage({
  onStudentLogin,
  onAdminLogin,
  onStudentRegister,
  onAdminRegister,
  onForgotPassword
}: LoginPageProps) {
  const [step, setStep] = useState<LoginStep>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onStudentLogin(studentId, password);
    } catch (err: any) {
      console.error('Student login error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onAdminLogin(email, password);
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const resetState = () => {
    setLoading(false);
    setError(null);
    setStudentId('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">

      {/* Dynamic Main Card */}
      <div className="w-full max-w-2xl bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-2xl overflow-hidden mb-12 relative transition-all duration-300">

        {step === 'select' && (
          <div className="p-8 md:p-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">C</span>
                ConcernTrack
              </h1>
              <p className="text-[#9ca3af] text-lg">Who are you signing in as?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => { setStep('student'); resetState(); }}
                className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-8 text-left hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all group flex flex-col items-center text-center cursor-pointer"
              >
                <div className="w-16 h-16 bg-[#1a1d27] rounded-full flex items-center justify-center mb-6 border border-[#2a2d3a] group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-colors">
                  <UserIcon className="w-8 h-8 text-[#9ca3af] group-hover:text-indigo-400 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Student</h3>
                <p className="text-sm text-[#9ca3af] leading-relaxed">Submit and track your concerns.</p>
              </button>

              <button
                onClick={() => { setStep('admin'); resetState(); }}
                className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-8 text-left hover:border-amber-500 hover:ring-1 hover:ring-amber-500 transition-all group flex flex-col items-center text-center cursor-pointer"
              >
                <div className="w-16 h-16 bg-[#1a1d27] rounded-full flex items-center justify-center mb-6 border border-[#2a2d3a] group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-colors">
                  <ShieldCheckIcon className="w-8 h-8 text-[#9ca3af] group-hover:text-amber-400 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Admin / Staff</h3>
                <p className="text-sm text-[#9ca3af] leading-relaxed">Manage and resolve concerns.</p>
              </button>
            </div>
          </div>
        )}

        {(step === 'student' || step === 'admin') && (
          <div className="p-8 md:p-12 animate-in slide-in-from-right-8 fade-in duration-300">
            <button
              onClick={() => { setStep('select'); resetState(); }}
              className="absolute top-8 left-8 text-[#9ca3af] hover:text-white flex items-center text-sm font-medium transition-colors"
              disabled={loading}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </button>

            <div className="flex flex-col items-center text-center mb-8 mt-2">
              <div className="w-16 h-16 bg-[#0f1117] border border-[#2a2d3a] rounded-full flex items-center justify-center mb-4">
                {step === 'student' ? (
                  <UserIcon className="w-8 h-8 text-indigo-400" />
                ) : (
                  <ShieldCheckIcon className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">{step === 'student' ? 'Student portal' : 'Admin & staff portal'}</h2>
              <p className="text-[#9ca3af]">
                {step === 'student'
                  ? 'Submit concerns, track your requests, and receive updates.'
                  : 'Manage, route, and resolve student concerns from your department.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 animate-in fade-in duration-300 mx-auto max-w-sm">
                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form className="space-y-4 max-w-sm mx-auto" onSubmit={step === 'student' ? handleStudentSubmit : handleAdminSubmit}>
              {step === 'student' ? (
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 2023-07-00126"
                    disabled={loading}
                    required
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@university.edu.ph"
                    disabled={loading}
                    required
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  `Sign in as ${step}`
                )}
              </button>
            </form>

            <div className="mt-6 text-center flex flex-col gap-2">
              <button
                onClick={() => step === 'student' ? onStudentRegister() : onAdminRegister()}
                disabled={loading}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
              >
                Don't have an account? Register here
              </button>
              <button
                onClick={() => onForgotPassword(step)}
                disabled={loading}
                className="text-sm text-[#9ca3af] hover:text-white transition-colors disabled:opacity-50"
              >
                Forgot your password? <span className="text-indigo-400 hover:text-indigo-300 font-medium">Reset it here</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Feature Highlights Section */}
      <div className="w-full max-w-5xl">
        <h3 className="text-xl font-semibold mb-6 text-center text-white">Why use ConcernTrack?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</span>
              <h4 className="font-medium text-white">Auto-routing</h4>
            </div>
            <p className="text-sm text-[#9ca3af] leading-relaxed">Concerns go directly to the right department — no manual sorting.</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm">⏱</span>
              <h4 className="font-medium text-white">SLA enforcement</h4>
            </div>
            <p className="text-sm text-[#9ca3af] leading-relaxed">Automatic escalation if no action within 2 or 5 days.</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">📋</span>
              <h4 className="font-medium text-white">Full audit trail</h4>
            </div>
            <p className="text-sm text-[#9ca3af] leading-relaxed">Every action timestamped and logged — complete transparency.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
