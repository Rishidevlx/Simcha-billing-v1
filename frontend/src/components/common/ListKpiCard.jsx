import React, { useState, useEffect, useRef } from 'react'

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

export default function ListKpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  onClick,
  className = ''
}) {
  const currentVariant = VARIANTS[variant] || VARIANTS.blue

  // Smooth Count-Up Animation from 0 to target value
  const [animatedValue, setAnimatedValue] = useState(0)
  const prevTargetRef = useRef(0)

  // Parse raw target number if value is numeric or currency string
  const isCurrency = typeof value === 'string' && (value.includes('₹') || value.includes('Rs'))
  const rawNumber = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0
      : 0

  useEffect(() => {
    if (isNaN(rawNumber)) return

    const startValue = 0
    const endValue = rawNumber
    prevTargetRef.current = endValue

    let startTime = null
    const duration = 2000 // 1.4s silky smooth animation
    let animationFrameId

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Smooth ease-out exponential curve: 1 - 2^(-10 * progress)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(startValue + (endValue - startValue) * ease)

      setAnimatedValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setAnimatedValue(endValue)
      }
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [rawNumber])

  // Display formatted value with animated counter
  const displayFormatted = !isNaN(rawNumber) && rawNumber !== 0
    ? (isCurrency ? `₹ ${animatedValue.toLocaleString('en-IN')}` : animatedValue.toLocaleString('en-IN'))
    : value

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs hover:shadow-md flex items-center justify-between transition-all font-['Poppins',sans-serif] ${
        onClick ? 'cursor-pointer hover:border-[#043486] dark:hover:border-blue-400' : ''
      } ${className}`}
    >
      {/* Decorative Soft Wave on the Left Half */}
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
          {displayFormatted}
        </p>
        {subtitle && (
          <p className="text-[11px] font-medium text-gray-400 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {Icon && (
        <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center font-bold border shrink-0 backdrop-blur-xs ${currentVariant.iconBg}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  )
}
