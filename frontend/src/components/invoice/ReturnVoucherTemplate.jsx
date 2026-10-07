import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useSettings } from '../../context/SettingsContext'
import {
  TemplatePageShell,
  TemplateHeader,
  TemplateMetaBar,
  TemplateFooterRibbon
} from './shared'

// Number to Words converter helper
function numberToWords(num) {
  if (!num || isNaN(num)) return ''
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const inWords = (n) => {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '')
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '')
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '')
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '')
  }

  const parts = Number(num).toFixed(2).split('.')
  const rupees = parseInt(parts[0], 10)
  const paise = parseInt(parts[1], 10)

  let result = inWords(rupees) + ' Rupees'
  if (paise > 0) {
    result += ' and ' + inWords(paise) + ' Paise'
  }
  return result + ' Only'
}

export default function ReturnVoucherTemplate({ returnItem, settings, company }) {
  if (!returnItem) return null

  // 1. Snapshot Pattern for Past Return Vouchers Immutability (Legal Audit Rule)
  let snapshot = returnItem?.company_snapshot || null
  if (typeof snapshot === 'string') {
    try { snapshot = JSON.parse(snapshot) } catch { snapshot = null }
  }

  // 2. Live DB Context fallback for New Returns & UI Rendering
  const {
    settings: liveSettings,
    companyDetails: liveCompany,
    signatureUrl: liveSignUrl
  } = useSettings()

  const effectiveSettings = snapshot || settings || company || liveSettings || {}
  const effectiveCompany = snapshot || company || liveCompany || {}

  // Dynamic Company Settings with fallbacks from Theme/System Settings
  const companyName = effectiveCompany?.company_name || effectiveCompany?.name || ''
  const companyGstin = effectiveCompany?.gstin || ''
  const companyPhone = effectiveCompany?.phone || ''
  const companyEmail = effectiveCompany?.email || ''
  const companyAddress = effectiveCompany?.address || ''
  const signatureUrl = effectiveSettings?.signature_url || effectiveSettings?.signatureUrl || returnItem?.signature_url || liveSignUrl || null

  const isCreditNote = returnItem.qc_decision === 'REFUND' || (returnItem.resolution_ref && returnItem.resolution_ref.includes('CN'))
  const isReplacement = returnItem.qc_decision === 'REPLACE'
  const documentTitle = isCreditNote ? 'CREDIT NOTE' : (isReplacement ? 'REPLACEMENT VOUCHER' : 'RETURN VOUCHER')
  const documentNumber = returnItem.resolution_ref || returnItem.return_number

  const isPassed = returnItem.qc_condition === 'PASS' || returnItem.qc_condition === 'Good'
  const isDefective = !isPassed && returnItem.qc_status !== 'Pending QC'

  // Format date helper (e.g. 22 Sept 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Format clean integer/decimal quantity
  const formatQty = (qty) => {
    const num = parseFloat(qty) || 0
    return num % 1 === 0 ? parseInt(num, 10) : num
  }

  const returnQty = parseFloat(returnItem.quantity) || 1
  const unitRate = parseFloat(returnItem.unit_price || returnItem.rate || 0)
  const grandTotal = parseFloat(returnItem.refund_amount || returnItem.total_amount || (unitRate * returnQty)) || 0
  const amountInWords = numberToWords(grandTotal)

  const defaultReturnTerms = (Array.isArray(snapshot?.return_terms) && snapshot.return_terms.length > 0)
    ? snapshot.return_terms
    : (Array.isArray(effectiveSettings?.return_terms) && effectiveSettings.return_terms.length > 0)
    ? effectiveSettings.return_terms
    : (Array.isArray(effectiveSettings?.terms_conditions) && effectiveSettings.terms_conditions.length > 0)
    ? effectiveSettings.terms_conditions
    : [
      'Returns must be requested within the eligible return window from invoice date.',
      'Items must be returned with original box, accessories, and packaging intact.',
      'Defective items are subject to QC verification before replacement or credit note issuance.'
    ]

  return (
    <div id="return-slip-printable-area" className="w-full">
      <TemplatePageShell pageIndex={1} totalPages={1}>
        {/* Main Content Area: Natural sequential flow so Terms & Conditions sit directly below QC Card */}
        <div className="relative z-10 px-7 pt-6 pb-2 space-y-3 flex-1">
          {/* Header with branding */}
          <TemplateHeader
            companyName={companyName}
            companyGstin={companyGstin}
            companyPhone={companyPhone}
            companyEmail={companyEmail}
            companyAddress={companyAddress}
          />

          {/* Meta Bar */}
          <TemplateMetaBar
            docNumberLabel="RETURN NUMBER:"
            docNumber={documentNumber}
            dateLabel="DATE:"
            dateValue={formatDate(returnItem.return_date)}
            rightExtra={
              returnItem.bill_number ? (
                <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300 shrink-0">
                  <span className="text-gray-600 uppercase font-semibold text-[10px]">AGAINST INVOICE:</span>
                  <span className="text-[#043486] font-mono font-bold text-[11px]">{returnItem.bill_number}</span>
                </div>
              ) : null
            }
          />

          {/* Customer & Return Details Box: Two Columns (BILL TO & RETURN VOUCHER DETAILS) */}
          <div className="border border-gray-300 p-2.5 bg-white/80 text-[#292424]">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column: CUSTOMER DETAILS */}
              <div className="space-y-0.5 border-r border-gray-200 pr-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[12px] font-black text-[#043486] uppercase tracking-wider block mb-0.5">
                      CUSTOMER DETAILS
                    </span>
                    <h3 className="text-[12.5px] font-bold text-[#292424]">
                      {returnItem.customer_name}
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#292424] bg-gray-100 border border-gray-300 px-2 py-0.5 inline-block shrink-0">
                    ORIGINAL
                  </span>
                </div>

                <div className="space-y-0.5 pt-1 text-[10px] font-medium text-gray-700">
                  {returnItem.customer_phone && (
                    <div><strong>Mobile:</strong> <span className="font-mono text-[#292424]">{returnItem.customer_phone}</span></div>
                  )}
                  {returnItem.customer_email && (
                    <div><strong>Email:</strong> <span className="text-[#292424]">{returnItem.customer_email}</span></div>
                  )}
                  <div><strong>Place of Supply:</strong> <span className="text-[#292424]">33-Tamil Nadu</span></div>
                </div>
              </div>

              {/* Right Column: RETURN & VOUCHER DETAILS */}
              <div className="space-y-0.5 pl-1">
                <span className="text-[12px] font-black text-[#043486] uppercase tracking-wider block mb-0.5">
                  RETURN &amp; VOUCHER DETAILS
                </span>
                <div className="space-y-0.5 pt-0.5 text-[10px] font-medium text-gray-700">
                  <div><strong>Return Tracking ID:</strong> <span className="font-mono text-[#292424] font-bold">{returnItem.return_number}</span></div>
                  <div><strong>QC Status:</strong> <span className="font-bold text-emerald-700 uppercase">{returnItem.qc_status || 'COMPLETED'}</span></div>
                  <div><strong>Resolution Type:</strong> <span className="font-bold text-[#292424] uppercase">{isCreditNote ? 'Credit Note Issued for Refund' : (isReplacement ? 'Item Replaced' : 'Restocked')}</span></div>
                  <div><strong>Return Date:</strong> <span className="font-medium text-[#292424]">{formatDate(returnItem.return_date)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* --- CLEAN PRODUCT & SERIAL ITEM TABLE --- */}
          <div className="border border-gray-300 overflow-hidden text-[#292424]">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-[#f3f4f6] border-b border-gray-300 text-[9.5px] font-black uppercase text-[#292424]">
                  <th className="py-2 px-2.5 border-r border-gray-300 text-center w-[6%]">S.NO</th>
                  <th className="py-2 px-3 border-r border-gray-300 w-[46%]">PRODUCT DESCRIPTION</th>
                  <th className="py-2 px-2.5 border-r border-gray-300 text-center w-[12%]">QUANTITY</th>
                  <th className="py-2 px-3 border-r border-gray-300 text-center w-[18%]">RETURNED SERIAL #</th>
                  <th className="py-2 px-3 text-right w-[18%]">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[#292424]">
                <tr className="hover:bg-gray-50/50">
                  <td className="py-3 px-2.5 border-r border-gray-300 text-center font-bold align-top text-[#292424]">
                    1
                  </td>
                  <td className="py-3 px-3 border-r border-gray-300 align-top">
                    <div className="font-bold text-[11px] text-[#292424]">
                      {returnItem.item_name}
                      <span className="text-[10px] font-semibold text-gray-600 ml-1">
                        ({returnItem.unit || 'Nos'})
                      </span>
                    </div>
                    {returnItem.reason && (
                      <div className="text-[9.5px] text-gray-500 font-medium mt-1">
                        Reason: {returnItem.reason}
                      </div>
                    )}
                    {returnItem.replacement_serial && (
                      <div className="text-[9.5px] font-mono font-bold text-emerald-800 mt-0.5">
                        Replacement Serial: {returnItem.replacement_serial}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2.5 border-r border-gray-300 text-center font-semibold align-top text-[#292424]">
                    {formatQty(returnQty)} {returnItem.unit || 'Nos'}
                  </td>
                  <td className="py-3 px-3 border-r border-gray-300 text-center font-mono font-bold align-top text-gray-800">
                    {returnItem.serial_number || '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black align-top text-[#292424] text-[11px]">
                    ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>

              {/* Table Subtotal Bar */}
              <tfoot>
                <tr className="bg-[#f3f4f6] border-t border-gray-300 font-bold text-[10.5px] text-[#292424]">
                  <td colSpan={2} className="py-1.5 px-3 border-r border-gray-300 uppercase text-[#292424]">SUB TOTAL</td>
                  <td className="py-1.5 px-2.5 border-r border-gray-300 text-center font-mono text-[#292424]">{formatQty(returnQty)} Unit</td>
                  <td className="border-r border-gray-300" />
                  <td className="py-1.5 px-3 text-right font-mono text-[#292424] font-black">
                    ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* --- QUALITY CHECK & RESOLUTION BOX --- */}
          <div className="border border-gray-300 bg-white/90 p-3 space-y-2 text-[#292424]">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-[#043486]">
                Quality Check (QC) &amp; Resolution Summary
              </span>
              <span
                className={`px-2.5 py-0.5 text-[9.5px] font-bold uppercase ${
                  isPassed
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : isDefective
                    ? 'bg-rose-50 text-rose-800 border border-rose-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                QC Condition: {returnItem.qc_condition || 'PASS'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center pt-0.5">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Resolution Action:</span>
                <span className="font-bold text-[#292424] text-[11px] uppercase">
                  {isCreditNote
                    ? 'Credit Note Issued for Refund'
                    : isReplacement
                    ? 'Exchange / Replacement Dispatched'
                    : 'Restocked to Inventory'}
                </span>
                {returnItem.qc_notes && (
                  <div className="text-[10px] text-gray-600 italic mt-0.5">
                    <strong>Remarks:</strong> "{returnItem.qc_notes}"
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                  {isCreditNote ? 'Credit Note Issued Value:' : 'Total Value:'}
                </span>
                <span className="text-base font-mono font-black text-[#292424]">
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Amount in words */}
            {amountInWords && (
              <div className="pt-1.5 border-t border-gray-200 text-[9.5px] text-gray-700 leading-tight">
                <strong className="text-gray-800">Amount in Words: </strong>
                <span className="italic text-[#292424] font-semibold capitalize">
                  {amountInWords}
                </span>
              </div>
            )}
          </div>

          {/* --- TERMS & CONDITIONS AND SIGNATURE SECTION (Directly below QC Box) --- */}
          <div className="pt-3 border-t border-gray-200 grid grid-cols-12 gap-4 items-end">
            {/* Left: Return Terms & Conditions */}
            <div className="col-span-8 space-y-1">
              <h4 className="text-[10px] font-bold text-[#043486] uppercase tracking-wider">
                Terms &amp; Conditions:
              </h4>
              <ol className="list-decimal list-inside text-[9px] text-gray-700 space-y-0.5 leading-relaxed font-medium">
                {defaultReturnTerms.map((term, idx) => (
                  <li key={idx}>{term}</li>
                ))}
              </ol>
            </div>

            {/* Right: Signature Box */}
            <div className="col-span-4 text-center space-y-0.5">
              {signatureUrl ? (
                <div className="flex justify-center items-center h-12 mb-1">
                  <img
                    src={signatureUrl}
                    alt="Authorized Signatory Signature / Seal"
                    className="max-h-12 max-w-[140px] object-contain"
                  />
                </div>
              ) : (
                <div className="h-10"></div>
              )}
              <div className="w-full border-t border-dashed border-gray-400 pt-1">
                <p className="text-[9.5px] font-bold text-[#043486] uppercase tracking-wide">
                  For {companyName}
                </p>
                <p className="text-[8.5px] text-gray-500 font-semibold uppercase">
                  (Authorized Signatory)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Ribbon */}
        <TemplateFooterRibbon
          companyPhone={companyPhone}
          companyEmail={companyEmail}
          companyAddress={companyAddress}
        />
      </TemplatePageShell>
    </div>
  )
}
