import React from 'react'

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  icon: Icon,
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

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-gray-400 dark:text-slate-500 pointer-events-none">
            <Icon size={15} />
          </div>
        )}

        <input
          type={type}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-gray-300 dark:border-slate-700 focus:border-[#043486] focus:ring-[#043486] dark:focus:ring-blue-500'
          } text-gray-900 dark:text-white rounded-none shadow-2xs placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : ''
          } ${className}`}
          {...props}
        />
      </div>

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  )
}
