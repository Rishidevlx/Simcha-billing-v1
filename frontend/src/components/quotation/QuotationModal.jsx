import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Printer,
  Download,
  X,
  FileText,
  Copy,
  Check
} from '../common/icons'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import Swal from 'sweetalert2'
import QuotationTemplate from './QuotationTemplate'
import { API_ENDPOINTS } from '../../config/api'

export default function QuotationModal({ isOpen, onClose, quotation, settings, onQuotationUpdated }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [copied, setCopied] = useState(false)
  const quotationContainerRef = useRef(null)

  if (!isOpen || !quotation) return null

  // Trigger Native Browser Print Dialog
  const handlePrint = () => {
    window.print()
  }

  // Generate & Download PDF using html2canvas-pro & jsPDF
  const handleDownloadPdf = async () => {
    const element = document.getElementById('quotation-printable-area')
    if (!element) return

    setIsGeneratingPdf(true)
    const fileName = `${quotation.quotation_number || 'Quotation'}_${(quotation.customer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageElements = element.querySelectorAll('.invoice-page')
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
        title: `PDF Downloaded: ${fileName}`
      })
    } catch (err) {
      console.error('Error generating PDF:', err)
      Swal.fire({
        icon: 'error',
        title: 'PDF Generation Failed',
        text: err.message || 'Unable to download PDF.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleCopyQuotationNumber = () => {
    if (quotation.quotation_number) {
      navigator.clipboard.writeText(quotation.quotation_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static font-['Poppins',sans-serif]">
      
      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 text-[#292424] dark:text-white rounded-none border border-gray-300 dark:border-slate-700 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none print:max-w-none print:w-full print:bg-white print:text-black">
        
        {/* Modal Toolbar */}
        <div className="px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          
          {/* Left Title & Quotation Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-none">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#292424] dark:text-white tracking-wide uppercase">
                  Quotation Preview
                </h2>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-mono font-bold">
                  {quotation.quotation_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopyQuotationNumber}
                  title="Copy Quotation No"
                  className="text-gray-400 hover:text-[#043486] dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Customer: <span className="text-gray-800 dark:text-slate-200 font-semibold">{quotation.customer_name}</span> &nbsp;|&nbsp; Estimated Total: <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">₹{parseFloat(quotation.total_amount || 0).toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-semibold text-xs rounded-none border border-gray-300 dark:border-slate-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Download as PDF"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-[#043486] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={14} className="text-[#043486] dark:text-blue-400" />
              )}
              <span>{isGeneratingPdf ? 'Generating...' : 'PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-xs rounded-none shadow-xs hover:shadow transition-all cursor-pointer"
              title="Print Quotation"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer ml-1"
              title="Close Preview"
            >
              <X size={18} />
            </button>

          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#eaedf2] dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div ref={quotationContainerRef} className="print:w-full">
            <QuotationTemplate quotation={quotation} settings={settings} />
          </div>
        </div>

      </div>

      {/* Direct Printable Quotation Portal for window.print() */}
      {typeof document !== 'undefined' && createPortal(
        <div id="quotation-print-wrapper">
          <QuotationTemplate quotation={quotation} settings={settings} />
        </div>,
        document.body
      )}

    </div>
  )
}
