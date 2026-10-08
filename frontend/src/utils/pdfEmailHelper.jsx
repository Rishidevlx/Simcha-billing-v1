import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import InvoiceTemplate from '../components/invoice/InvoiceTemplate'
import ServiceInvoiceTemplate from '../components/invoice/ServiceInvoiceTemplate'
import ReceiptTemplate from '../components/receipt/ReceiptTemplate'
import QuotationTemplate from '../components/quotation/QuotationTemplate'
import ServiceReceiptTemplate from '../components/receipt/ServiceReceiptTemplate'

import { ThemeProvider } from '../context/ThemeContext'
import { SettingsProvider } from '../context/SettingsContext'

/**
 * Universal Offscreen PDF Generator to Base64 String
 * Renders any React template component in off-screen DOM, computes high-res PDF canvas, and outputs Base64.
 */
export async function generatePdfBase64FromComponent(Component, props = {}) {
  // Ensure document fonts (Poppins, Inter, etc.) are ready
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
  } catch {}

  const container = document.createElement('div')
  container.id = `offscreen-pdf-renderer-${Date.now()}`
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = '794px' // Exact A4 pixel width (210mm @ 96dpi)
  container.style.minWidth = '794px'
  container.style.maxWidth = '794px'
  container.style.backgroundColor = '#ffffff'
  container.style.zIndex = '-99999'
  container.style.opacity = '0'
  container.style.pointerEvents = 'none'
  container.style.overflow = 'visible'
  document.body.appendChild(container)

  const root = createRoot(container)

  try {
    root.render(
      <SettingsProvider>
        <ThemeProvider>
          <Component {...props} />
        </ThemeProvider>
      </SettingsProvider>
    )

    // Wait for React DOM update and layout calculation
    await new Promise((r) => setTimeout(r, 250))

    // Wait for all images inside container (logos, watermarks, stamps, signatures, QR) to fully load
    const images = Array.from(container.querySelectorAll('img'))
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
            setTimeout(resolve, 1500)
          })
        })
      )
    }

    // Additional settling delay for CSS geometry
    await new Promise((r) => setTimeout(r, 120))

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageElements = container.querySelectorAll('.invoice-page, .quotation-page, .receipt-page')
    if (pageElements && pageElements.length > 0) {
      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i]
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          windowWidth: 794,
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
        windowWidth: 794,
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
 * Generate Base64 PDF for Service Invoice
 */
export async function generateServiceInvoicePdfBase64(service, settings = {}) {
  return generatePdfBase64FromComponent(ServiceInvoiceTemplate, {
    service,
    items: service.items || [],
    settings,
    company: settings
  })
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
  let snapshot = service.company_snapshot
  if (typeof snapshot === 'string') {
    try { snapshot = JSON.parse(snapshot) } catch { snapshot = null }
  }

  let parsedServiceQtnTerms = []
  if (Array.isArray(snapshot?.service_quotation_terms) && snapshot.service_quotation_terms.length > 0) {
    parsedServiceQtnTerms = snapshot.service_quotation_terms
  } else if (Array.isArray(settings?.service_quotation_terms) && settings.service_quotation_terms.length > 0) {
    parsedServiceQtnTerms = settings.service_quotation_terms
  } else if (typeof settings?.service_quotation_terms === 'string') {
    try { parsedServiceQtnTerms = JSON.parse(settings.service_quotation_terms) } catch { parsedServiceQtnTerms = [] }
  }

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

  const cleanSnapshot = snapshot ? {
    ...snapshot,
    service_quotation_terms: parsedServiceQtnTerms.length > 0 ? parsedServiceQtnTerms : undefined,
    quotation_terms: parsedServiceQtnTerms.length > 0 ? parsedServiceQtnTerms : undefined,
    terms_conditions: parsedServiceQtnTerms.length > 0 ? parsedServiceQtnTerms : undefined,
    service_terms: undefined
  } : null

  const quotationData = {
    ...service,
    company_snapshot: cleanSnapshot,
    is_service: true,
    quotation_number: service.quotation_number || service.service_quotation_number || service.service_number,
    quotation_date: service.service_date,
    service_quotation_terms: parsedServiceQtnTerms.length > 0 ? parsedServiceQtnTerms : undefined,
    quotation_terms: parsedServiceQtnTerms.length > 0 ? parsedServiceQtnTerms : undefined,
    terms_conditions: parsedServiceQtnTerms.length > 0 ? parsedServiceQtnTerms : undefined,
    valid_until: null,
    items: mappedItems
  }

  return generatePdfBase64FromComponent(QuotationTemplate, { quotation: quotationData, settings })
}
