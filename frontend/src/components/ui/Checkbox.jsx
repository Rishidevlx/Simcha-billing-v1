import { Check } from 'lucide-react'

export default function Checkbox({
  label,
  checked,
  onChange,
  className = '',
  ...props
}) {
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer select-none group ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
          {...props}
        />
        <div className="w-4 h-4 rounded-md border border-gray-300 bg-white/80 peer-checked:bg-[#0248BC] peer-checked:border-[#0248BC] flex items-center justify-center transition-all duration-150 shadow-xs">
          {checked && <Check size={12} className="text-white stroke-[3]" />}
        </div>
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
          {label}
        </span>
      )}
    </label>
  )
}
