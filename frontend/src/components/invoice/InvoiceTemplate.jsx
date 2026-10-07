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

// Helper function to paginate invoice items into strictly 5 items per A4 page
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

export default function InvoiceTemplate({ bill, settings, company }) {
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
  const bankImageUrl = effectiveBank?.bank_image_url || effectiveBank?.bankImageUrl || bill.bank_image_url || liveBankImg || ''
  const signatureUrl = effectiveSettings?.signature_url || effectiveSettings?.signatureUrl || bill.signature_url || liveSignUrl || ''
  
  const defaultTermsList = (Array.isArray(snapshot?.invoice_terms) && snapshot.invoice_terms.length > 0)
    ? snapshot.invoice_terms
    : (Array.isArray(snapshot?.terms_conditions) && snapshot.terms_conditions.length > 0)
    ? snapshot.terms_conditions
    : (Array.isArray(effectiveSettings?.invoice_terms) && effectiveSettings.invoice_terms.length > 0)
    ? effectiveSettings.invoice_terms
    : (Array.isArray(effectiveSettings?.terms_conditions) && effectiveSettings.terms_conditions.length > 0)
    ? effectiveSettings.terms_conditions
    : (liveTerms && liveTerms.length > 0)
    ? liveTerms
    : []

  const items = Array.isArray(bill.items) ? bill.items : []
  const hasReturnableItems = items.some(it => it.return_policy === true || it.return_policy === 1 || it.return_policy === '1')
  const rawReturnDays = snapshot?.return_days !== undefined && snapshot?.return_days !== null && snapshot?.return_days !== ''
    ? snapshot.return_days
    : (effectiveSettings?.return_days !== undefined && effectiveSettings?.return_days !== null && effectiveSettings?.return_days !== ''
      ? effectiveSettings.return_days
      : (settings?.return_days !== undefined && settings?.return_days !== null && settings?.return_days !== '' ? settings.return_days : 0))
  const returnDays = parseInt(rawReturnDays, 10) || 0

  const hasReturnWindow = returnDays > 0
  const customReturnClause = ((snapshot?.return_policy_clause !== undefined && snapshot?.return_policy_clause !== null ? snapshot.return_policy_clause : effectiveSettings?.return_policy_clause) || settings?.return_policy_clause || '').trim()
  const returnClause = customReturnClause
    ? customReturnClause.replace('{days}', `${returnDays} days`)
    : `Products eligible for return have to be returned within ${returnDays} days of purchase with original invoice copy.`

  const termsList = (hasReturnableItems && hasReturnWindow)
    ? [returnClause, ...defaultTermsList.filter(t => !t.toLowerCase().includes('will not be taken back'))]
    : defaultTermsList
  const isGstInvoice = bill.invoice_type === 'GST' || (!bill.invoice_type && parseFloat(bill.total_tax || 0) > 0)
  const isIntraState = !bill.place_of_supply || bill.place_of_supply.includes('33') || bill.place_of_supply.toLowerCase().includes('tamil nadu')

  const totalQty = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0)
  const totalTaxAmt = isGstInvoice ? items.reduce((sum, it) => sum + (parseFloat(it.tax_amount) || 0), 0) : 0
  const totalGrossAmt = items.reduce((sum, it) => sum + (parseFloat(it.amount) || (parseFloat(it.quantity || 0) * parseFloat(it.rate || 0))), 0)
  const totalDiscountSavings = items.reduce((sum, it) => sum + ((parseFloat(it.discount_amount) || 0) * (parseFloat(it.quantity) || 1)), 0)
  const totalGrossOrigAmt = items.reduce((sum, it) => sum + (((parseFloat(it.original_rate) || parseFloat(it.rate) || 0)) * (parseFloat(it.quantity) || 1)), 0)

  // Format date helper (e.g. 15 Sept 2026)
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
    <div id="invoice-printable-area" className="w-full">
      {paginatedPages.map((page) => (
        <TemplatePageShell
          key={page.pageIndex}
          pageIndex={page.pageIndex}
          totalPages={page.totalPages}
        >
          {/* Main Content Area: Sequential flow so summary sits directly under table */}
          <div className="relative z-10 px-7 pt-6 pb-2 space-y-3 flex-1">
            {/* Header with branding */}
            <TemplateHeader
              companyName={companyName}
              companyGstin={companyGstin}
              companyPhone={companyPhone}
              companyEmail={companyEmail}
              companyAddress={companyAddress}
            />

            {/* Invoice Meta Bar */}
            <TemplateMetaBar
              docNumberLabel="SALES INVOICE NUMBER:"
              docNumber={bill.invoice_number}
              dateLabel="SALES DATE:"
              dateValue={formatDate(bill.invoice_date)}
              dueDateLabel="DUE DATE:"
              dueDateValue={bill.due_date ? formatDate(bill.due_date) : null}
            />

            {/* Customer Details Box (BILL TO & SHIP TO) */}
            <TemplatePartyBox
              mode="two-column"
              billTitle="Billing Details"
              customerName={bill.customer_name}
              customerAddress={bill.customer_address}
              customerPhone={bill.customer_phone}
              customerEmail={bill.customer_email}
              placeOfSupply={bill.place_of_supply}
              customerGstin={bill.customer_gstin}
              copyType={bill.copy_type}
              shipTitle="SHIP TO / DELIVERY ADDRESS"
              deliveryAddress={bill.delivery_address}
              sameAsBilling={bill.same_as_billing}
            />

            {/* --- DYNAMIC LINE ITEMS TABLE (WITH DEDICATED DISC % COLUMN) --- */}
            <div className="border border-gray-300 overflow-hidden text-[#292424]">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#f3f4f6] border-b border-gray-300 text-[9.5px] font-black uppercase text-[#292424]">
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[5%]">S.NO</th>
                    <th className="py-1.5 px-2.5 border-r border-gray-300 w-[33%]">ITEMS</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[11%]">HSN/SAC</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[9%]">QTY</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[8%]">DISC (%)</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-right w-[12%]">RATE (₹)</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-right w-[10%]">TAX</th>
                    <th className="py-1.5 px-2.5 text-right w-[12%]">AMOUNT (₹)</th>
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
                          {item.item_name || item.name}
                          {item.unit && (
                            <span className="text-[10.5px] font-semibold text-gray-600 ml-1">
                              ({item.unit})
                            </span>
                          )}
                        </div>
                        {item.category_name && (
                          <div className="text-[9.5px] text-gray-500 font-medium">
                            [{item.category_name}]
                          </div>
                        )}
                        {item.serial_number && (
                          <div className="text-[9.5px] font-mono font-semibold text-gray-800 mt-0.5">
                            Serial No.: {item.serial_number}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-mono align-top text-gray-700">
                        {item.hsn_code || '-'}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-semibold align-top text-[#292424]">
                        {formatQty(item.quantity)} Unit
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-mono align-top">
                        {(item.has_discount || parseFloat(item.discount_percent || 0) > 0) ? (
                          <span className="font-bold text-emerald-700">
                            {parseFloat(item.discount_percent || 0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-right font-mono align-top text-[#292424]">
                        <div>₹ {parseFloat(item.rate || item.original_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {(item.has_discount || parseFloat(item.discount_percent || 0) > 0) && (
                          <div className="text-[8.5px] text-gray-400 line-through">
                            ₹ {parseFloat(item.original_rate || item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-right font-mono align-top text-gray-700 text-[9.5px]">
                        {isGstInvoice && parseFloat(item.tax_amount || 0) > 0 ? (
                          <>
                            ₹ {parseFloat(item.tax_amount || 0).toFixed(2)}
                            {item.tax_rate ? ` (${item.tax_rate}%)` : ''}
                          </>
                        ) : (
                          '₹ 0.00'
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold align-top text-[#292424]">
                        ₹ {parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Table Subtotal Bar on Last Page */}
                {page.showSummary && (
                  <tfoot>
                    <tr className="bg-[#f3f4f6] border-t border-gray-300 font-bold text-[10.5px] text-[#292424]">
                      <td colSpan={2} className="py-1.5 px-2.5 border-r border-gray-300 uppercase text-[#292424]">SUB TOTAL</td>
                      <td className="border-r border-gray-300" />
                      <td className="py-1.5 px-2 border-r border-gray-300 text-center font-mono text-[#292424]">{formatQty(totalQty)} Unit</td>
                      <td className="border-r border-gray-300" />
                      <td className="border-r border-gray-300" />
                      <td className="py-1.5 px-2 border-r border-gray-300 text-right font-mono text-gray-800">
                        ₹ {totalTaxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-[#292424] font-black">
                        ₹ {totalGrossAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* --- 3-COLUMN SUMMARY (DIRECTLY UNDER TABLE) --- */}
            {page.showSummary && (
              <TemplateSummaryGrid
                bankAccountName={bankAccountName}
                bankName={bankName}
                bankAccountNo={bankAccountNo}
                bankIfsc={bankIfsc}
                bankBranch={bankBranch}
                bankImageUrl={bankImageUrl}
                termsList={termsList}
                totalDiscountSavings={totalDiscountSavings}
                totalGrossOrigAmt={totalGrossOrigAmt}
                taxableAmount={bill.taxable_amount}
                isGstInvoice={isGstInvoice}
                isIntraState={isIntraState}
                cgstRate={bill.cgst_rate || effectiveSettings?.cgst_rate || 9}
                cgstAmount={bill.cgst_amount}
                sgstRate={bill.sgst_rate || effectiveSettings?.sgst_rate || 9}
                sgstAmount={bill.sgst_amount}
                igstRate={bill.igst_rate || effectiveSettings?.igst_rate || 18}
                igstAmount={bill.igst_amount}
                roundOff={bill.round_off}
                totalAmount={bill.total_amount}
                amountInWords={bill.amount_in_words}
                totalLabel="Invoice Total"
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
