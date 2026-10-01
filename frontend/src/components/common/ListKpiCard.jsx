import React from 'react'

const VARIANTS = {
  blue: {
    textColor: 'text-[#292424] dark:text-white',
    iconBg: 'bg-[#043486]/10 text-[#043486] dark:text-blue-400 border-blue-200 dark:border-blue-900',
    waveColor: 'text-[#043486]/8 dark:text-blue-500/10'
  },
  blueValue: {
    textColor: 'text-[#043486] dark:text-blue-400',
    iconBg: 'bg-[#043486]/10 text-[#043486] dark:text-blue-400 border-blue-200 dark:border-blue-900',
    waveColor: 'text-[#043486]/8 dark:text-blue-500/10'
  },
  emerald: {
    textColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    waveColor: 'text-emerald-500/10 dark:text-emerald-500/10'
  },
  amber: {
    textColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    waveColor: 'text-amber-500/10 dark:text-amber-500/10'
  },
  indigo: {
    textColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    waveColor: 'text-indigo-500/10 dark:text-indigo-500/10'
  },
  purple: {
    textColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    waveColor: 'text-purple-500/10 dark:text-purple-500/10'
  },
  rose: {
    textColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    waveColor: 'text-rose-500/10 dark:text-rose-500/10'
  },
  red: {
    textColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    waveColor: 'text-rose-500/10 dark:text-rose-500/10'
  }
}

export default function ListKpiCard({ label, value, icon: Icon, variant = 'blue' }) {
  const currentVariant = VARIANTS[variant] || VARIANTS.blue

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs hover:shadow-md flex items-center justify-between transition-all font-['Poppins',sans-serif]">
      {/* Decorative Velzon Soft Wave on the Left Half */}
      <div className="absolute left-0 top-0 bottom-0 w-[55%] pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 200 120"
          preserveAspectRatio="none"
          className={`w-full h-full ${currentVariant.waveColor} fill-current transition-colors`}
        >
          <path d="M0,0 L150,0 C190,40 130,80 170,120 L0,120 Z" />
        </svg>
      </div>

      <div className="relative z-10">
        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <p className={`text-lg sm:text-xl font-bold ${currentVariant.textColor} mt-1 font-mono tracking-tight`}>
          {value}
        </p>
      </div>

      {Icon && (
        <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center font-bold border shrink-0 backdrop-blur-xs ${currentVariant.iconBg}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  )
}
