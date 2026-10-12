import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ActivityLogItem } from '../lib/api';
import {
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Printer,
} from 'lucide-react';


export const AdminLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'all' | 'normal' | 'suspicious'>('all');

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminActivityLogs(token);
      setLogs(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter((log) => {
    if (classificationFilter !== 'all' && log.classification !== classificationFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        String(log.student_id).includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Audit Activity Stream
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono font-bold">
              {logs.length} Events Inspected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Raw student traffic telemetry classified by the random forest IDS model
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Log Sheet
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs no-print shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or student ID..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">Classification:</span>
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Traffic</option>
            <option value="normal">Normal Only</option>
            <option value="suspicious">Suspicious Only</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
          Loading audit stream...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl printable-area">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Event ID</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">IDS Classification</th>
                  <th className="py-3.5 px-4">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans text-xs">
                      No activity logs match the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        log.classification === 'suspicious' ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-400">#{log.id}</td>
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-bold">
                        User #{log.student_id}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold font-sans">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.success
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {log.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.classification === 'suspicious'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {log.classification === 'suspicious' ? (
                            <ShieldAlert className="h-3 w-3" />
                          ) : (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          {log.classification}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {Math.round(log.confidence * 100)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
