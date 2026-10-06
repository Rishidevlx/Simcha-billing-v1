import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import InvoiceTemplate from '../components/invoice/InvoiceTemplate'
import ReceiptTemplate from '../components/receipt/ReceiptTemplate'
import QuotationTemplate from '../components/quotation/QuotationTemplate'
import ServiceReceiptTemplate from '../components/receipt/ServiceReceiptTemplate'

/**
 * Universal Offscreen PDF Generator to Base64 String
 * Renders any React template component in off-screen DOM, computes high-res PDF canvas, and outputs Base64.
 */
export async function generatePdfBase64FromComponent(Component, props = {}) {
  const container = document.createElement('div')
  container.id = `offscreen-pdf-renderer-${Date.now()}`
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '210mm'
  container.style.backgroundColor = '#ffffff'
  container.style.zIndex = '-9999'
  container.style.pointerEvents = 'none'
  container.style.overflow = 'visible'
  document.body.appendChild(container)

  const root = createRoot(container)

  try {
    root.render(<Component {...props} />)

    // Wait for React DOM update
    await new Promise((r) => setTimeout(r, 200))

    // Wait for all images inside container (logos, watermarks, stamps, signatures) to fully load
    const images = Array.from(container.querySelectorAll('img'))
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )
    }

    // Additional short settling delay for fonts / layout
    await new Promise((r) => setTimeout(r, 100))

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageElements = container.querySelectorAll('.invoice-page')
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
      const canvas = await html2canvas(container, {
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

    const dataUri = pdf.output('datauristring')
    const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri
    return base64
  } finally {
    try {
      root.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    } catch (e) {
      console.warn('PDF offscreen cleanup note:', e)
    }
  }
}

/**
 * Generate Base64 PDF for Tax Invoice
 */
export async function generateInvoicePdfBase64(bill, settings = {}) {
  return generatePdfBase64FromComponent(InvoiceTemplate, { bill, settings })
}

/**
 * Generate Base64 PDF for Payment Receipt
 */
export async function generateReceiptPdfBase64(bill, settings = {}) {
  return generatePdfBase64FromComponent(ReceiptTemplate, { bill, settings })
}

/**
 * Generate Base64 PDF for Quotation
 */
export async function generateQuotationPdfBase64(quotation, settings = {}) {
  return generatePdfBase64FromComponent(QuotationTemplate, { quotation, settings })
}

/**
 * Generate Base64 PDF for Service Payment Receipt
 */
export async function generateServiceReceiptPdfBase64(service, settings = {}) {
  return generatePdfBase64FromComponent(ServiceReceiptTemplate, { service, bill: service, settings, company: settings })
}

/**
 * Generate Base64 PDF for Service Quotation
 */
export async function generateServiceQuotationPdfBase64(service, settings = {}) {
  const mappedItems = (service.items || []).map((it) => ({
    ...it,
    item_name: it.product_name || it.item_name || 'Service Item',
    name: it.product_name || it.item_name || 'Service Item',
    quantity: parseFloat(it.quantity) || 1,
    unit: it.unit || 'NOS',
    rate: parseFloat(it.rate) || 0,
    amount: parseFloat(it.amount) || 0,
    tax_rate: parseFloat(it.tax_rate) || 18,
    tax_amount: parseFloat(it.tax_amount) || 0,
    hsn_code: it.hsn_code || '9987',
    serial_number: it.serial_number || it.brand_model || ''
  }))

  const quotationData = {
    ...service,
    quotation_number: service.service_number,
    quotation_date: service.service_date,
    valid_until: null,
    items: mappedItems
  }

  return generatePdfBase64FromComponent(QuotationTemplate, { quotation: quotationData, settings })
}
