import React from 'react'

export default function ListPageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3 transition-colors font-['Poppins',sans-serif]">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
          {Icon && <Icon className="text-[#043486] dark:text-blue-400" size={22} />}
          <span>{title}</span>
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
