import React from 'react'
import { ChevronLeft, ChevronRight } from '../common/icons'

export default function Pagination({
  currentPage = 1,
  totalPages,
  totalItems = 0,
  itemsPerPage = 10,
  pageSize,
  onItemsPerPageChange,
  onPageSizeChange,
  onPageChange,
  className = ''
}) {
  const perPage = Number(itemsPerPage || pageSize || 10)
  const current = Number(currentPage || 1)
  const total = Number(totalItems || 0)
  const pages = Number(totalPages || Math.max(1, Math.ceil(total / (perPage > 0 ? perPage : 1))))
  const handleSizeChange = onItemsPerPageChange || onPageSizeChange || (() => {})
  const startIndex = total === 0 ? 0 : (current - 1) * perPage + 1
  const endIndex = Math.min(current * perPage, total)

  return (
    <div className={`px-6 py-3 bg-[#f8fafc] dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-600 dark:text-slate-300 font-['Poppins',sans-serif] ${className}`}>
      {/* Items Per Page Selector */}
      <div className="flex items-center gap-2">
        <span>Items per page:</span>
        <select
          value={perPage}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="px-2 py-1 font-semibold text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Item Count Summary */}
      <div className="text-gray-500 dark:text-slate-400 font-mono text-xs">
        {total === 0 ? (
          '0 of 0 items'
        ) : (
          <span>
            {startIndex}-{endIndex} of {total} items
          </span>
        )}
      </div>

      {/* Page Selector & Prev / Next Arrows */}
      <div className="flex items-center gap-3">
        {/* Page Select Dropdown */}
        <div className="flex items-center gap-1.5">
          <span>Page</span>
          <select
            value={current}
            onChange={(e) => onPageChange && onPageChange(Number(e.target.value))}
            className="px-2 py-1 font-semibold text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
          >
            {Array.from({ length: Math.max(1, pages) }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span>of {pages} pages</span>
        </div>

        {/* Navigation Arrow Buttons */}
        <div className="flex items-center border border-gray-300 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onPageChange && onPageChange(current - 1)}
            disabled={current <= 1 || total === 0}
            className="p-1.5 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-300 dark:border-slate-700 transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange && onPageChange(current + 1)}
            disabled={current >= pages || total === 0}
            className="p-1.5 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
