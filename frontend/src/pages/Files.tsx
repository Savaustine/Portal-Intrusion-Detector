import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, FileItem } from '../lib/api';
import { FileText, Download, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';


export const Files: React.FC = () => {
  const { token } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const fetchFiles = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api
      .getFiles(token)
      .then((res) => {
        setFiles(res);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load course materials');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFiles();
  }, [token]);

  const handleDownload = async (file: FileItem) => {
    if (!token) return;
    setDownloadingId(file.id);
    setDownloadStatus(null);

    try {
      const blob = await api.downloadFile(file.id, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setDownloadStatus(`Downloaded ${file.filename} successfully!`);
    } catch (err: any) {
      setError(err.message || `Failed to download ${file.filename}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Course Materials & Downloads
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Repository
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Access syllabus documents, lab guides, lecture slides, and academic calendars
          </p>
        </div>

        <button
          onClick={fetchFiles}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh List
        </button>
      </div>

      {downloadStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="font-medium">{downloadStatus}</span>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
          Loading course files from portal repository...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {files.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-500 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              No course documents currently available.
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/40 rounded-xl text-blue-600 dark:text-blue-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
                      {file.size}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                    {file.filename}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {file.course}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{file.uploaded_at}</span>
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === file.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloadingId === file.id ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
