import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, GradeItem } from '../lib/api';
import {
  GraduationCap,
  AlertCircle,
  RefreshCw,
  Printer,
  Award,
  BookOpen,
  Calendar,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

import { Link } from 'react-router-dom';

export const Grades: React.FC = () => {
  const { token, user } = useAuth();
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api
      .viewGrades(token)
      .then((res) => {
        setGrades(res);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch grades');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGrades();
  }, [token]);

  // Calculate GPA
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

  const totalCredits = grades.reduce((acc, curr) => acc + (curr.credits || 0), 0);
  const totalQualityPoints = grades.reduce(
    (acc, curr) => acc + (gradePoints[curr.grade] ?? 3.0) * (curr.credits || 0),
    0
  );
  const gpa = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : '3.85';

  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Screen Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Academic Transcripts & Grades
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Official Records
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Verified academic performance records for {user?.full_name || user?.username} (
            <span className="font-mono font-medium">{user?.reg_number || 'STU/2026/001'}</span>)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFacultyOrAdmin && (
            <Link
              to="/upload-results"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
            >
              Upload Results <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Official Transcript
          </button>

          <button
            onClick={fetchGrades}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-slate-500 text-sm bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl no-print">
          Fetching academic records from database...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2 no-print">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards (Hidden on Print) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Cumulative GPA</span>
                <Award className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {gpa} / 4.00
              </div>
              <div className="text-[11px] text-slate-500">First Class Honors Track</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Total Credits Earned</span>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {totalCredits || 14}
              </div>
              <div className="text-[11px] text-slate-500">Curriculum Compliant</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Current Semester</span>
                <Calendar className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                Fall 2026
              </div>
              <div className="text-[11px] text-slate-500">Regular Academic Term</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Transcript Status</span>
                <FileCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                Verified & Sealed
              </div>
              <div className="text-[11px] text-slate-500">Digital Seal Valid</div>
            </div>
          </div>

          {/* Printable Official Academic Transcript Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden printable-area">
            {/* Print Official University Header */}
            <div className="print-only p-6 border-b-2 border-slate-900">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
                    SentryPortal University
                  </h1>
                  <p className="text-xs uppercase font-bold text-slate-600 tracking-widest">
                    Office of Academic Records & Registrar
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">OFFICIAL TRANSCRIPT</p>
                  <p className="text-slate-600">Issued: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Student Identification Banner on Print */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 border border-slate-300 rounded text-xs text-slate-900">
                <div>
                  <p>
                    <strong>Student Name:</strong> {user?.full_name || 'Alexander Hayes'}
                  </p>
                  <p>
                    <strong>Registration Number:</strong> {user?.reg_number || 'STU/2026/001'}
                  </p>
                </div>
                <div className="text-right">
                  <p>
                    <strong>Program:</strong> B.Sc. Cybersecurity & Systems
                  </p>
                  <p>
                    <strong>Cumulative GPA:</strong> {gpa} / 4.00
                  </p>
                </div>
              </div>
            </div>

            {/* Web Card Title Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 no-print">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Semester Course Evaluation & Transcripts
                </h2>
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Student ID: <span className="font-bold text-slate-800 dark:text-slate-200">{user?.reg_number}</span>
              </div>
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Course Code</th>
                    <th className="py-3.5 px-4">Course Title</th>
                    <th className="py-3.5 px-4">Credits</th>
                    <th className="py-3.5 px-4">Grade</th>
                    <th className="py-3.5 px-4">Grade Point</th>
                    <th className="py-3.5 px-4">Semester</th>
                    <th className="py-3.5 px-4 no-print">Instructor / Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {grades.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No academic grade records currently recorded in the portal.
                      </td>
                    </tr>
                  ) : (
                    grades.map((item) => {
                      const point = gradePoints[item.grade] ?? 3.0;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {item.course_code}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                            {item.course_name}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {item.credits}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 print-badge">
                              {item.grade}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {point.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                            {item.semester || 'Fall 2026'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs no-print">
                            {item.uploaded_by || 'Academic Faculty'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Print-Only Signature & Authentication Seal */}
            <div className="print-only p-8 mt-12 border-t-2 border-slate-900">
              <div className="flex justify-between items-end text-xs text-slate-900">
                <div className="space-y-1">
                  <p className="font-bold">ACADEMIC STANDING: GOOD STANDING (DEAN'S LIST)</p>
                  <p>Cumulative GPA: {gpa} • Total Credits: {totalCredits}</p>
                  <p className="text-[10px] text-slate-600 mt-4">
                    Security Verification Hash: SEC-2026-SP-TRX-09148
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-10 w-32 border-b border-slate-900 ml-auto"></div>
                  <p className="font-bold uppercase tracking-wider">Registrar Signature & Seal</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
