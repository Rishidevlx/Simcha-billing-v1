import React from 'react'

export default function ListPageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs transition-colors font-['Poppins',sans-serif]">
      <div>
        <h1 className="text-xl font-bold text-[#292424] dark:text-white uppercase tracking-wide">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}
