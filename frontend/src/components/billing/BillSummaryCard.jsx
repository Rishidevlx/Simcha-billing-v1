import React from 'react'
import { IndianRupee, Save, RotateCcw, ArrowLeft } from 'lucide-react'
import { Button } from '../ui'

/**
 * Reusable Bill Summary Card Engine across Outward Invoices, Services, and Inwards
 */
export default function BillSummaryCard({
  title = 'Invoice Summary',
  billNumber = '',
  // Optional Line items breakdown (used for Inward or custom list)
  itemsBreakdown = null,
  totalItemsCount = null,
  totalQuantity = null,
  // Pricing breakdown
  totalGrossOrigAmt = 0,
  totalDiscountSavings = 0,
  taxableAmount = 0,
  isIntraState = true,
  cgstRate = 9,
  cgstAmount = 0,
  sgstRate = 9,
  sgstAmount = 0,
  igstRate = 18,
  igstAmount = 0,
  totalTax = 0,
  roundOff = 0,
  grandTotal = 0,
  amountInWords = '',
  // Bank details
  bankDetails = null,
  // Save & Reset States
  isSaving = false,
  isEditMode = false,
  saveButtonText = null,
  cancelButtonText = 'Cancel & Back to List',
  resetButtonText = 'Reset Form (Alt+R)',
  onSave,
  onReset,
  onCancel,
  // Extra slot below summary or action buttons
  children
}) {
  const displaySaveText = saveButtonText || (isEditMode ? 'Update (Ctrl+Enter)' : 'Save (Ctrl+Enter)')

  return (
    <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
        <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
          <IndianRupee size={16} />
          <span>{title}</span>
        </h2>
        {billNumber && (
          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-mono font-bold">
            {billNumber}
          </span>
        )}
      </div>

      <div className="space-y-3 text-sm">
        {/* Optional Items Breakdown list (e.g. Inward page) */}
        {itemsBreakdown && (
          <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-none border border-gray-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-1 border-b border-gray-200 dark:border-slate-800">
              <span>Item &amp; Rate</span>
              <span>Total Amount</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {itemsBreakdown.map((it, idx) => {
                const hasName = it.item_name && it.item_name.trim() !== ''
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-slate-900 last:border-0">
                    <div className="truncate pr-2">
                      <span className="font-semibold text-gray-800 dark:text-slate-200">
                        {hasName ? it.item_name : `Item #${idx + 1}`}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 ml-1">
                        ({it.quantity} {it.unit || 'NOS'} @ ₹{Number(it.rate || 0).toFixed(2)})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-gray-900 dark:text-white shrink-0">
                      ₹ {Number(it.amount || 0).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>

            {totalItemsCount !== null && (
              <div className="pt-2 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-slate-400">Total Items:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-slate-200">
                  {totalItemsCount} {totalQuantity !== null ? `(${totalQuantity} Units)` : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Gross Amount & Discount Savings */}
        {totalDiscountSavings > 0 && (
          <>
            <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
              <span>Gross Amount</span>
              <span className="font-mono text-gray-800 dark:text-slate-200">
                ₹ {Number(totalGrossOrigAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <span>Discount Savings</span>
              <span className="font-mono">
                - ₹ {Number(totalDiscountSavings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}

        {/* Taxable Amount */}
        <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
          <span>Taxable Amount</span>
          <span className="font-medium font-mono text-gray-900 dark:text-white">
            ₹ {Number(taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Tax Breakdown */}
        {isIntraState ? (
          <>
            <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
              <span>CGST ({cgstRate}%)</span>
              <span className="font-mono text-gray-800 dark:text-slate-200">
                ₹ {Number(cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
              <span>SGST ({sgstRate}%)</span>
              <span className="font-mono text-gray-800 dark:text-slate-200">
                ₹ {Number(sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
            <span>IGST ({igstRate}%)</span>
            <span className="font-mono text-gray-800 dark:text-slate-200">
              ₹ {Number(igstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Total Tax */}
        <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
          <span>Total Tax</span>
          <span className="font-medium font-mono text-blue-900 dark:text-blue-300">
            ₹ {Number(totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Round Off */}
        {roundOff !== 0 && (
          <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs">
            <span>Round Off</span>
            <span className="font-mono">
              {roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}
            </span>
          </div>
        )}

        {/* Grand Total */}
        <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm font-bold text-[#292424] dark:text-white">Grand Total</span>
          <span className="text-2xl font-black text-[#043486] dark:text-blue-400 font-mono">
            ₹ {Number(grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Amount in words */}
        {amountInWords && (
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-none">
            <span className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Amount in Words
            </span>
            <p className="text-xs font-semibold text-[#043486] dark:text-blue-300 mt-0.5 capitalize leading-relaxed">
              {amountInWords}
            </p>
          </div>
        )}

        {/* Bank details summary pill */}
        {bankDetails && (
          <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-none border border-gray-200 dark:border-slate-800 text-[11px] text-gray-600 dark:text-slate-400 space-y-0.5">
            <p className="font-semibold text-gray-800 dark:text-slate-200">
              Bank: {bankDetails.bank_name} ({bankDetails.branch || 'Main'})
            </p>
            <p>
              A/C: <span className="font-mono text-gray-900 dark:text-white font-bold">{bankDetails.account_no}</span> | IFSC:{' '}
              <span className="font-mono text-gray-900 dark:text-white font-bold">{bankDetails.ifsc_code}</span>
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
        {onSave && (
          <Button
            type={onSave ? 'button' : 'submit'}
            variant="primary"
            icon={Save}
            isLoading={isSaving}
            disabled={isSaving}
            onClick={onSave}
            className="w-full py-3 text-sm"
          >
            {displaySaveText}
          </Button>
        )}

        {isEditMode && onCancel ? (
          <Button
            type="button"
            variant="secondary"
            icon={ArrowLeft}
            onClick={onCancel}
            className="w-full py-2 text-xs font-medium"
          >
            {cancelButtonText}
          </Button>
        ) : onReset ? (
          <Button
            type="button"
            variant="secondary"
            icon={RotateCcw}
            onClick={onReset}
            className="w-full py-2 text-xs font-medium"
          >
            {resetButtonText}
          </Button>
        ) : null}
      </div>

      {/* Extra slots */}
      {children}
    </div>
  )
}
