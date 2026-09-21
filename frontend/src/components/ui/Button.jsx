export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]"

  const variants = {
    primary: "bg-gradient-to-r from-[#043486] to-[#0248BC] text-white shadow-lg shadow-blue-800/25 hover:shadow-xl hover:shadow-blue-800/35 hover:from-[#032c70] hover:to-[#023fa5]",
    secondary: "bg-white text-[#043486] border border-gray-200 hover:bg-gray-50 shadow-xs",
    ghost: "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-black/5"
  }

  const sizes = {
    sm: "px-3.5 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base"
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  )
}
