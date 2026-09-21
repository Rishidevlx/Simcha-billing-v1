import React from 'react'

const VARIANTS = {
  blue: {
    textColor: 'text-[#292424] dark:text-white',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 border-blue-100 dark:border-blue-900'
  },
  blueValue: {
    textColor: 'text-[#043486] dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 border-blue-100 dark:border-blue-900'
  },
  emerald: {
    textColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900'
  },
  amber: {
    textColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900'
  },
  indigo: {
    textColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900'
  },
  purple: {
    textColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900'
  },
  rose: {
    textColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900'
  }
}

export default function ListKpiCard({ label, value, icon: Icon, variant = 'blue' }) {
  const currentVariant = VARIANTS[variant] || VARIANTS.blue

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors font-['Poppins',sans-serif]">
      <div>
        <span className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <p className={`text-2xl font-black ${currentVariant.textColor} mt-1 font-mono`}>
          {value}
        </p>
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-none flex items-center justify-center font-bold border ${currentVariant.iconBg}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  )
}
