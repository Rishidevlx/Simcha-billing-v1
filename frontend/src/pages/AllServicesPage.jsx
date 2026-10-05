import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  Wrench,
  Search,
  Plus,
  Eye,
  Trash2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpDown,
  User,
  Phone,
  Building,
  FileText,
  X,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  Download,
  CheckSquare,
  Square,
  Send,
  FileCheck,
  FileDigit,
  AlertCircle,
  Hash,
  Pencil,
  RefreshCw,
  List,
  Receipt
} from '../components/common/icons'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import ServiceInvoiceTemplate from '../components/invoice/ServiceInvoiceTemplate'
import ServiceReceiptTemplate from '../components/receipt/ServiceReceiptTemplate'
import ListPageHeader from '../components/common/ListPageHeader'
import ListKpiCard from '../components/common/ListKpiCard'
import ListDateRangeFilter from '../components/common/ListDateRangeFilter'
import { Button, ActionButton, SearchInput, DataTable, Pagination, TabNav, TabButton } from '../components/ui'
import { API_ENDPOINTS } from '../config/api'
import { getUserPermissions } from '../utils/access'


// Local Date Helper to eliminate timezone UTC discrepancy (e.g. 2026-10-02T18:30:00Z -> 2026-10-03 in local IST)
const getLocalDateString = (dateVal) => {
  if (!dateVal) return ''
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim()
  }
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) {
    if (typeof dateVal === 'string') {
      return dateVal.slice(0, 10)
    }
    return ''
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const SERVICE_STATUS_STAGES = [
  'Received',
  'Quotations',
  'Quotation',
  'Customer Approval',
  'Approved',
  'Payment Received',
  'Repair In-Progress',
  'Ready',
  'Delivered',
  'Cancelled'
]

export const SERVICE_TABS = [
  {
    id: 'quotation_approval',
    label: 'Quotation & approval',
    description: 'Received, Quotations & Customer Approval',
    statuses: ['Received', 'Quotation', 'Quotations', 'Customer Approval', 'Draft'],
    allowedTransitions: ['Ready', 'Quotations', 'Approved', 'Cancel']
  },
  {
    id: 'repair_ready',
    label: 'Repair & ready',
    description: 'Approved, Repair In-Progress & Ready',
    statuses: ['Approved', 'Repair In-Progress', 'Ready', 'Payment Received'],
    allowedTransitions: ['Approved', 'Repair In-Progress', 'Ready', 'Delivered', 'Cancel']
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Delivered & Handed Over Records',
    statuses: ['Delivered'],
    allowedTransitions: ['Delivered', 'Cancel']
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    description: 'Cancelled Service Tickets',
    statuses: ['Cancelled', 'Cancel'],
    allowedTransitions: ['Cancelled', 'Received']
  }
]

export default function AllServicesPage({ setActiveRoute }) {
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('services_new', 'Add') || can('services_list', 'Add') || can('services', 'Add')
  const canEdit = hasAny('services_list', ['Edit']) || hasAny('services_new', ['Edit']) || hasAny('services', ['Edit'])
  const canDelete = hasAny('services_list', ['Delete']) || hasAny('services_new', ['Delete']) || hasAny('services', ['Delete'])
  const canDownload = hasAny('services_list', ['Download']) || hasAny('services_new', ['Download']) || hasAny('services', ['Download'])

  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [activeTab, setActiveTab] = useState('quotation_approval')
  const [stats, setStats] = useState({
    totalServices: 0,
    totalValue: 0,
    inProgressCount: 0,
    readyDeliveredCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState(null)

  // Selection state for Excel export & batch actions
  const [selectedServiceIds, setSelectedServiceIds] = useState([])

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL')

  // Date Range Filters
  const [datePreset, setDatePreset] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Selected Service for Details / Print Modal
  const [selectedService, setSelectedService] = useState(null)
  const [selectedReceiptService, setSelectedReceiptService] = useState(null)
  const [directPrintService, setDirectPrintService] = useState(null)
  const [directPrintReceiptService, setDirectPrintReceiptService] = useState(null)
  const [serialModalService, setSerialModalService] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isGeneratingReceiptPdf, setIsGeneratingReceiptPdf] = useState(false)

  // Track in-flight status requests per serviceId to cancel stale requests and eliminate race conditions
  const activeStatusControllers = useRef(new Map())

  const fetchInitialData = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true)

      // 1. Fetch Services
      const res = await fetch(API_ENDPOINTS.SERVICES)
      const data = await res.json()
      if (data.success) {
        setServices(data.services || [])
        if (data.stats) {
          setStats(data.stats)
        }
      }

      // 2. Fetch Settings (only on primary mount)
      if (!isBackground) {
        const settingsRes = await fetch(API_ENDPOINTS.SETTINGS)
        const settingsData = await settingsRes.json()
        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings)
          try {
            localStorage.setItem('simcha_settings', JSON.stringify(settingsData.settings))
          } catch {}
        }
      }
    } catch (err) {
      console.error('Error fetching services data:', err)
      if (!isBackground) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to retrieve service history from database.',
          confirmButtonColor: '#043486'
        })
      }
    } finally {
      if (!isBackground) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Handle Date Presets
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
    const today = new Date()
    const todayStr = getLocalDateString(today)

    if (preset === 'ALL') {
      setStartDate('')
      setEndDate('')
    } else if (preset === 'TODAY') {
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === 'THIS_WEEK') {
      const day = today.getDay() || 7
      const firstDay = new Date(today)
      firstDay.setDate(today.getDate() - day + 1)
      setStartDate(getLocalDateString(firstDay))
      setEndDate(todayStr)
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(getLocalDateString(firstDay))
      setEndDate(todayStr)
    }
    setCurrentPage(1)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPaymentModeFilter('ALL')
    setDatePreset('ALL')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // View Service Details Modal
  const handleViewService = async (serviceId) => {
    try {
      setIsLoadingDetails(true)
      const res = await fetch(API_ENDPOINTS.SERVICE_BY_ID(serviceId))
      const data = await res.json()
      if (data.success && data.service) {
        setSelectedService(data.service)
      }
    } catch (err) {
      console.error('Error fetching service details:', err)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Direct Print / Preview Service Receipt
  const handlePrintReceipt = async (serviceId) => {
    try {
      const res = await fetch(API_ENDPOINTS.SERVICE_BY_ID(serviceId))
      const data = await res.json()
      if (data.success && data.service) {
        setSelectedReceiptService(data.service)
      }
    } catch (err) {
      console.error('Error fetching service for receipt:', err)
    }
  }

  // Download Service Receipt PDF
  const handleDownloadReceiptPdf = async () => {
    const element = document.getElementById('service-receipt-printable-area')
    if (!element || !selectedReceiptService) return

    setIsGeneratingReceiptPdf(true)
    const receiptNo = selectedReceiptService.receipt_number || selectedReceiptService.service_number || 'REC'
    const fileName = `ServiceReceipt_${receiptNo.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(selectedReceiptService.customer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`

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
      console.error('Error generating receipt PDF:', err)
      Swal.fire({
        icon: 'error',
        title: 'PDF Generation Failed',
        text: err.message || 'Unable to download PDF. You can also use the "Print Receipt" option to Save as PDF.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsGeneratingReceiptPdf(false)
    }
  }

  // Direct Print Service Invoice
  const handleDirectPrintService = async (serviceId) => {
    try {
      const res = await fetch(API_ENDPOINTS.SERVICE_BY_ID(serviceId))
      const data = await res.json()
      if (data.success && data.service) {
        setDirectPrintService(data.service)
        setTimeout(() => {
          window.print()
        }, 350)
      }
    } catch (err) {
      console.error('Error fetching service for direct print:', err)
    }
  }

  // View Serial Numbers Modal
  const handleViewSerials = async (service) => {
    // If full item list is not loaded, fetch complete details
    if (!service.items || service.items.length === 0) {
      try {
        const res = await fetch(API_ENDPOINTS.SERVICE_BY_ID(service.id))
        const data = await res.json()
        if (data.success && data.service) {
          setSerialModalService(data.service)
          return
        }
      } catch (err) {
        console.error('Error fetching serials for service:', err)
      }
    }
    setSerialModalService(service)
  }

  // Quick Status Update (Smooth & Optimistic with Race-Condition Guard)
  const handleStatusChange = async (serviceId, newStatus) => {
    // 1. Abort any previous pending status request for THIS specific service row
    if (activeStatusControllers.current.has(serviceId)) {
      try {
        activeStatusControllers.current.get(serviceId).abort()
      } catch {}
    }

    // 2. Create and store a fresh AbortController for this new request
    const controller = new AbortController()
    activeStatusControllers.current.set(serviceId, controller)

    // 3. Instant Optimistic Local Update (0ms lag, smooth transition)
    setServices(prev =>
      prev.map(s => (s.id === serviceId ? { ...s, service_status: newStatus } : s))
    )

    try {
      const res = await fetch(API_ENDPOINTS.SERVICE_STATUS_UPDATE(serviceId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_status: newStatus }),
        signal: controller.signal
      })
      const data = await res.json()
      if (data.success) {
        // 4. Silent background sync for KPI cards without full table skeleton/reload
        fetchInitialData(true)

        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        }).fire({
          icon: 'success',
          title: `Status updated to ${newStatus}`
        })
      } else {
        throw new Error(data.message || 'Status update failed')
      }
    } catch (err) {
      // If this request was cancelled because the user clicked a newer status, ignore silently
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return
      }

      console.error('Error updating status:', err)
      // Rollback list state in background on actual server failure
      fetchInitialData(true)
      Swal.fire({
        icon: 'error',
        title: 'Status Update Failed',
        text: err.message || 'Could not update service status.',
        confirmButtonColor: '#043486'
      })
    } finally {
      // Clean up controller reference if this was the latest one
      if (activeStatusControllers.current.get(serviceId) === controller) {
        activeStatusControllers.current.delete(serviceId)
      }
    }
  }

  // Send Quotation Email to Customer & Automatically Move Status to 'Quotations'
  const handleSendQuotationEmail = async (service) => {
    // 1. Obtain & confirm recipient email
    let targetEmail = (service.customer_email || '').trim()

    if (!targetEmail) {
      const promptResult = await Swal.fire({
        title: 'Send Service Quotation',
        text: `Customer email is missing for "${service.customer_name}". Please enter recipient email:`,
        input: 'email',
        inputPlaceholder: 'customer@example.com',
        showCancelButton: true,
        confirmButtonColor: '#043486',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Send Quotation PDF',
        inputValidator: (val) => {
          if (!val || !val.trim()) {
            return 'Please enter a valid email address!'
          }
        }
      })

      if (!promptResult.isConfirmed || !promptResult.value) return
      targetEmail = promptResult.value.trim()
    } else {
      const confirmResult = await Swal.fire({
        title: 'Send Service Quotation?',
        html: `<p class="text-sm text-gray-600 dark:text-slate-300">Send official service quotation PDF for <b>${service.service_number}</b> to <b>${targetEmail}</b>?</p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#043486',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Send Quotation'
      })

      if (!confirmResult.isConfirmed) return
    }

    // 2. Dispatch Email API
    try {
      Swal.fire({
        title: 'Sending Quotation...',
        text: 'Generating PDF and dispatching quotation email...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const res = await fetch(API_ENDPOINTS.SERVICE_SEND_QUOTATION(service.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_email: targetEmail, email: targetEmail })
      })
      const data = await res.json()

      if (data.success) {
        setServices(prev =>
          prev.map(s =>
            s.id === service.id
              ? {
                  ...s,
                  service_status: 'Quotations',
                  quotation_email_sent: 1,
                  quotation_email_sent_at: new Date().toISOString()
                }
              : s
          )
        )
        fetchInitialData(true)

        Swal.fire({
          icon: 'success',
          title: 'Quotation Sent Successfully!',
          text: `Service quotation PDF has been emailed to ${targetEmail}. Status updated to Quotations.`,
          confirmButtonColor: '#043486'
        })
      } else {
        throw new Error(data.message || 'Failed to dispatch quotation email.')
      }
    } catch (err) {
      console.error('Error sending quotation email:', err)
      Swal.fire({
        icon: 'error',
        title: 'Failed to Send Quotation',
        text: err.message || 'Error occurred while sending quotation email.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Send Receipt Email to Customer (Active ONLY from 'Payment Received' onwards)
  const handleSendReceiptEmail = async (service) => {
    // 1. Validate status
    const isReceiptActive = [
      'Payment Received',
      'Repair In-Progress',
      'Ready',
      'Delivered'
    ].includes(service.service_status)

    if (!isReceiptActive) {
      Swal.fire({
        icon: 'warning',
        title: 'Receipt Not Available',
        text: 'Receipt email can only be issued once the status reaches "Payment Received" or later stages.',
        confirmButtonColor: '#043486'
      })
      return
    }

    // 2. Check if already sent
    if (service.receipt_email_sent === 1 || service.receipt_email_sent === true) {
      const sentDate = service.receipt_email_sent_at
        ? new Date(service.receipt_email_sent_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'an earlier date'
      Swal.fire({
        icon: 'info',
        title: 'Receipt Already Sent',
        html: `<p class="text-sm text-gray-600 dark:text-slate-300">Payment receipt for Service <b>${service.service_number}</b> has already been emailed to the customer on <b>${sentDate}</b>.</p><p class="text-xs text-gray-400 mt-2">To prevent duplicate emails, receipts can only be sent once.</p>`,
        confirmButtonColor: '#043486'
      })
      return
    }

    // 3. Obtain & confirm recipient email
    let targetEmail = (service.customer_email || '').trim()

    if (!targetEmail) {
      const promptResult = await Swal.fire({
        title: 'Send Service Receipt',
        text: `Customer email is missing for "${service.customer_name}". Please enter recipient email:`,
        input: 'email',
        inputPlaceholder: 'customer@example.com',
        showCancelButton: true,
        confirmButtonColor: '#043486',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Send Receipt PDF',
        inputValidator: (val) => {
          if (!val || !val.trim()) {
            return 'Please enter a valid email address!'
          }
        }
      })

      if (!promptResult.isConfirmed || !promptResult.value) return
      targetEmail = promptResult.value.trim()
    } else {
      const confirmResult = await Swal.fire({
        title: 'Send Service Receipt?',
        html: `<p class="text-sm text-gray-600">Send official service receipt PDF for <b>${service.service_number}</b> to <b>${targetEmail}</b>?</p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#043486',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Send Email'
      })

      if (!confirmResult.isConfirmed) return
    }

    // 4. Dispatch Email API
    try {
      Swal.fire({
        title: 'Sending Receipt...',
        text: 'Generating PDF and sending email...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const res = await fetch(API_ENDPOINTS.SERVICE_SEND_RECEIPT(service.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      })
      const data = await res.json()

      if (data.success) {
        setServices(prev =>
          prev.map(s =>
            s.id === service.id
              ? {
                  ...s,
                  receipt_email_sent: 1,
                  receipt_email_sent_at: new Date().toISOString()
                }
              : s
          )
        )
        Swal.fire({
          icon: 'success',
          title: 'Receipt Sent Successfully!',
          text: `Service payment receipt PDF has been emailed to ${targetEmail}.`,
          confirmButtonColor: '#043486'
        })
      } else {
        throw new Error(data.message || 'Failed to dispatch receipt email.')
      }
    } catch (err) {
      console.error('Error sending receipt email:', err)
      Swal.fire({
        icon: 'error',
        title: 'Failed to Send',
        text: err.message || 'Error occurred while sending receipt email.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Delete Service Record
  const handleDeleteService = async (serviceId, serviceNumber) => {
    const result = await Swal.fire({
      title: 'Delete Service Request?',
      text: `Are you sure you want to delete service "${serviceNumber}"? This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete Record'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(API_ENDPOINTS.SERVICE_BY_ID(serviceId), {
          method: 'DELETE'
        })
        const data = await res.json()
        if (data.success) {
          setServices(prev => prev.filter(s => s.id !== serviceId))
          setSelectedServiceIds(prev => prev.filter(id => id !== serviceId))
          Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          }).fire({
            icon: 'success',
            title: `Service "${serviceNumber}" deleted successfully`
          })
          fetchInitialData(true)
        } else {
          throw new Error(data.message || 'Failed to delete service')
        }
      } catch (err) {
        console.error('Error deleting service:', err)
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err.message || 'Could not delete service request.',
          confirmButtonColor: '#043486'
        })
      }
    }
  }

  // Dynamic Tab Counts for Badge Badges
  const tabCounts = useMemo(() => {
    const quotation_approval = services.filter(s =>
      ['Received', 'Quotation', 'Quotations', 'Customer Approval', 'Draft'].includes(s.service_status)
    ).length
    const repair_ready = services.filter(s =>
      ['Approved', 'Repair In-Progress', 'Ready', 'Payment Received'].includes(s.service_status)
    ).length
    const delivered = services.filter(s =>
      s.service_status === 'Delivered'
    ).length
    const cancelled = services.filter(s =>
      ['Cancelled', 'Cancel'].includes(s.service_status)
    ).length

    return { quotation_approval, repair_ready, delivered, cancelled }
  }, [services])

  // Filter Logic based on Active Tab + Search + Sub-status + Payment Mode + Date Range
  const filteredServices = useMemo(() => {
    const currentTabConfig = SERVICE_TABS.find(t => t.id === activeTab) || SERVICE_TABS[0]

    return services.filter(service => {
      // 0. Primary Tab filter: Only services matching active tab's statuses
      const matchesTab = currentTabConfig.statuses.includes(service.service_status)
      if (!matchesTab) return false

      // 1. Search filter
      const search = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !search ||
        service.service_number?.toLowerCase().includes(search) ||
        service.customer_name?.toLowerCase().includes(search) ||
        service.customer_phone?.toLowerCase().includes(search) ||
        service.service_title?.toLowerCase().includes(search) ||
        service.item_details?.toLowerCase().includes(search) ||
        (Array.isArray(service.items) &&
          service.items.some(
            it =>
              it.product_name?.toLowerCase().includes(search) ||
              it.item_name?.toLowerCase().includes(search) ||
              it.brand_model?.toLowerCase().includes(search) ||
              it.serial_number?.toLowerCase().includes(search)
          ))

      // 2. Sub-status filter within current tab
      const matchesStatus =
        statusFilter === 'ALL' || service.service_status === statusFilter

      // 3. Payment Mode filter
      const matchesPaymentMode =
        paymentModeFilter === 'ALL' || service.payment_mode === paymentModeFilter

      // 4. Date Range filter
      if (startDate || endDate) {
        const sDateStr = getLocalDateString(service.service_date || service.created_at)
        if (startDate && sDateStr < startDate) return false
        if (endDate && sDateStr > endDate) return false
      }

      return matchesSearch && matchesStatus && matchesPaymentMode
    })
  }, [services, activeTab, searchTerm, statusFilter, paymentModeFilter, startDate, endDate])

  // Pagination Logic
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredServices.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredServices, currentPage, itemsPerPage])

  // Selection Checkbox logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allCurrentIds = paginatedServices.map(s => s.id)
      setSelectedServiceIds(Array.from(new Set([...selectedServiceIds, ...allCurrentIds])))
    } else {
      const currentIds = paginatedServices.map(s => s.id)
      setSelectedServiceIds(selectedServiceIds.filter(id => !currentIds.includes(id)))
    }
  }

  const handleSelectOne = (id) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter(item => item !== id))
    } else {
      setSelectedServiceIds([...selectedServiceIds, id])
    }
  }

  const isAllCurrentSelected =
    paginatedServices.length > 0 &&
    paginatedServices.every(s => selectedServiceIds.includes(s.id))

  // Export to Excel
  const handleExportExcel = () => {
    const targetServices =
      selectedServiceIds.length > 0
        ? services.filter(s => selectedServiceIds.includes(s.id))
        : filteredServices

    if (targetServices.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Data to Export',
        text: 'There are no service records matching current filters.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const excelRows = targetServices.map(s => ({
      'Service Number': s.service_number,
      'Service Date': s.service_date,
      'Customer Name': s.customer_name,
      'Contact Phone': s.customer_phone || '-',
      'Email': s.customer_email || '-',
      'Service Title / Issue': s.service_title || '-',
      'Device / Item': s.item_details || '-',
      'Estimated Delivery': s.estimated_delivery_date || '-',
      'Service Status': s.service_status,
      'Payment Mode': s.payment_mode || '-',
      'Payment Status': s.payment_status || '-',
      'Subtotal (₹)': Number(s.subtotal || 0).toFixed(2),
      'Tax Amount (₹)': Number(s.total_tax || 0).toFixed(2),
      'Grand Total (₹)': Number(s.grand_total || 0).toFixed(2)
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Services')
    XLSX.writeFile(
      workbook,
      `Simcha_Services_Export_${new Date().toISOString().split('T')[0]}.xlsx`
    )
  }

  // Get status badge colors
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Received':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
      case 'Quotation':
      case 'Quotations':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
      case 'Customer Approval':
      case 'Approved':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
      case 'Payment Received':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
      case 'Repair In-Progress':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
      case 'Ready':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800'
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800'
      case 'Cancelled':
      case 'Cancel':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Define DataTable column configurations for modularity & future extensions
  const serviceTableColumns = useMemo(
    () => [
      {
        header: 'Service ID',
        key: 'service_number',
        render: (val, row) => {
          const isCancelled = ['Cancelled', 'Cancel'].includes(row.service_status)
          return (
            <button
              type="button"
              onClick={() => handleViewService(row.id)}
              className={`font-semibold font-mono whitespace-nowrap hover:underline cursor-pointer inline-flex items-center text-left ${
                isCancelled
                  ? 'line-through text-slate-500 dark:text-slate-400'
                  : 'text-[#043486] dark:text-blue-400'
              }`}
              title="Click to view Service Bill"
            >
              {val}
            </button>
          )
        }
      },
      {
        header: 'Date',
        key: 'service_date',
        className: 'whitespace-nowrap',
        render: (val, row) => {
          const isCancelled = ['Cancelled', 'Cancel'].includes(row.service_status)
          const formatted = val
            ? new Date(val).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : '-'
          return (
            <span className={isCancelled ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}>
              {formatted}
            </span>
          )
        }
      },
      {
        header: 'Customer',
        key: 'customer_name',
        className: 'min-w-[140px]',
        render: (val, row) => {
          const isCancelled = ['Cancelled', 'Cancel'].includes(row.service_status)
          return (
            <span
              className={`font-semibold ${
                isCancelled
                  ? 'line-through text-slate-500 dark:text-slate-400'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {val}
            </span>
          )
        }
      },
      {
        header: 'Mobile Number',
        key: 'customer_phone',
        className: 'whitespace-nowrap',
        render: (val, row) => {
          const isCancelled = ['Cancelled', 'Cancel'].includes(row.service_status)
          return (
            <span
              className={`font-mono font-medium ${
                isCancelled
                  ? 'line-through text-slate-500 dark:text-slate-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {val || '-'}
            </span>
          )
        }
      },
      {
        header: 'Product & QTY',
        key: 'items',
        className: 'min-w-[160px]',
        render: (_, row) => {
          const isCancelled = ['Cancelled', 'Cancel'].includes(row.service_status)
          const itemsList = row.items || []
          return itemsList.length > 0 ? (
            <div className={`space-y-1 ${isCancelled ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
              {itemsList.map((it, idx) => (
                <div key={idx} className="text-xs">
                  <span
                    onClick={() => handleViewSerials(row)}
                    className={`font-semibold cursor-pointer transition-colors ${
                      isCancelled
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-800 dark:text-slate-200 hover:text-[#043486] dark:hover:text-blue-400 hover:underline'
                    }`}
                    title="Click to view registered hardware serial numbers"
                  >
                    {it.product_name || it.item_name}
                  </span>
                  <span
                    className={`ml-1.5 font-mono ${
                      isCancelled
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    - {parseFloat(it.quantity) || 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-400 text-xs">-</span>
          )
        }
      },
      {
        header: 'Total',
        align: 'right',
        className: 'whitespace-nowrap',
        render: (_, row) => {
          const isCancelled = ['Cancelled', 'Cancel'].includes(row.service_status)
          return (
            <span
              className={`font-bold font-mono ${
                isCancelled
                  ? 'line-through text-slate-500 dark:text-slate-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              ₹ {Number(row.grand_total || row.total_amount || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          )
        }
      },
      {
        header: 'Status',
        align: 'center',
        className: 'whitespace-nowrap',
        render: (_, row) => {
          const currentTabConfig = SERVICE_TABS.find(t => t.id === activeTab) || SERVICE_TABS[0]
          const options = Array.from(
            new Set([...currentTabConfig.allowedTransitions, row.service_status])
          )

          return (
            <select
              value={row.service_status}
              onChange={(e) => handleStatusChange(row.id, e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-none border focus:outline-none cursor-pointer transition-colors shadow-2xs ${getStatusBadgeClass(
                row.service_status
              )}`}
            >
              {options.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )
        }
      },
      {
        header: 'Actions',
        align: 'center',
        className: 'whitespace-nowrap',
        render: (_, service) => {
          const isCancelled = ['Cancelled', 'Cancel'].includes(service.service_status)
          const isQuotationTab = activeTab === 'quotation_approval'
          const isQuotationSent = service.quotation_email_sent === 1 || service.quotation_email_sent === true

          const isReceiptActive =
            !isCancelled &&
            [
              'Payment Received',
              'Repair In-Progress',
              'Ready',
              'Delivered'
            ].includes(service.service_status)
          const isReceiptSent =
            service.receipt_email_sent === 1 || service.receipt_email_sent === true

          return (
            <div className="flex items-center justify-center gap-1.5">
              {/* 1. Direct Print / View Receipt Modal (When active from Payment Received onwards) */}
              <ActionButton
                icon={FileCheck}
                onClick={() => handlePrintReceipt(service.id)}
                disabled={!isReceiptActive}
                className={
                  isReceiptActive
                    ? '!text-purple-600 dark:!text-purple-400 hover:!bg-purple-50 dark:hover:!bg-slate-800'
                    : '!text-gray-300 dark:!text-slate-700 opacity-40'
                }
                title={
                  isReceiptActive
                    ? 'Print / View Service Payment Receipt'
                    : 'Receipt available from Payment Received stage onwards'
                }
              />

              {/* 2. Send Action Icon */}
              {isQuotationTab ? (
                /* Quotation Tab: Send Quotation Email (Active by default!) */
                <ActionButton
                  icon={Send}
                  disabled={isCancelled}
                  onClick={() => handleSendQuotationEmail(service)}
                  title={
                    isCancelled
                      ? 'Cannot send quotation for cancelled service'
                      : isQuotationSent
                      ? 'Quotation Email Sent (Click to resend)'
                      : 'Send Service Quotation via Email (Auto-updates status to Quotations)'
                  }
                  className={
                    isCancelled
                      ? '!text-gray-300 dark:!text-slate-700 opacity-40'
                      : isQuotationSent
                      ? '!text-red-500 hover:!bg-red-50 dark:hover:!bg-slate-800'
                      : '!text-indigo-600 dark:!text-indigo-400 hover:!bg-indigo-50 dark:hover:!bg-slate-800'
                  }
                />
              ) : (
                /* Other Tabs: Send Receipt Email */
                <ActionButton
                  icon={Send}
                  disabled={!isReceiptActive}
                  onClick={() => handleSendReceiptEmail(service)}
                  title={
                    !isReceiptActive
                      ? 'Receipt email available from Payment Received stage onwards'
                      : isReceiptSent
                      ? 'Receipt Email Sent'
                      : 'Send Receipt PDF via Email'
                  }
                  className={
                    !isReceiptActive
                      ? '!text-gray-300 dark:!text-slate-700 opacity-40'
                      : isReceiptSent
                      ? '!text-red-500 hover:!bg-red-50 dark:hover:!bg-slate-800'
                      : '!text-indigo-600 dark:!text-indigo-400 hover:!bg-indigo-50 dark:hover:!bg-slate-800'
                  }
                />
              )}

              {/* 3. Edit Service Record */}
              {canEdit && (
                <ActionButton
                  type="edit"
                  disabled={isCancelled}
                  onClick={() => {
                    if (isCancelled) return
                    if (setActiveRoute) setActiveRoute('new-service')
                    navigate(`/services/new?editId=${service.id}`)
                  }}
                  title={isCancelled ? 'Cannot edit cancelled service' : 'Edit Service Request'}
                  className={
                    isCancelled
                      ? '!text-gray-300 dark:!text-slate-700 opacity-40 cursor-not-allowed'
                      : '!text-amber-600 dark:!text-amber-400 hover:!bg-amber-50 dark:hover:!bg-slate-800'
                  }
                />
              )}

              {/* 4. Delete Service Record */}
              {canDelete && (
                <ActionButton
                  type="delete"
                  onClick={() => handleDeleteService(service.id, service.service_number)}
                  title="Delete Service Record"
                  className="!text-gray-400 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-slate-800"
                />
              )}
            </div>
          )
        }
      }
    ],
    [activeTab, canEdit, canDelete]
  )

  const currentTabStages = useMemo(() => {
    const tabConfig = SERVICE_TABS.find(t => t.id === activeTab)
    return tabConfig ? tabConfig.statuses : SERVICE_STATUS_STAGES
  }, [activeTab])

  return (
    <div className="space-y-6 font-['Poppins',sans-serif] pb-16 animate-in fade-in duration-200">
      {/* 1. Transparent Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
            <List className="text-[#043486] dark:text-blue-400" size={22} />
            <span>SERVICES &amp; REPAIRS REGISTRY</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Manage end-to-end service requests, track lifecycle stages, process invoices &amp; dispatch receipts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {canDownload && (
            <Button
              variant="export"
              icon={Download}
              onClick={handleExportExcel}
              className="text-xs font-semibold"
              title={selectedServiceIds.length > 0 ? `Export ${selectedServiceIds.length} Selected Record(s)` : 'Export All Filtered Records'}
            >
              {selectedServiceIds.length > 0 ? `EXPORT SELECTED (${selectedServiceIds.length})` : 'EXPORT TO EXCEL'}
            </Button>
          )}
          {canAdd && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                if (setActiveRoute) setActiveRoute('new-service')
                navigate('/services/new')
              }}
              className="text-xs font-semibold"
            >
              NEW REQUEST
            </Button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ListKpiCard
          label="Total Service Requests"
          value={stats.totalServices || 0}
          icon={Wrench}
          variant="blue"
        />
        <ListKpiCard
          label="Total Service Revenue"
          value={`₹${Number(stats.totalValue || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          icon={IndianRupee}
          variant="blueValue"
        />
        <ListKpiCard
          label="Active In-Progress / Repairs"
          value={stats.inProgressCount || 0}
          icon={Clock}
          variant="amber"
        />
        <ListKpiCard
          label="Ready &amp; Delivered"
          value={stats.readyDeliveredCount || 0}
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5">
            <SearchInput
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              onClear={() => {
                setSearchTerm('')
                setCurrentPage(1)
              }}
              placeholder="Search by Service #, Customer Name, Phone, Item / Issue..."
            />
          </div>

          {/* Sub-status Filter within Active Tab */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#043486] transition-colors"
            >
              <option value="ALL">All Stages in Tab ({currentTabStages.length})</option>
              {currentTabStages.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="md:col-span-3">
            <select
              value={paymentModeFilter}
              onChange={(e) => {
                setPaymentModeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#043486] transition-colors"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI / Online">UPI / Online</option>
              <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
              <option value="Credit / Debit Card">Credit / Debit Card</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Reset & Reload Filters */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                handleResetFilters()
                fetchInitialData()
              }}
              title="Reload Service Records"
              className="p-2 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Date Filter & Preset Controls */}
        <ListDateRangeFilter
          datePreset={datePreset}
          onDatePresetChange={handleDatePresetChange}
          startDate={startDate}
          onStartDateChange={(val) => {
            setStartDate(val)
            setDatePreset('CUSTOM')
            setCurrentPage(1)
          }}
          endDate={endDate}
          onEndDateChange={(val) => {
            setEndDate(val)
            setDatePreset('CUSTOM')
            setCurrentPage(1)
          }}
        />
      </div>

      {/* 4. Tab Navigation Bar (Standard Module Chevron Arrow Nav) */}
      <TabNav>
        <TabButton
          active={activeTab === 'quotation_approval'}
          variant="blue"
          icon={FileText}
          label={`Quotation & approval (${tabCounts.quotation_approval})`}
          onClick={() => {
            setActiveTab('quotation_approval')
            setStatusFilter('ALL')
            setCurrentPage(1)
            setSelectedServiceIds([])
          }}
        />

        <TabButton
          active={activeTab === 'repair_ready'}
          variant="amber"
          icon={Clock}
          label={`Repair & ready (${tabCounts.repair_ready})`}
          onClick={() => {
            setActiveTab('repair_ready')
            setStatusFilter('ALL')
            setCurrentPage(1)
            setSelectedServiceIds([])
          }}
        />

        <TabButton
          active={activeTab === 'delivered'}
          variant="emerald"
          icon={CheckCircle2}
          label={`Delivered (${tabCounts.delivered})`}
          onClick={() => {
            setActiveTab('delivered')
            setStatusFilter('ALL')
            setCurrentPage(1)
            setSelectedServiceIds([])
          }}
        />

        <TabButton
          active={activeTab === 'cancelled'}
          variant="slate"
          icon={X}
          label={`Cancelled (${tabCounts.cancelled})`}
          onClick={() => {
            setActiveTab('cancelled')
            setStatusFilter('ALL')
            setCurrentPage(1)
            setSelectedServiceIds([])
          }}
        />
      </TabNav>

      {/* 4. Global Reusable Service Records DataTable & Pagination */}
      <div className="space-y-0">
        <DataTable
          columns={serviceTableColumns}
          data={paginatedServices}
          keyField="id"
          isLoading={isLoading}
          loadingMessage="Loading service registry records..."
          emptyMessage="No service requests found matching your filters."
          emptySubtitle="Try adjusting your search filters, stage, or date range."
          emptyIcon={Wrench}
          selectable={true}
          selectedIds={selectedServiceIds}
          onSelectAll={handleSelectAll}
          onSelectRow={(id) => handleSelectOne(id)}
          rowClassName={(row) =>
            ['Cancelled', 'Cancel'].includes(row.service_status)
              ? 'opacity-65 bg-gray-50/80 dark:bg-slate-900/60'
              : ''
          }
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredServices.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num)
            setCurrentPage(1)
          }}
        />
      </div>

      {/* 6. Printable Service Invoice Modal */}
      {selectedService &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:hidden">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#043486]" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Service Invoice Preview — {selectedService.service_number}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDirectPrintService(selectedService)
                      setTimeout(() => {
                        window.print()
                      }, 250)
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#043486] hover:bg-[#032560] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Template Container */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950/50">
                <div className="max-w-[800px] mx-auto bg-white shadow-md">
                  <ServiceInvoiceTemplate
                    service={selectedService}
                    items={selectedService.items || []}
                    settings={settings}
                    company={settings}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 7. Printable Service Receipt Modal (Matching Outward Receipt Modal Theme) */}
      {selectedReceiptService &&
        createPortal(
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
                        #{selectedReceiptService.receipt_number || selectedReceiptService.service_number}
                      </span>
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      Official payment receipt • Customer: {selectedReceiptService.customer_name}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDirectPrintReceiptService(selectedReceiptService)
                      setTimeout(() => {
                        window.print()
                      }, 250)
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none shadow-sm transition-all cursor-pointer"
                    title="Print Receipt"
                  >
                    <Printer size={15} />
                    <span>Print Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadReceiptPdf}
                    disabled={isGeneratingReceiptPdf}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 rounded-none shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    title="Download High-Resolution PDF"
                  >
                    <Download size={15} />
                    <span>{isGeneratingReceiptPdf ? 'Rendering PDF...' : 'Download PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedReceiptService(null)}
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
                  <ServiceReceiptTemplate
                    service={selectedReceiptService}
                    settings={settings}
                    company={settings}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 8. Serial Numbers Quick Check Modal */}
      {serialModalService &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col rounded-none">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <FileDigit className="w-5 h-5 text-[#043486] dark:text-blue-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                      Registered Serial Numbers
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {serialModalService.service_number} • {serialModalService.customer_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSerialModalService(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3.5 max-h-[60vh] overflow-y-auto">
                {(serialModalService.items || []).length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No products found for this service ticket.
                  </div>
                ) : (
                  (serialModalService.items || []).map((item, idx) => {
                    const serials =
                      Array.isArray(item.serial_numbers) && item.serial_numbers.length > 0
                        ? item.serial_numbers
                        : item.serial_number
                        ? item.serial_number
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : []

                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-none space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {idx + 1}. {item.product_name || item.item_name}{' '}
                            {item.brand_model ? `(${item.brand_model})` : ''}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-900 font-mono">
                            Qty: {item.quantity || 1}
                          </span>
                        </div>

                        {item.issue_description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Issue:
                            </span>{' '}
                            {item.issue_description}
                          </p>
                        )}

                        <div className="pt-1">
                          {serials.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-[11px] text-slate-500 font-semibold mr-1">
                                Serials:
                              </span>
                              {serials.map((sn, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold shadow-2xs"
                                >
                                  #{sIdx + 1}: {sn}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              No hardware serial numbers tracked for this item.
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setSerialModalService(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#043486] hover:bg-[#0248BC] text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 9. Direct Printable Invoice Portal for instant table action window.print() */}
      {directPrintService &&
        typeof document !== 'undefined' &&
        createPortal(
          <div id="invoice-print-wrapper">
            <ServiceInvoiceTemplate service={directPrintService} settings={settings} company={settings} />
          </div>,
          document.body
        )}

      {/* 10. Direct Printable Receipt Portal for instant table action window.print() */}
      {directPrintReceiptService &&
        typeof document !== 'undefined' &&
        createPortal(
          <div id="receipt-print-wrapper">
            <ServiceReceiptTemplate service={directPrintReceiptService} settings={settings} company={settings} />
          </div>,
          document.body
        )}
    </div>
  )
}
