import React, { forwardRef, useEffect, useRef } from 'react'
import { Check, Minus } from '../common/icons'

/**
 * Outline Checkbox Component (Velzon Style)
 * Supports:
 * - Outline design with crisp borders and check icon
 * - Indeterminate state (for table header select-all)
 * - Variants: 'primary' (default #043486), 'secondary', 'success', 'warning', 'danger', 'info', 'dark'
 * - Sizes: 'sm' (16px), 'md' (18px), 'lg' (22px)
 * - forwardRef for direct DOM access & table indeterminate bindings
 */
const Checkbox = forwardRef(function Checkbox(
  {
    checked = false,
    indeterminate = false,
    onChange,
    disabled = false,
    label,
    description,
    variant = 'primary', // 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'dark'
    size = 'sm', // 'sm' | 'md' | 'lg'
    className = '',
    wrapperClassName = '',
    id,
    title,
    ...props
  },
  forwardedRef
) {
  const innerRef = useRef(null)
  const inputRef = forwardedRef || innerRef

  useEffect(() => {
    if (inputRef && 'current' in inputRef && inputRef.current) {
      inputRef.current.indeterminate = Boolean(indeterminate)
    }
  }, [indeterminate, inputRef])

  // Dimensions
  const sizeMap = {
    sm: {
      box: 'w-4 h-4 rounded-[4px]',
      icon: 11,
      stroke: 3
    },
    md: {
      box: 'w-4.5 h-4.5 rounded-[5px]',
      icon: 13,
      stroke: 3
    },
    lg: {
      box: 'w-5.5 h-5.5 rounded-[6px]',
      icon: 15,
      stroke: 3.5
    }
  }

  const currentSize = sizeMap[size] || sizeMap.sm

  // Variant color definitions for outline & checkmark
  const variantStyles = {
    primary: {
      checked: 'border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/30',
      hover: 'hover:border-[#043486] dark:hover:border-blue-400'
    },
    secondary: {
      checked: 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/30',
      hover: 'hover:border-blue-600 dark:hover:border-blue-400'
    },
    success: {
      checked: 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/30',
      hover: 'hover:border-emerald-600 dark:hover:border-emerald-400'
    },
    warning: {
      checked: 'border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/30',
      hover: 'hover:border-amber-500 dark:hover:border-amber-400'
    },
    danger: {
      checked: 'border-red-500 dark:border-red-400 text-red-500 dark:text-red-400 bg-red-50/30 dark:bg-red-950/30',
      hover: 'hover:border-red-500 dark:hover:border-red-400'
    },
    info: {
      checked: 'border-cyan-500 dark:border-cyan-400 text-cyan-500 dark:text-cyan-400 bg-cyan-50/30 dark:bg-cyan-950/30',
      hover: 'hover:border-cyan-500 dark:hover:border-cyan-400'
    },
    dark: {
      checked: 'border-slate-800 dark:border-slate-200 text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/40',
      hover: 'hover:border-slate-800 dark:hover:border-slate-200'
    }
  }

  const currentVariant = variantStyles[variant] || variantStyles.primary

  const isCheckedOrIndeterminate = checked || indeterminate

  const checkboxBoxClasses = `
    relative flex items-center justify-center
    border-2 transition-all duration-150 ease-in-out
    ${currentSize.box}
    ${
      disabled
        ? 'border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900 text-gray-400 dark:text-slate-600 cursor-not-allowed opacity-50'
        : isCheckedOrIndeterminate
        ? `${currentVariant.checked} cursor-pointer`
        : `border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 ${currentVariant.hover} cursor-pointer shadow-2xs`
    }
    ${className}
  `

  return (
    <label
      htmlFor={id}
      title={title}
      className={`inline-flex items-center gap-2 select-none group ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${wrapperClassName}`}
    >
      <div className="relative inline-flex items-center justify-center shrink-0">
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          checked={Boolean(checked)}
          onChange={disabled ? undefined : onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />

        <div className={checkboxBoxClasses}>
          {indeterminate ? (
            <Minus
              size={currentSize.icon}
              strokeWidth={currentSize.stroke}
              className="animate-in zoom-in-75 duration-150"
            />
          ) : checked ? (
            <Check
              size={currentSize.icon}
              strokeWidth={currentSize.stroke}
              className="animate-in zoom-in-75 duration-150"
            />
          ) : null}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span
              className={`text-xs sm:text-[13px] font-medium transition-colors ${
                disabled
                  ? 'text-gray-400 dark:text-slate-600'
                  : 'text-gray-700 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white'
              }`}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-gray-400 dark:text-slate-500">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  )
})

export default Checkbox
