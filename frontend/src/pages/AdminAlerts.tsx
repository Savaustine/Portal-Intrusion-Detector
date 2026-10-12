import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AlertItem } from '../lib/api';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter,
  Check,
  Clock,
  Printer,
} from 'lucide-react';

export const AdminAlerts: React.FC = () => {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'acknowledged'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [ackLoadingId, setAckLoadingId] = useState<number | null>(null);

  const fetchAlerts = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminAlerts(token);
      setAlerts(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch security alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [token]);

  const handleAcknowledge = async (alertId: number) => {
    if (!token) return;
    setAckLoadingId(alertId);
    try {
      await api.acknowledgeAlert(alertId, token);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
    } catch (err: any) {
      setError(err.message || `Failed to acknowledge alert #${alertId}`);
    } finally {
      setAckLoadingId(null);
    }
  };

  const filteredAlerts = alerts.filter((item) => {
    if (filterStatus === 'pending' && item.acknowledged) return false;
    if (filterStatus === 'acknowledged' && !item.acknowledged) return false;
    if (filterSeverity !== 'all' && item.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Security Incident Alerts
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono font-bold">
              {alerts.filter((a) => !a.acknowledged).length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Machine learning anomaly alert queue and security incident triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </button>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs no-print shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
          <Filter className="h-3.5 w-3.5" /> Filters:
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[11px]">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="acknowledged">Acknowledged Only</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[11px]">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
          Loading alerts telemetry...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3 printable-area">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              No security alerts matching the current filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all shadow-sm ${
                  alert.acknowledged
                    ? 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-80'
                    : alert.severity === 'critical'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                    : alert.severity === 'high'
                    ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          alert.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        Alert #{alert.id} • Student ID: #{alert.student_id}
                      </span>
                      {alert.acknowledged && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Acknowledged
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{alert.created_at}</span>
                    </div>
                  </div>

                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={ackLoadingId === alert.id}
                      className="no-print self-start sm:self-center flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow transition-all disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {ackLoadingId === alert.id ? 'Updating...' : 'Triage & Acknowledge'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
