import React from 'react'

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [], // array of { value, label } or simple strings
  required = false,
  disabled = false,
  error = '',
  placeholder = '-- Select --',
  className = '',
  wrapperClassName = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}

      <select
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border ${
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-gray-300 dark:border-slate-700 focus:border-[#043486] focus:ring-[#043486] dark:focus:ring-blue-500'
        } text-gray-900 dark:text-white rounded-none shadow-2xs focus:outline-none focus:ring-1 transition-all disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, idx) => {
          const optValue = typeof opt === 'object' ? opt.value ?? opt.id ?? opt.name : opt
          const optLabel = typeof opt === 'object' ? opt.label ?? opt.name : opt
          return (
            <option key={idx} value={optValue}>
              {optLabel}
            </option>
          )
        })}
      </select>

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  )
}
