import React from 'react'

const VARIANT_STYLES = {
  blue: {
    activeBg: 'bg-[#e9f0fe] text-[#043486] dark:bg-blue-950/80 dark:text-blue-300 font-bold',
    arrowColor: 'text-[#e9f0fe] dark:text-[#0c1938]',
    iconActive: 'text-[#043486] dark:text-blue-400',
    badgeActive: 'bg-[#043486] text-white'
  },
  amber: {
    activeBg: 'bg-[#fef3c7] text-[#92400e] dark:bg-amber-950/80 dark:text-amber-300 font-bold',
    arrowColor: 'text-[#fef3c7] dark:text-[#451a03]',
    iconActive: 'text-[#b45309] dark:text-amber-400',
    badgeActive: 'bg-[#d97706] text-white'
  },
  emerald: {
    activeBg: 'bg-[#d1fae5] text-[#065f46] dark:bg-emerald-950/80 dark:text-emerald-300 font-bold',
    arrowColor: 'text-[#d1fae5] dark:text-[#064e3b]',
    iconActive: 'text-[#059669] dark:text-emerald-400',
    badgeActive: 'bg-[#059669] text-white'
  },
  rose: {
    activeBg: 'bg-[#ffe4e6] text-[#9f1239] dark:bg-rose-950/80 dark:text-rose-300 font-bold',
    arrowColor: 'text-[#ffe4e6] dark:text-[#4c0519]',
    iconActive: 'text-[#e11d48] dark:text-rose-400',
    badgeActive: 'bg-[#e11d48] text-white'
  },
  red: {
    activeBg: 'bg-[#ffe4e6] text-[#9f1239] dark:bg-rose-950/80 dark:text-rose-300 font-bold',
    arrowColor: 'text-[#ffe4e6] dark:text-[#4c0519]',
    iconActive: 'text-[#e11d48] dark:text-rose-400',
    badgeActive: 'bg-[#e11d48] text-white'
  },
  purple: {
    activeBg: 'bg-[#f3e8ff] text-[#6b21a8] dark:bg-purple-950/80 dark:text-purple-300 font-bold',
    arrowColor: 'text-[#f3e8ff] dark:text-[#3b0764]',
    iconActive: 'text-[#7c3aed] dark:text-purple-400',
    badgeActive: 'bg-[#7c3aed] text-white'
  }
}

/**
 * Velzon-Style Compact Arrow Nav Steps (Wizard / Chevron Tabs Navigation)
 */
export default function ArrowNavTabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  fullWidth = false
}) {
  if (!tabs || tabs.length === 0) return null

  return (
    <div className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      <div className={`${fullWidth ? 'flex w-full' : 'inline-flex'} items-stretch bg-white dark:bg-slate-900 rounded-none border border-gray-200/90 dark:border-slate-800 shadow-2xs font-['Poppins',sans-serif]`}>
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id
          const isLast = idx === tabs.length - 1
          const Icon = tab.icon
          const variant = tab.variant || 'blue'
          const styleConfig = VARIANT_STYLES[variant] || VARIANT_STYLES.blue

          return (
            <div
              key={tab.id || idx}
              className={`relative ${fullWidth ? 'flex-1' : ''} flex items-stretch group`}
              style={{ zIndex: tabs.length - idx }}
            >
              <button
                type="button"
                onClick={() => onChange && onChange(tab.id)}
                className={`w-full py-2.5 px-4 sm:px-5 text-xs sm:text-[12.5px] transition-all cursor-pointer flex items-center justify-center gap-2 select-none relative whitespace-nowrap ${
                  isActive
                    ? styleConfig.activeBg
                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-100/70 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {Icon && (
                  <Icon
                    size={14}
                    className={`shrink-0 ${
                      isActive ? styleConfig.iconActive : 'text-gray-400 dark:text-slate-500'
                    }`}
                  />
                )}
                <span className="truncate">{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                      isActive
                        ? styleConfig.badgeActive
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>

              {/* Velzon Arrow Chevron Divider */}
              {!isLast && (
                <div className="absolute right-0 top-0 bottom-0 w-3 translate-x-full pointer-events-none flex items-center justify-center overflow-visible z-20">
                  <svg
                    className={`w-3 h-full transition-colors drop-shadow-[1px_0_0_rgba(203,213,225,0.7)] dark:drop-shadow-[1px_0_0_rgba(51,65,85,0.7)] ${
                      isActive
                        ? styleConfig.arrowColor
                        : 'text-white dark:text-slate-900 group-hover:text-gray-100 dark:group-hover:text-slate-800'
                    }`}
                    viewBox="0 0 10 36"
                    preserveAspectRatio="none"
                    fill="currentColor"
                  >
                    <path d="M0 0 L10 18 L0 36 Z" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
