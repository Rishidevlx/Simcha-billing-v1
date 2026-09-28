import React from 'react'

export default function StatusToggle({
  value = 'Active', // 'Active' or 'Inactive'
  onChange,
  disabled = false,
  className = '',
  name = 'status_toggle'
}) {
  const isActive = value === 'Active' || value === true

  return (
    <div className={`grid grid-cols-2 gap-3 max-w-sm ${className}`}>
      <label
        onClick={() => !disabled && onChange && onChange('Active')}
        className={`flex items-center justify-center gap-2 p-2.5 border rounded-none text-xs sm:text-[13px] font-semibold transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          isActive
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
            : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
        }`}
      >
        <input
          type="radio"
          name={name}
          value="Active"
          disabled={disabled}
          checked={isActive}
          onChange={() => onChange && onChange('Active')}
          className="sr-only"
        />
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            isActive
              ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900'
              : 'bg-gray-300 dark:bg-slate-600'
          }`}
        />
        Active
      </label>

      <label
        onClick={() => !disabled && onChange && onChange('Inactive')}
        className={`flex items-center justify-center gap-2 p-2.5 border rounded-none text-xs sm:text-[13px] font-semibold transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          !isActive
            ? 'border-gray-500 dark:border-slate-500 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold'
            : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
        }`}
      >
        <input
          type="radio"
          name={name}
          value="Inactive"
          disabled={disabled}
          checked={!isActive}
          onChange={() => onChange && onChange('Inactive')}
          className="sr-only"
        />
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            !isActive
              ? 'bg-gray-600 dark:bg-slate-400 ring-2 ring-gray-300 dark:ring-slate-700'
              : 'bg-gray-300 dark:bg-slate-600'
          }`}
        />
        Inactive
      </label>
    </div>
  )
}

