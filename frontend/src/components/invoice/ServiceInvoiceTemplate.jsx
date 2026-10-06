import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useSettings } from '../../context/SettingsContext'
import {
  TemplatePageShell,
  TemplateHeader,
  TemplateMetaBar,
  TemplatePartyBox,
  TemplateSummaryGrid,
  TemplateFooterRibbon
} from './shared'

// Helper function to paginate service invoice items into strictly 5 items per A4 page
function paginateInvoiceItems(items) {
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

export default function ServiceInvoiceTemplate({ service, bill, settings, company }) {
  const data = service || bill
  if (!data) return null

  // 1. Snapshot Pattern for Past Service Invoices Immutability (Legal Audit Rule)
  let snapshot = data?.company_snapshot || null
  if (typeof snapshot === 'string') {
    try { snapshot = JSON.parse(snapshot) } catch { snapshot = null }
  }

  // 2. Live DB Context fallback for New Services & UI Rendering
  const {
    settings: liveSettings,
    companyDetails: liveCompany,
    bankDetails: liveBank,
    signatureUrl: liveSignUrl,
    bankImageUrl: liveBankImg,
    termsList: liveTerms
  } = useSettings()

  const effectiveSettings = snapshot || settings || company || liveSettings || {}
  const effectiveCompany = snapshot || company || liveCompany || {}
  const effectiveBank = snapshot || liveBank || {}

  const companyName = effectiveCompany?.company_name || effectiveCompany?.name || ''
  const companyGstin = effectiveCompany?.gstin || ''
  const companyPhone = effectiveCompany?.phone || ''
  const companyEmail = effectiveCompany?.email || ''
  const companyAddress = effectiveCompany?.address || ''

  const bankName = effectiveBank?.bank_name || effectiveBank?.bankName || ''
  const bankBranch = effectiveBank?.branch || ''
  const bankAccountName = effectiveBank?.account_name || effectiveBank?.accountName || companyName || ''
  const bankAccountNo = effectiveBank?.account_no || effectiveBank?.accountNo || ''
  const bankIfsc = effectiveBank?.ifsc_code || effectiveBank?.ifscCode || ''
  const bankImageUrl = effectiveBank?.bank_image_url || effectiveBank?.bankImageUrl || data.bank_image_url || liveBankImg || ''
  const signatureUrl = effectiveSettings?.signature_url || effectiveSettings?.signatureUrl || data.signature_url || liveSignUrl || ''
  
  const defaultTermsList = (Array.isArray(effectiveSettings?.service_terms) && effectiveSettings.service_terms.length > 0)
    ? effectiveSettings.service_terms
    : (Array.isArray(snapshot?.service_terms) && snapshot.service_terms.length > 0)
    ? snapshot.service_terms
    : (Array.isArray(effectiveSettings?.terms_conditions) && effectiveSettings.terms_conditions.length > 0)
    ? effectiveSettings.terms_conditions
    : (Array.isArray(snapshot?.terms_conditions) && snapshot.terms_conditions.length > 0)
    ? snapshot.terms_conditions
    : (liveTerms && liveTerms.length > 0)
    ? liveTerms
    : [
      'Warranty as per manufacturer’s norms & should be claimed directly.',
      'Service warranty 30 days applicable on reported issues only.',
      'Please carry service invoice copy for warranty claims.',
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

  const paginatedPages = paginateInvoiceItems(items)

  return (
    <div id="service-invoice-printable-area" className="w-full">
      {paginatedPages.map((page) => (
        <TemplatePageShell
          key={page.pageIndex}
          pageIndex={page.pageIndex}
          totalPages={page.totalPages}
        >
          {/* Main Content Area */}
          <div className="relative z-10 px-7 pt-6 pb-2 space-y-3 flex-1">
            {/* Full Header */}
            <TemplateHeader
              companyName={companyName}
              companyGstin={companyGstin}
              companyPhone={companyPhone}
              companyEmail={companyEmail}
              companyAddress={companyAddress}
            />

            {/* Service Meta Bar */}
            <TemplateMetaBar
              docNumberLabel="SERVICE INVOICE NUMBER:"
              docNumber={data.service_number || data.invoice_number}
              dateLabel="SERVICE DATE:"
              dateValue={formatDate(data.service_date || data.invoice_date)}
            />

            {/* Customer Bill To Details (Single Column Mode) */}
            <TemplatePartyBox
              mode="single-column"
              billTitle="Billing Details"
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

            {/* --- 3-COLUMN SUMMARY --- */}
            {page.showSummary && (
              <TemplateSummaryGrid
                bankAccountName={bankAccountName}
                bankName={bankName}
                bankAccountNo={bankAccountNo}
                bankIfsc={bankIfsc}
                bankBranch={bankBranch}
                bankImageUrl={bankImageUrl}
                termsList={termsList}
                taxableAmount={data.taxable_amount}
                isGstInvoice={isGstInvoice}
                isIntraState={isIntraState}
                cgstRate={data.cgst_rate || effectiveSettings?.cgst_rate || 9}
                cgstAmount={data.cgst_amount}
                sgstRate={data.sgst_rate || effectiveSettings?.sgst_rate || 9}
                sgstAmount={data.sgst_amount}
                igstRate={data.igst_rate || effectiveSettings?.igst_rate || 18}
                igstAmount={data.igst_amount}
                roundOff={data.round_off}
                totalAmount={data.total_amount}
                amountInWords={data.amount_in_words}
                totalLabel="Service Total"
                signatureUrl={signatureUrl}
                companyName={companyName}
              />
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
