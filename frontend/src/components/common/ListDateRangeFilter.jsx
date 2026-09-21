import React from 'react'
import { Calendar } from 'lucide-react'

export default function ListDateRangeFilter({
  datePreset,
  onDatePresetChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange
}) {
  const presets = [
    { id: 'ALL', label: 'All Time' },
    { id: 'TODAY', label: 'Today' },
    { id: 'THIS_WEEK', label: 'This Week' },
    { id: 'THIS_MONTH', label: 'This Month' },
    { id: 'CUSTOM', label: 'Custom' }
  ]

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-slate-800 font-['Poppins',sans-serif]">
      {/* Quick Date Range Preset Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mr-1 flex items-center gap-1">
          <Calendar size={13} />
          <span>Date:</span>
        </span>
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onDatePresetChange(p.id)}
            className={`px-3 py-1.5 font-semibold transition-all cursor-pointer ${
              datePreset === p.id
                ? 'bg-[#043486] text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Date Pickers (From -> To) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-500 font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486]"
          />
        </div>

        <span className="text-gray-400 text-xs">to</span>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-500 font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486]"
          />
        </div>
      </div>
    </div>
  )
}
