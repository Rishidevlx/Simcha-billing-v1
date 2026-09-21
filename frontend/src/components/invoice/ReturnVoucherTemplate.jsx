import React from 'react'
import logoImg from '../../assets/Logo/Logo-bg-remove.png'
import { Phone, Mail, MapPin, CheckCircle2, RotateCcw, CreditCard, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function ReturnVoucherTemplate({ returnItem, settings }) {
  if (!returnItem) return null

  const companyName = settings?.company_name || 'SIMCHA INFO SOLUTIONS'
  const companyGstin = settings?.gstin || '33GEZPM1178G1ZY'
  const companyPhone = settings?.phone || '8122022060'
  const companyEmail = settings?.email || 'simchainfosolutions@gmail.com'
  const companyAddress = settings?.address || '7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.'

  const isPassed = returnItem.qc_condition === 'PASS' || returnItem.qc_condition === 'Good'
  const isDefective = !isPassed && returnItem.qc_status !== 'Pending QC'

  return (
    <div id="return-slip-printable-area" className="w-full bg-white text-[#292424] font-['Poppins',sans-serif]">
      <div className="invoice-page relative bg-white text-[#292424] w-full max-w-[210mm] min-h-[297mm] mx-auto p-8 flex flex-col justify-between box-border">
        
        {/* Header Section with Company Branding */}
        <div>
          <div className="flex items-start justify-between pb-4 border-b-2 border-[#043486]">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Simcha Logo" className="h-16 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#043486] uppercase">
                  {companyName}
                </h1>
                <div className="text-[11px] text-gray-600 space-y-0.5 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#043486] shrink-0" />
                    <span>{companyAddress}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-[#043486]" /> {companyPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-[#043486]" /> {companyEmail}
                    </span>
                    <span className="font-semibold text-[#043486]">
                      GSTIN: {companyGstin}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Title Badge */}
            <div className="text-right">
              <div className="inline-block px-3 py-1.5 bg-[#043486] text-white font-black text-xs uppercase tracking-widest">
                RETURN VOUCHER SLIP
              </div>
              <div className="text-[11px] font-mono font-bold text-gray-700 mt-1">
                {returnItem.return_number}
              </div>
            </div>
          </div>

          {/* Return & Customer Info Banner */}
          <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Customer Details:
              </div>
              <div className="text-sm font-bold text-gray-900">
                {returnItem.customer_name}
              </div>
              <div className="text-gray-600 font-mono">
                Phone: <b>{returnItem.customer_phone || 'N/A'}</b>
              </div>
              <div className="text-gray-600 font-mono">
                Original Bill / Invoice #: <b>{returnItem.bill_number || 'N/A'}</b>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Voucher Details:
              </div>
              <div>
                Return Date:{' '}
                <b>
                  {returnItem.return_date
                    ? new Date(returnItem.return_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '-'}
                </b>
              </div>
              <div>
                QC Status: <b className="text-[#043486] uppercase">{returnItem.qc_status}</b>
              </div>
              {returnItem.resolution_ref && (
                <div className="font-mono text-emerald-700">
                  Ref / CN No: <b>{returnItem.resolution_ref}</b>
                </div>
              )}
            </div>
          </div>

          {/* Product & Return Item Table */}
          <table className="w-full text-left border-collapse border border-gray-300 text-xs my-4">
            <thead>
              <tr className="bg-[#043486] text-white uppercase text-[10px] tracking-wider">
                <th className="p-2.5 border border-gray-300 w-12 text-center">S.No</th>
                <th className="p-2.5 border border-gray-300">Product Description</th>
                <th className="p-2.5 border border-gray-300 text-center w-20">Quantity</th>
                <th className="p-2.5 border border-gray-300">Returned Serial #</th>
                <th className="p-2.5 border border-gray-300">Replacement Serial #</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-gray-300 text-center font-mono font-bold">1</td>
                <td className="p-3 border border-gray-300">
                  <div className="font-bold text-gray-900">{returnItem.item_name}</div>
                  <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                    Reason: {returnItem.reason}
                  </div>
                </td>
                <td className="p-3 border border-gray-300 text-center font-bold">
                  {parseFloat(returnItem.quantity || 1).toFixed(2)} {returnItem.unit || 'Nos'}
                </td>
                <td className="p-3 border border-gray-300 font-mono font-bold text-gray-800">
                  {returnItem.serial_number || '—'}
                </td>
                <td className="p-3 border border-gray-300 font-mono font-bold text-emerald-700">
                  {returnItem.replacement_serial || '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Quality Inspection & Resolution Details */}
          <div className="my-5 p-4 border border-gray-300 bg-gray-50/60 text-xs space-y-3">
            <div className="text-[11px] uppercase font-bold text-gray-700 border-b border-gray-200 pb-1.5 flex items-center justify-between">
              <span>Quality Check (QC) &amp; Warranty Resolution</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                  isPassed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isDefective
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                QC Condition: {returnItem.qc_condition || 'Pending Inspection'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-gray-500 block text-[11px]">Resolution Action:</span>
                <span className="font-bold text-gray-900 uppercase">
                  {returnItem.qc_decision === 'REPLACE'
                    ? 'Exchange / Replacement Dispatched'
                    : returnItem.qc_decision === 'REFUND'
                    ? 'Credit Note Issued for Refund'
                    : returnItem.qc_decision === 'STOCK'
                    ? 'Restocked to Live Inventory'
                    : returnItem.qc_decision === 'REJECT'
                    ? 'Return Request Rejected'
                    : 'Pending Inspection'}
                </span>
              </div>

              {returnItem.refund_amount > 0 && (
                <div>
                  <span className="text-gray-500 block text-[11px]">Refund / Credit Note Value:</span>
                  <span className="font-mono font-bold text-purple-700 text-sm">
                    ₹{parseFloat(returnItem.refund_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {returnItem.qc_notes && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">QC Findings / Technician Observation:</span>
                <p className="text-gray-700 italic mt-0.5">"{returnItem.qc_notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer & Signature Section */}
        <div className="pt-8 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-8 text-xs text-center">
            <div>
              <div className="h-16"></div>
              <div className="border-t border-dashed border-gray-400 pt-1 font-semibold text-gray-700">
                Customer Signature
              </div>
            </div>

            <div>
              <div className="h-16"></div>
              <div className="border-t border-dashed border-gray-400 pt-1 font-semibold text-[#043486]">
                For {companyName} (Authorized Signatory)
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 text-center mt-6">
            This is a computer-generated Return Voucher Slip issued under standard warranty &amp; billing policy.
          </div>
        </div>

      </div>
    </div>
  )
}
