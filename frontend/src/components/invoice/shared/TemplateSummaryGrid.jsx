import React from 'react'

export default function TemplateSummaryGrid({
  // Bank Details
  bankAccountName = '',
  bankName = '',
  bankAccountNo = '',
  bankIfsc = '',
  bankBranch = '',
  bankImageUrl = '',
  // Terms & Conditions
  termsList = [],
  // Calculation / Tax Breakdown
  totalDiscountSavings = 0,
  totalGrossOrigAmt = 0,
  taxableAmount = 0,
  isGstInvoice = false,
  isIntraState = true,
  cgstRate = 9,
  cgstAmount = 0,
  sgstRate = 9,
  sgstAmount = 0,
  igstRate = 18,
  igstAmount = 0,
  roundOff = 0,
  totalAmount = 0,
  amountInWords = '',
  totalLabel = 'Invoice Total',
  // Authorized Signatory
  signatureUrl = '',
  companyName = '',
  // Custom slot overrides
  customLeftContent = null,
  customCenterContent = null,
  customTaxRows = null
}) {
  return (
    <div className="grid grid-cols-12 gap-4 pt-2 text-[#292424]">
      {/* Left Column (5/12): Bank Details & Terms & Conditions */}
      <div className="col-span-5 space-y-2.5">
        {customLeftContent || (
          <>
            {/* Bank Details */}
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

            {/* Terms & Conditions */}
            {termsList && termsList.length > 0 && (
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
            )}
          </>
        )}
      </div>

      {/* Center Column (3/12): Scan to Pay & Large QR */}
      <div className="col-span-3 flex flex-col items-center justify-start text-center pt-1">
        {customCenterContent || (
          <>
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
          </>
        )}
      </div>

      {/* Right Column (4/12): Tax Breakdown, Discount Savings & Totals */}
      <div className="col-span-4 flex flex-col justify-between text-[#292424] pl-1">
        {/* Tax Computation Table */}
        <div className="space-y-0.5 text-[10.5px]">
          {customTaxRows || (
            <>
              {totalDiscountSavings > 0 && (
                <>
                  <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                    <span>Gross Amount</span>
                    <span className="font-mono text-[#292424]">
                      ₹ {parseFloat(totalGrossOrigAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 text-[10.5px] font-bold text-emerald-700">
                    <span>Discount Savings</span>
                    <span className="font-mono">
                      - ₹ {parseFloat(totalDiscountSavings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-gray-700 py-0.5">
                <span>Taxable Amount</span>
                <span className="font-mono font-semibold text-[#292424]">
                  ₹ {parseFloat(taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {isGstInvoice && (
                <>
                  {isIntraState ? (
                    <>
                      <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                        <span>CGST ({cgstRate}%)</span>
                        <span className="font-mono text-[#292424]">
                          ₹ {parseFloat(cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                        <span>SGST ({sgstRate}%)</span>
                        <span className="font-mono text-[#292424]">
                          ₹ {parseFloat(sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-gray-700 py-0.5 text-[10px]">
                      <span>IGST ({igstRate}%)</span>
                      <span className="font-mono text-[#292424]">
                        ₹ {parseFloat(igstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </>
              )}

              {roundOff && parseFloat(roundOff) !== 0 && (
                <div className="flex justify-between text-gray-500 py-0.5 text-[10px]">
                  <span>Round Off</span>
                  <span className="font-mono text-[#292424]">
                    {parseFloat(roundOff) > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Grand Total Row */}
          <div className="border-t border-b border-gray-400 py-1 my-0.5 flex justify-between items-center text-xs font-black text-[#292424]">
            <span>{totalLabel}</span>
            <span className="text-sm font-mono font-black">
              ₹ {parseFloat(totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Amount in Words */}
          {amountInWords && (
            <div className="pt-0.5 text-[9px] text-gray-600 leading-tight">
              <strong className="text-gray-800">In Words: </strong>
              <span className="italic text-[#292424] font-medium capitalize">
                {amountInWords}
              </span>
            </div>
          )}
        </div>

        {/* Authorized Signatory Block */}
        <div className="pt-2 text-center space-y-0.5">
          {signatureUrl && (
            <div className="flex justify-center items-center h-10 mb-1">
              <img
                src={signatureUrl}
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
  )
}
