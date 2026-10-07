import React from 'react'
import {
  Wrench,
  Plus,
  Trash2,
  Copy,
  Hash,
  AlertCircle,
  CheckSquare,
  Square
} from '../common/icons'
import { Button } from '../ui'

/**
 * Line Items Engine for Service Billing & Repair Orders
 */
export default function ServiceLineItems({
  items = [],
  serviceType = 'GST',
  duplicateSerials = new Set(),
  onItemChange,
  onToggleSerial,
  onSerialNumberChange,
  onAddItem,
  onDuplicateItem,
  onRemoveItem
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4 transition-colors w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Wrench size={18} className="text-[#043486] dark:text-blue-400" />
          <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
            Service Description &amp; Spare Parts ({items.length})
          </h2>
        </div>

        <Button
          type="button"
          variant="primary"
          icon={Plus}
          onClick={onAddItem}
          className="text-xs font-semibold w-full sm:w-auto"
        >
          Add Line Item (Alt+A)
        </Button>
      </div>

      {/* Service Table List */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const qtyCount = Math.max(1, Math.floor(parseFloat(item.quantity) || 1))
          const serialsList = item.serial_numbers || []

          return (
            <div
              key={index}
              className="p-3.5 sm:p-4 rounded-none border border-gray-300 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/60 hover:border-[#043486] dark:hover:border-blue-600 transition-all space-y-3"
            >
              {/* Mobile Item Card Header (S.No + Duplicate/Delete) */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 dark:border-slate-800/80 lg:hidden">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-none bg-[#043486] text-white text-[11px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    Service Item #{index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onDuplicateItem(index)}
                    title="Duplicate item"
                    className="p-1.5 text-gray-500 hover:text-[#043486] dark:hover:text-blue-400 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none cursor-pointer"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    title="Delete item"
                    className="p-1.5 text-gray-500 hover:text-red-600 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Main Service Row */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2.5">
                {/* 1. Item Index (Desktop only) */}
                <div className="hidden lg:flex shrink-0 items-center">
                  <span className="w-8 h-[38px] bg-[#043486] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                </div>

                {/* 2. Product Name */}
                <div className="flex-[1.4] min-w-[120px]">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                    Product <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={item.product_name}
                    onChange={(e) => onItemChange(index, 'product_name', e.target.value)}
                    placeholder="Enter Product name"
                    className="w-full px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-semibold h-[38px]"
                  />
                </div>

                {/* Brand / Model & Issue row on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-1 gap-2.5">
                  {/* 3. Brand / Model */}
                  <div className="flex-1 min-w-[100px]">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                      Brand / Model
                    </label>
                    <input
                      type="text"
                      value={item.brand_model}
                      onChange={(e) => onItemChange(index, 'brand_model', e.target.value)}
                      placeholder="Brand / Model"
                      className="w-full px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium h-[38px]"
                    />
                  </div>

                  {/* 4. Issue */}
                  <div className="flex-1 min-w-[100px]">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                      Issue
                    </label>
                    <input
                      type="text"
                      value={item.issue_description}
                      onChange={(e) => onItemChange(index, 'issue_description', e.target.value)}
                      placeholder="Enter issue"
                      className="w-full px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium h-[38px]"
                    />
                  </div>
                </div>

                {/* Numbers Grid on Mobile (Qty, Rate, Amount) */}
                <div className="grid grid-cols-3 lg:flex lg:items-end gap-2.5">
                  {/* 5. Quantity */}
                  <div className="col-span-1 lg:w-16 shrink-0">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1 text-center">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-1.5 py-1.5 text-xs text-center font-bold text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 h-[38px]"
                    />
                  </div>

                  {/* 6. Rate (₹) */}
                  <div className="col-span-1 lg:w-24 shrink-0">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1 text-right">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={(e) => onItemChange(index, 'rate', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 text-xs text-right font-bold text-[#043486] dark:text-blue-400 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-mono h-[38px]"
                    />
                  </div>

                  {/* 7. Amount (₹) */}
                  <div className="col-span-1 lg:w-28 shrink-0">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1 text-right">
                      Amount (₹)
                    </label>
                    <div className="px-2 py-1.5 text-xs text-right font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-none font-mono h-[38px] flex items-center justify-end">
                      ₹{' '}
                      {parseFloat(item.amount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                </div>

                {/* 8. Desktop Actions (Duplicate & Delete) */}
                <div className="hidden lg:flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDuplicateItem(index)}
                    title="Duplicate Row"
                    className="w-[38px] h-[38px] text-gray-500 hover:text-blue-600 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:border-blue-500 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    title="Delete Row"
                    className="w-[38px] h-[38px] text-gray-500 hover:text-red-600 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:border-red-500 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Right-Bottom Checkbox: Serial Number Option */}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-gray-400 dark:text-slate-500">
                  {item.product_name && (
                    <span>
                      Product: <b>{item.product_name}</b> {item.brand_model ? `(${item.brand_model})` : ''}
                    </span>
                  )}
                </div>

                <label
                  onClick={() => onToggleSerial(index)}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer select-none hover:text-[#043486] dark:hover:text-blue-400 transition-colors"
                >
                  {item.has_serial ? (
                    <CheckSquare size={16} className="text-[#043486] dark:text-blue-400" />
                  ) : (
                    <Square size={16} className="text-gray-400" />
                  )}
                  <span>Has Serial Number?</span>
                </label>
              </div>

              {/* Dynamic Serial Number Input Fields (when checked) */}
              {item.has_serial && (
                <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-none space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-[#043486] dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Hash size={14} />
                      <span>
                        Enter Serial Number ({qtyCount} item{qtyCount > 1 ? 's' : ''})
                      </span>
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 font-normal">
                      Provide unique hardware serial / barcode number
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: qtyCount }).map((_, sIdx) => {
                      const serialVal = serialsList[sIdx] || ''
                      const isDuplicate =
                        serialVal.trim() !== '' &&
                        duplicateSerials.has(serialVal.trim().toLowerCase())

                      return (
                        <div key={sIdx} className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs font-mono font-bold">
                            #{sIdx + 1}
                          </div>
                          <input
                            type="text"
                            value={serialVal}
                            onChange={(e) =>
                              onSerialNumberChange(index, sIdx, e.target.value)
                            }
                            placeholder={`Serial #${sIdx + 1}`}
                            className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-mono text-[#292424] dark:text-white rounded-none focus:outline-none transition-colors ${
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
          )
        })}
      </div>
    </div>
  )
}
