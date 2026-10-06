import React from 'react'
import {
  Boxes,
  Plus,
  Trash2,
  Copy,
  Hash,
  AlertCircle,
  CheckCircle2,
  FileDigit,
  ChevronDown
} from '../common/icons'
import SearchableSelect from '../common/SearchableSelect'
import { Button } from '../ui'

/**
 * Line Items Engine for Outward / Sales Invoices
 */
export default function OutwardLineItems({
  items = [],
  categoryOptions = [],
  materials = [],
  getMaterialOptionsForRow,
  duplicateSerials = new Set(),
  verifiedSerials = {},
  availableSerialsMap = {},
  activeSerialSuggest = null,
  setActiveSerialSuggest,
  fetchAvailableSerialsForMaterial,
  verifySerialWithDb,
  onCategorySelect,
  onMaterialSelect,
  onItemChange,
  onSerialNumberChange,
  onAddItem,
  onDuplicateItem,
  onRemoveItem,
  isQuotation = false
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors w-full">
      {/* Header with Title & Add Line Item button */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Boxes size={18} className="text-[#043486] dark:text-blue-400" />
          <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
            {isQuotation ? 'Quotation Line Items' : 'Invoice Line Items'} ({items.length})
          </h2>
        </div>

        <Button
          type="button"
          variant="primary"
          icon={Plus}
          onClick={onAddItem}
          className="text-xs font-semibold"
        >
          Add Line Item (Alt+A)
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-none border border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 hover:border-blue-300 dark:hover:border-blue-800 transition-all space-y-3"
          >
            {/* Row 1: Index + Category + Product Select + HSN/SAC + Qty & Unit + Row Actions */}
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
              {/* S.No */}
              <div className="shrink-0">
                <span className="w-9 h-[41px] rounded-none bg-[#043486] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
              </div>

              {/* 1. Category Search & Select Dropdown */}
              <div className="w-full md:w-60 shrink-0">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Material Category
                </label>
                <SearchableSelect
                  options={categoryOptions}
                  value={item.category_id || ''}
                  onChange={(val) => onCategorySelect(index, val)}
                  placeholder="Select Category..."
                />
              </div>

              {/* 2. Product / Material Search & Select Dropdown */}
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200">
                    Item Name <span className="text-red-500 font-bold">*</span>
                    {!isQuotation && item.material_id && item.current_stock !== null && item.current_stock !== undefined && (
                      <span
                        className={`ml-2 text-[10.5px] font-bold ${
                          parseFloat(item.current_stock) <= 0
                            ? 'text-red-500'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {parseFloat(item.current_stock) <= 0
                          ? '(0 in Stock - Out of Stock)'
                          : `(Available: ${item.current_stock} ${item.unit || 'NOS'})`}
                      </span>
                    )}
                  </label>
                </div>
                <SearchableSelect
                  options={getMaterialOptionsForRow ? getMaterialOptionsForRow(item.category_id, item.hsn_code) : []}
                  value={item.material_id || ''}
                  onChange={(val) => onMaterialSelect(index, val)}
                  placeholder={
                    item.category_name
                      ? `Select product in "${item.category_name}"...`
                      : item.hsn_code
                      ? `Select product for HSN "${item.hsn_code}"...`
                      : 'Search & select product / item...'
                  }
                />

                {/* Stock Validations Warning Message Under Input Field */}
                {!isQuotation && item.material_id && item.current_stock !== null && item.current_stock !== undefined && (
                  <>
                    {parseFloat(item.current_stock) <= 0 ? (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 border border-red-200 dark:border-red-900 animate-pulse">
                        <AlertCircle size={12} className="shrink-0 text-red-500" />
                        <span>⚠️ Out of Stock! (0 {item.unit || 'NOS'} in inventory)</span>
                      </div>
                    ) : (parseFloat(item.quantity) || 1) > parseFloat(item.current_stock) ? (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 border border-red-200 dark:border-red-900">
                        <AlertCircle size={12} className="shrink-0 text-red-500" />
                        <span>
                          ⚠️ Insufficient Stock! Only {item.current_stock} {item.unit || 'NOS'} available (Billed:{' '}
                          {item.quantity})
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* 3. HSN / SAC */}
              <div className="w-full sm:w-36 shrink-0">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  value={item.hsn_code}
                  onChange={(e) => onItemChange(index, 'hsn_code', e.target.value)}
                  placeholder="HSN / SAC"
                  title="HSN / SAC Code"
                  className="w-full px-3 py-2.5 text-xs font-mono text-center text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium h-[41px]"
                />
              </div>

              {/* 4. Quantity & Unit */}
              <div className="shrink-0">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Qty & Unit
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                    title="Quantity"
                    placeholder="Qty"
                    className={`w-20 px-2 py-2.5 text-xs text-center font-bold bg-white dark:bg-slate-900 border rounded-none focus:outline-none h-[41px] ${
                      !isQuotation &&
                      item.material_id &&
                      item.current_stock !== null &&
                      (parseFloat(item.current_stock) <= 0 || (parseFloat(item.quantity) || 1) > parseFloat(item.current_stock))
                        ? 'border-red-500 text-red-600 dark:text-red-400 focus:border-red-600 bg-red-50/20'
                        : 'text-[#292424] dark:text-white border-gray-300 dark:border-slate-700 focus:border-[#043486] dark:focus:border-blue-500'
                    }`}
                  />
                  <input
                    type="text"
                    value={item.unit || 'NOS'}
                    readOnly
                    title="Unit (From material)"
                    className="w-18 px-2 py-2.5 text-xs text-center uppercase text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-none cursor-not-allowed select-none focus:outline-none font-semibold h-[41px]"
                  />
                </div>
              </div>

              {/* Row Actions */}
              <div className="shrink-0 self-end md:self-end">
                <label className="hidden md:block text-[11px] font-semibold text-transparent select-none mb-1">
                  Action
                </label>
                <div className="flex items-center gap-1 h-[41px]">
                  <button
                    type="button"
                    onClick={() => onDuplicateItem(index)}
                    title="Duplicate row"
                    className="p-2.5 text-gray-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    title="Delete row"
                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Dynamic Serial Number Inputs */}
            {(item.has_serial || (item.serial_numbers && item.serial_numbers.some(Boolean)) || item.serial_number) && (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-none space-y-3 pt-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#043486] dark:text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <FileDigit size={15} />
                    <span>
                      Enter Serial Numbers for stock verification (
                      {Math.min(25, Math.max(1, Math.floor(parseFloat(item.quantity) || 1)))} total){' '}
                      <span className="text-red-500">*</span>
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 font-normal">
                    Auto-suggest available stock from Warehouse Vault
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: Math.min(25, Math.max(1, Math.floor(parseFloat(item.quantity) || 1))) }).map(
                    (_, sIdx) => {
                      const serialVal = item.serial_numbers?.[sIdx] || (sIdx === 0 ? item.serial_number : '') || ''
                      const trimmed = serialVal.trim().toLowerCase()
                      const isDuplicate = trimmed !== '' && duplicateSerials.has(trimmed)
                      const dbStatus = trimmed ? verifiedSerials[trimmed] : null
                      const isNotFound = dbStatus && dbStatus.found === false
                      const isSoldOrUnavailable = dbStatus && dbStatus.found === true && dbStatus.status && dbStatus.status.toLowerCase() !== 'available'
                      const isVerified = dbStatus && dbStatus.found === true && (!dbStatus.status || dbStatus.status.toLowerCase() === 'available')
                      const isSuggestOpen =
                        activeSerialSuggest?.itemIndex === index && activeSerialSuggest?.serialIndex === sIdx
                      const availableStockSerials = availableSerialsMap[item.material_id] || []
                      const matchingStockSerials = availableStockSerials.filter(
                        (sn) => !trimmed || sn.toLowerCase().includes(trimmed)
                      )

                      return (
                        <div key={sIdx} className="space-y-1 relative">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs font-mono font-bold">
                              #{sIdx + 1}
                            </div>
                            <input
                              type="text"
                              value={serialVal}
                              onChange={(e) => onSerialNumberChange(index, sIdx, e.target.value)}
                              onFocus={() => {
                                if (setActiveSerialSuggest) {
                                  setActiveSerialSuggest({ itemIndex: index, serialIndex: sIdx })
                                }
                                if (item.material_id && fetchAvailableSerialsForMaterial) {
                                  fetchAvailableSerialsForMaterial(item.material_id)
                                }
                              }}
                              onBlur={(e) => {
                                if (setActiveSerialSuggest) {
                                  setTimeout(() => setActiveSerialSuggest(null), 250)
                                }
                                if (e.target.value.trim() && verifySerialWithDb) {
                                  verifySerialWithDb(e.target.value.trim())
                                }
                              }}
                              placeholder={`Serial #${sIdx + 1}`}
                              className={`w-full pl-9 pr-14 py-2.5 text-xs sm:text-sm font-mono text-[#292424] dark:text-white rounded-none focus:outline-none transition-colors ${
                                isDuplicate || isNotFound || isSoldOrUnavailable
                                  ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-500 text-red-700 dark:text-red-300 focus:border-red-600'
                                  : isVerified
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-[#043486] dark:focus:border-blue-500'
                              } placeholder:text-gray-400 dark:placeholder:text-slate-500`}
                            />
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                              {isDuplicate ? (
                                <AlertCircle size={15} className="text-red-500" title="Duplicate serial in bill" />
                              ) : isNotFound ? (
                                <AlertCircle size={15} className="text-red-500" title="Not found in stock DB" />
                              ) : isSoldOrUnavailable ? (
                                <AlertCircle size={15} className="text-red-500" title={`Serial number is already ${dbStatus.status} in inventory`} />
                              ) : isVerified ? (
                                <CheckCircle2
                                  size={15}
                                  className="text-emerald-600 dark:text-emerald-400"
                                  title="Verified in stock"
                                />
                              ) : null}

                              <button
                                type="button"
                                tabIndex={-1}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  if (setActiveSerialSuggest) {
                                    if (isSuggestOpen) {
                                      setActiveSerialSuggest(null)
                                    } else {
                                      setActiveSerialSuggest({ itemIndex: index, serialIndex: sIdx })
                                      if (item.material_id && fetchAvailableSerialsForMaterial) {
                                        fetchAvailableSerialsForMaterial(item.material_id)
                                      }
                                    }
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-[#043486] dark:hover:text-blue-400 transition-colors cursor-pointer"
                                title="Toggle available serials suggestions"
                              >
                                <ChevronDown
                                  size={14}
                                  className={`transition-transform duration-150 ${
                                    isSuggestOpen ? 'rotate-180 text-[#043486]' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Auto-Suggest Dropdown Popover */}
                          {isSuggestOpen && (
                            <div
                              onMouseDown={(e) => e.preventDefault()}
                              className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 shadow-xl z-50 rounded-none overflow-hidden max-h-52 overflow-y-auto animate-in fade-in duration-100"
                            >
                              <div className="px-3 py-1.5 bg-blue-50 dark:bg-slate-800 border-b border-blue-200 dark:border-slate-700 flex items-center justify-between text-[10px] font-bold text-[#043486] dark:text-blue-300">
                                <span className="flex items-center gap-1">
                                  <FileDigit size={11} />
                                  <span>In-Stock Serials ({matchingStockSerials.length})</span>
                                </span>
                                <span className="text-gray-400">Click to select</span>
                              </div>

                              {matchingStockSerials.length === 0 ? (
                                <div className="p-3 text-center text-xs text-gray-400 dark:text-slate-500 font-medium">
                                  {availableStockSerials.length === 0
                                    ? 'No registered stock serials found for this item.'
                                    : 'No available serials match filter.'}
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                  {matchingStockSerials.map((stockSn) => {
                                    const isAlreadySelectedInBill =
                                      duplicateSerials.has(stockSn.toLowerCase()) ||
                                      items.some((it, i) => {
                                        const sList =
                                          it.serial_numbers || (it.serial_number ? [it.serial_number] : [])
                                        return sList.some(
                                          (s, idx) =>
                                            !(i === index && idx === sIdx) &&
                                            (s || '').trim().toLowerCase() === stockSn.toLowerCase()
                                        )
                                      })

                                    return (
                                      <button
                                        key={stockSn}
                                        type="button"
                                        onClick={() => {
                                          onSerialNumberChange(index, sIdx, stockSn)
                                          if (setActiveSerialSuggest) setActiveSerialSuggest(null)
                                        }}
                                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                                          isAlreadySelectedInBill
                                            ? 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60'
                                            : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-800 dark:text-slate-200'
                                        }`}
                                      >
                                        <span className="font-bold flex items-center gap-1.5 truncate">
                                          <Hash size={12} className="text-gray-400" />
                                          {stockSn}
                                        </span>
                                        <span
                                          className={`text-[9px] px-1.5 py-0.5 font-bold uppercase rounded-none border ${
                                            isAlreadySelectedInBill
                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300'
                                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                                          }`}
                                        >
                                          {isAlreadySelectedInBill ? 'Used in Bill' : 'Available'}
                                        </span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Status label under input */}
                          {trimmed && (
                            <div className="text-[10px] font-medium px-1 flex items-center gap-1">
                              {isDuplicate ? (
                                <span className="text-red-600 dark:text-red-400 font-bold">Duplicate in bill</span>
                              ) : isNotFound ? (
                                <span className="text-red-600 dark:text-red-400 font-bold">Not in registered stock</span>
                              ) : isSoldOrUnavailable ? (
                                <span className="text-red-600 dark:text-red-400 font-bold">
                                  Already {dbStatus.status} (Cannot bill)
                                </span>
                              ) : isVerified ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Verified (In Stock)
                                </span>
                              ) : (
                                <span className="text-gray-400">Verifying...</span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    }
                  )}
                </div>
              </div>
            )}

            {/* Row 3: Rate, Tax, Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-slate-800 items-end">
              {/* Rate (Base Price - Non-editable from material) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200">
                      {item.has_discount ? 'Discounted Rate (₹)' : 'Rate (₹)'}
                    </label>
                    {item.material_id && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-none border ${
                        item.tax_inclusive 
                          ? 'bg-blue-50 text-[#043486] dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900' 
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                      }`}>
                        {item.tax_inclusive ? 'Tax Inclusive' : 'Tax Exclusive (+18%)'}
                      </span>
                    )}
                    {item.has_discount && (
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono font-medium">
                        (Orig:{' '}
                        <span className="line-through text-gray-400">
                          ₹{Number(item.original_rate || item.rate || 0).toFixed(2)}
                        </span>{' '}
                        -₹{Number(item.discount_amount || 0).toFixed(2)})
                      </span>
                    )}
                  </div>
                  {item.has_discount && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {item.discount_percent}% OFF
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={Number(item.rate || 0).toFixed(2)}
                    readOnly
                    className="w-full px-3 py-2.5 text-xs font-semibold text-right font-mono text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-none cursor-not-allowed select-none focus:outline-none h-[41px]"
                  />
                </div>
              </div>

              {/* Tax % */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Tax ({item.tax_rate}%)
                </label>
                <div className="px-3 py-2.5 text-xs bg-gray-100 dark:bg-slate-800 rounded-none border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-mono font-medium flex items-center justify-end h-[41px]">
                  ₹ {Number(item.tax_amount || 0).toFixed(2)}
                </div>
              </div>

              {/* Total Line Amount */}
              <div>
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  Amount (₹)
                </label>
                <div className="px-3 py-2.5 text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-center justify-end h-[41px]">
                  ₹ {Number(item.amount || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
