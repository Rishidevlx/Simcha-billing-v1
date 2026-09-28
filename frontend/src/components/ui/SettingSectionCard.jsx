import React from 'react'

export default function SettingSectionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
  bodyClassName = ''
}) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors ${className}`}>
      {/* Header */}
      {(title || Icon || actions || badge) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 border border-blue-200 dark:border-blue-900 shrink-0">
                <Icon size={18} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wide">
                  {title}
                </h3>
                {badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Card Content Body */}
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  )
}
