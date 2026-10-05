import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useSettings } from '../../context/SettingsContext'
import {
  TemplatePageShell,
  TemplateHeader,
  TemplateMetaBar,
  TemplatePartyBox,
  TemplateFooterRibbon
} from '../invoice/shared'

// Helper function to paginate receipt items into strictly 5 items per A4 page
function paginateReceiptItems(items) {
  if (!items || items.length === 0) {
    return [{
      pageIndex: 1,
      totalPages: 1,
      startIndex: 0,
      items: [],
      isFirstPage: true,
      isLastPage: true,
      showSummary: true
    }]
  }

  const CHUNK_SIZE = 5
  const totalPages = Math.max(1, Math.ceil(items.length / CHUNK_SIZE))
  const pages = []

  for (let i = 0; i < totalPages; i++) {
    const start = i * CHUNK_SIZE
    const chunk = items.slice(start, start + CHUNK_SIZE)
    pages.push({
      pageIndex: i + 1,
      totalPages,
      startIndex: start,
      items: chunk,
      isFirstPage: i === 0,
      isLastPage: i === totalPages - 1,
      showSummary: i === totalPages - 1
    })
  }

  return pages
}

export default function ReceiptTemplate({ bill, settings, company }) {
  if (!bill) return null

  // 1. Snapshot Pattern for Past Bills Immutability (Legal Audit Rule)
  let snapshot = bill?.company_snapshot || null
  if (typeof snapshot === 'string') {
    try { snapshot = JSON.parse(snapshot) } catch { snapshot = null }
  }

  // 2. Live DB Context fallback for New Bills & UI Rendering
  const {
    settings: liveSettings,
    companyDetails: liveCompany,
    signatureUrl: liveSignUrl,
    termsList: liveTerms
  } = useSettings()

  const effectiveSettings = snapshot || settings || company || liveSettings || {}
  const effectiveCompany = snapshot || company || liveCompany || {}

  const companyName = effectiveCompany?.company_name || effectiveCompany?.name || ''
  const companyGstin = effectiveCompany?.gstin || ''
  const companyPhone = effectiveCompany?.phone || ''
  const companyEmail = effectiveCompany?.email || ''
  const companyAddress = effectiveCompany?.address || ''
  const signatureUrl = effectiveSettings?.signature_url || effectiveSettings?.signatureUrl || bill.signature_url || liveSignUrl || null

  const defaultTermsList = (Array.isArray(effectiveSettings?.terms_conditions) && effectiveSettings.terms_conditions.length > 0)
    ? effectiveSettings.terms_conditions
    : (Array.isArray(snapshot?.terms_conditions) && snapshot.terms_conditions.length > 0)
    ? snapshot.terms_conditions
    : (liveTerms && liveTerms.length > 0)
    ? liveTerms
    : [
      'Warranty as per manufacturer’s norms & should be claimed directly.',
      'Warranty claim takes 1 to 8 weeks.',
      'Please carry receipt copy for warranty.',
      'Goods Once Sold will not be taken back or exchanged.'
    ]

  const items = Array.isArray(bill.items) ? bill.items : []
  const hasReturnableItems = items.some(it => it.return_policy === true || it.return_policy === 1 || it.return_policy === '1')
  const returnDays = settings?.return_days || 7
  const returnClause = settings?.return_policy_clause
    ? settings.return_policy_clause.replace('{days}', `${returnDays} days`)
    : `Products eligible for return must be returned within ${returnDays} days of purchase with original invoice copy.`

  const termsList = hasReturnableItems
    ? [returnClause, ...defaultTermsList.filter(t => !t.toLowerCase().includes('will not be taken back'))]
    : defaultTermsList
  const isGstInvoice = bill.invoice_type === 'GST' || (!bill.invoice_type && parseFloat(bill.total_tax || 0) > 0)
  const isIntraState = !bill.place_of_supply || bill.place_of_supply.includes('33') || bill.place_of_supply.toLowerCase().includes('tamil nadu')

  const totalQty = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0)
  const totalTaxAmt = isGstInvoice ? items.reduce((sum, it) => sum + (parseFloat(it.tax_amount) || 0), 0) : 0
  const totalGrossAmt = items.reduce((sum, it) => sum + (parseFloat(it.amount) || (parseFloat(it.quantity || 0) * parseFloat(it.rate || 0))), 0)
  const totalDiscountSavings = items.reduce((sum, it) => sum + ((parseFloat(it.discount_amount) || 0) * (parseFloat(it.quantity) || 1)), 0)
  const totalGrossOrigAmt = items.reduce((sum, it) => sum + (((parseFloat(it.original_rate) || parseFloat(it.rate) || 0)) * (parseFloat(it.quantity) || 1)), 0)

  // Format date helper (e.g. 18 Sept 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Format clean integer/decimal quantity (e.g. 1, 11, 2.5)
  const formatQty = (qty) => {
    const num = parseFloat(qty) || 0
    return num % 1 === 0 ? parseInt(num, 10) : num
  }

  const paginatedPages = paginateReceiptItems(items)

  return (
    <div id="receipt-printable-area" className="w-full">
      {paginatedPages.map((page) => (
        <TemplatePageShell
          key={page.pageIndex}
          pageIndex={page.pageIndex}
          totalPages={page.totalPages}
        >
          {/* Main Content Area */}
          <div className="relative z-10 px-8 pt-7 flex-1 flex flex-col justify-start space-y-2">
            {/* Header */}
            <TemplateHeader
              companyName={companyName}
              companyGstin={companyGstin}
              companyPhone={companyPhone}
              companyEmail={companyEmail}
              companyAddress={companyAddress}
            />

            {/* Receipt Meta Bar */}
            <TemplateMetaBar
              docNumberLabel="RECEIPT NUMBER:"
              docNumber={bill.receipt_number || bill.invoice_number}
              dateLabel="RECEIPT DATE:"
              dateValue={formatDate(bill.invoice_date || new Date())}
            />

            {/* Customer Details Box: Two Columns (RECEIVED FROM & DELIVERY ADDRESS) */}
            <TemplatePartyBox
              mode="two-column"
              billTitle="RECEIVED FROM (BILL TO)"
              customerName={bill.customer_name}
              customerAddress={bill.customer_address}
              customerPhone={bill.customer_phone}
              customerEmail={bill.customer_email}
              placeOfSupply={bill.place_of_supply}
              customerGstin={bill.customer_gstin}
              copyType={bill.copy_type}
              shipTitle="DELIVERY / SHIPPING ADDRESS"
              deliveryAddress={bill.delivery_address}
              sameAsBilling={bill.same_as_billing}
            />

            {/* --- LINE ITEMS TABLE --- */}
            <div className="border border-gray-300 overflow-hidden text-[#292424]">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#f3f4f6] border-b border-gray-300 text-[9.5px] font-black uppercase text-[#292424]">
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[5%]">#</th>
                    <th className="py-1.5 px-2.5 border-r border-gray-300 w-[35%]">ITEM DESCRIPTION</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[10%]">HSN</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[8%]">QTY</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[8%]">DISC</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-right w-[11%]">RATE (₹)</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-right w-[11%]">TAX</th>
                    <th className="py-1.5 px-2.5 text-right w-[12%]">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[#292424]">
                  {page.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-1.5 px-2 border-r border-gray-300 text-center font-bold align-top text-[#292424]">
                        {(page.startIndex || 0) + idx + 1}
                      </td>
                      <td className="py-1.5 px-2.5 border-r border-gray-300 align-top">
                        <div className="font-bold text-[#292424]">
                          {item.item_name || item.name}
                          {item.unit && (
                            <span className="text-[10px] font-semibold text-gray-600 ml-1">
                              ({item.unit})
                            </span>
                          )}
                        </div>
                        {item.category_name && (
                          <div className="text-[9px] text-gray-500 font-medium">
                            [{item.category_name}]
                          </div>
                        )}
                        {item.serial_number && (
                          <div className="text-[9px] font-mono font-semibold text-gray-700 mt-0.5">
                            S/N: {item.serial_number}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-center font-mono align-top text-gray-600">
                        {item.hsn_code || '-'}
                      </td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-center font-semibold align-top text-[#292424]">
                        {formatQty(item.quantity)}
                      </td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-center font-mono align-top text-emerald-700 font-bold">
                        {(item.has_discount || parseFloat(item.discount_percent || 0) > 0) ? `${parseFloat(item.discount_percent || 0)}%` : '—'}
                      </td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-right font-mono align-top text-[#292424]">
                        <div>₹ {parseFloat(item.rate || item.original_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-right font-mono align-top text-gray-600 text-[9px]">
                        {isGstInvoice && parseFloat(item.tax_amount || 0) > 0 ? (
                          <>
                            ₹{parseFloat(item.tax_amount || 0).toFixed(2)}
                            {item.tax_rate ? ` (${item.tax_rate}%)` : ''}
                          </>
                        ) : (
                          '₹ 0.00'
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold align-top text-[#292424]">
                        ₹ {parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {page.isLastPage && (
                  <tfoot>
                    <tr className="bg-[#f3f4f6] font-bold border-t border-gray-300 text-[10px] text-[#292424]">
                      <td colSpan={3} className="py-1 px-2 border-r border-gray-300 text-right uppercase">
                        Total Items: {items.length}
                      </td>
                      <td className="py-1 px-2 border-r border-gray-300 text-center font-bold font-mono">
                        {formatQty(totalQty)}
                      </td>
                      <td className="border-r border-gray-300" />
                      <td className="border-r border-gray-300" />
                      <td className="py-1 px-2 border-r border-gray-300 text-right font-mono">
                        ₹ {totalTaxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono font-black text-[#292424]">
                        ₹ {totalGrossAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* --- SUMMARY SECTION --- */}
            {page.showSummary && (
              <div className="grid grid-cols-12 gap-6 pt-2 text-[#292424]">
                {/* Left Column: Terms & Conditions & Payment Mode */}
                <div className="col-span-6 space-y-2">
                  <div className="space-y-0.5 text-[9.5px]">
                    <span className="font-black text-[#292424] uppercase tracking-wider block text-[10px] mb-0.5">
                      TERMS &amp; CONDITIONS
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700 leading-snug">
                      {termsList.map((t, idx) => (
                        <li key={idx} className="leading-tight">{t}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-2.5 bg-gray-50 border border-gray-200 text-[10px] text-gray-600 rounded-none mt-3">
                    <p><strong>Payment Mode:</strong> {bill.payment_mode || 'Cash'}</p>
                    <p className="mt-0.5"><strong>Payment Status:</strong> <span className="font-bold text-emerald-700">PAID</span></p>
                  </div>
                </div>

                {/* Right Column: Tax Breakdown, Totals & Signatory */}
                <div className="col-span-6 flex flex-col justify-between text-[#292424] pl-2">
                  <div className="space-y-0.5 text-[10.5px]">
                    {totalDiscountSavings > 0 && (
                      <>
                        <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                          <span>Gross Amount</span>
                          <span className="font-mono text-[#292424]">
                            ₹ {totalGrossOrigAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 text-[10.5px] font-bold text-emerald-700">
                          <span>Discount Savings</span>
                          <span className="font-mono">
                            - ₹ {totalDiscountSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-gray-700 py-0.5">
                      <span>Taxable Amount</span>
                      <span className="font-mono font-semibold text-[#292424]">
                        ₹ {parseFloat(bill.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {isGstInvoice && parseFloat(bill.total_tax || 0) > 0 && (
                      <>
                        {isIntraState ? (
                          <>
                            <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                              <span>CGST ({bill.cgst_rate || settings?.cgst_rate || 9}%)</span>
                              <span className="font-mono text-[#292424]">
                                ₹ {parseFloat(bill.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                              <span>SGST ({bill.sgst_rate || settings?.sgst_rate || 9}%)</span>
                              <span className="font-mono text-[#292424]">
                                ₹ {parseFloat(bill.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                            <span>IGST ({bill.igst_rate || settings?.igst_rate || 18}%)</span>
                            <span className="font-mono text-[#292424]">
                              ₹ {parseFloat(bill.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {bill.round_off && parseFloat(bill.round_off) !== 0 && (
                      <div className="flex justify-between text-gray-500 py-0.5 text-[10px]">
                        <span>Round Off</span>
                        <span className="font-mono">
                          {bill.round_off > 0 ? `+₹${bill.round_off}` : `-₹${Math.abs(bill.round_off)}`}
                        </span>
                      </div>
                    )}

                    {/* Total Amount Received */}
                    <div className="border-t border-b border-gray-400 py-1 my-1 flex justify-between items-center text-xs font-black text-[#292424]">
                      <span className="text-xs uppercase">Total Amount Received</span>
                      <span className="text-sm font-black font-mono text-[#043486]">
                        ₹ {parseFloat(bill.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {bill.amount_in_words && (
                      <div className="pt-0.5 text-[9px] text-gray-600 leading-tight">
                        <strong className="text-gray-800">In Words: </strong>
                        <span className="italic text-[#292424] font-medium capitalize">
                          {bill.amount_in_words}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Authorized Signatory */}
                  <div className="pt-4 text-right pr-2">
                    {signatureUrl && (
                      <div className="flex justify-end items-center h-10 mb-1">
                        <img
                          src={signatureUrl}
                          alt="Authorized Signature"
                          className="max-h-10 max-w-[140px] object-contain"
                        />
                      </div>
                    )}
                    <div className="inline-block border-t border-gray-400 pt-1 text-center min-w-[180px]">
                      <p className="text-[9.5px] text-gray-600 font-medium">Authorized Signatory</p>
                      <p className="text-[10px] font-black text-[#043486] uppercase tracking-wide">
                        {companyName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Ribbon */}
          <TemplateFooterRibbon
            companyPhone={companyPhone}
            companyEmail={companyEmail}
            companyAddress={companyAddress}
          />
        </TemplatePageShell>
      ))}
    </div>
  )
}
