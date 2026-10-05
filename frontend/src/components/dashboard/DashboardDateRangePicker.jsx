import React, { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Calendar, ChevronLeft, ChevronRight, X } from '../common/icons'

// Local Date Helper
const getLocalDateString = (dateVal) => {
  if (!dateVal) return ''
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim()
  }
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) {
    if (typeof dateVal === 'string') {
      return dateVal.slice(0, 10)
    }
    return ''
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateObj = (str) => {
  if (!str) return undefined
  const parts = str.split('-')
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? undefined : d
}

const formatDisplay = (dStr) => {
  if (!dStr) return ''
  const parts = dStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dStr
}

export default function DashboardDateRangePicker({
  dateRange,
  setDateRange,
  onRangeChange
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const presetsScrollRef = useRef(null)

  const [pendingRange, setPendingRange] = useState({
    from: parseDateObj(dateRange.startDate),
    to: parseDateObj(dateRange.endDate)
  })
  const [pendingPreset, setPendingPreset] = useState(dateRange.preset || 'ALL_TIME')

  useEffect(() => {
    setPendingRange({
      from: parseDateObj(dateRange.startDate),
      to: parseDateObj(dateRange.endDate)
    })
    setPendingPreset(dateRange.preset || 'ALL_TIME')
  }, [dateRange.startDate, dateRange.endDate, dateRange.preset])

  // Reset pending selection to committed dateRange on open
  const handleToggleOpen = () => {
    if (!isOpen) {
      setPendingRange({
        from: parseDateObj(dateRange.startDate),
        to: parseDateObj(dateRange.endDate)
      })
      setPendingPreset(dateRange.preset || 'ALL_TIME')
    }
    setIsOpen(!isOpen)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  // Presets
  const presets = [
    { key: 'TODAY', label: 'Today' },
    { key: 'YESTERDAY', label: 'Yesterday' },
    { key: 'LAST_7_DAYS', label: 'Last 7 Days' },
    { key: 'LAST_30_DAYS', label: 'Last 30 Days' },
    { key: 'THIS_MONTH', label: 'This Month' },
    { key: 'LAST_MONTH', label: 'Last Month' },
    { key: 'THIS_YEAR', label: 'This Year' },
    { key: 'ALL_TIME', label: 'All Time' }
  ]

  const handlePresetClick = (presetKey) => {
    const now = new Date()
    let start = ''
    let end = ''

    if (presetKey === 'TODAY') {
      start = getLocalDateString(now)
      end = getLocalDateString(now)
    } else if (presetKey === 'YESTERDAY') {
      const y = new Date(now)
      y.setDate(now.getDate() - 1)
      start = getLocalDateString(y)
      end = getLocalDateString(y)
    } else if (presetKey === 'LAST_7_DAYS') {
      const past7 = new Date(now)
      past7.setDate(now.getDate() - 6)
      start = getLocalDateString(past7)
      end = getLocalDateString(now)
    } else if (presetKey === 'LAST_30_DAYS') {
      const past30 = new Date(now)
      past30.setDate(now.getDate() - 29)
      start = getLocalDateString(past30)
      end = getLocalDateString(now)
    } else if (presetKey === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      start = getLocalDateString(firstDay)
      end = getLocalDateString(lastDay)
    } else if (presetKey === 'LAST_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
      start = getLocalDateString(firstDay)
      end = getLocalDateString(lastDay)
    } else if (presetKey === 'THIS_YEAR') {
      const firstDay = new Date(now.getFullYear(), 0, 1)
      const lastDay = new Date(now.getFullYear(), 11, 31)
      start = getLocalDateString(firstDay)
      end = getLocalDateString(lastDay)
    } else if (presetKey === 'ALL_TIME') {
      start = ''
      end = ''
    }

    setPendingPreset(presetKey)
    setPendingRange({
      from: parseDateObj(start),
      to: parseDateObj(end)
    })
  }

  // React-day-picker range selection handler (stores in pending state without filtering yet)
  const handleSelectDayPicker = (range) => {
    setPendingPreset('CUSTOM')
    setPendingRange(range || { from: undefined, to: undefined })
  }

  // Commit and Apply Filter when user clicks "Done"
  const handleApplyDone = () => {
    let startStr = ''
    let endStr = ''
    let label = ''

    if (pendingPreset === 'ALL_TIME' || (!pendingRange?.from && !pendingRange?.to)) {
      startStr = ''
      endStr = ''
      label = 'All Time'
    } else if (pendingRange?.from && pendingRange?.to) {
      startStr = getLocalDateString(pendingRange.from)
      endStr = getLocalDateString(pendingRange.to)
      label = startStr === endStr ? formatDisplay(startStr) : `${formatDisplay(startStr)} - ${formatDisplay(endStr)}`
    } else if (pendingRange?.from && !pendingRange?.to) {
      startStr = getLocalDateString(pendingRange.from)
      endStr = startStr
      label = formatDisplay(startStr)
    }

    const nextState = {
      preset: pendingPreset,
      startDate: startStr,
      endDate: endStr,
      label: label || 'All Time'
    }

    setDateRange(nextState)
    if (onRangeChange) onRangeChange(nextState)
    setIsOpen(false)
  }

  // Clear Filter handler
  const handleClearFilter = () => {
    const nextState = {
      preset: 'ALL_TIME',
      startDate: '',
      endDate: '',
      label: 'All Time'
    }
    setPendingPreset('ALL_TIME')
    setPendingRange({ from: undefined, to: undefined })
    setDateRange(nextState)
    if (onRangeChange) onRangeChange(nextState)
    setIsOpen(false)
  }

  const scrollPresets = (dir) => {
    if (presetsScrollRef.current) {
      presetsScrollRef.current.scrollBy({ left: dir * 120, behavior: 'smooth' })
    }
  }

  // Trigger Button text formatted
  const triggerLabel = dateRange.startDate && dateRange.endDate
    ? (dateRange.startDate === dateRange.endDate
        ? formatDisplay(dateRange.startDate)
        : `${formatDisplay(dateRange.startDate)} - ${formatDisplay(dateRange.endDate)}`)
    : (dateRange.label || 'All Time')

  return (
    <div className="relative inline-block text-left font-['Poppins',sans-serif]" ref={dropdownRef}>
      {/* 1. Header Trigger Box */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium rounded-none border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 hover:border-gray-400 dark:hover:border-slate-600 transition-all cursor-pointer shadow-2xs h-[37px]"
      >
        <Calendar size={15} className="text-gray-600 dark:text-slate-400 shrink-0" />
        <span className="tracking-tight text-gray-800 dark:text-slate-200 font-semibold">{triggerLabel}</span>
      </button>

      {/* 2. Popover Dropdown with React Day Picker */}
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/90 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 custom-daypicker-container">

          {/* Top Quick Presets Carousel with Arrow Controls */}
          <div className="relative flex items-center mb-3 pb-2.5 border-b border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => scrollPresets(-1)}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>

            <div
              ref={presetsScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto mx-1 no-scrollbar scroll-smooth max-w-[280px] sm:max-w-[300px]"
            >
              {presets.map((p) => {
                const isActive = pendingPreset === p.key
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePresetClick(p.key)}
                    className={`px-3 py-1 text-[11px] font-medium whitespace-nowrap rounded-md transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#043486] text-white font-bold shadow-xs'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollPresets(1)}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* React DayPicker Component */}
          <div className="flex justify-center">
            <DayPicker
              mode="range"
              selected={pendingRange}
              onSelect={handleSelectDayPicker}
              captionLayout="dropdown"
              fromYear={2000}
              toYear={2040}
              className="m-0"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleClearFilter}
              className="px-2.5 py-1 text-gray-500 hover:text-gray-800 dark:hover:text-slate-200 transition-colors cursor-pointer font-medium"
            >
              Clear Filter
            </button>
            <button
              type="button"
              onClick={handleApplyDone}
              className="px-3.5 py-1.5 bg-[#043486] hover:bg-[#0248BC] text-white font-bold rounded-lg shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              Done
            </button>
          </div>

          {/* React-day-picker custom styles */}
          <style>{`
            .custom-daypicker-container .rdp {
              --rdp-cell-size: 34px;
              --rdp-accent-color: #043486;
              --rdp-background-color: #e0e7ff;
              margin: 0;
              font-family: inherit;
            }
            .custom-daypicker-container .rdp-caption_dropdowns {
              display: flex;
              gap: 6px;
              justify-content: center;
              background-color: #fff7ed;
              padding: 6px 10px;
              border-radius: 10px;
              border: 1px solid #ffedd5;
              margin-bottom: 8px;
            }
            .dark .custom-daypicker-container .rdp-caption_dropdowns {
              background-color: #1e293b;
              border-color: #334155;
            }
            .custom-daypicker-container .rdp-dropdown select {
              padding: 3px 6px;
              border-radius: 6px;
              border: 1px solid #fed7aa;
              font-weight: bold;
              font-size: 12px;
              cursor: pointer;
              background-color: #ffffff;
              color: #1e293b;
            }
            .dark .custom-daypicker-container .rdp-dropdown select {
              background-color: #0f172a;
              border-color: #475569;
              color: #f8fafc;
            }
            .custom-daypicker-container .rdp-head_cell {
              color: #64748b;
              font-size: 11px;
              font-weight: 600;
            }
            .custom-daypicker-container .rdp-day {
              font-size: 12px;
              font-weight: 500;
              border-radius: 6px;
            }
            .custom-daypicker-container .rdp-day_selected,
            .custom-daypicker-container .rdp-day_range_start,
            .custom-daypicker-container .rdp-day_range_end {
              background-color: #043486 !important;
              color: #ffffff !important;
              font-weight: bold;
            }
            .custom-daypicker-container .rdp-day_range_middle {
              background-color: #e0e7ff !important;
              color: #1e40af !important;
              border-radius: 0;
            }
            .dark .custom-daypicker-container .rdp-day_range_middle {
              background-color: #1e3a8a !important;
              color: #bfdbfe !important;
            }
            .custom-daypicker-container .rdp-day_today {
              font-weight: bold;
              background-color: #fed7aa;
              color: #9a3412;
            }
            .dark .custom-daypicker-container .rdp-day_today {
              background-color: #78350f;
              color: #fde68a;
            }
          `}</style>

        </div>
      )}
    </div>
  )
}
