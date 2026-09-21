import React from 'react'
import { Boxes, Plus, Trash2, Copy, Hash, AlertCircle } from 'lucide-react'
import SearchableSelect from '../common/SearchableSelect'

export default function InwardLineItems({
  items,
  materialOptions,
  duplicateSerials = new Set(),
  onMaterialSelect,
  onItemChange,
  onToggleSerial,
  onSerialNumberChange,
  onAddItem,
  onDuplicateItem,
  onRemoveItem
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors w-full">
      {/* Line Items Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Boxes size={18} className="text-[#043486] dark:text-blue-400" />
          <h2 className="text-base font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
            Inward Materials / Line Items ({items.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#043486] hover:bg-[#0248BC] text-white font-semibold text-xs rounded-none shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Material (Alt+A)</span>
        </button>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const qtyCount = Math.min(25, Math.max(1, Math.floor(parseFloat(item.quantity) || 1)))
          const serialsList = item.serial_numbers || []

          return (
            <div
              key={index}
              className="p-4 rounded-none border border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 hover:border-blue-300 dark:hover:border-blue-800 transition-all space-y-3"
            >
              {/* Row 1: S.No + Item Name Select + HSN/SAC + Qty (Max 25) + Unit (Auto) + Rate (Auto) + Amount + Actions */}
              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
                {/* S.No */}
                <div className="shrink-0">
                  <span className="w-9 h-[41px] rounded-none bg-[#043486] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                </div>

                {/* 1. Item Name / Material Search & Select */}
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    Item Name <span className="text-blue-500">*</span>
                  </label>
                  <SearchableSelect
                    options={materialOptions}
                    value={item.material_id || ''}
                    onChange={(val) => onMaterialSelect(index, val)}
                    placeholder="Select material"
                  />
                </div>

                {/* 2. HSN / SAC Code (Auto fetched & Non-editable) */}
                <div className="w-full sm:w-28 shrink-0">
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    HSN / SAC
                  </label>
                  <input
                    type="text"
                    value={item.hsn_code || ''}
                    readOnly
                    placeholder="HSN"
                    className="w-full px-3 py-2.5 text-xs font-mono text-center text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-none cursor-not-allowed select-none font-medium h-[41px]"
                  />
                </div>

                {/* 3. Quantity (Max 25) */}
                <div className="w-full sm:w-24 shrink-0">
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    Qty <span className="text-[10px] text-gray-400 font-normal">(Max 25)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                    title="Quantity (Max 25)"
                    placeholder="Qty"
                    className="w-full px-2 py-2.5 text-xs text-center font-bold text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 h-[41px]"
                  />
                </div>

                {/* 4. Unit Type (Auto fetched & Non-editable) */}
                <div className="w-full sm:w-24 shrink-0">
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={item.unit || 'NOS'}
                    readOnly
                    className="w-full px-2 py-2.5 text-xs text-center uppercase font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-none cursor-not-allowed select-none h-[41px]"
                  />
                </div>

                {/* 5. Rate (₹) (Auto fetched & Non-editable) */}
                <div className="w-full sm:w-28 shrink-0">
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    Rate (₹)
                  </label>
                  <input
                    type="text"
                    value={Number(item.rate || 0).toFixed(2)}
                    readOnly
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 text-xs font-semibold text-right font-mono text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-none cursor-not-allowed select-none h-[41px]"
                  />
                </div>

                {/* 6. Amount (₹) */}
                <div className="w-full sm:w-32 shrink-0">
                  <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    Amount (₹)
                  </label>
                  <div className="px-3 py-2.5 text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-center justify-end h-[41px]">
                    ₹ {Number(item.amount || 0).toFixed(2)}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 self-end md:self-end">
                  <div className="flex items-center gap-1 h-[41px]">
                    <button
                      type="button"
                      onClick={() => onDuplicateItem(index)}
                      title="Duplicate material row"
                      className="p-2.5 text-gray-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      title="Delete material row"
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Description + Serial Number Toggle + Dynamic 3-Column Serial Inputs */}
              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-3">
                <div>
                  {/* Description / Notes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                      Description / Notes <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => onItemChange(index, 'description', e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full px-3 py-2 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Dynamic Serial Number Input Fields (Strictly 3 fields per row + Enhanced Padding) */}
                {item.has_serial && (
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-none space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#043486] dark:text-blue-300">
                      <span className="flex items-center gap-1.5">
                        <Hash size={14} />
                        <span>Enter Unique Serial Numbers ({qtyCount} total)</span>
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 font-normal">
                        Each serial number must be unique
                      </span>
                    </div>

                    {/* 3 Fields per row on desktop (grid-cols-1 md:grid-cols-3) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Array.from({ length: qtyCount }).map((_, sIdx) => {
                        const serialVal = serialsList[sIdx] || ''
                        const isDuplicate = serialVal.trim() !== '' && duplicateSerials.has(serialVal.trim().toLowerCase())

                        return (
                          <div key={sIdx} className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs font-mono font-bold">
                              #{sIdx + 1}
                            </div>
                            <input
                              type="text"
                              value={serialVal}
                              onChange={(e) => onSerialNumberChange(index, sIdx, e.target.value)}
                              placeholder={`Serial #${sIdx + 1}`}
                              className={`w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm font-mono text-[#292424] dark:text-white rounded-none focus:outline-none transition-colors ${
                                isDuplicate
                                  ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-500 text-red-700 dark:text-red-300 focus:border-red-600'
                                  : 'bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-[#043486] dark:focus:border-blue-500'
                              } placeholder:text-gray-400 dark:placeholder:text-slate-500`}
                            />
                            {isDuplicate && (
                              <div
                                title="Duplicate serial number detected!"
                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-red-500 pointer-events-none"
                              >
                                <AlertCircle size={15} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
