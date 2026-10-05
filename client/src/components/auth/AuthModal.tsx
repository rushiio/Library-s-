import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth, AuthModalView } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalView,
    contextMessage,
    openAuthModal,
    closeAuthModal,
    login,
    signup,
    forgotPassword,
    changePassword,
  } = useAuth();
  const navigate = useNavigate();

  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);

  // Common Form States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEnrollment, setSignupEnrollment] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('Computer Engineering');
  const [signupYear, setSignupYear] = useState('1');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // Force Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Focus trapping and Esc key handler
  useEffect(() => {
    if (!isAuthModalOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthModalOpen, authModalView]);

  if (!isAuthModalOpen) return null;

  // Password Strength Calculation
  const checkPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score += 1;
    return score;
  };

  const signupPwdStrength = checkPasswordStrength(signupPassword);
  const newPwdStrength = checkPasswordStrength(newPassword);

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Invalid email or password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(loginEmail.trim(), loginPassword, rememberMe);

      if (!user.mustChangePassword) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        // Automatically redirect based on DB role
        switch (user.role) {
          case 'ADMIN': navigate('/admin'); break;
          case 'LIBRARIAN': navigate('/librarian'); break;
          case 'FACULTY': navigate('/faculty'); break;
          default: navigate('/student');
        }
      }
    } catch (err: any) {
      // Use generic error message
      setErrorMsg(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Sign Up Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword || !signupConfirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (signupPwdStrength < 4) {
      setErrorMsg('Password must meet all security requirements below.');
      return;
    }

    try {
      setLoading(true);
      const res = await signup({
        name: signupName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim(),
        enrollmentNumber: signupEnrollment.trim(),
        department: signupDepartment,
        year: parseInt(signupYear, 10),
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Registration successful! Please log in.');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setTimeout(() => {
          openAuthModal('login');
          setLoginEmail(signupEmail);
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(forgotEmail.trim());
      setSuccessMsg(res.message || 'If an account exists with this email, reset instructions have been generated.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Force Change Password Submit
  const handleForceChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword || !confirmNewPassword) {
      setErrorMsg('Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPwdStrength < 4) {
      setErrorMsg('New password must meet all security requirements.');
      return;
    }

    try {
      setLoading(true);
      const res = await changePassword(newPassword, confirmNewPassword);
      if (res.success) {
        setSuccessMsg('Password updated successfully! Welcome to LibraAI.');
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && authModalView !== 'force_change') {
          closeAuthModal();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white dark:bg-[#0c1324] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200"
      >
        {/* Close Button (Hidden during mandatory force password change) */}
        {authModalView !== 'force_change' && (
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Branding & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-lg shadow-blue-500/30 mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {authModalView === 'login' && 'Welcome Back'}
            {authModalView === 'signup' && 'Student Registration'}
            {authModalView === 'forgot' && 'Reset Password'}
            {authModalView === 'force_change' && 'Set New Password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {authModalView === 'login' && 'Sign in with your email and password to access the library.'}
            {authModalView === 'signup' && 'Create your student library account for digital resources and loans.'}
            {authModalView === 'forgot' && 'Enter your registered email to receive reset instructions.'}
            {authModalView === 'force_change' && 'For security, please set a strong personal password on your first login.'}
          </p>
        </div>

        {/* Contextual Action Prompt */}
        {contextMessage && authModalView !== 'force_change' && (
          <div className="mb-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/80 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{contextMessage}</span>
          </div>
        )}

        {/* Global Inline Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: LOGIN FORM */}
        {authModalView === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address / Member ID *
              </label>
              <div className="relative">
                <input
                  ref={initialFocusRef}
                  type="text"
                  required
                  placeholder="name@college.edu or STU001"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => openAuthModal('forgot')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-xs text-slate-500">New student? </span>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign Up for Library Access
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: SIGN UP FORM */}
        {authModalView === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  ref={initialFocusRef}
                  type="text"
                  required
                  placeholder="e.g. Rohan Deshmukh"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  College Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Department / Branch *
                </label>
                <select
                  value={signupDepartment}
                  onChange={(e) => setSignupDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Electronics & Telecomm">Electronics & Telecomm</option>
                  <option value="Engineering Science">Engineering Science</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Year
                </label>
                <select
                  value={signupYear}
                  onChange={(e) => setSignupYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Enrollment / Roll Number
              </label>
              <input
                type="text"
                placeholder="e.g. EN2024-8842"
                value={signupEnrollment}
                onChange={(e) => setSignupEnrollment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            {/* Password with Strength Meter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {signupPassword && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500">Password Strength:</span>
                  <span className={signupPwdStrength >= 4 ? 'text-emerald-600 font-bold' : signupPwdStrength >= 2 ? 'text-amber-600' : 'text-rose-600'}>
                    {signupPwdStrength >= 4 ? 'Strong' : signupPwdStrength >= 2 ? 'Moderate' : 'Weak'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      signupPwdStrength >= 4 ? 'bg-emerald-500 w-full' : signupPwdStrength >= 2 ? 'bg-amber-500 w-2/3' : 'bg-rose-500 w-1/3'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 text-slate-400">
                  <span className={signupPassword.length >= 8 ? 'text-emerald-500' : ''}>• 8+ Characters</span>
                  <span className={/[A-Z]/.test(signupPassword) ? 'text-emerald-500' : ''}>• Uppercase Letter</span>
                  <span className={/[0-9]/.test(signupPassword) ? 'text-emerald-500' : ''}>• Number (0-9)</span>
                  <span className={/[!@#$%^&*]/.test(signupPassword) ? 'text-emerald-500' : ''}>• Special Character</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              <span>{loading ? 'Creating Account...' : 'Complete Student Registration'}</span>
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-500">Already registered? </span>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD */}
        {authModalView === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Registered Email Address *
              </label>
              <div className="relative">
                <input
                  ref={initialFocusRef}
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              <span>{loading ? 'Generating Link...' : 'Send Password Reset Instructions'}</span>
            </button>

            <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: MANDATORY FIRST-LOGIN PASSWORD CHANGE */}
        {authModalView === 'force_change' && (
          <form onSubmit={handleForceChangeSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
              <span>Administrative Security Policy: You are required to set a new password before continuing.</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                New Secure Password *
              </label>
              <div className="relative">
                <input
                  ref={initialFocusRef}
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-500">
              <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Password Requirements:</div>
              <div className="flex items-center gap-2">
                <Check className={`h-3.5 w-3.5 ${newPassword.length >= 8 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className={`h-3.5 w-3.5 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Uppercase & lowercase letters</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className={`h-3.5 w-3.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>At least one number</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className={`h-3.5 w-3.5 ${/[!@#$%^&*]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>At least one special character</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{loading ? 'Saving Password...' : 'Save Password & Enter Dashboard'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
