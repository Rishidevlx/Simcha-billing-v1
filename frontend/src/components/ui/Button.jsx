import React from 'react'

export default function Button({
  children,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger', 'success', 'ghost', 'reset'
  size = 'md', // 'xs', 'sm', 'md', 'lg'
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-bold tracking-wide rounded-none transition-all duration-150 select-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99] shadow-2xs"

  const variants = {
    primary:
      "relative overflow-hidden bg-transparent border border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-400 hover:text-white dark:hover:text-white before:absolute before:inset-0 before:bg-[#043486] dark:before:bg-[#043486] before:-translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-300 before:ease-out shadow-xs group z-0 [&>*]:relative [&>*]:z-10",
    create:
      "relative overflow-hidden bg-transparent border border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-400 hover:text-white dark:hover:text-white before:absolute before:inset-0 before:bg-[#043486] dark:before:bg-[#043486] before:-translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-300 before:ease-out shadow-xs group z-0 [&>*]:relative [&>*]:z-10",
    list:
      "bg-[#043486] hover:bg-[#0248BC] text-white border border-transparent shadow-xs hover:shadow-sm",
    export:
      "bg-[#0f766e] hover:bg-[#115e59] text-white border border-transparent shadow-xs hover:shadow-sm",
    secondary:
      "bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800",
    outline:
      "bg-transparent border border-[#043486] text-[#043486] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white border border-transparent shadow-xs",
    success:
      "bg-[#0f766e] hover:bg-[#115e59] text-white border border-transparent shadow-xs hover:shadow-sm",
    ghost:
      "bg-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 border-transparent shadow-none",
    reset:
      "bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold"
  }

  const sizes = {
    xs: "px-2.5 py-1 text-[11px] gap-1",
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs sm:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm font-black gap-2"
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} className="shrink-0" />
      ) : null}

      <span>{children}</span>

      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} className="shrink-0 ml-1.5" />
      ) : null}
    </button>
  )
}
