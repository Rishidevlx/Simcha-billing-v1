import React, { useRef, useState } from 'react'
import {
  Printer,
  Download,
  X,
  FileCheck,
  Receipt
} from 'lucide-react'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import Swal from 'sweetalert2'
import ReceiptTemplate from './ReceiptTemplate'

export default function ReceiptModal({ isOpen, onClose, bill, settings }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  if (!isOpen || !bill) return null

  // Trigger Native Browser Print Dialog
  const handlePrint = () => {
    window.print()
  }

  // Generate & Download PDF using html2canvas-pro & jsPDF
  const handleDownloadPdf = async () => {
    const element = document.getElementById('receipt-printable-area')
    if (!element) return

    setIsGeneratingPdf(true)
    const receiptNo = bill.receipt_number || bill.invoice_number || 'REC'
    const fileName = `Receipt_${receiptNo.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(bill.customer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageElements = element.querySelectorAll('.receipt-page')
      if (pageElements && pageElements.length > 0) {
        for (let i = 0; i < pageElements.length; i++) {
          const pageEl = pageElements[i]
          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          })

          const imgData = canvas.toDataURL('image/jpeg', 0.98)
          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width

          if (i > 0) {
            pdf.addPage('a4', 'portrait')
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297))
        }
      } else {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/jpeg', 0.98)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297))
      }

      pdf.save(fileName)

      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: `Receipt PDF Downloaded: ${fileName}`
      })
    } catch (err) {
      console.error('Error generating PDF:', err)
      Swal.fire({
        icon: 'error',
        title: 'PDF Generation Failed',
        text: err.message || 'Unable to download PDF. You can also use the "Print Receipt" option to Save as PDF.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs font-['Poppins',sans-serif] overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      
      {/* Modal Card Container */}
      <div className="relative w-full max-w-5xl bg-slate-100 dark:bg-slate-900 rounded-none border border-slate-300 dark:border-slate-800 shadow-2xl flex flex-col max-h-[96vh] overflow-hidden my-auto print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white">
        
        {/* Modal Top Action Toolbar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-850 border-b border-gray-200 dark:border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-200 dark:border-purple-800">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>PAYMENT RECEIPT PREVIEW</span>
                <span className="font-mono text-purple-700 dark:text-purple-400 font-black">
                  #{bill.receipt_number || bill.invoice_number}
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Official payment receipt • Customer: {bill.customer_name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none shadow-sm transition-all cursor-pointer"
              title="Print Receipt"
            >
              <Printer size={15} />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 rounded-none shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Download High-Resolution PDF"
            >
              <Download size={15} />
              <span>{isGeneratingPdf ? 'Rendering PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-none hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Stage */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 dark:bg-slate-950/90 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div className="w-full max-w-[210mm] shadow-2xl bg-white print:shadow-none print:w-full">
            <ReceiptTemplate bill={bill} settings={settings} />
          </div>
        </div>

      </div>
    </div>
  )
}
