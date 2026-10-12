import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';


export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme, effectiveTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 transition-all shadow-sm ${className}`}
      role="group"
      aria-label="Theme selector"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Light Mode (Default for crisp printing)"
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
          theme === 'light'
            ? 'bg-white text-blue-600 shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Dark Mode"
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
          theme === 'dark'
            ? 'bg-slate-800 text-blue-400 shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title={`System Default Mode (Currently ${effectiveTheme})`}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Laptop className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Auto</span>
      </button>
    </div>
  );
};
