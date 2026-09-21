import React from 'react'
import logoImg from '../../assets/Logo/Logo-bg-remove.png'
import faviconWatermark from '../../assets/Logo/Favicon.jpeg'
import { Phone, Mail, MapPin } from 'lucide-react'

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

export default function ServiceInvoiceTemplate({ service, bill, settings }) {
  const data = service || bill
  if (!data) return null

  // Resolve dynamic settings with fallbacks
  const companyName = settings?.company_name || 'SIMCHA INFO SOLUTIONS'
  const companyGstin = settings?.gstin || '33GEZPM1178G1ZY'
  const companyPhone = settings?.phone || '8122022060'
  const companyEmail = settings?.email || 'simchainfosolutions@gmail.com'
  const companyAddress = settings?.address || '7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.'

  const bankName = settings?.bank_name || 'Canara Bank'
  const bankBranch = settings?.branch || 'Peelamedu'
  const bankAccountName = settings?.account_name || 'Simcha Info Solutions'
  const bankAccountNo = settings?.account_no || '120041754011'
  const bankIfsc = settings?.ifsc_code || 'CNRB0002732'
  const bankImageUrl = settings?.bank_image_url || ''
  
  const defaultTermsList = Array.isArray(settings?.terms_conditions) && settings.terms_conditions.length > 0
    ? settings.terms_conditions
    : [
      'Warranty as per manufacturer’s norms & should be claimed directly.',
      'Service warranty 30 days applicable on reported issues only.',
      'Please carry service invoice copy for warranty claims.',
      'Replaced spare parts will not be returned unless requested prior.'
    ]

  const items = Array.isArray(data.items) ? data.items : []
  const hasReturnableItems = items.some(it => it.return_policy === true || it.return_policy === 1 || it.return_policy === '1')
  const returnDays = settings?.return_days || 7
  const returnClause = `Products eligible for return must be returned within ${returnDays} days of purchase with original invoice copy.`

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
        <div
          key={page.pageIndex}
          className="invoice-page relative bg-white text-[#292424] font-['Poppins',sans-serif] w-full max-w-[210mm] min-h-[297mm] max-h-[297mm] h-[297mm] mx-auto p-0 flex flex-col justify-between shadow-lg print:shadow-none print:w-full print:max-w-none print:h-[297mm] print:min-h-[297mm] print:max-h-[297mm] text-[11.5px] leading-relaxed overflow-hidden box-border mb-8 print:mb-0"
          style={{
            pageBreakAfter: page.pageIndex < page.totalPages ? 'always' : 'avoid',
            breakAfter: page.pageIndex < page.totalPages ? 'page' : 'avoid',
            boxSizing: 'border-box'
          }}
        >
          {/* Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.05]">
            <img
              src={faviconWatermark}
              alt="Favicon Watermark"
              className="w-[300px] max-w-full object-contain filter grayscale"
            />
          </div>

          {/* Main Content Area */}
          <div className="relative z-10 px-7 pt-6 pb-2 space-y-3 flex-1">

            {/* --- FIXED FULL HEADER FOR ALL PAGES --- */}
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-4 pt-0.5">
                {/* Left Large Logo + Branding */}
                <div className="flex items-start gap-3.5">
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
                  <div className="mt-1">
                    <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 bg-[#043486]/10 text-[#043486] border border-[#043486]/20">
                      SERVICE INVOICE
                    </span>
                  </div>
                </div>
              </div>

              {/* Thin Divider Rule */}
              <div className="w-full h-[2px] bg-[#043486] mt-1.5" />
            </div>

            {/* Service Meta Bar */}
            <div className="bg-[#f3f4f6] border border-gray-300 px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-[#292424]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 uppercase font-semibold text-[10.5px]">SERVICE INVOICE NUMBER:</span>
                <span className="text-[#292424] font-mono text-sm font-black">{data.service_number || data.invoice_number}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 uppercase font-semibold text-[10.5px]">SERVICE DATE:</span>
                <span className="text-[#292424] font-semibold text-[11.5px]">{formatDate(data.service_date || data.invoice_date)}</span>
              </div>
            </div>

            {/* Customer Bill To Details */}
            <div className="border border-gray-300 p-2.5 bg-white/80 text-[#292424]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[9.5px] font-black text-[#292424] uppercase tracking-wider block mb-0.5">
                    BILL TO / CLIENT
                  </span>
                  <h3 className="text-[13px] font-bold text-[#292424]">
                    {data.customer_name}
                  </h3>
                </div>

                {/* Copy Type Tag */}
                <div className="text-right shrink-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#292424] bg-gray-100 border border-gray-300 px-2.5 py-0.5 inline-block">
                    {data.copy_type === 'DUPLICATE' ? 'DUPLICATE' : (data.copy_type === 'TRIPLICATE' ? 'TRIPLICATE' : 'ORIGINAL')}
                  </span>
                </div>
              </div>

              {data.customer_address && (
                <p className="text-[10.5px] text-gray-700 leading-snug whitespace-pre-line mt-0.5">
                  {data.customer_address}
                </p>
              )}
              <div className="space-y-0.5 pt-1 text-[10.5px] font-medium text-gray-700">
                {data.customer_phone && (
                  <div>
                    <strong>Mobile:</strong> <span className="font-mono text-[#292424]">{data.customer_phone}</span>
                  </div>
                )}
                {data.customer_email && (
                  <div>
                    <strong>Email:</strong> <span className="text-[#292424]">{data.customer_email}</span>
                  </div>
                )}
                <div>
                  <strong>Place of Supply:</strong> <span className="text-[#292424]">{data.place_of_supply || '33-Tamil Nadu'}</span>
                </div>
                <div>
                  <strong>Customer Type:</strong> <span className="text-[#292424]">{data.customer_type || 'Individual'}</span>
                </div>
                {data.customer_gstin && (
                  <div>
                    <strong>Customer GSTIN:</strong> <span className="font-mono font-bold uppercase text-[#292424]">{data.customer_gstin}</span>
                  </div>
                )}
              </div>
            </div>

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
              <div className="grid grid-cols-12 gap-4 pt-2 text-[#292424]">

                {/* Left Column (5/12): Bank Details & Terms */}
                <div className="col-span-5 space-y-2.5">
                  <div className="space-y-0.5 text-[10.5px]">
                    <span className="font-black text-[#292424] uppercase tracking-wider block text-[10.5px] mb-0.5">
                      BANK DETAILS
                    </span>
                    <div className="space-y-0.5 text-gray-800 font-medium text-[10.5px]">
                      <div><strong>Beneficiary:</strong> {bankAccountName}</div>
                      <div><strong>Bank:</strong> {bankName}</div>
                      <div><strong>Account No:</strong> <span className="font-mono font-bold text-[#292424]">{bankAccountNo}</span></div>
                      <div><strong>IFSC Code:</strong> <span className="font-mono font-bold text-[#292424]">{bankIfsc}</span></div>
                      <div><strong>Branch:</strong> {bankBranch}</div>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-[9.5px] pt-1">
                    <span className="font-black text-[#292424] uppercase tracking-wider block text-[10px] mb-0.5">
                      TERMS &amp; CONDITIONS
                    </span>
                    <ol className="list-decimal list-inside space-y-0.5 text-gray-700 leading-snug">
                      {termsList.map((t, idx) => (
                        <li key={idx} className="leading-tight">{t}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Center Column (3/12): Scan to Pay */}
                <div className="col-span-3 flex flex-col items-center justify-start text-center pt-1">
                  <span className="text-[10px] font-black uppercase text-[#292424] tracking-wider mb-2">
                    SCAN TO PAY
                  </span>
                  {bankImageUrl ? (
                    <div className="flex items-center justify-center">
                      <img
                        src={bankImageUrl}
                        alt="Scan to Pay QR"
                        className="h-32 w-32 max-h-36 max-w-full object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="h-28 w-28 flex items-center justify-center text-[10px] text-gray-400 italic">
                      No QR Image
                    </div>
                  )}
                </div>

                {/* Right Column (4/12): Tax Breakdown, Totals & Signatory */}
                <div className="col-span-4 flex flex-col justify-between text-[#292424] pl-1">
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
                        <span className="font-mono text-[#292424]">{data.round_off > 0 ? `+₹${data.round_off}` : `-₹${Math.abs(data.round_off)}`}</span>
                      </div>
                    )}

                    <div className="border-t border-b border-gray-400 py-1 my-0.5 flex justify-between items-center text-xs font-black text-[#292424]">
                      <span>Service Total</span>
                      <span className="text-sm font-mono font-black">
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

                  {/* Authorized Signatory Block */}
                  <div className="pt-2 text-center space-y-0.5">
                    {(settings?.signature_url || data.signature_url) && (
                      <div className="flex justify-center items-center h-10 mb-1">
                        <img
                          src={settings?.signature_url || data.signature_url}
                          alt="Authorized Signature"
                          className="max-h-10 max-w-[140px] object-contain"
                        />
                      </div>
                    )}
                    <div className="w-full border-t border-gray-400 pt-1">
                      <p className="text-[9.5px] text-gray-600 font-medium">Authorized signatory for</p>
                      <p className="text-[10.5px] font-black text-[#043486] uppercase tracking-wide">
                        {companyName}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* --- FOOTER RIBBON --- */}
          <div className="w-full bg-[#043486] text-white py-2.5 px-7 mt-auto z-10 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-medium">
              <div className="space-y-0.5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0">
                    <Phone size={8.5} fill="#043486" />
                  </div>
                  <span className="font-semibold tracking-wide">+91 {companyPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0">
                    <Mail size={8.5} />
                  </div>
                  <span className="tracking-wide text-[9.5px]">{companyEmail}</span>
                </div>
              </div>

              <div className="h-7 w-[1.5px] bg-white/40 rotate-[25deg] mx-4 shrink-0" />

              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <div className="w-4 h-4 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0">
                  <MapPin size={8.5} fill="#043486" />
                </div>
                <span className="leading-tight text-[9.5px] text-blue-100">{companyAddress}</span>
              </div>
            </div>
          </div>

        </div>
      ))}
    </div>
  )
}
