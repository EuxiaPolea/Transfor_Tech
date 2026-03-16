// Forgot Password Component with Gmail OTP flow (Build Fix - Vite Refresh)
import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

type ForgotPasswordProps = {
  role: 'student' | 'admin';
  onBack: () => void;
};

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPassword({ role, onBack }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ label: '', colorClass: 'bg-transparent', widthClass: 'w-0' });
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for OTP resend
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Password strength logic
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ label: '', colorClass: 'bg-transparent', widthClass: 'w-0' });
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
    const isLongEnough = newPassword.length >= 8;

    if (!isLongEnough || (hasLetters && !hasNumbers && !hasSpecial)) {
      setPasswordStrength({ label: 'Weak', colorClass: 'bg-red-500', widthClass: 'w-1/3' });
    } else if (isLongEnough && hasLetters && hasNumbers && !hasSpecial) {
      setPasswordStrength({ label: 'Medium', colorClass: 'bg-amber-500', widthClass: 'w-2/3' });
    } else if (isLongEnough && hasLetters && hasNumbers && hasSpecial) {
      setPasswordStrength({ label: 'Strong', colorClass: 'bg-green-500', widthClass: 'w-full' });
    } else {
      setPasswordStrength({ label: 'Weak', colorClass: 'bg-red-500', widthClass: 'w-1/3' });
    }
  }, [newPassword]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    try {
      // TODO: Replace YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, YOUR_PUBLIC_KEY with real EmailJS credentials
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        {
          to_email: email,
          otp_code: code,
          app_name: 'ConcernTrack'
        },
        'YOUR_PUBLIC_KEY'
      );
      setStep('otp');
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      console.error('EmailJS Error:', err);
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(60);
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    try {
      // TODO: Replace YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, YOUR_PUBLIC_KEY with real EmailJS credentials
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        {
          to_email: email,
          otp_code: code,
          app_name: 'ConcernTrack'
        },
        'YOUR_PUBLIC_KEY'
      );
      setResendStatus('Code resent!');
      setTimeout(() => setResendStatus(null), 3000);
    } catch (err) {
      setError('Failed to resend code.');
      setCanResend(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp === generatedOtp) {
      setStep('reset');
    } else {
      setError('Incorrect code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (newPassword.length < 8) {
      newErrors.password = 'Minimum 8 characters';
    }
    if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setResetErrors(newErrors);
      return;
    }

    console.log('Password reset successfully for:', role, email, 'New Password:', newPassword);
    showToast('Password reset successfully! You can now log in.');
    setTimeout(() => onBack(), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f1117]">
      <div className="w-full max-w-md bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-2xl p-8 relative overflow-hidden">
        
        {step === 'email' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Forgot your password?</h2>
              <p className="text-[#9ca3af] text-sm">
                Enter your registered email address and we'll send you a 6-digit verification code.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Email address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="your@email.com"
                  className={`w-full bg-[#0f1117] border ${error ? 'border-red-400' : 'border-[#2a2d3a]'} rounded-lg px-4 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3.4 h-3.5" /> {error}
                </p>}
              </div>

              <button 
                onClick={handleSendCode}
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>Send code <ArrowRightIcon className="w-4 h-4" /></>
                )}
              </button>

              <button 
                onClick={onBack}
                className="w-full text-sm text-[#9ca3af] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Back to login
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-[#9ca3af] text-sm">
                We sent a 6-digit code to <span className="text-white font-medium">{email}</span>. Enter it below.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-xl font-bold bg-[#0f1117] border border-[#2a2d3a] rounded-lg text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center font-medium">{error}</p>
              )}

              <button 
                onClick={handleVerifyOtp}
                disabled={otp.some(d => !d)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
              >
                Verify code
              </button>

              <div className="text-center space-y-2">
                <button 
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className={`text-sm ${canResend ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-500 cursor-not-allowed'} transition-colors font-medium`}
                >
                  Didn't receive it? Resend code
                </button>
                {!canResend && (
                  <p className="text-xs text-[#4b5563]">
                    Resend available in 0:{resendTimer.toString().padStart(2, '0')}
                  </p>
                )}
                {resendStatus && (
                  <p className="text-xs text-green-400 animate-pulse">{resendStatus}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Set a new password</h2>
              <p className="text-[#9ca3af] text-sm">
                Choose a strong password for your account.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">New password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (resetErrors.password) setResetErrors({...resetErrors, password: ''});
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-[#0f1117] border ${resetErrors.password ? 'border-red-400' : 'border-[#2a2d3a]'} rounded-lg px-4 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                
                {newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${passwordStrength.widthClass} ${passwordStrength.colorClass}`}></div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase min-w-[50px] text-right ${passwordStrength.colorClass.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {resetErrors.password && <p className="text-red-400 text-xs mt-1">{resetErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Confirm new password</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (resetErrors.confirmPassword) setResetErrors({...resetErrors, confirmPassword: ''});
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-[#0f1117] border ${resetErrors.confirmPassword ? 'border-red-400' : 'border-[#2a2d3a]'} rounded-lg px-4 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {resetErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{resetErrors.confirmPassword}</p>}
              </div>

              <button 
                type="submit"
                className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
              >
                Reset password
              </button>
            </div>
          </form>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl z-50 animate-bounce-short ${
            toast.type === 'success' ? 'bg-green-600 border border-green-500' : 'bg-red-600 border border-red-500'
          } text-white`}>
            {toast.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationCircleIcon className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
