import React from 'react'
import { Hash, Edit2, Save, Calendar, RotateCcw } from '../../common/icons'
import { SettingSectionCard } from '../../ui'

const MONTH_MAP = {
  'JAN': '01', 'JANUARY': '01',
  'FEB': '02', 'FEBRUARY': '02',
  'MAR': '03', 'MARCH': '03',
  'APR': '04', 'APRIL': '04',
  'MAY': '05',
  'JUN': '06', 'JUNE': '06',
  'JUL': '07', 'JULY': '07',
  'AUG': '08', 'AUGUST': '08',
  'SEP': '09', 'SEPTEMBER': '09',
  'OCT': '10', 'OCTOBER': '10',
  'NOV': '11', 'NOVEMBER': '11',
  'DEC': '12', 'DECEMBER': '12'
}

function formatMonthValue(month) {
  const now = new Date()
  const autoMonth = String(now.getMonth() + 1).padStart(2, '0')
  if (!month || !month.trim() || month.trim().toUpperCase() === 'AUTO') {
    return autoMonth
  }
  const clean = month.trim().toUpperCase()
  if (MONTH_MAP[clean]) {
    return MONTH_MAP[clean]
  }
  const num = parseInt(clean, 10)
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return String(num).padStart(2, '0')
  }
  return clean
}

function getDynamicPreview(prefix, sep, month, fy, startNum, padding) {
  const activeMonth = formatMonthValue(month)
  const now = new Date()
  const currentYear = now.getFullYear()
  const autoFy = (now.getMonth() >= 3)
    ? `${currentYear}-${String(currentYear + 1).slice(-2)}`
    : `${currentYear - 1}-${String(currentYear).slice(-2)}`
  const activeFy = (fy && fy.trim() && fy.trim().toUpperCase() !== 'AUTO') ? fy.trim() : autoFy
  const cleanPrefix = (prefix || 'SIS').replace(/[-/.]+$/, '')
  const separator = sep || '/'
  const padded = String(parseInt(startNum, 10) || 1).padStart(parseInt(padding, 10) || 4, '0')
  return `${cleanPrefix}${separator}${activeMonth}${separator}${activeFy}${separator}${padded}`
}

export default function NumberingSchemesSection({
  canEdit,
  isEditing,
  onToggleEdit,
  onSave,
  onCancel,
  isSaving,
  invoicePrefix,
  setInvoicePrefix,
  invoiceMonth,
  setInvoiceMonth,
  invoiceFinancialYear,
  setInvoiceFinancialYear,
  invoiceStartingNumber,
  setInvoiceStartingNumber,
  invoicePaddingDigits,
  invoiceSeparator,
  setInvoiceSeparator,
  dueDateDays,
  setDueDateDays,
  receiptPrefix,
  setReceiptPrefix,
  receiptMonth,
  setReceiptMonth,
  receiptFinancialYear,
  setReceiptFinancialYear,
  receiptStartingNumber,
  setReceiptStartingNumber,
  receiptPaddingDigits,
  receiptSeparator,
  setReceiptSeparator,
  servicePrefix,
  setServicePrefix,
  serviceMonth,
  setServiceMonth,
  serviceFinancialYear,
  setServiceFinancialYear,
  serviceStartingNumber,
  setServiceStartingNumber,
  servicePaddingDigits,
  serviceSeparator,
  setServiceSeparator,
  returnPrefix,
  setReturnPrefix,
  returnMonth,
  setReturnMonth,
  returnFinancialYear,
  setReturnFinancialYear,
  returnStartingNumber,
  setReturnStartingNumber,
  returnPaddingDigits,
  returnSeparator,
  setReturnSeparator,
  creditNotePrefix,
  setCreditNotePrefix,
  creditNoteMonth,
  setCreditNoteMonth,
  creditNoteFinancialYear,
  setCreditNoteFinancialYear,
  creditNoteStartingNumber,
  setCreditNoteStartingNumber,
  creditNotePaddingDigits,
  creditNoteSeparator,
  setCreditNoteSeparator,
  quotationPrefix,
  setQuotationPrefix,
  quotationMonth,
  setQuotationMonth,
  quotationFinancialYear,
  setQuotationFinancialYear,
  quotationStartingNumber,
  setQuotationStartingNumber,
  quotationPaddingDigits,
  quotationSeparator,
  setQuotationSeparator,
  quotationValidityDays,
  setQuotationValidityDays
}) {
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')

  return (
    <SettingSectionCard
      icon={Hash}
      title="Bill, Receipt & Service Numbering Settings"
      subtitle="Customize prefixes, financial year formats, auto-increment sequences, and delimiter styles."
      actions={
        canEdit && (
          !isEditing ? (
            <button
              type="button"
              onClick={() => onToggleEdit(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit2 size={13} />
              <span>Edit Numbering</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-none cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] disabled:opacity-50 rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save size={13} />
                <span>{isSaving ? 'Saving...' : 'Save Numbering'}</span>
              </button>
            </div>
          )
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- CARD 1: TAX INVOICE NUMBERING CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
              Tax Invoice Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Prefix *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={invoicePrefix}
                maxLength={10}
                onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                placeholder="Prefix"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Month (Auto)
                </label>
                {isEditing && invoiceMonth && invoiceMonth.toUpperCase() !== 'AUTO' && (
                  <button
                    type="button"
                    onClick={() => setInvoiceMonth('AUTO')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset to automatic current month roll-over"
                  >
                    <RotateCcw size={10} />
                    <span>Auto ({currentMonth})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? (invoiceMonth && invoiceMonth.toUpperCase() !== 'AUTO' ? invoiceMonth : (invoiceMonth === 'AUTO' ? '' : (invoiceMonth || '')))
                      : ((invoiceMonth && invoiceMonth.toUpperCase() !== 'AUTO') ? invoiceMonth : currentMonth)
                  }
                  maxLength={10}
                  onChange={(e) => setInvoiceMonth(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder={currentMonth}
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-[#043486] dark:text-blue-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={invoiceFinancialYear}
                  maxLength={9}
                  onChange={(e) => setInvoiceFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 9))}
                  placeholder="2026-27"
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Starting Number *
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setInvoiceStartingNumber('1')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset starting number to 1"
                  >
                    <RotateCcw size={10} />
                    <span>Set to 1</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={invoiceStartingNumber}
                onChange={(e) => setInvoiceStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Start no"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Separator / Delimiter
              </label>
              <select
                disabled={!isEditing}
                value={invoiceSeparator}
                onChange={(e) => setInvoiceSeparator(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              >
                <option value="/">Slash ( / )</option>
                <option value="-">Hyphen ( - )</option>
                <option value=".">Dot ( . )</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Default Due Period (Days) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="365"
                  disabled={!isEditing}
                  value={dueDateDays}
                  onChange={(e) => setDueDateDays(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="Due days"
                  className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  Days
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Invoice Preview:
            </span>
            <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
              <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-[#043486] flex items-center justify-between">
                <span className="truncate">{invoicePrefix ? getDynamicPreview(invoicePrefix, invoiceSeparator, invoiceMonth, invoiceFinancialYear, invoiceStartingNumber, invoicePaddingDigits) : '—'}</span>
                <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Bill)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 2: PAYMENT RECEIPT NUMBERING CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
              Receipt Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Prefix *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={receiptPrefix}
                maxLength={10}
                onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                placeholder="Prefix"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Month (Auto)
                </label>
                {isEditing && receiptMonth && receiptMonth.toUpperCase() !== 'AUTO' && (
                  <button
                    type="button"
                    onClick={() => setReceiptMonth('AUTO')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset to automatic current month roll-over"
                  >
                    <RotateCcw size={10} />
                    <span>Auto ({currentMonth})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? (receiptMonth && receiptMonth.toUpperCase() !== 'AUTO' ? receiptMonth : (receiptMonth === 'AUTO' ? '' : (receiptMonth || '')))
                      : ((receiptMonth && receiptMonth.toUpperCase() !== 'AUTO') ? receiptMonth : currentMonth)
                  }
                  maxLength={10}
                  onChange={(e) => setReceiptMonth(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder={currentMonth}
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-[#043486] dark:text-blue-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={receiptFinancialYear}
                  maxLength={9}
                  onChange={(e) => setReceiptFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 9))}
                  placeholder="2026-27"
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Starting Number *
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setReceiptStartingNumber('1')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset starting number to 1"
                  >
                    <RotateCcw size={10} />
                    <span>Set to 1</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={receiptStartingNumber}
                onChange={(e) => setReceiptStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Start no"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Separator / Delimiter
              </label>
              <select
                disabled={!isEditing}
                value={receiptSeparator}
                onChange={(e) => setReceiptSeparator(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              >
                <option value="/">Slash ( / )</option>
                <option value="-">Hyphen ( - )</option>
                <option value=".">Dot ( . )</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Receipt Preview:
            </span>
            <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
              <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-teal-600 flex items-center justify-between">
                <span className="truncate">{receiptPrefix ? getDynamicPreview(receiptPrefix, receiptSeparator, receiptMonth, receiptFinancialYear, receiptStartingNumber, receiptPaddingDigits) : '—'}</span>
                <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Rec)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 3: SERVICE TICKET CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
              Service Ticket Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Prefix *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={servicePrefix}
                maxLength={10}
                onChange={(e) => setServicePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                placeholder="Prefix"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Month (Auto)
                </label>
                {isEditing && serviceMonth && serviceMonth.toUpperCase() !== 'AUTO' && (
                  <button
                    type="button"
                    onClick={() => setServiceMonth('AUTO')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset to automatic current month roll-over"
                  >
                    <RotateCcw size={10} />
                    <span>Auto ({currentMonth})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? (serviceMonth && serviceMonth.toUpperCase() !== 'AUTO' ? serviceMonth : (serviceMonth === 'AUTO' ? '' : (serviceMonth || '')))
                      : ((serviceMonth && serviceMonth.toUpperCase() !== 'AUTO') ? serviceMonth : currentMonth)
                  }
                  maxLength={10}
                  onChange={(e) => setServiceMonth(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder={currentMonth}
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-[#043486] dark:text-blue-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={serviceFinancialYear}
                  maxLength={9}
                  onChange={(e) => setServiceFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 9))}
                  placeholder="2026-27"
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Starting Number *
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setServiceStartingNumber('1')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset starting number to 1"
                  >
                    <RotateCcw size={10} />
                    <span>Set to 1</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={serviceStartingNumber}
                onChange={(e) => setServiceStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Start no"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Separator / Delimiter
              </label>
              <select
                disabled={!isEditing}
                value={serviceSeparator}
                onChange={(e) => setServiceSeparator(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              >
                <option value="/">Slash ( / )</option>
                <option value="-">Hyphen ( - )</option>
                <option value=".">Dot ( . )</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Service Ticket Preview:
            </span>
            <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
              <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-indigo-500 flex items-center justify-between">
                <span className="truncate">{servicePrefix ? getDynamicPreview(servicePrefix, serviceSeparator, serviceMonth, serviceFinancialYear, serviceStartingNumber, servicePaddingDigits) : '—'}</span>
                <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Ticket)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 4: PRODUCT RETURN NUMBERING CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
              Product Return Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Return Prefix *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={returnPrefix}
                maxLength={10}
                onChange={(e) => setReturnPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                placeholder="Prefix"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Month (Auto)
                </label>
                {isEditing && returnMonth && returnMonth.toUpperCase() !== 'AUTO' && (
                  <button
                    type="button"
                    onClick={() => setReturnMonth('AUTO')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset to automatic current month roll-over"
                  >
                    <RotateCcw size={10} />
                    <span>Auto ({currentMonth})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? (returnMonth && returnMonth.toUpperCase() !== 'AUTO' ? returnMonth : (returnMonth === 'AUTO' ? '' : (returnMonth || '')))
                      : ((returnMonth && returnMonth.toUpperCase() !== 'AUTO') ? returnMonth : currentMonth)
                  }
                  maxLength={10}
                  onChange={(e) => setReturnMonth(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder={currentMonth}
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-[#043486] dark:text-blue-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={returnFinancialYear}
                  maxLength={9}
                  onChange={(e) => setReturnFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 9))}
                  placeholder="2026-27"
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Starting Number *
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setReturnStartingNumber('1')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset starting number to 1"
                  >
                    <RotateCcw size={10} />
                    <span>Set to 1</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={returnStartingNumber}
                onChange={(e) => setReturnStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Start no"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Separator / Delimiter
              </label>
              <select
                disabled={!isEditing}
                value={returnSeparator}
                onChange={(e) => setReturnSeparator(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              >
                <option value="/">Slash ( / )</option>
                <option value="-">Hyphen ( - )</option>
                <option value=".">Dot ( . )</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Return Voucher Preview:
            </span>
            <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
              <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-amber-500 flex items-center justify-between">
                <span className="truncate">{returnPrefix ? getDynamicPreview(returnPrefix, returnSeparator, returnMonth, returnFinancialYear, returnStartingNumber, returnPaddingDigits) : '—'}</span>
                <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Return)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 5: CREDIT NOTE NUMBERING CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
              Credit Note Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Credit Note Prefix *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={creditNotePrefix}
                maxLength={10}
                onChange={(e) => setCreditNotePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                placeholder="Prefix"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Month (Auto)
                </label>
                {isEditing && creditNoteMonth && creditNoteMonth.toUpperCase() !== 'AUTO' && (
                  <button
                    type="button"
                    onClick={() => setCreditNoteMonth('AUTO')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset to automatic current month roll-over"
                  >
                    <RotateCcw size={10} />
                    <span>Auto ({currentMonth})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? (creditNoteMonth && creditNoteMonth.toUpperCase() !== 'AUTO' ? creditNoteMonth : (creditNoteMonth === 'AUTO' ? '' : (creditNoteMonth || '')))
                      : ((creditNoteMonth && creditNoteMonth.toUpperCase() !== 'AUTO') ? creditNoteMonth : currentMonth)
                  }
                  maxLength={10}
                  onChange={(e) => setCreditNoteMonth(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder={currentMonth}
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-[#043486] dark:text-blue-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={creditNoteFinancialYear}
                  maxLength={9}
                  onChange={(e) => setCreditNoteFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 9))}
                  placeholder="2026-27"
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Starting Number *
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setCreditNoteStartingNumber('1')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset starting number to 1"
                  >
                    <RotateCcw size={10} />
                    <span>Set to 1</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={creditNoteStartingNumber}
                onChange={(e) => setCreditNoteStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Start no"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Separator / Delimiter
              </label>
              <select
                disabled={!isEditing}
                value={creditNoteSeparator}
                onChange={(e) => setCreditNoteSeparator(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              >
                <option value="/">Slash ( / )</option>
                <option value="-">Hyphen ( - )</option>
                <option value=".">Dot ( . )</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Credit Note Preview:
            </span>
            <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
              <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-emerald-500 flex items-center justify-between">
                <span className="truncate">{creditNotePrefix ? getDynamicPreview(creditNotePrefix, creditNoteSeparator, creditNoteMonth, creditNoteFinancialYear, creditNoteStartingNumber, creditNotePaddingDigits) : '—'}</span>
                <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st CN)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 6: QUOTATION NUMBERING CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
              Quotation &amp; Estimate Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Quotation Prefix *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={quotationPrefix}
                maxLength={10}
                onChange={(e) => setQuotationPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                placeholder="Prefix"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Month (Auto)
                </label>
                {isEditing && quotationMonth && quotationMonth.toUpperCase() !== 'AUTO' && (
                  <button
                    type="button"
                    onClick={() => setQuotationMonth('AUTO')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset to automatic current month roll-over"
                  >
                    <RotateCcw size={10} />
                    <span>Auto ({currentMonth})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={
                    isEditing
                      ? (quotationMonth && quotationMonth.toUpperCase() !== 'AUTO' ? quotationMonth : (quotationMonth === 'AUTO' ? '' : (quotationMonth || '')))
                      : ((quotationMonth && quotationMonth.toUpperCase() !== 'AUTO') ? quotationMonth : currentMonth)
                  }
                  maxLength={10}
                  onChange={(e) => setQuotationMonth(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder={currentMonth}
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-[#043486] dark:text-blue-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={quotationFinancialYear}
                  maxLength={9}
                  onChange={(e) => setQuotationFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 9))}
                  placeholder="2026-27"
                  className={`w-full px-3 py-2 pr-8 text-xs font-mono font-bold rounded-none transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Starting Number *
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setQuotationStartingNumber('1')}
                    className="text-[10px] font-semibold text-[#043486] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Reset starting number to 1"
                  >
                    <RotateCcw size={10} />
                    <span>Set to 1</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={quotationStartingNumber}
                onChange={(e) => setQuotationStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Start no"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Separator / Delimiter
              </label>
              <select
                disabled={!isEditing}
                value={quotationSeparator}
                onChange={(e) => setQuotationSeparator(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              >
                <option value="/">Slash ( / )</option>
                <option value="-">Hyphen ( - )</option>
                <option value=".">Dot ( . )</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Default Validity (Days) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="365"
                  disabled={!isEditing}
                  value={quotationValidityDays}
                  onChange={(e) => setQuotationValidityDays(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="Validity days"
                  className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  Days
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Quotation Preview:
            </span>
            <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
              <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-sky-500 flex items-center justify-between">
                <span className="truncate">{quotationPrefix ? getDynamicPreview(quotationPrefix, quotationSeparator, quotationMonth, quotationFinancialYear, quotationStartingNumber, quotationPaddingDigits) : '—'}</span>
                <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Qtn)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </SettingSectionCard>
  )
}
