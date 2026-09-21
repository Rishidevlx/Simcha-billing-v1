import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X } from 'lucide-react'

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Type or select category...',
  disabled = false,
  required = false,
  className = '',
  name = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const optionsListRef = useRef(null)

  // Normalize options to { value, label, subLabel }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt.id,
        label: opt.label ?? opt.name ?? String(opt.value ?? opt.id),
        subLabel: opt.subLabel
      }
    }
    return { value: opt, label: String(opt) }
  })

  // Sync inputText with selected option when value changes externally
  useEffect(() => {
    const selected = normalizedOptions.find(opt => String(opt.value) === String(value))
    setInputText(selected ? selected.label : '')
  }, [value, options])

  // Filter options based on inputText
  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes((inputText || '').toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes((inputText || '').toLowerCase()))
  )

  // Reset highlightedIndex whenever filtered options change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [inputText])

  // Close when clicking outside & handle blur reconciliation
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        if (!value) {
          setInputText('')
        } else {
          const selected = normalizedOptions.find(opt => String(opt.value) === String(value))
          setInputText(selected ? selected.label : (String(value) || ''))
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value, normalizedOptions])

  const handleInputChange = (e) => {
    const text = e.target.value
    setInputText(text)
    setIsOpen(true)
    setHighlightedIndex(0)

    // Check if typed text matches exactly any option
    const exactMatch = normalizedOptions.find(
      opt => opt.label.toLowerCase() === text.trim().toLowerCase()
    )
    if (exactMatch && onChange) {
      onChange(exactMatch.value)
    } else if (!text && onChange) {
      onChange('')
    }
  }

  const handleSelect = (opt) => {
    if (!opt) return
    setInputText(opt.label)
    if (onChange) {
      onChange(opt.value)
    }
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setInputText('')
    if (onChange) {
      onChange('')
    }
    inputRef.current?.focus()
    setIsOpen(true)
  }

  // Handle Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e) => {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setHighlightedIndex(prev => (prev + 1) % (filteredOptions.length || 1))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setHighlightedIndex(prev => (prev - 1 + (filteredOptions.length || 1)) % (filteredOptions.length || 1))
      }
    } else if (e.key === 'Enter') {
      if (isOpen && filteredOptions.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        const selectedOpt = filteredOptions[highlightedIndex] || filteredOptions[0]
        if (selectedOpt) {
          handleSelect(selectedOpt)
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for standard form serialization */}
      <input
        type="hidden"
        name={name}
        value={value || ''}
        required={required}
      />

      {/* Main Searchable Input Field (Direct Typeahead) */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 pr-14 text-xs sm:text-sm text-[#292424] dark:text-white rounded-none border transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 ${
            disabled
              ? 'bg-gray-100 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-400 cursor-not-allowed'
              : isOpen
              ? 'border-[#0248BC] dark:border-blue-500 ring-1 ring-[#0248BC] dark:ring-blue-500 bg-white dark:bg-slate-950'
              : 'border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 bg-white dark:bg-slate-950'
          }`}
        />

        {/* Right action icons (Clear X and Chevron) */}
        <div className="absolute right-2 flex items-center gap-1 text-gray-400 dark:text-slate-400">
          {inputText && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Clear"
            >
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen)
                if (!isOpen) inputRef.current?.focus()
              }
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none hover:text-[#0248BC] dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0248BC] dark:text-blue-400' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Options List */}
      {isOpen && (
        <div 
          ref={optionsListRef}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-none shadow-xl max-h-56 overflow-y-auto p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-3 text-center text-xs text-gray-400 dark:text-slate-500">
              No matching options found
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value)
              const isHighlighted = idx === highlightedIndex
              return (
                <button
                  key={opt.value}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    // onMouseDown prevents input blur before selection
                    e.preventDefault()
                    handleSelect(opt)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-none transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-[#043486] dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60'
                      : isHighlighted
                      ? 'bg-gray-100 dark:bg-slate-800 text-[#043486] dark:text-blue-400'
                      : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-[#043486] dark:hover:text-blue-400'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal">{opt.subLabel}</span>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="text-[#043486] dark:text-blue-400 shrink-0 ml-2" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

