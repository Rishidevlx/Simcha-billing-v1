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

export default function ServiceReceiptTemplate({ service, bill, settings, company }) {
  const data = service || bill
  if (!data) return null

  // 1. Snapshot Pattern for Past Service Receipts Immutability (Legal Audit Rule)
  let snapshot = data?.company_snapshot || null
  if (typeof snapshot === 'string') {
    try { snapshot = JSON.parse(snapshot) } catch { snapshot = null }
  }

  // 2. Live DB Context fallback for New Services & UI Rendering
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
  const signatureUrl = effectiveSettings?.signature_url || effectiveSettings?.signatureUrl || data.signature_url || liveSignUrl || null

  const defaultTermsList = (Array.isArray(effectiveSettings?.terms_conditions) && effectiveSettings.terms_conditions.length > 0)
    ? effectiveSettings.terms_conditions
    : (Array.isArray(snapshot?.terms_conditions) && snapshot.terms_conditions.length > 0)
    ? snapshot.terms_conditions
    : (liveTerms && liveTerms.length > 0)
    ? liveTerms
    : [
      'Warranty as per manufacturer’s norms & should be claimed directly.',
      'Service warranty 30 days applicable on reported issues only.',
      'Please carry service receipt copy for warranty claims.',
      'Replaced spare parts will not be returned unless requested prior.'
    ]

  const items = Array.isArray(data.items) ? data.items : []
  const hasReturnableItems = items.some(it => it.return_policy === true || it.return_policy === 1 || it.return_policy === '1')
  const returnDays = settings?.return_days || 7
  const returnClause = settings?.return_policy_clause
    ? settings.return_policy_clause.replace('{days}', `${returnDays} days`)
    : `Products eligible for return must be returned within ${returnDays} days of purchase with original invoice copy.`

  const termsList = hasReturnableItems
    ? [returnClause, ...defaultTermsList.filter(t => !t.toLowerCase().includes('will not be taken back'))]
    : defaultTermsList
  const isGstInvoice = data.service_type === 'GST' || data.invoice_type === 'GST' || parseFloat(data.total_tax || 0) > 0
  const isIntraState = !data.place_of_supply || data.place_of_supply.includes('33') || data.place_of_supply.toLowerCase().includes('tamil nadu')

  const totalQty = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0)
  const totalTaxAmt = isGstInvoice ? items.reduce((sum, it) => sum + (parseFloat(it.tax_amount) || 0), 0) : 0
  const totalGrossAmt = items.reduce((sum, it) => sum + (parseFloat(it.amount) || (parseFloat(it.quantity || 0) * parseFloat(it.rate || 0))), 0)

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
    <div id="service-receipt-printable-area" className="w-full">
      {paginatedPages.map((page) => (
        <TemplatePageShell
          key={page.pageIndex}
          pageIndex={page.pageIndex}
          totalPages={page.totalPages}
        >
          {/* Page Main Content */}
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
              docNumber={data.receipt_number || data.service_number}
              dateLabel="RECEIPT DATE:"
              dateValue={formatDate(data.service_date || new Date())}
              rightExtra={
                <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300">
                  <span className="text-gray-600 uppercase font-semibold text-[10.5px]">SERVICE REF:</span>
                  <span className="text-[#043486] font-mono font-bold text-xs">{data.service_number}</span>
                </div>
              }
            />

            {/* Customer Details Box */}
            <TemplatePartyBox
              mode="single-column"
              billTitle="RECEIVED FROM"
              customerName={data.customer_name}
              customerAddress={data.customer_address}
              customerPhone={data.customer_phone}
              customerEmail={data.customer_email}
              placeOfSupply={data.place_of_supply}
              customerType={data.customer_type || 'Individual'}
              customerGstin={data.customer_gstin}
              copyType={data.copy_type}
            />

            {/* --- LINE ITEMS TABLE --- */}
            <div className="border border-gray-300 overflow-hidden text-[#292424]">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#f3f4f6] border-b border-gray-300 text-[9.5px] font-black uppercase text-[#292424]">
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[5%]">#</th>
                    <th className="py-1.5 px-2.5 border-r border-gray-300 w-[30%]">PRODUCT &amp; MODEL</th>
                    <th className="py-1.5 px-2.5 border-r border-gray-300 w-[27%]">REPORTED ISSUE / SERVICE</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[8%]">QTY</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-right w-[10%]">RATE (₹)</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-right w-[10%]">TAX</th>
                    <th className="py-1.5 px-2.5 text-right w-[10%]">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[#292424]">
                  {page.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-bold align-top text-[#292424]">
                        {(page.startIndex || 0) + idx + 1}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-300 align-top">
                        <div className="font-bold text-[#292424]">
                          {item.product_name || item.item_name || item.name}
                        </div>
                        {item.brand_model && (
                          <div className="text-[10px] text-gray-600 font-medium">
                            Model: {item.brand_model}
                          </div>
                        )}
                        {item.serial_number && (
                          <div className="text-[9.5px] font-mono font-semibold text-[#043486] mt-0.5">
                            S/N: {item.serial_number}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-300 align-top text-gray-800">
                        <div>{item.issue_description || 'General Service & Repair'}</div>
                        {item.hsn_code && (
                          <div className="text-[9px] font-mono text-gray-500 mt-0.5">
                            HSN/SAC: {item.hsn_code}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-bold align-top text-[#292424]">
                        {formatQty(item.quantity)}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-right font-mono align-top text-gray-800">
                        {parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-right font-mono text-[9.5px] text-gray-600 align-top">
                        {parseFloat(item.tax_amount || 0) > 0 ? (
                          <>
                            <div>₹{parseFloat(item.tax_amount).toFixed(2)}</div>
                            <div className="text-[8.5px] text-gray-500">({item.tax_rate}%)</div>
                          </>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold align-top text-[#292424]">
                        {parseFloat(item.amount || (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      <td className="py-1 px-2 border-r border-gray-300 text-right font-mono text-gray-600">
                        —
                      </td>
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
                {/* Left Column (6/12): Terms & Payment Mode */}
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
                    <p><strong>Payment Mode:</strong> {data.payment_mode || 'Cash'}</p>
                    <p className="mt-0.5"><strong>Service Status:</strong> <span className="font-bold text-emerald-700 uppercase">{data.service_status || 'DELIVERED'}</span></p>
                  </div>
                </div>

                {/* Right Column (6/12): Tax Breakdown, Totals & Signatory */}
                <div className="col-span-6 flex flex-col justify-between text-[#292424] pl-2">
                  <div className="space-y-0.5 text-[10.5px]">
                    <div className="flex justify-between text-gray-700 py-0.5">
                      <span>Taxable Amount</span>
                      <span className="font-mono font-semibold text-[#292424]">
                        ₹ {parseFloat(data.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {isGstInvoice && parseFloat(data.total_tax || 0) > 0 && (
                      <>
                        {isIntraState ? (
                          <>
                            <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                              <span>CGST ({data.cgst_rate || settings?.cgst_rate || 9}%)</span>
                              <span className="font-mono text-[#292424]">
                                ₹ {parseFloat(data.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                              <span>SGST ({data.sgst_rate || settings?.sgst_rate || 9}%)</span>
                              <span className="font-mono text-[#292424]">
                                ₹ {parseFloat(data.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                            <span>IGST ({data.igst_rate || settings?.igst_rate || 18}%)</span>
                            <span className="font-mono text-[#292424]">
                              ₹ {parseFloat(data.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {data.round_off && parseFloat(data.round_off) !== 0 && (
                      <div className="flex justify-between text-gray-500 py-0.5 text-[10px]">
                        <span>Round Off</span>
                        <span className="font-mono">{data.round_off > 0 ? `+₹${data.round_off}` : `-₹${Math.abs(data.round_off)}`}</span>
                      </div>
                    )}

                    <div className="border-t border-b border-gray-400 py-1 my-1 flex justify-between items-center text-xs font-black text-[#292424]">
                      <span className="text-xs uppercase">Service Total</span>
                      <span className="text-sm font-black font-mono text-[#043486]">
                        ₹ {parseFloat(data.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {data.amount_in_words && (
                      <div className="pt-0.5 text-[9px] text-gray-600 leading-tight">
                        <strong className="text-gray-800">In Words: </strong>
                        <span className="italic text-[#292424] font-medium capitalize">
                          {data.amount_in_words}
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
