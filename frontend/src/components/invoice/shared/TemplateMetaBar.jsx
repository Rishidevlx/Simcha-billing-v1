import React from 'react'

export default function TemplateMetaBar({
  docNumberLabel = 'INVOICE NUMBER:',
  docNumber = '',
  dateLabel = 'DATE:',
  dateValue = '',
  dueDateLabel = null,
  dueDateValue = null,
  rightExtra = null
}) {
  return (
    <div className="bg-[#f3f4f6] border border-gray-300 px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-[#292424] whitespace-nowrap">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-gray-600 uppercase font-semibold text-[10px]">{docNumberLabel}</span>
        <span className="text-[#292424] font-mono text-[12px] font-black">{docNumber}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-gray-600 uppercase font-semibold text-[10px]">{dateLabel}</span>
          <span className="text-[#292424] font-semibold text-[11px]">{dateValue}</span>
        </div>
        {dueDateLabel && dueDateValue && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300 shrink-0">
            <span className="text-rose-700 uppercase font-bold text-[10px]">{dueDateLabel}</span>
            <span className="text-rose-800 font-black text-[11px]">{dueDateValue}</span>
          </div>
        )}
        {rightExtra}
      </div>
    </div>
  )
}
