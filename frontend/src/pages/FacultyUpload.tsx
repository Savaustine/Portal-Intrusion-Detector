import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, GradeItem, StudentListItem, StudentLookupResponse } from '../lib/api';
import {
  Upload,
  UserCheck,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Trash2,
  Printer,
  RefreshCw,
  Users,
  Edit3,
  X,
  Save,
  BarChart3,
  FileCheck,
  Eye,
} from 'lucide-react';

export const FacultyUpload: React.FC = () => {
  const { token, user } = useAuth();

  // Active Tab: 'gradebook' | 'publish' | 'roster'
  const [activeTab, setActiveTab] = useState<'gradebook' | 'publish' | 'roster'>('gradebook');

  // Form state for Publish
  const [regNumber, setRegNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [courseCode, setCourseCode] = useState('CS-401');
  const [courseName, setCourseName] = useState('Network & Systems Security');
  const [grade, setGrade] = useState('A');
  const [credits, setCredits] = useState(4);
  const [semester, setSemester] = useState('Fall 2026');

  // Student Lookup state
  const [lookupLoading, setLookupLoading] = useState(false);
  const [studentFound, setStudentFound] = useState<StudentLookupResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Registered students list for quick selection
  const [studentsList, setStudentsList] = useState<StudentListItem[]>([]);

  // Grades table & UI state
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Edit Grade Modal state
  const [editingGrade, setEditingGrade] = useState<GradeItem | null>(null);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseName, setEditCourseName] = useState('');
  const [editLetter, setEditLetter] = useState('A');
  const [editCredits, setEditCredits] = useState(3);
  const [editSemester, setEditSemester] = useState('Fall 2026');
  const [editLoading, setEditLoading] = useState(false);

  const commonCourses = [
    { code: 'CS-401', name: 'Network & Systems Security', credits: 4 },
    { code: 'CS-350', name: 'Applied Machine Learning', credits: 3 },
    { code: 'CS-210', name: 'Data Structures & Algorithms', credits: 4 },
    { code: 'MATH-240', name: 'Discrete Mathematics & Logic', credits: 3 },
    { code: 'CYBER-450', name: 'Intrusion Detection & Defense', credits: 3 },
    { code: 'CS-480', name: 'Cloud Computing & Infrastructure', credits: 4 },
  ];

  // Fetch registered students & existing grades
  const refreshData = () => {
    if (!token) return;
    setLoadingGrades(true);

    api.getStudents(token)
      .then((res) => setStudentsList(res))
      .catch(() => {});

    api.viewGrades(token)
      .then((res) => setGrades(res))
      .catch((err) => console.error(err))
      .finally(() => setLoadingGrades(false));
  };

  useEffect(() => {
    refreshData();
  }, [token]);

  // Debounced auto-fetch student when regNumber changes
  useEffect(() => {
    const trimmed = regNumber.trim();
    if (!trimmed) {
      setStudentFound(null);
      setStudentName('');
      setLookupError(null);
      return;
    }

    const timer = setTimeout(() => {
      setLookupLoading(true);
      setLookupError(null);

      api.lookupStudent(trimmed, token || undefined)
        .then((res) => {
          if (res.found) {
            setStudentFound(res);
            setStudentName(res.full_name);
            setLookupError(null);
          }
        })
        .catch((err: any) => {
          setStudentFound(null);
          setStudentName('');
          setLookupError(err.message || `No student found with Reg No: ${trimmed}`);
        })
        .finally(() => setLookupLoading(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [regNumber, token]);

  const handleCourseSelect = (code: string) => {
    const matched = commonCourses.find((c) => c.code === code);
    if (matched) {
      setCourseCode(matched.code);
      setCourseName(matched.name);
      setCredits(matched.credits);
    }
  };

  const handleSelectStudent = (s: StudentListItem) => {
    setRegNumber(s.reg_number);
    setStudentName(s.full_name);
    setStudentFound({
      found: true,
      id: s.id,
      reg_number: s.reg_number,
      full_name: s.full_name,
      username: s.username,
      email: s.email,
      role: s.role || 'student',
    });
    setLookupError(null);
    setActiveTab('publish');
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!studentFound && !studentName) {
      setFeedback({
        type: 'error',
        message: 'Please enter a valid student registration number first.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.uploadGrade(
        {
          reg_number: regNumber.trim(),
          course_code: courseCode.trim().toUpperCase(),
          course_name: courseName.trim(),
          grade: grade.trim().toUpperCase(),
          credits: Number(credits),
          semester: semester.trim(),
        },
        token
      );

      setFeedback({
        type: 'success',
        message: res.message || `Grade '${grade}' successfully saved for ${studentName || regNumber}!`,
      });

      refreshData();
      setActiveTab('gradebook');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to upload student grade',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: GradeItem) => {
    setEditingGrade(item);
    setEditCourseCode(item.course_code);
    setEditCourseName(item.course_name);
    setEditLetter(item.grade);
    setEditCredits(item.credits || 3);
    setEditSemester(item.semester || 'Fall 2026');
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade || !token) return;

    setEditLoading(true);
    try {
      await api.updateGrade(
        editingGrade.id,
        {
          course_code: editCourseCode,
          course_name: editCourseName,
          grade: editLetter,
          credits: Number(editCredits),
          semester: editSemester,
        },
        token
      );

      setFeedback({
        type: 'success',
        message: `Grade updated successfully to '${editLetter}' for ${editingGrade.student_name || editingGrade.reg_number}!`,
      });
      setEditingGrade(null);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update grade record');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteGrade = async (id: number) => {
    if (!token || !window.confirm('Are you sure you want to delete this grade record?')) return;
    try {
      await api.deleteGrade(id, token);
      setGrades((prev) => prev.filter((g) => g.id !== id));
      setFeedback({ type: 'success', message: 'Grade record removed successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete grade record.' });
    }
  };

  // Grade filter logic
  const filteredGrades = grades.filter((g) => {
    const q = searchFilter.toLowerCase();
    const matchSearch =
      g.reg_number.toLowerCase().includes(q) ||
      (g.student_name && g.student_name.toLowerCase().includes(q)) ||
      g.course_code.toLowerCase().includes(q) ||
      g.course_name.toLowerCase().includes(q);

    const matchCourse = courseFilter === 'ALL' || g.course_code === courseFilter;
    const matchGrade = gradeFilter === 'ALL' || g.grade.startsWith(gradeFilter);

    return matchSearch && matchCourse && matchGrade;
  });

  // Calculate quick stats
  const totalGradesCount = grades.length;
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
  const gpaAvg =
    grades.length > 0
      ? (
          grades.reduce((acc, curr) => acc + (gradePoints[curr.grade] ?? 3.0), 0) / grades.length
        ).toFixed(2)
      : '3.82';

  const uniqueCourseCodes = Array.from(new Set(grades.map((g) => g.course_code)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Faculty Grade Management & Academic Gradebook
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Faculty Access
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Full semester gradebook: View, publish, edit, and update student performance records and transcripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-all shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Official Roster
          </button>
          <button
            onClick={refreshData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Global Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 animate-fade-in no-print ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick Summary KPIs (Hidden on Print) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Total Grades Recorded</span>
            <FileCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {totalGradesCount}
          </div>
          <div className="text-[11px] text-slate-500">Official Student Records</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Enrolled Students</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {studentsList.length || 1}
          </div>
          <div className="text-[11px] text-slate-500">Active in Portal</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Average Class GPA</span>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {gpaAvg} / 4.00
          </div>
          <div className="text-[11px] text-slate-500">High Standing</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Course Offerings</span>
            <BookOpen className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500">
            {commonCourses.length}
          </div>
          <div className="text-[11px] text-slate-500">Fall Semester 2026</div>
        </div>
      </div>

      {/* Navigation Tabs (Hidden on Print) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 no-print">
        <button
          onClick={() => setActiveTab('gradebook')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'gradebook'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Gradebook & Records ({grades.length})
        </button>

        <button
          onClick={() => setActiveTab('publish')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'publish'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Upload className="h-4 w-4" />
          Publish New Grade
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'roster'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          Registered Students ({studentsList.length})
        </button>
      </div>

      {/* ============================================================
          TAB 1: COMPLETE GRADEBOOK & RECORDS TABLE
         ============================================================ */}
      {activeTab === 'gradebook' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden printable-area">
          {/* Print-Only Official Header */}
          <div className="print-only p-6 border-b-2 border-slate-900 mb-4">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
                SentryPortal Academic Institution
              </h1>
              <h2 className="text-sm font-semibold text-slate-700 uppercase">
                Official Faculty Semester Grade Roster — Fall 2026
              </h2>
              <p className="text-xs text-slate-600">
                Faculty Evaluator: {user?.full_name || user?.username} ({user?.reg_number}) • Date: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Web Toolbar with Filters & Search */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60 no-print">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Semester Gradebook ({filteredGrades.length} Records)
                </h3>
                <p className="text-xs text-slate-500">
                  Manage, edit, or delete any recorded student grade in real-time
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter student or course..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Course Filter */}
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Courses</option>
                {uniqueCourseCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              {/* Grade Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Grades</option>
                <option value="A">A Grades (A+, A, A-)</option>
                <option value="B">B Grades (B+, B, B-)</option>
                <option value="C">C Grades (C+, C)</option>
                <option value="F">Failing Grades (F)</option>
              </select>

              <button
                onClick={() => setActiveTab('publish')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" /> New Entry
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Letter Grade</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4 no-print text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {loadingGrades ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading grade records from institutional database...
                    </td>
                  </tr>
                ) : filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No matching grade records found.
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.reg_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {item.student_name || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {item.course_code}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.course_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {item.credits}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs border print-badge ${
                            item.grade.startsWith('A')
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : item.grade.startsWith('B')
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              : item.grade.startsWith('C')
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {item.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                        {item.semester || 'Fall 2026'}
                      </td>
                      <td className="py-3 px-4 no-print text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit / Update Button */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit / Update Grade"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg border border-blue-200 dark:border-blue-900 transition-all"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteGrade(item.id)}
                            title="Delete Grade Record"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Print-Only Sign-off Footer */}
          <div className="print-only mt-12 p-6 pt-10 border-t border-slate-300">
            <div className="flex justify-between items-end text-xs text-slate-800">
              <div>
                <p>Faculty In Charge: _________________________</p>
                <p className="mt-2">Department: Computer Science & Cybersecurity</p>
              </div>
              <div className="text-right">
                <p>Registrar Signature: _________________________</p>
                <p className="mt-2">Official Stamp & Date</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: PUBLISH NEW STUDENT RESULT
         ============================================================ */}
      {activeTab === 'publish' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
          {/* Left: Upload Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Record Student Grade
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Keyed by official Student Registration Number
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* Reg Number Lookup */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Student Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. STU/2026/001"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-24 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                    />
                    {lookupLoading && (
                      <span className="absolute right-3 top-3 text-[11px] font-medium text-blue-500 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Fetching...
                      </span>
                    )}
                  </div>
                </div>

                {studentFound && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 animate-fade-in">
                    <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                        Verified Student Identity
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {studentFound.full_name}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Reg No: <span className="font-mono font-medium">{studentFound.reg_number}</span>
                        {studentFound.email && ` • ${studentFound.email}`}
                      </div>
                    </div>
                  </div>
                )}

                {lookupError && !lookupLoading && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{lookupError}</span>
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g. CS-401"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Credits
                  </label>
                  <select
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1 Credit</option>
                    <option value={2}>2 Credits</option>
                    <option value={3}>3 Credits</option>
                    <option value={4}>4 Credits</option>
                    <option value={5}>5 Credits</option>
                    <option value={6}>6 Credits</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Course Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Network & Systems Security"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="Fall 2026"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Awarded Letter Grade <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:border-blue-500"
                  >
                    <option value="A+">A+ (4.00 - Outstanding)</option>
                    <option value="A">A (4.00 - Excellent)</option>
                    <option value="A-">A- (3.70 - Very Good)</option>
                    <option value="B+">B+ (3.30 - Good)</option>
                    <option value="B">B (3.00 - Satisfactory)</option>
                    <option value="B-">B- (2.70 - Adequate)</option>
                    <option value="C+">C+ (2.30 - Pass)</option>
                    <option value="C">C (2.00 - Marginal)</option>
                    <option value="F">F (0.00 - Fail)</option>
                  </select>
                </div>
              </div>

              {/* Quick Course Presets */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Quick Course Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {commonCourses.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCourseSelect(c.code)}
                      className={`px-2 py-1 rounded text-xs transition-colors border ${
                        courseCode === c.code
                          ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 text-blue-800 dark:text-blue-200 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || lookupLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <Upload className="h-4 w-4" />
                {submitting ? 'Recording Grade in Portal...' : 'Publish Student Grade'}
              </button>
            </form>
          </div>

          {/* Right: Quick Student Directory */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Select Student from Roster
                  </h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {studentsList.length} Active
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any student below to immediately populate the form:
              </p>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {studentsList.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s)}
                    className="w-full pt-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2.5 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                        {s.full_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {s.reg_number}
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: REGISTERED STUDENTS DIRECTORY & TRANSCRIPT INSPECTOR
         ============================================================ */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-6 no-print">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Enrolled Students Directory ({studentsList.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Inspect student records and check course evaluations across departments
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsList.map((s) => {
              const studentGrades = grades.filter(
                (g) => g.reg_number.toLowerCase() === s.reg_number.toLowerCase()
              );
              const creditsEarned = studentGrades.reduce((acc, curr) => acc + (curr.credits || 0), 0);

              return (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {s.full_name}
                      </h3>
                      <p className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {s.reg_number}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Active
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <p>Email: {s.email || 'N/A'}</p>
                    <p>Completed Courses: {studentGrades.length}</p>
                    <p>Total Credits: {creditsEarned} Credits</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleSelectStudent(s)}
                      className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Upload className="h-3 w-3" /> Grade
                    </button>
                    <button
                      onClick={() => {
                        setSearchFilter(s.reg_number);
                        setActiveTab('gradebook');
                      }}
                      className="py-1.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> Records
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT GRADE MODAL
         ============================================================ */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Update Student Grade
                </h3>
              </div>
              <button
                onClick={() => setEditingGrade(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-0.5">
              <p>
                <strong>Student:</strong> {editingGrade.student_name || 'Student'}
              </p>
              <p>
                <strong>Registration No:</strong>{' '}
                <span className="font-mono">{editingGrade.reg_number}</span>
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  value={editCourseCode}
                  onChange={(e) => setEditCourseCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm font-mono text-slate-900 dark:text-slate-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Letter Grade
                  </label>
                  <select
                    value={editLetter}
                    onChange={(e) => setEditLetter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm font-bold text-blue-600 dark:text-blue-400"
                  >
                    <option value="A+">A+ (4.00)</option>
                    <option value="A">A (4.00)</option>
                    <option value="A-">A- (3.70)</option>
                    <option value="B+">B+ (3.30)</option>
                    <option value="B">B (3.00)</option>
                    <option value="B-">B- (2.70)</option>
                    <option value="C+">C+ (2.30)</option>
                    <option value="C">C (2.00)</option>
                    <option value="F">F (0.00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credits
                  </label>
                  <select
                    value={editCredits}
                    onChange={(e) => setEditCredits(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value={1}>1 Credit</option>
                    <option value={2}>2 Credits</option>
                    <option value={3}>3 Credits</option>
                    <option value={4}>4 Credits</option>
                    <option value={5}>5 Credits</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Semester
                </label>
                <input
                  type="text"
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingGrade(null)}
                  className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
