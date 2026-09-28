import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function StatusToggle({
  value = 'Active', // 'Active' or 'Inactive' (or boolean)
  onChange,
  disabled = false,
  className = ''
}) {
  const isActive = value === 'Active' || value === true

  return (
    <div className={`inline-flex items-center border border-gray-200 dark:border-slate-700 p-0.5 bg-gray-50 dark:bg-slate-900 rounded-none shadow-2xs ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange && onChange('Active')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
          isActive
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <CheckCircle2 size={13} className="shrink-0" />
        <span>Active</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange && onChange('Inactive')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
          !isActive
            ? 'bg-rose-600 text-white shadow-xs'
            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <XCircle size={13} className="shrink-0" />
        <span>Inactive</span>
      </button>
    </div>
  )
}
