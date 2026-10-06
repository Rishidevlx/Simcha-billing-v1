import React, { useState } from 'react'
import {
  FileText,
  Edit2,
  Save,
  Trash2,
  Plus,
  Lock,
  Hash,
  Receipt,
  RotateCcw as ReturnIcon,
  RotateCcw
} from '../../common/icons'
import { SettingSectionCard, StatusPill } from '../../ui'

function TermsClauseCard({
  title,
  pillStatus,
  terms = [],
  isEditing,
  onTermChange,
  onRemoveTerm,
  onAddTerm,
  placeholder = "Type new clause and press Add...",
  helperText,
  footerContent
}) {
  const [inputVal, setInputVal] = useState('')

  const handleAdd = () => {
    if (!inputVal.trim()) return
    onAddTerm(inputVal.trim())
    setInputVal('')
  }

  return (
    <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4 font-['Poppins',sans-serif]">
      {/* Card Header */}
      <div className="pb-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
            {title}
          </h3>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500">
            ({terms.length} {terms.length === 1 ? 'Clause' : 'Clauses'})
          </span>
        </div>
        <StatusPill status={pillStatus} size="sm" />
      </div>

      {/* Clauses List */}
      <div className="space-y-2.5">
        {terms.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-gray-200 dark:border-slate-800 text-xs text-gray-400 dark:text-slate-500">
            No terms configured yet. {isEditing && 'Add your first clause below.'}
          </div>
        ) : (
          terms.map((term, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-none bg-gray-100 dark:bg-slate-800 text-[#043486] dark:text-blue-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700 font-mono">
                {index + 1}
              </span>
              <input
                type="text"
                disabled={!isEditing}
                value={term}
                onChange={(e) => onTermChange(index, e.target.value)}
                placeholder="Enter clause text..."
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-none transition-all ${
                  isEditing
                    ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                }`}
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => onRemoveTerm(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition-colors cursor-pointer shrink-0"
                  title="Remove clause"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add New Clause Bar */}
      {isEditing ? (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-1.5 text-xs text-[#292424] dark:text-white font-medium bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-[#043486] dark:text-blue-300 text-xs font-semibold rounded-none border border-blue-200 dark:border-blue-900 transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 dark:text-slate-500 pt-0.5 flex items-center gap-1.5">
          <Lock size={11} />
          <span>{helperText || 'Click edit above to add, update or remove clauses.'}</span>
        </p>
      )}

      {/* Optional Extra Footer Content */}
      {footerContent && (
        <div className="pt-3 border-t border-gray-200 dark:border-slate-800">
          {footerContent}
        </div>
      )}
    </div>
  )
}

export default function TermsConditionsSection({
  canEdit,
  editStates = {},
  onToggleEdit,
  onSave,
  onCancel,
  isSaving,
  // Quotation Terms
  quotationTerms = [],
  setQuotationTerms,
  serviceQuotationTerms = [],
  setServiceQuotationTerms,
  // Invoice Terms
  invoiceTerms = [],
  setInvoiceTerms,
  serviceTerms = [],
  setServiceTerms,
  returnDays = '',
  setReturnDays,
  returnClause = '',
  setReturnClause,
  // Receipt Terms
  receiptTerms = [],
  setReceiptTerms,
  serviceReceiptTerms = [],
  setServiceReceiptTerms,
  // Return Terms
  returnTerms = [],
  setReturnTerms
}) {
  const [activeSubTab, setActiveSubTab] = useState('quotations') // 'quotations' | 'invoices' | 'receipts' | 'returns'

  const isQuotationsEditing = !!editStates?.terms_quotations
  const isInvoicesEditing = !!editStates?.terms_invoices
  const isReceiptsEditing = !!editStates?.terms_receipts
  const isReturnsEditing = !!editStates?.terms_returns

  const subMenus = [
    {
      id: 'quotations',
      label: 'Quotation Terms',
      icon: FileText,
      title: 'Quotation Terms & Conditions',
      subtitle: 'Customize legal clauses and warranty terms printed on Outward and Service Quotation PDFs.',
      editLabel: 'Edit Quotation Terms',
      saveLabel: 'Save Quotation Terms',
      isEditing: isQuotationsEditing
    },
    {
      id: 'invoices',
      label: 'Invoice Terms',
      icon: Hash,
      title: 'Invoice Terms & Conditions',
      subtitle: 'Customize standard payment, legal, and return clauses printed on Tax Invoices and Service Tickets.',
      editLabel: 'Edit Invoice Terms',
      saveLabel: 'Save Invoice Terms',
      isEditing: isInvoicesEditing
    },
    {
      id: 'receipts',
      label: 'Receipt Terms',
      icon: Receipt,
      title: 'Receipt Terms & Conditions',
      subtitle: 'Customize acknowledgement and payment terms printed on Outward and Service Receipt vouchers.',
      editLabel: 'Edit Receipt Terms',
      saveLabel: 'Save Receipt Terms',
      isEditing: isReceiptsEditing
    },
    {
      id: 'returns',
      label: 'Return Terms',
      icon: ReturnIcon,
      title: 'Return Terms & Conditions',
      subtitle: 'Customize customer return eligibility and QC policy terms printed on Product Return documents.',
      editLabel: 'Edit Return Terms',
      saveLabel: 'Save Return Terms',
      isEditing: isReturnsEditing
    }
  ]

  const currentMenu = subMenus.find(m => m.id === activeSubTab) || subMenus[0]

  // Handlers for dynamic list edits
  const updateListTerm = (setter) => (index, val) => {
    setter(prev => {
      const copy = [...prev]
      copy[index] = val
      return copy
    })
  }

  const removeListTerm = (setter) => (index) => {
    setter(prev => prev.filter((_, i) => i !== index))
  }

  const addListTerm = (setter) => (newTerm) => {
    if (!newTerm.trim()) return
    setter(prev => [...prev, newTerm.trim()])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-['Poppins',sans-serif]">
      
      {/* ================= LEFT STANDALONE SIDEBAR MENU ================= */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-2 shadow-xs space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800/80 mb-1">
          Terms Modules
        </div>
        {subMenus.map((menu) => {
          const Icon = menu.icon
          const isActive = activeSubTab === menu.id
          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => setActiveSubTab(menu.id)}
              className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold rounded-none transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#043486] text-white font-bold shadow-xs'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100/70 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'text-white' : 'text-[#043486] dark:text-blue-400'} />
                <span>{menu.label}</span>
              </div>
              {menu.isEditing && (
                <span className={`text-[10px] px-1.5 py-0.5 font-bold uppercase ${
                  isActive
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}>
                  Editing
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ================= RIGHT MAIN CONTENT ================= */}
      <div className="lg:col-span-9">
        <SettingSectionCard
          icon={currentMenu.icon}
          title={currentMenu.title}
          subtitle={currentMenu.subtitle}
          actions={
            canEdit && (
              !currentMenu.isEditing ? (
                <button
                  type="button"
                  onClick={() => onToggleEdit(activeSubTab, true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>{currentMenu.editLabel}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCancel(activeSubTab)}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-none cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onSave(activeSubTab)}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] disabled:opacity-50 rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save size={13} />
                    <span>{isSaving ? 'Saving...' : currentMenu.saveLabel}</span>
                  </button>
                </div>
              )
            )
          }
        >
          <div className="space-y-6">

            {/* ---------------- 1. QUOTATION TERMS ---------------- */}
            {activeSubTab === 'quotations' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Outward Sales Quotation Terms */}
                <TermsClauseCard
                  title="Outward Quotation Terms"
                  pillStatus="Sales Quotation"
                  terms={quotationTerms}
                  isEditing={isQuotationsEditing}
                  onTermChange={updateListTerm(setQuotationTerms)}
                  onRemoveTerm={removeListTerm(setQuotationTerms)}
                  onAddTerm={addListTerm(setQuotationTerms)}
                  placeholder="e.g. Quotation valid for 15 days from issue date..."
                />

                {/* Service Estimation Terms */}
                <TermsClauseCard
                  title="Service Estimation Terms"
                  pillStatus="Service Estimation"
                  terms={serviceQuotationTerms}
                  isEditing={isQuotationsEditing}
                  onTermChange={updateListTerm(setServiceQuotationTerms)}
                  onRemoveTerm={removeListTerm(setServiceQuotationTerms)}
                  onAddTerm={addListTerm(setServiceQuotationTerms)}
                  placeholder="e.g. Estimate valid for 7 days. Diagnosis fee applies..."
                />
              </div>
            )}

            {/* ---------------- 2. INVOICE TERMS ---------------- */}
            {activeSubTab === 'invoices' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Outward Tax Invoice Terms */}
                <TermsClauseCard
                  title="Tax Invoice Terms"
                  pillStatus="Outward Sales"
                  terms={invoiceTerms}
                  isEditing={isInvoicesEditing}
                  onTermChange={updateListTerm(setInvoiceTerms)}
                  onRemoveTerm={removeListTerm(setInvoiceTerms)}
                  onAddTerm={addListTerm(setInvoiceTerms)}
                  placeholder="e.g. Goods once sold will not be taken back without bill..."
                  footerContent={
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <RotateCcw size={13} className="text-[#043486] dark:text-blue-400" />
                        <h4 className="text-[11px] font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                          Return Policy &amp; Window Clause
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Window (Days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="90"
                            disabled={!isInvoicesEditing}
                            value={returnDays}
                            onChange={(e) => setReturnDays(e.target.value)}
                            placeholder="7"
                            className={`w-full px-2.5 py-1.5 text-xs font-bold font-mono rounded-none transition-all ${
                              isInvoicesEditing
                                ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                                : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                            }`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Custom Return Clause (Optional)
                          </label>
                          <input
                            type="text"
                            disabled={!isInvoicesEditing}
                            value={returnClause}
                            onChange={(e) => setReturnClause(e.target.value)}
                            placeholder="e.g. Eligible for 7 days return policy..."
                            className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-none transition-all ${
                              isInvoicesEditing
                                ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                                : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  }
                />

                {/* Service Ticket Terms */}
                <TermsClauseCard
                  title="Service Ticket Terms"
                  pillStatus="Service Ticket"
                  terms={serviceTerms}
                  isEditing={isInvoicesEditing}
                  onTermChange={updateListTerm(setServiceTerms)}
                  onRemoveTerm={removeListTerm(setServiceTerms)}
                  onAddTerm={addListTerm(setServiceTerms)}
                  placeholder="e.g. Delivery strictly against original service ticket..."
                />
              </div>
            )}

            {/* ---------------- 3. RECEIPT TERMS ---------------- */}
            {activeSubTab === 'receipts' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Outward Receipt Terms */}
                <TermsClauseCard
                  title="Outward Receipt Terms"
                  pillStatus="Sales Receipt"
                  terms={receiptTerms}
                  isEditing={isReceiptsEditing}
                  onTermChange={updateListTerm(setReceiptTerms)}
                  onRemoveTerm={removeListTerm(setReceiptTerms)}
                  onAddTerm={addListTerm(setReceiptTerms)}
                  placeholder="e.g. Payment received subject to realization of cheque..."
                />

                {/* Service Receipt Terms */}
                <TermsClauseCard
                  title="Service Receipt Terms"
                  pillStatus="Service Receipt"
                  terms={serviceReceiptTerms}
                  isEditing={isReceiptsEditing}
                  onTermChange={updateListTerm(setServiceReceiptTerms)}
                  onRemoveTerm={removeListTerm(setServiceReceiptTerms)}
                  onAddTerm={addListTerm(setServiceReceiptTerms)}
                  placeholder="e.g. Payment received for service charges. Retain for warranty..."
                />
              </div>
            )}

            {/* ---------------- 4. RETURN TERMS (No Credit Note) ---------------- */}
            {activeSubTab === 'returns' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Product Return Terms */}
                <TermsClauseCard
                  title="Product Return Terms"
                  pillStatus="Against Invoice"
                  terms={returnTerms}
                  isEditing={isReturnsEditing}
                  onTermChange={updateListTerm(setReturnTerms)}
                  onRemoveTerm={removeListTerm(setReturnTerms)}
                  onAddTerm={addListTerm(setReturnTerms)}
                  placeholder="e.g. Returned items must include original box & packaging..."
                />
              </div>
            )}

          </div>
        </SettingSectionCard>
      </div>

    </div>
  )
}
