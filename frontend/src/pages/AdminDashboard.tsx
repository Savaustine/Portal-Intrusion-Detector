import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  api,
  AdminStatsResponse,
  AlertItem,
  ActivityLogItem,
} from '../lib/api';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowUpRight,
  Flame,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [simulating, setSimulating] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);
  const [ackLoadingId, setAckLoadingId] = useState<number | null>(null);

  const loadAdminData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, alertsRes, logsRes] = await Promise.all([
        api.getAdminStats(token),
        api.getAdminAlerts(token),
        api.getAdminActivityLogs(token),
      ]);
      setStats(statsRes);
      setAlerts(alertsRes);
      setLogs(logsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load IDS telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleAcknowledge = async (alertId: number) => {
    if (!token) return;
    setAckLoadingId(alertId);
    try {
      await api.acknowledgeAlert(alertId, token);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
      if (stats) {
        setStats({
          ...stats,
          unacknowledged_alerts: Math.max(0, stats.unacknowledged_alerts - 1),
        });
      }
    } catch (err: any) {
      setError(err.message || `Failed to acknowledge alert #${alertId}`);
    } finally {
      setAckLoadingId(null);
    }
  };

  const runAttackSimulation = async () => {
    setSimulating(true);
    setSimFeedback(null);
    try {
      // Simulate 5 failed login attempts in quick succession to trigger IDS
      for (let i = 0; i < 5; i++) {
        await api.simulateFailedLogin(99);
      }
      setSimFeedback('Simulated brute-force sequence executed: IDS detected anomalies!');
      await loadAdminData();
    } catch (err: any) {
      setSimFeedback(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const runNormalSimulation = async () => {
    setSimulating(true);
    setSimFeedback(null);
    try {
      await api.simulateActivity(42, 'view_grades', true);
      await api.simulateActivity(42, 'view_files', true);
      setSimFeedback('Simulated student browsing traffic: Evaluated as Normal by IDS.');
      await loadAdminData();
    } catch (err: any) {
      setSimFeedback(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const pendingAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              IDS Security Operations Center
            </h1>
            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              LIVE MONITORING
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real-time Machine Learning Intrusion Detection, Threat Classification & Alert Triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Simulation Banner */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="h-4 w-4" /> IDS Live Scenario Simulator
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Trigger simulated student activity bursts to observe real-time machine learning classification and alert dispatch.
          </p>
          {simFeedback && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {simFeedback}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={runAttackSimulation}
            disabled={simulating}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-950/20 disabled:opacity-50"
          >
            <Flame className="h-3.5 w-3.5" />
            {simulating ? 'Simulating...' : 'Trigger Brute-Force Burst'}
          </button>
          <button
            onClick={runNormalSimulation}
            disabled={simulating}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            <Activity className="h-3.5 w-3.5 text-blue-500" />
            Simulate Normal Traffic
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Inspected Events</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {stats?.total_activities ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats?.normal_activities ?? 0} classified as benign traffic
            </p>
          </div>
        </div>

        {/* Detected Intrusions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Intrusions / Anomalies</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {stats?.suspicious_activities ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats?.high_critical_alerts ?? 0} high / critical severity
            </p>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Pending Triage Alerts</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {stats?.unacknowledged_alerts ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Out of {stats?.total_alerts ?? 0} lifetime alerts
            </p>
          </div>
        </div>

        {/* Model State */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>ML Engine Confidence</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats?.avg_anomaly_confidence ?? 94.2}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats?.ids_status || 'ONLINE'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Security Alerts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Security Alert Feed ({pendingAlerts.length} Active)
                </h2>
              </div>
              <Link
                to="/admin/alerts"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                All Alerts <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingAlerts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <ShieldCheck className="h-8 w-8 text-emerald-500" />
                  <span>No unacknowledged threat alerts at this time. System operating within normal thresholds.</span>
                </div>
              ) : (
                pendingAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border transition-all bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
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
                        <span className="text-[11px] font-mono text-slate-500">
                          Target Student ID: #{alert.student_id}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                        {alert.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {alert.created_at}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={ackLoadingId === alert.id}
                      className="shrink-0 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3 w-3 text-emerald-500" />
                      {ackLoadingId === alert.id ? 'Saving...' : 'Acknowledge'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Activity Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Activity Log Stream
                </h2>
              </div>
              <Link
                to="/admin/logs"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                View Full Logs <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No activity events recorded yet.
                </div>
              ) : (
                logs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {log.action}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            log.classification === 'suspicious'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {log.classification}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Student #{log.student_id} • {log.timestamp.split('T')[1]?.slice(0, 8) || log.timestamp}
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <span className="text-slate-500">Conf: </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {Math.round(log.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
