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
    <div className="bg-[#f3f4f6] border border-gray-300 px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-[#292424]">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-600 uppercase font-semibold text-[10.5px]">{docNumberLabel}</span>
        <span className="text-[#292424] font-mono text-sm font-black">{docNumber}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 uppercase font-semibold text-[10.5px]">{dateLabel}</span>
          <span className="text-[#292424] font-semibold text-[11.5px]">{dateValue}</span>
        </div>
        {dueDateLabel && dueDateValue && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300">
            <span className="text-rose-700 uppercase font-bold text-[10.5px]">{dueDateLabel}</span>
            <span className="text-rose-800 font-black text-[11.5px]">{dueDateValue}</span>
          </div>
        )}
        {rightExtra}
      </div>
    </div>
  )
}
