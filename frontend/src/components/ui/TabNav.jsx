import React from 'react'

export function TabNav({ children, className = '' }) {
  return (
    <div
      className={`flex items-center border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 shadow-2xs overflow-x-auto ${className}`}
    >
      {children}
    </div>
  )
}

export function TabButton({
  active = false,
  onClick,
  icon: Icon,
  label,
  badge,
  children,
  className = '',
  disabled = false
}) {
  const content = children || label

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? 'border-[#043486] text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
          : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
      } ${className}`}
    >
      {Icon && <Icon size={14} className="shrink-0" />}
      {content && <span>{content}</span>}
      {badge !== undefined && badge !== null && (
        <span
          className={`px-1.5 py-0.2 text-[10px] font-black rounded-xs ${
            active
              ? 'bg-[#043486] text-white'
              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
