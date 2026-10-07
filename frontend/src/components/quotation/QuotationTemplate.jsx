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
  
  const isServiceQuotation = quotation.is_service || !!quotation.service_number || (typeof quotation.quotation_number === 'string' && (quotation.quotation_number.includes('SIS-QTN-S') || quotation.quotation_number.includes('SIS-SR')))
  
  let resolvedTerms = null
  if (isServiceQuotation) {
    if (Array.isArray(quotation.service_quotation_terms) && quotation.service_quotation_terms.length > 0) {
      resolvedTerms = quotation.service_quotation_terms
    } else if (Array.isArray(snapshot?.service_quotation_terms) && snapshot.service_quotation_terms.length > 0) {
      resolvedTerms = snapshot.service_quotation_terms
    } else if (Array.isArray(settings?.service_quotation_terms) && settings.service_quotation_terms.length > 0) {
      resolvedTerms = settings.service_quotation_terms
    } else if (Array.isArray(liveSettings?.service_quotation_terms) && liveSettings.service_quotation_terms.length > 0) {
      resolvedTerms = liveSettings.service_quotation_terms
    } else if (typeof liveSettings?.service_quotation_terms === 'string') {
      try {
        const parsed = JSON.parse(liveSettings.service_quotation_terms)
        if (Array.isArray(parsed) && parsed.length > 0) resolvedTerms = parsed
      } catch {}
    } else if (typeof settings?.service_quotation_terms === 'string') {
      try {
        const parsed = JSON.parse(settings.service_quotation_terms)
        if (Array.isArray(parsed) && parsed.length > 0) resolvedTerms = parsed
      } catch {}
    }
  } else {
    // Normal Sales Quotation
    if (Array.isArray(quotation.quotation_terms) && quotation.quotation_terms.length > 0) {
      resolvedTerms = quotation.quotation_terms
    } else if (Array.isArray(snapshot?.quotation_terms) && snapshot.quotation_terms.length > 0) {
      resolvedTerms = snapshot.quotation_terms
    } else if (Array.isArray(settings?.quotation_terms) && settings.quotation_terms.length > 0) {
      resolvedTerms = settings.quotation_terms
    } else if (Array.isArray(liveSettings?.quotation_terms) && liveSettings.quotation_terms.length > 0) {
      resolvedTerms = liveSettings.quotation_terms
    } else if (Array.isArray(snapshot?.terms_conditions) && snapshot.terms_conditions.length > 0) {
      resolvedTerms = snapshot.terms_conditions
    } else if (Array.isArray(settings?.terms_conditions) && settings.terms_conditions.length > 0) {
      resolvedTerms = settings.terms_conditions
    } else if (liveTerms && liveTerms.length > 0) {
      resolvedTerms = liveTerms
    }
  }

  const defaultTermsList = resolvedTerms || []

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
              billTitle="Customer Details"
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
                    <th className={`py-1.5 px-2.5 border-r border-gray-300 ${isServiceQuotation ? 'w-[45%]' : 'w-[33%]'}`}>
                      {isServiceQuotation ? 'ITEMS / SERVICES' : 'ITEMS'}
                    </th>
                    {!isServiceQuotation && (
                      <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[11%]">HSN/SAC</th>
                    )}
                    <th className={`py-1.5 px-2 border-r border-gray-300 text-center ${isServiceQuotation ? 'w-[12%]' : 'w-[9%]'}`}>QTY</th>
                    {!isServiceQuotation && (
                      <th className="py-1.5 px-2 border-r border-gray-300 text-center w-[8%]">DISC (%)</th>
                    )}
                    <th className={`py-1.5 px-2 border-r border-gray-300 text-right ${isServiceQuotation ? 'w-[12%]' : 'w-[12%]'}`}>RATE (₹)</th>
                    <th className={`py-1.5 px-2 border-r border-gray-300 text-right ${isServiceQuotation ? 'w-[12%]' : 'w-[10%]'}`}>TAX</th>
                    <th className={`py-1.5 px-2.5 text-right ${isServiceQuotation ? 'w-[14%]' : 'w-[12%]'}`}>AMOUNT (₹)</th>
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
                        {item.reported_issue && (
                          <div className="text-[9.5px] text-gray-500 font-medium">
                            Issue: {item.reported_issue}
                          </div>
                        )}
                        {item.category_name && !item.reported_issue && (
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
                      {!isServiceQuotation && (
                        <td className="py-2 px-2 border-r border-gray-300 text-center font-mono align-top text-gray-700">
                          {item.hsn_code || '-'}
                        </td>
                      )}
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-semibold align-top text-[#292424]">
                        {formatQty(item.quantity)} Unit
                      </td>
                      {!isServiceQuotation && (
                        <td className="py-2 px-2 border-r border-gray-300 text-center font-mono align-top">
                          {(item.has_discount || parseFloat(item.discount_percent || 0) > 0) ? (
                            <span className="font-bold text-emerald-700">
                              {parseFloat(item.discount_percent || 0)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
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
                    {isServiceQuotation ? (
                      <tr className="bg-[#f3f4f6] border-t border-gray-300 font-bold text-[10.5px] text-[#292424]">
                        <td colSpan={2} className="py-1.5 px-2.5 border-r border-gray-300 uppercase text-[#292424]">SUB TOTAL</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-center font-mono text-[#292424]">{formatQty(totalQty)} Unit</td>
                        <td className="border-r border-gray-300" />
                        <td className="py-1.5 px-2 border-r border-gray-300 text-right font-mono text-gray-800">
                          ₹ {totalTaxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-[#292424] font-black">
                          ₹ {totalGrossAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ) : (
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
                    )}
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
