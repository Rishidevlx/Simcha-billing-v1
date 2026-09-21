import React from 'react'
import logoImg from '../../assets/Logo/Logo-bg-remove.png'
import faviconWatermark from '../../assets/Logo/Favicon.jpeg'
import { Phone, Mail, MapPin } from 'lucide-react'

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

export default function ReceiptTemplate({ bill, settings }) {
  if (!bill) return null

  // Resolve dynamic settings with fallbacks
  const companyName = settings?.company_name || 'SIMCHA INFO SOLUTIONS'
  const companyGstin = settings?.gstin || '33GEZPM1178G1ZY'
  const companyPhone = settings?.phone || '8122022060'
  const companyEmail = settings?.email || 'simchainfosolutions@gmail.com'
  const companyAddress = settings?.address || '7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.'

  const defaultTermsList = Array.isArray(settings?.terms_conditions) && settings.terms_conditions.length > 0
    ? settings.terms_conditions
    : [
      'Warranty as per manufacturer’s norms & should be claimed directly.',
      'Warranty claim takes 1 to 8 weeks.',
      'Please carry receipt copy for warranty.',
      'Goods Once Sold will not be taken back or exchanged.'
    ]

  const items = Array.isArray(bill.items) ? bill.items : []
  const hasReturnableItems = items.some(it => it.return_policy === true || it.return_policy === 1 || it.return_policy === '1')
  const returnDays = settings?.return_days || 7
  const returnClause = `Products eligible for return must be returned within ${returnDays} days of purchase with original invoice copy.`

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
        <div
          key={page.pageIndex}
          className="receipt-page relative bg-white text-[#292424] font-['Poppins',sans-serif] w-full max-w-[210mm] min-h-[297mm] max-h-[297mm] h-[297mm] mx-auto p-0 flex flex-col justify-between shadow-lg print:shadow-none print:w-full print:max-w-none print:h-[297mm] print:min-h-[297mm] print:max-h-[297mm] text-[11.5px] leading-relaxed overflow-hidden box-border mb-8 print:mb-0"
          style={{
            pageBreakAfter: page.pageIndex < page.totalPages ? 'always' : 'avoid',
            breakAfter: page.pageIndex < page.totalPages ? 'page' : 'avoid',
            boxSizing: 'border-box'
          }}
        >
          {/* Subtle Watermark in Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.06]">
            <img
              src={faviconWatermark}
              alt="Simcha Watermark"
              className="w-80 max-w-full grayscale object-contain"
            />
          </div>

          {/* Page Main Content */}
          <div className="relative z-10 px-8 pt-7 flex-1 flex flex-col justify-start space-y-2">
            
            {/* --- PAGE 1: Full Official Letterhead Header --- */}
            {page.isFirstPage ? (
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-4">
                  {/* Top Left: Logo & Company Address */}
                  <div className="flex items-start gap-4">
                    <img
                      src={logoImg}
                      alt="Simcha Logo"
                      className="h-20 w-auto object-contain shrink-0 -mt-1"
                    />
                    <div className="space-y-0.5">
                      <h1 className="text-xl font-black text-[#043486] tracking-tight leading-none">
                        {companyName}
                      </h1>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider pt-0.5">
                        IT CONSULTING | HARDWARE &amp; SOFTWARE SOLUTIONS | SALES &amp; SERVICE
                      </p>
                      <p className="text-[10px] text-gray-600 leading-normal truncate max-w-lg">
                        {companyAddress}
                      </p>
                      <p className="text-[10px] text-gray-700 font-medium">
                        <strong>Mobile:</strong> {companyPhone} &nbsp;|&nbsp; <strong>Email:</strong> {companyEmail}
                      </p>
                    </div>
                  </div>

                  {/* Top Right: GSTIN Header */}
                  <div className="text-right shrink-0 pt-0.5">
                    <div className="text-xs font-bold text-[#292424] font-mono tracking-wide">
                      <span className="text-gray-500 font-bold font-sans text-[11px]">GSTIN: </span>
                      {companyGstin}
                    </div>
                  </div>
                </div>

                {/* Thin Divider Rule */}
                <div className="w-full h-[2px] bg-[#043486] mt-1.5" />
              </div>
            ) : (
              /* --- PAGE 2+: Compact Header --- */
              <div className="border-b-2 border-[#043486] pb-2 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={logoImg} alt="Simcha Logo" className="h-9 w-auto object-contain" />
                    <div>
                      <h2 className="text-sm font-black text-[#043486] tracking-tight leading-none">{companyName}</h2>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                        PAYMENT RECEIPT
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[10.5px] font-semibold text-gray-700">
                    <div><span className="text-gray-500 font-normal">Date: </span>{formatDate(new Date())}</div>
                    <div className="font-mono text-[9.5px] text-gray-500">GSTIN: {companyGstin}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Meta Bar */}
            <div className="bg-[#f3f4f6] border border-gray-300 px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-[#292424]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 uppercase font-semibold text-[10.5px]">RECEIPT NUMBER:</span>
                <span className="text-[#292424] font-mono text-sm font-black">{bill.receipt_number || bill.invoice_number}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 uppercase font-semibold text-[10.5px]">RECEIPT DATE:</span>
                <span className="text-[#292424] font-semibold text-[11.5px]">{formatDate(new Date())}</span>
              </div>
            </div>

            {/* Customer Details Box: Two Columns (RECEIVED FROM & DELIVERY ADDRESS) */}
            <div className="border border-gray-300 p-2.5 bg-white/80 text-[#292424]">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Left Column: RECEIVED FROM (BUYER) */}
                <div className="space-y-0.5 border-r border-gray-200 pr-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9.5px] font-black text-[#043486] uppercase tracking-wider block mb-0.5">
                        RECEIVED FROM (BILL TO)
                      </span>
                      <h3 className="text-[12.5px] font-bold text-[#292424]">
                        {bill.customer_name}
                      </h3>
                    </div>
                    {/* Copy Type Tag */}
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#292424] bg-gray-100 border border-gray-300 px-2 py-0.5 inline-block shrink-0">
                      {bill.copy_type === 'DUPLICATE' ? 'DUPLICATE' : (bill.copy_type === 'TRIPLICATE' ? 'TRIPLICATE' : 'ORIGINAL')}
                    </span>
                  </div>

                  {bill.customer_address && (
                    <p className="text-[10px] text-gray-700 leading-snug whitespace-pre-line mt-0.5">
                      {bill.customer_address}
                    </p>
                  )}
                  <div className="space-y-0.5 pt-1 text-[10px] font-medium text-gray-700">
                    {bill.customer_phone && (
                      <div><strong>Mobile:</strong> <span className="font-mono text-[#292424]">{bill.customer_phone}</span></div>
                    )}
                    {bill.customer_email && (
                      <div><strong>Email:</strong> <span className="text-[#292424]">{bill.customer_email}</span></div>
                    )}
                    <div><strong>Place of Supply:</strong> <span className="text-[#292424]">{bill.place_of_supply || '33-Tamil Nadu'}</span></div>
                    {bill.customer_gstin && (
                      <div><strong>GSTIN:</strong> <span className="font-mono font-bold uppercase text-[#292424]">{bill.customer_gstin}</span></div>
                    )}
                  </div>
                </div>

                {/* Right Column: SHIP TO / DELIVERY ADDRESS */}
                <div className="space-y-0.5 pl-1">
                  <span className="text-[9.5px] font-black text-[#043486] uppercase tracking-wider block mb-0.5">
                    DELIVERY / SHIPPING ADDRESS
                  </span>
                  <h3 className="text-[12.5px] font-bold text-[#292424]">
                    {bill.customer_name}
                  </h3>
                  <p className="text-[10px] text-gray-700 leading-snug whitespace-pre-line mt-0.5">
                    {bill.delivery_address && bill.delivery_address.trim() ? bill.delivery_address : (bill.customer_address || 'Same as billing address')}
                  </p>
                  <div className="space-y-0.5 pt-1 text-[10px] font-medium text-gray-700">
                    {bill.customer_phone && (
                      <div><strong>Contact:</strong> <span className="font-mono text-[#292424]">{bill.customer_phone}</span></div>
                    )}
                    <div><strong>Destination:</strong> <span className="text-[#292424]">{bill.place_of_supply || '33-Tamil Nadu'}</span></div>
                    <div className="text-[9px] text-gray-500 italic pt-0.5">
                      {(!bill.delivery_address || bill.same_as_billing || bill.delivery_address === bill.customer_address) ? '✓ Same as billing address' : '✓ Separate Delivery Destination'}
                    </div>
                  </div>
                </div>

              </div>
            </div>

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
                          <div className="text-[9.5px] text-gray-500 font-medium leading-tight">
                            [{item.category_name}]
                          </div>
                        )}
                        {item.serial_number && (
                          <div className="text-[9.5px] font-mono font-semibold text-gray-800 leading-tight mt-0.5">
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

            {/* --- SUMMARY SECTION (NO BANK DETAILS, NO QR CODE) --- */}
            {page.showSummary && (
              <div className="grid grid-cols-12 gap-6 pt-2 text-[#292424]">

                {/* Left Column (6/12): Terms & Conditions Only */}
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

                {/* Right Column (6/12): Tax Breakdown, Totals & Signatory */}
                <div className="col-span-6 flex flex-col justify-between text-[#292424] pl-2">
                  {/* Tax Computation Table */}
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

                    {/* Amount in words */}
                    {bill.amount_in_words && (
                      <div className="text-[9.5px] text-gray-600 leading-tight pt-0.5 capitalize">
                        <strong>Received (in words):</strong> {bill.amount_in_words}
                      </div>
                    )}
                  </div>

                  {/* Authorized Signatory */}
                  <div className="mt-4 text-center pt-2">
                    {(settings?.signature_url || bill.signature_url) && (
                      <div className="flex justify-center items-center h-10 mb-1">
                        <img
                          src={settings?.signature_url || bill.signature_url}
                          alt="Authorized Signature"
                          className="max-h-10 max-w-[140px] object-contain"
                        />
                      </div>
                    )}
                    <div className="inline-block border-t border-gray-400 pt-1 px-8 min-w-[190px]">
                      <p className="text-[9.5px] text-gray-600">Authorized signatory for</p>
                      <p className="text-[10.5px] font-black text-[#292424] uppercase tracking-wide">
                        {companyName}
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* --- 100% FULL-WIDTH FOOTER RIBBON (EXACT SIMCHA LETTERHEAD DESIGN) --- */}
          <div className="w-full bg-[#043486] text-white px-8 py-2.5 flex items-center justify-between text-[9.5px] font-medium tracking-wide z-10 shrink-0">
            {/* Left Contact Pills */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0 shadow-xs">
                  <Phone size={10} className="stroke-[2.5]" />
                </div>
                <span className="font-semibold tracking-wider font-mono">+91 {companyPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0 shadow-xs">
                  <Mail size={10} className="stroke-[2.5]" />
                </div>
                <span className="tracking-wide">{companyEmail}</span>
              </div>
            </div>

            {/* Slanted Divider */}
            <div className="h-5 w-[1px] bg-blue-300/40 transform rotate-12 mx-2" />

            {/* Right Location Address */}
            <div className="flex items-center gap-4 max-w-md text-right">
              <div className="flex items-center gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0 shadow-xs">
                  <MapPin size={10} className="stroke-[2.5]" />
                </div>
                <span className="text-[9px] leading-tight text-blue-100 truncate max-w-xs">
                  {companyAddress}
                </span>
              </div>
            </div>
          </div>

        </div>
      ))}
    </div>
  )
}
