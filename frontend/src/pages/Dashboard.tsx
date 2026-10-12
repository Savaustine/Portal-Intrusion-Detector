import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, DashboardResponse, GradeItem, StudentListItem } from '../lib/api';
import {
  LayoutDashboard,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  User,
  Clock,
  ShieldCheck,
  GraduationCap,
  FolderDown,
  ArrowRight,
  BookOpen,
  Hash,
  Upload,
  Users,
  Award,
  Search,
  FileCheck,
  BarChart3,
  Edit3,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Faculty specific data
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const promises: Promise<any>[] = [api.getDashboard(token)];

    if (isFaculty || isAdmin) {
      promises.push(api.viewGrades(token));
      promises.push(api.getStudents(token));
    }

    Promise.all(promises)
      .then(([dashRes, gradesRes, studentsRes]) => {
        setData(dashRes);
        if (gradesRes) setGrades(gradesRes);
        if (studentsRes) setStudents(studentsRes);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load portal records');
      })
      .finally(() => setLoading(false));
  }, [token, isFaculty, isAdmin]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPwStatus(null);
    setPwLoading(true);

    try {
      const res = await api.changePassword(
        { current_password: currentPassword, new_password: newPassword },
        token
      );
      setPwStatus({ type: 'success', msg: res.message || 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwStatus({ type: 'error', msg: err.message || 'Failed to change password' });
    } finally {
      setPwLoading(false);
    }
  };

  // Compute Faculty Statistics
  const facultyCourses = [
    { code: 'CS-401', name: 'Network & Systems Security', credits: 4, schedule: 'Mon/Wed 10:00 AM' },
    { code: 'CS-350', name: 'Applied Machine Learning', credits: 3, schedule: 'Tue/Thu 02:00 PM' },
    { code: 'CS-210', name: 'Data Structures & Algorithms', credits: 4, schedule: 'Mon/Fri 11:30 AM' },
    { code: 'CYBER-450', name: 'Intrusion Detection & Defense', credits: 3, schedule: 'Wed/Fri 03:30 PM' },
  ];

  const totalEvaluations = grades.length;
  const gradePoints: Record<string, number> = {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    F: 0.0,
  };

  const avgGpa =
    grades.length > 0
      ? (
          grades.reduce((acc, curr) => acc + (gradePoints[curr.grade] ?? 3.0), 0) / grades.length
        ).toFixed(2)
      : '3.82';

  const gradeCounts = grades.reduce((acc: Record<string, number>, curr) => {
    const g = curr.grade.toUpperCase();
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.reg_number.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {isFaculty ? 'Faculty Academic Portal & Command Center' : 'Student Academic Portal'}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                isFaculty
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
              }`}
            >
              {isFaculty ? 'Faculty In-Charge' : 'Student Portal'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome back,{' '}
            <span className="text-slate-900 dark:text-slate-200 font-bold">
              {user?.full_name || user?.username}
            </span>
            ! ({user?.role === 'student' ? 'Reg Number' : 'Staff Identification'}:{' '}
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {user?.reg_number || 'N/A'}
            </span>
            ) • Fall Semester 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFaculty && (
            <Link
              to="/upload-results"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all"
            >
              <Edit3 className="h-3.5 w-3.5" /> Manage Gradebook
            </Link>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Active Session</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
          Loading institutional records & class telemetry...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {!loading && (
        <>
          {/* ============================================================
              FACULTY SPECIFIC DASHBOARD VIEW
             ============================================================ */}
          {isFaculty ? (
            <div className="space-y-8">
              {/* Faculty KPI Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Enrolled Students</span>
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    {students.length || 1}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="text-emerald-500 font-semibold">Active</span> across departments
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Assigned Courses</span>
                    <BookOpen className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {facultyCourses.length}
                  </div>
                  <div className="text-[11px] text-slate-500">Fall 2026 Academic Term</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Evaluations Recorded</span>
                    <FileCheck className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {totalEvaluations}
                  </div>
                  <div className="text-[11px] text-slate-500">Official Submitted Grades</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Class Average GPA</span>
                    <Award className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-amber-500">
                    {avgGpa} <span className="text-xs text-slate-400 font-normal">/ 4.00</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Performance Distribution: High</div>
                </div>
              </div>

              {/* Course Offerings & Grade Distribution Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Active Courses Taught */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                          Assigned Courses & Lecture Modules
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Semester syllabus, grading weight, and course management
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/upload-results"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      Open Gradebook <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {facultyCourses.map((c) => {
                      const courseGrades = grades.filter((g) => g.course_code === c.code);
                      return (
                        <div
                          key={c.code}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {c.code}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {c.credits} Credits
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {c.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80">
                            <span>{c.schedule}</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {courseGrades.length} Grades Recorded
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grade Distribution & Quick Summary */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <BarChart3 className="h-4 w-4 text-emerald-500" />
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        Grade Distribution
                      </h3>
                    </div>

                    <div className="space-y-3 pt-3">
                      {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'F'].map((letter) => {
                        const count = gradeCounts[letter] || 0;
                        const pct = totalEvaluations > 0 ? (count / totalEvaluations) * 100 : 0;
                        if (count === 0 && letter !== 'A' && letter !== 'B') return null;
                        return (
                          <div key={letter} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                                Grade {letter}
                              </span>
                              <span className="text-slate-500 font-mono">
                                {count} students ({pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  letter.startsWith('A')
                                    ? 'bg-emerald-500'
                                    : letter.startsWith('B')
                                    ? 'bg-blue-500'
                                    : letter.startsWith('C')
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(pct, 8)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <Link
                      to="/upload-results"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                    >
                      <Upload className="h-4 w-4" /> Publish / Edit Student Grade
                    </Link>
                    <Link
                      to="/files"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      <FolderDown className="h-4 w-4" /> Upload Course Syllabus & Materials
                    </Link>
                  </div>
                </div>
              </div>

              {/* Registered Students Roster & Recent Evaluations */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Grade Submissions */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        Recent Grade Submissions & Records ({grades.length})
                      </h3>
                    </div>
                    <Link
                      to="/upload-results"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      View All in Gradebook →
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Reg No</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Course</th>
                          <th className="py-2.5 px-3">Grade</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {grades.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              No grade records recorded yet.
                            </td>
                          </tr>
                        ) : (
                          grades.slice(0, 5).map((g) => (
                            <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {g.reg_number}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                                {g.student_name || '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                                {g.course_code}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  {g.grade}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <Link
                                  to="/upload-results"
                                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Edit / Update
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Enrolled Students Quick Directory */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-500" />
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        Enrolled Student Directory
                      </h3>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {students.length} Total
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search student by name or Reg No..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredStudents.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No students found.
                      </div>
                    ) : (
                      filteredStudents.map((s) => (
                        <div
                          key={s.id}
                          className="pt-2 flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                              {s.full_name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {s.reg_number} {s.email && `• ${s.email}`}
                            </div>
                          </div>
                          <Link
                            to="/upload-results"
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded border border-emerald-300 dark:border-emerald-800/60 transition-colors"
                          >
                            Grade Student →
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Profile & Security Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faculty Profile Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-600 dark:text-blue-400">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100">
                        Faculty Institutional Credentials
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Academic appointment & privileged access role
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <User className="h-4 w-4 text-slate-400" /> Full Name:
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 text-xs font-bold">
                        {user?.full_name || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Hash className="h-4 w-4 text-slate-400" /> Staff Identification ID:
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-bold">
                        {user?.reg_number || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <ShieldCheck className="h-4 w-4 text-slate-400" /> Role & Authority:
                      </span>
                      <span className="capitalize font-mono text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60">
                        Academic Faculty / Evaluator
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Clock className="h-4 w-4 text-slate-400" /> Session Status:
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        Active & Authenticated
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change Password Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100">
                        Security Credentials
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Update your portal password
                      </p>
                    </div>
                  </div>

                  {pwStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        pwStatus.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {pwStatus.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      )}
                      <span>{pwStatus.msg}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      {pwLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================
                STUDENT DASHBOARD VIEW
               ============================================================ */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                    <span>Enrolled Courses</span>
                    <BookOpen className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {data?.stats?.courses_count || 4}
                  </div>
                  <Link
                    to="/grades"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Official Grades <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                    <span>Course Materials</span>
                    <FolderDown className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {data?.stats?.files_count || 5} Available
                  </div>
                  <Link
                    to="/files"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Download Files <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                    <span>Academic Standing</span>
                    <GraduationCap className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    Good Standing
                  </div>
                  <p className="text-[11px] text-slate-500">Fall Semester 2026</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Profile Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-600 dark:text-blue-400">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100">
                        Student Institutional Profile
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Official academic credentials & student identity
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <User className="h-4 w-4 text-slate-400" /> Full Name:
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 text-xs font-bold">
                        {user?.full_name || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Hash className="h-4 w-4 text-slate-400" /> Registration Number:
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-bold">
                        {user?.reg_number || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <ShieldCheck className="h-4 w-4 text-slate-400" /> Portal Role:
                      </span>
                      <span className="capitalize font-mono text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60">
                        {user?.role || 'student'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Clock className="h-4 w-4 text-slate-400" /> Status:
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        Active & Enrolled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change Password Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100">
                        Security Credentials
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Update your account password
                      </p>
                    </div>
                  </div>

                  {pwStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        pwStatus.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {pwStatus.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      )}
                      <span>{pwStatus.msg}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      {pwLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

