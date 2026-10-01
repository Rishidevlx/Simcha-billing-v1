import React from 'react'
import { Search, X } from '../common/icons'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
  size = 'md', // 'sm', 'md'
  disabled = false,
  ...props
}) {
  const handleClear = () => {
    if (onClear) onClear()
    else if (onChange) onChange({ target: { value: '' } })
  }

  const sizeClasses = {
    sm: 'py-1.5 pl-8 pr-7 text-xs',
    md: 'py-2 pl-9 pr-8 text-xs sm:text-sm'
  }

  const iconSizes = {
    sm: 13,
    md: 15
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={iconSizes[size] || 15}
        className="absolute left-2.5 text-gray-400 dark:text-slate-500 pointer-events-none"
      />
      <input
        type="text"
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-none shadow-2xs placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#043486] dark:focus:ring-blue-500 focus:border-[#043486] transition-all ${
          sizeClasses[size] || sizeClasses.md
        }`}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
          title="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
