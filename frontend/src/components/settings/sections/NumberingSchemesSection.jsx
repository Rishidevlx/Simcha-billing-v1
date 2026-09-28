import React from 'react'
import { Hash } from 'lucide-react'
import { SettingSectionCard } from '../../ui'

export default function NumberingSchemesSection({
  isEditing,
  invoicePrefix,
  setInvoicePrefix,
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
  receiptFinancialYear,
  setReceiptFinancialYear,
  receiptStartingNumber,
  setReceiptStartingNumber,
  receiptPaddingDigits,
  receiptSeparator,
  setReceiptSeparator,
  servicePrefix,
  setServicePrefix,
  serviceFinancialYear,
  setServiceFinancialYear,
  serviceStartingNumber,
  setServiceStartingNumber,
  servicePaddingDigits,
  serviceSeparator,
  setServiceSeparator,
  returnPrefix,
  setReturnPrefix,
  returnFinancialYear,
  setReturnFinancialYear,
  returnStartingNumber,
  setReturnStartingNumber,
  returnPaddingDigits,
  returnSeparator,
  setReturnSeparator,
  creditNotePrefix,
  setCreditNotePrefix,
  creditNoteFinancialYear,
  setCreditNoteFinancialYear,
  creditNoteStartingNumber,
  setCreditNoteStartingNumber,
  creditNotePaddingDigits,
  creditNoteSeparator,
  setCreditNoteSeparator
}) {
  return (
    <SettingSectionCard
      icon={Hash}
      title="Bill, Receipt & Service Numbering Settings"
      subtitle="Customize prefixes, financial year formats, auto-increment sequences, and delimiter styles."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- CARD 1: TAX INVOICE NUMBERING CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800">
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
                placeholder="SIS"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={invoiceFinancialYear}
                maxLength={7}
                onChange={(e) => setInvoiceFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 7))}
                placeholder="2026-27"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Starting Number *
              </label>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={invoiceStartingNumber}
                onChange={(e) => setInvoiceStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="1"
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Default Invoice Due Date Period (Days) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="365"
                  disabled={!isEditing}
                  value={dueDateDays}
                  onChange={(e) => setDueDateDays(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="15"
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
              <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-gray-400 dark:border-slate-600 flex items-center justify-between">
                <span className="truncate">{invoicePrefix || 'SIS'}{invoiceSeparator}{invoiceFinancialYear || '2026-27'}{invoiceSeparator}{String(parseInt(invoiceStartingNumber, 10) || 1).padStart(parseInt(invoicePaddingDigits, 10) || 4, '0')}</span>
                <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Bill)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 2: PAYMENT RECEIPT NUMBERING CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800">
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
                placeholder="SIS-REC"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={receiptFinancialYear}
                maxLength={7}
                onChange={(e) => setReceiptFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 7))}
                placeholder="2026-27"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Starting Number *
              </label>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={receiptStartingNumber}
                onChange={(e) => setReceiptStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="1"
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
              <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-gray-400 dark:border-slate-600 flex items-center justify-between">
                <span className="truncate">{receiptPrefix || 'SIS-REC'}{receiptSeparator}{receiptFinancialYear || '2026-27'}{receiptSeparator}{String(parseInt(receiptStartingNumber, 10) || 1).padStart(parseInt(receiptPaddingDigits, 10) || 4, '0')}</span>
                <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Rec)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 3: SERVICE TICKET CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800">
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
                placeholder="SIS-SR"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Financial Year *
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={serviceFinancialYear}
                maxLength={7}
                onChange={(e) => setServiceFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 7))}
                placeholder="2026-27"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Starting Number *
              </label>
              <input
                type="number"
                min="1"
                max="999999"
                disabled={!isEditing}
                value={serviceStartingNumber}
                onChange={(e) => setServiceStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="1"
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
        </div>

        {/* --- CARD 4: PRODUCT RETURN / CREDIT NOTE CONFIGURATION --- */}
        <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
          <div className="pb-2 border-b border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
              Product Return &amp; Credit Note Settings
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
                placeholder="SIS-RET"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

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
                placeholder="SIS-CN"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>
          </div>
        </div>

      </div>
    </SettingSectionCard>
  )
}
