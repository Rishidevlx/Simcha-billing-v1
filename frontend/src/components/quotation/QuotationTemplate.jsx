import React from 'react'
import { useSettings } from '../../context/SettingsContext'
import {
  TemplatePageShell,
  TemplateHeader,
  TemplateMetaBar,
  TemplatePartyBox,
  TemplateSummaryGrid,
  TemplateFooterRibbon
} from '../invoice/shared'

// Helper function to paginate quotation items into 5 items per A4 page
function paginateQuotationItems(items) {
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

export default function QuotationTemplate({ quotation, settings, company }) {
  if (!quotation) return null

  // 1. Snapshot Pattern for Past Quotations Immutability
  let snapshot = quotation?.company_snapshot || null
  if (typeof snapshot === 'string') {
    try { snapshot = JSON.parse(snapshot) } catch { snapshot = null }
  }

  // 2. Live DB Context fallback
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

  const companyName = effectiveCompany?.company_name || effectiveCompany?.name || 'SIMCHA INFO SOLUTIONS'
  const companyGstin = effectiveCompany?.gstin || ''
  const companyPhone = effectiveCompany?.phone || ''
  const companyEmail = effectiveCompany?.email || ''
  const companyAddress = effectiveCompany?.address || ''

  const bankName = effectiveBank?.bank_name || effectiveBank?.bankName || ''
  const bankBranch = effectiveBank?.branch || ''
  const bankAccountName = effectiveBank?.account_name || effectiveBank?.accountName || companyName || ''
  const bankAccountNo = effectiveBank?.account_no || effectiveBank?.accountNo || ''
  const bankIfsc = effectiveBank?.ifsc_code || effectiveBank?.ifscCode || ''
  const bankImageUrl = effectiveBank?.bank_image_url || effectiveBank?.bankImageUrl || quotation.bank_image_url || liveBankImg || ''
  const signatureUrl = effectiveSettings?.signature_url || effectiveSettings?.signatureUrl || quotation.signature_url || liveSignUrl || ''
  
  const defaultTermsList = (Array.isArray(effectiveSettings?.terms_conditions) && effectiveSettings.terms_conditions.length > 0)
    ? effectiveSettings.terms_conditions
    : (Array.isArray(snapshot?.terms_conditions) && snapshot.terms_conditions.length > 0)
    ? snapshot.terms_conditions
    : (liveTerms && liveTerms.length > 0)
    ? liveTerms
    : [
      'Quotation valid for 15 days from the date of issue unless specified otherwise.',
      'Prices are inclusive of standard applicable taxes where mentioned.',
      'Warranty as per manufacturer norms & directly claimable with authorized service centers.',
      'Delivery timeline subject to stock availability upon confirmation.'
    ]

  const items = Array.isArray(quotation.items) ? quotation.items : []
  const isGstQuotation = quotation.quotation_type === 'GST' || (!quotation.quotation_type && parseFloat(quotation.total_tax || 0) > 0)
  const isIntraState = !quotation.place_of_supply || quotation.place_of_supply.includes('33') || quotation.place_of_supply.toLowerCase().includes('tamil nadu')

  const totalQty = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0)
  const totalTaxAmt = isGstQuotation ? items.reduce((sum, it) => sum + (parseFloat(it.tax_amount) || 0), 0) : 0
  const totalGrossAmt = items.reduce((sum, it) => sum + (parseFloat(it.amount) || (parseFloat(it.quantity || 0) * parseFloat(it.rate || 0))), 0)
  const totalDiscountSavings = items.reduce((sum, it) => sum + ((parseFloat(it.discount_amount) || 0) * (parseFloat(it.quantity) || 1)), 0)
  const totalGrossOrigAmt = items.reduce((sum, it) => sum + (((parseFloat(it.original_rate) || parseFloat(it.rate) || 0)) * (parseFloat(it.quantity) || 1)), 0)

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatQty = (qty) => {
    const num = parseFloat(qty) || 0
    return num % 1 === 0 ? parseInt(num, 10) : num
  }

  const paginatedPages = paginateQuotationItems(items)

  return (
    <div id="quotation-printable-area" className="w-full">
      {paginatedPages.map((page) => (
        <TemplatePageShell
          key={page.pageIndex}
          pageIndex={page.pageIndex}
          totalPages={page.totalPages}
        >
          {/* Main Content Area */}
          <div className="relative z-10 px-7 pt-6 pb-2 space-y-3 flex-1">
            {/* Header with branding */}
            <TemplateHeader
              companyName={companyName}
              companyGstin={companyGstin}
              companyPhone={companyPhone}
              companyEmail={companyEmail}
              companyAddress={companyAddress}
            />

            {/* Quotation Meta Bar */}
            <TemplateMetaBar
              docNumberLabel="QUOTATION NUMBER:"
              docNumber={quotation.quotation_number}
              dateLabel="QUOTATION DATE:"
              dateValue={formatDate(quotation.quotation_date)}
            />

            {/* Customer Details Box (QUOTATION FOR & SHIP TO) */}
            <TemplatePartyBox
              mode="two-column"
              billTitle="QUOTATION FOR (PROPOSAL TO)"
              customerName={quotation.customer_name}
              customerAddress={quotation.customer_address}
              customerPhone={quotation.customer_phone}
              customerEmail={quotation.customer_email}
              placeOfSupply={quotation.place_of_supply}
              customerGstin={quotation.customer_gstin}
              copyType="OFFICIAL ESTIMATE"
              shipTitle="DELIVERY / SITE ADDRESS"
              deliveryAddress={quotation.delivery_address}
              sameAsBilling={quotation.same_as_billing}
            />

            {/* --- LINE ITEMS TABLE --- */}
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
                            Ref: {item.serial_number}
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
                        {isGstQuotation && parseFloat(item.tax_amount || 0) > 0 ? (
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

            {/* --- SUMMARY (DIRECTLY UNDER TABLE) --- */}
            {page.showSummary && (
              <TemplateSummaryGrid
                hideBankDetails={true}
                hideQrCode={true}
                termsList={defaultTermsList}
                totalDiscountSavings={totalDiscountSavings}
                totalGrossOrigAmt={totalGrossOrigAmt}
                taxableAmount={quotation.taxable_amount}
                isGstInvoice={isGstQuotation}
                isIntraState={isIntraState}
                cgstRate={quotation.cgst_rate || effectiveSettings?.cgst_rate || 9}
                cgstAmount={quotation.cgst_amount}
                sgstRate={quotation.sgst_rate || effectiveSettings?.sgst_rate || 9}
                sgstAmount={quotation.sgst_amount}
                igstRate={quotation.igst_rate || effectiveSettings?.igst_rate || 18}
                igstAmount={quotation.igst_amount}
                roundOff={quotation.round_off}
                totalAmount={quotation.total_amount}
                amountInWords={quotation.amount_in_words}
                totalLabel="Quotation Total"
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
