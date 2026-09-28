import React from 'react'

export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = 'md', // 'sm' | 'md'
  variant = 'brand', // 'brand' | 'yellow' | 'emerald'
  className = '',
  title = ''
}) {
  const isSm = size === 'sm'

  const getActiveBg = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-600 dark:bg-emerald-500'
      case 'yellow':
        return 'bg-[#FFFF61] border border-amber-300 text-amber-900'
      case 'brand':
      default:
        return 'bg-[#043486] dark:bg-blue-600'
    }
  }

  const getInactiveBg = () => {
    if (variant === 'yellow') {
      return 'bg-gray-200/80 dark:bg-slate-700'
    }
    return 'bg-gray-300 dark:bg-slate-700'
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      title={title}
      onClick={() => !disabled && onChange && onChange(!checked)}
      className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        isSm ? 'h-4.5 w-8' : 'h-5.5 w-10'
      } ${
        checked ? getActiveBg() : getInactiveBg()
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out pointer-events-none ${
          isSm ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'
        } ${
          checked
            ? isSm
              ? 'translate-x-3.5'
              : 'translate-x-4.5'
            : 'translate-x-0'
        }`}
      />
    </button>
  )
}
