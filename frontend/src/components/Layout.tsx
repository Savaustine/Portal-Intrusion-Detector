import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  GraduationCap,
  FolderDown,
  LogOut,
  AlertTriangle,
  ScrollText,
  Activity,
  UserCheck,
  Upload,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
      isActive
        ? isAdmin
          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-sm'
          : isFaculty
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
          : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 shadow-sm'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200 transition-colors">
      {/* Top Navbar */}
      <header
        className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors no-print ${
          isAdmin
            ? 'bg-white/90 dark:bg-slate-900/90 border-rose-200 dark:border-rose-950/60 shadow-sm dark:shadow-rose-950/20'
            : isFaculty
            ? 'bg-white/90 dark:bg-slate-900/90 border-emerald-200 dark:border-emerald-950/60 shadow-sm dark:shadow-emerald-950/20'
            : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-8">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  isAdmin
                    ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400'
                    : isFaculty
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400'
                }`}
              >
                {isAdmin ? (
                  <Shield className="h-5 w-5" />
                ) : isFaculty ? (
                  <Upload className="h-5 w-5" />
                ) : (
                  <Activity className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-400">
                    SentryPortal
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      isAdmin
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                        : isFaculty
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isAdmin ? 'SOC Console' : isFaculty ? 'Faculty Hub' : 'Student Portal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs based on Role */}
            <nav className="hidden md:flex items-center gap-1.5">
              {isAdmin ? (
                <>
                  <NavLink to="/admin" end className={navLinkClass}>
                    <LayoutDashboard className="h-4 w-4" />
                    IDS Dashboard
                  </NavLink>
                  <NavLink to="/admin/alerts" className={navLinkClass}>
                    <AlertTriangle className="h-4 w-4" />
                    Security Alerts
                  </NavLink>
                  <NavLink to="/admin/logs" className={navLinkClass}>
                    <ScrollText className="h-4 w-4" />
                    Activity Stream
                  </NavLink>
                  <NavLink to="/upload-results" className={navLinkClass}>
                    <Upload className="h-4 w-4" />
                    Upload Grades
                  </NavLink>
                </>
              ) : isFaculty ? (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/upload-results" className={navLinkClass}>
                    <Upload className="h-4 w-4" />
                    Upload Results
                  </NavLink>
                  <NavLink to="/grades" className={navLinkClass}>
                    <GraduationCap className="h-4 w-4" />
                    View Grades
                  </NavLink>
                  <NavLink to="/files" className={navLinkClass}>
                    <FolderDown className="h-4 w-4" />
                    Materials
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/grades" className={navLinkClass}>
                    <GraduationCap className="h-4 w-4" />
                    Grades & Transcript
                  </NavLink>
                  <NavLink to="/files" className={navLinkClass}>
                    <FolderDown className="h-4 w-4" />
                    Course Materials
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right Controls: Theme Toggle, User Profile & Logout */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle className="no-print" />

            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <UserCheck
                  className={`h-3.5 w-3.5 ${
                    isAdmin
                      ? 'text-rose-500'
                      : isFaculty
                      ? 'text-emerald-500'
                      : 'text-blue-500'
                  }`}
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {user.full_name || user.username}
                </span>
                <span
                  className={`capitalize text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isAdmin
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : isFaculty
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800/80 px-2 py-2 bg-white dark:bg-slate-900">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end className={navLinkClass}>
                <LayoutDashboard className="h-4 w-4" />
                IDS
              </NavLink>
              <NavLink to="/admin/alerts" className={navLinkClass}>
                <AlertTriangle className="h-4 w-4" />
                Alerts
              </NavLink>
              <NavLink to="/admin/logs" className={navLinkClass}>
                <ScrollText className="h-4 w-4" />
                Logs
              </NavLink>
              <NavLink to="/upload-results" className={navLinkClass}>
                <Upload className="h-4 w-4" />
                Grades
              </NavLink>
            </>
          ) : isFaculty ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="h-4 w-4" />
                Home
              </NavLink>
              <NavLink to="/upload-results" className={navLinkClass}>
                <Upload className="h-4 w-4" />
                Upload
              </NavLink>
              <NavLink to="/grades" className={navLinkClass}>
                <GraduationCap className="h-4 w-4" />
                Grades
              </NavLink>
              <NavLink to="/files" className={navLinkClass}>
                <FolderDown className="h-4 w-4" />
                Files
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="h-4 w-4" />
                Home
              </NavLink>
              <NavLink to="/grades" className={navLinkClass}>
                <GraduationCap className="h-4 w-4" />
                Grades
              </NavLink>
              <NavLink to="/files" className={navLinkClass}>
                <FolderDown className="h-4 w-4" />
                Files
              </NavLink>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
