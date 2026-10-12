import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  Hash,
  Sparkles,
  GraduationCap,
  BookOpen,
  Info,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Role selection first (student, faculty, admin)
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isStudent = role === 'student';
  const idLabel = isStudent ? 'Student Registration Number' : 'Staff ID';
  const idPlaceholder = isStudent
    ? 'e.g. STU/2026/0142'
    : role === 'faculty'
    ? 'e.g. FAC/2026/010'
    : 'e.g. ADM/2026/999';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = identifier.trim();
    const trimmedName = fullName.trim();

    if (!trimmedId) {
      setError(isStudent ? 'Registration Number is required for students.' : 'Staff ID is required for faculty/admin.');
      return;
    }

    if (!trimmedName || !trimmedName.includes(' ') || trimmedName.length < 4) {
      setError('Please provide your complete Full Name (e.g. First and Last name).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register({
        reg_number: trimmedId.toUpperCase(),
        full_name: trimmedName,
        email: email.trim() || undefined,
        password,
        role,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 mb-1 text-blue-600 dark:text-blue-400 shadow-inner">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Institutional Onboarding
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your institutional role and initialize your authenticated portal profile
          </p>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="font-medium">Account onboarded successfully! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: Select Role First */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Step 1: Select Your Role <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isStudent ? 'Requires Reg Number' : 'Requires Staff ID'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Student Card */}
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
                    Uses Reg No
                  </div>
                </div>
              </button>

              {/* Faculty Card */}
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
                    Uses Staff ID
                  </div>
                </div>
              </button>

              {/* Admin Card */}
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
                    Uses Staff ID
                  </div>
                </div>
              </button>
            </div>

            {/* Informative Guidance Banner */}
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border transition-all ${
                isStudent
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300'
                  : role === 'faculty'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              <Info className="h-4 w-4 shrink-0" />
              <span>
                {isStudent ? (
                  <>
                    <strong>Student Policy:</strong> ONLY students onboard with an official{' '}
                    <strong>Registration Number</strong>.
                  </>
                ) : role === 'faculty' ? (
                  <>
                    <strong>Faculty Policy:</strong> Academic staff sign up with their institutional{' '}
                    <strong>Staff ID</strong>.
                  </>
                ) : (
                  <>
                    <strong>Administrative Policy:</strong> SOC & Admin personnel onboard with their{' '}
                    <strong>Staff ID</strong>.
                  </>
                )}
              </span>
            </div>
          </div>

          {/* STEP 2: Credentials & Identity Details */}
          <div className="space-y-4 pt-1">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Step 2: Enter Account Details
            </div>

            {/* Dynamic Identifier Field (Reg No for Students vs Staff ID for Faculty/Admin) */}
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {isStudent
                  ? 'Official Student Registration Number issued by the academic registrar.'
                  : role === 'faculty'
                  ? 'Official Faculty Staff Identification Number.'
                  : 'Official Security / Administrative Staff ID.'}
              </span>
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    isStudent
                      ? 'e.g. Alexander Jonathan Hayes'
                      : role === 'faculty'
                      ? 'e.g. Dr. Eleanor Vance'
                      : 'e.g. Security Admin Officer'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Please enter your complete official name (First & Last name).
              </span>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Institutional Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    isStudent
                      ? 'ahayes@school.edu'
                      : role === 'faculty'
                      ? 'eleanor.vance@school.edu'
                      : 'admin.soc@school.edu'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
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
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Must be at least 6 characters long.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Creating Account...' : `Complete ${isStudent ? 'Student' : role === 'faculty' ? 'Faculty' : 'Admin'} Onboarding`}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
