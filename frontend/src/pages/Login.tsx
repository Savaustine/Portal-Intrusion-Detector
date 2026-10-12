import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  AlertCircle,
  Hash,
  ArrowRight,
  UserCheck,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Role selection first
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isStudent = role === 'student';
  const idLabel = isStudent ? 'Registration Number' : 'Staff ID';
  const idPlaceholder = isStudent
    ? 'e.g. STU/2026/001'
    : role === 'faculty'
    ? 'e.g. FAC/2026/010'
    : 'e.g. ADM/2026/999';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setError(isStudent ? 'Please enter your Registration Number' : 'Please enter your Staff ID');
      return;
    }

    setLoading(true);

    try {
      const loggedUser = await login({ reg_number: trimmedId, password });
      
      // Navigate based on logged in user's role
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'faculty') {
        navigate('/upload-results');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.message ||
          (isStudent
            ? 'Invalid Registration Number or password'
            : 'Invalid Staff ID or password')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (targetRole: 'student' | 'faculty' | 'admin', id: string, pass: string) => {
    setRole(targetRole);
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Gateway Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 mb-1 text-blue-600 dark:text-blue-400 shadow-inner">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            SentryPortal Gateway
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure Student, Faculty & Administrative Sign In
          </p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: Role Selection First */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Step 1: Select Portal Role <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isStudent ? 'Student Reg No' : 'Staff ID'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Student */}
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setError(null);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col items-center sm:items-start gap-1.5 transition-all ${
                  role === 'student'
                    ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    role === 'student'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-bold text-xs">Student</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    Reg Number
                  </div>
                </div>
              </button>

              {/* Faculty */}
              <button
                type="button"
                onClick={() => {
                  setRole('faculty');
                  setError(null);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col items-center sm:items-start gap-1.5 transition-all ${
                  role === 'faculty'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    role === 'faculty'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-bold text-xs">Faculty</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    Staff ID
                  </div>
                </div>
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setError(null);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col items-center sm:items-start gap-1.5 transition-all ${
                  role === 'admin'
                    ? 'bg-rose-50/80 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    role === 'admin'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-bold text-xs">Admin / SOC</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    Staff ID
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Credentials */}
          <div className="space-y-4 pt-1">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Step 2: Enter Sign In Credentials
            </div>

            {/* Dynamic Identifier Field (Reg No for student, Staff ID for faculty/admin) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {idLabel} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={idPlaceholder}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {isStudent
                  ? 'Enter your institutional Student Registration Number.'
                  : role === 'faculty'
                  ? 'Enter your assigned Faculty Staff ID.'
                  : 'Enter your administrative Staff ID.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : `Sign In as ${isStudent ? 'Student' : role === 'faculty' ? 'Faculty' : 'Admin'}`}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-500" />
              <span>One-Click Demo Accounts:</span>
            </div>
            <span className="text-[10px] lowercase text-slate-400">(auto-fills role & ID)</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => handleQuickFill('student', 'STU/2026/001', 'password123')}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                role === 'student' && identifier === 'STU/2026/001'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:border-blue-400'
              }`}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('faculty', 'FAC/2026/010', 'password123')}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                role === 'faculty' && identifier === 'FAC/2026/010'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400'
              }`}
            >
              👨‍🏫 Faculty
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'ADM/2026/999', 'password123')}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                role === 'admin' && identifier === 'ADM/2026/999'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:border-rose-400'
              }`}
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          Need a portal account?{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
            Institutional Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
};
