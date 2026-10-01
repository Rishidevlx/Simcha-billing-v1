import React from 'react'
import { Inbox } from '../common/icons'

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  loadingMessage = 'Loading data...',
  emptyMessage = 'No matching records found',
  emptySubtitle = 'Try adjusting your search filters or criteria.',
  emptyIcon: EmptyIcon = Inbox,
  selectable = false,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  rowClassName,
  className = '',
  tableClassName = '',
  children
}) {
  const isAllSelected =
    data.length > 0 &&
    data.every((row) => selectedIds.includes(row[keyField]))

  const getAlignClass = (align) => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      case 'left':
      default:
        return 'text-left'
    }
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors ${className}`}>
      {isLoading ? (
        <div className="p-4 space-y-3">
          <div className="h-9 bg-slate-100 dark:bg-slate-800 flex items-center px-4 gap-4 animate-pulse">
            {columns.map((_, i) => (
              <div key={i} className="h-3 bg-slate-200 dark:bg-slate-700 rounded-xs flex-1" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, rIdx) => (
            <div
              key={rIdx}
              className="h-11 border-b border-gray-100 dark:border-slate-800/70 flex items-center px-4 gap-4 animate-pulse"
            >
              {columns.map((_, cIdx) => (
                <div
                  key={cIdx}
                  className={`h-3 bg-slate-200/80 dark:bg-slate-800 rounded-xs ${
                    cIdx === 0 ? 'w-10' : cIdx === columns.length - 1 ? 'w-16' : 'flex-1'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <EmptyIcon size={36} className="mx-auto text-gray-300 dark:text-slate-700" />
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{emptyMessage}</p>
          {emptySubtitle && (
            <p className="text-xs text-gray-400 dark:text-slate-500">{emptySubtitle}</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full text-sm border-collapse font-['Poppins',sans-serif] ${tableClassName}`}>
            <thead className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#043486] dark:text-blue-400 font-bold">
              <tr>
                {selectable && (
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={onSelectAll}
                      className="w-4 h-4 rounded-none accent-[#043486] cursor-pointer"
                      title="Select / Deselect all on this page"
                    />
                  </th>
                )}
                {columns.map((col, idx) => (
                  <th
                    key={col.key || idx}
                    className={`py-3 px-4 ${getAlignClass(col.align)} ${col.width || ''} ${col.headerClassName || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-xs font-medium">
              {children ||
                data.map((row, index) => {
                  const rowId = row[keyField]
                  const isSelected = selectedIds.includes(rowId)
                  const customRowClass = rowClassName ? rowClassName(row, index, isSelected) : ''

                  return (
                    <tr
                      key={rowId || index}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/40'
                      } ${customRowClass}`}
                    >
                      {selectable && (
                        <td className="py-3.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelectRow && onSelectRow(rowId, row)}
                            className="w-4 h-4 rounded-none accent-[#043486] cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col, colIdx) => {
                        const val = col.key ? row[col.key] : undefined
                        return (
                          <td
                            key={col.key || colIdx}
                            className={`py-3.5 px-4 ${getAlignClass(col.align)} ${col.className || ''}`}
                          >
                            {col.render ? col.render(val, row, index) : val}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
