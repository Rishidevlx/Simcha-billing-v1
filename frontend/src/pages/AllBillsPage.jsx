import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  Receipt,
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
  Pencil,
  RefreshCw,
  List
} from '../components/common/icons'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import InvoiceModal from '../components/invoice/InvoiceModal'
import InvoiceTemplate from '../components/invoice/InvoiceTemplate'
import ReceiptModal from '../components/receipt/ReceiptModal'
import ReceiptTemplate from '../components/receipt/ReceiptTemplate'
import ListPageHeader from '../components/common/ListPageHeader'
import ListKpiCard from '../components/common/ListKpiCard'
import ListDateRangeFilter from '../components/common/ListDateRangeFilter'
import ListPagePagination from '../components/common/ListPagePagination'
import { Button, ActionButton, SearchInput, Checkbox, StatusPill, TabNav, TabButton } from '../components/ui'
import { API_ENDPOINTS } from '../config/api'
import { getUserPermissions } from '../utils/access'
import { generateInvoicePdfBase64, generateReceiptPdfBase64 } from '../utils/pdfEmailHelper'

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

export default function AllBillsPage({ setActiveRoute }) {
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [stats, setStats] = useState({ totalBills: 0, totalRevenue: 0, paidCount: 0, pendingCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('outward', 'Add') || can('outward_list', 'Add')
  const canEdit = hasAny('outward_list', ['Edit']) || hasAny('outward', ['Edit'])
  const canDelete = hasAny('outward_list', ['Delete']) || hasAny('outward', ['Delete'])
  const canDownload = hasAny('outward_list', ['Download']) || hasAny('outward', ['Download'])

  // Active Tab State ('pending' | 'paid' | 'cancelled')
  const [activeTab, setActiveTab] = useState('pending')

  // Selection state for Excel export & batch actions
  const [selectedBillIds, setSelectedBillIds] = useState([])

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL')
  
  // Date Range Filters
  const [datePreset, setDatePreset] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Selected Bill for Details / Print Modal
  const [selectedBill, setSelectedBill] = useState(null)
  const [selectedReceiptBill, setSelectedReceiptBill] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)
      
      // 1. Fetch Bills
      const res = await fetch(API_ENDPOINTS.BILLS)
      const data = await res.json()
      if (data.success) {
        setBills(data.bills || [])
        if (data.stats) {
          setStats(data.stats)
        }
      }

      // 2. Fetch Settings
      const settingsRes = await fetch(API_ENDPOINTS.SETTINGS)
      const settingsData = await settingsRes.json()
      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings)
      }

    } catch (err) {
      console.error('Error fetching billing data:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to retrieve invoice history from database.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsLoading(false)
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
    setTypeFilter('ALL')
    setPaymentModeFilter('ALL')
    setDatePreset('ALL')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // View Bill Details Modal
  const handleViewBill = async (billId) => {
    try {
      setIsLoadingDetails(true)
      const res = await fetch(API_ENDPOINTS.BILL_BY_ID(billId))
      const data = await res.json()
      if (data.success && data.bill) {
        setSelectedBill(data.bill)
      }
    } catch (err) {
      console.error('Error fetching bill details:', err)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Direct Print Bill (Invoice)
  const handlePrintDirect = async (billId) => {
    try {
      const res = await fetch(API_ENDPOINTS.BILL_BY_ID(billId))
      const data = await res.json()
      if (data.success && data.bill) {
        setSelectedBill(data.bill)
        setTimeout(() => {
          window.print()
        }, 300)
      }
    } catch (err) {
      console.error('Error fetching bill for direct print:', err)
    }
  }

  // Direct Print / Preview Receipt
  const handlePrintReceipt = async (billId) => {
    try {
      const res = await fetch(API_ENDPOINTS.BILL_BY_ID(billId))
      const data = await res.json()
      if (data.success && data.bill) {
        setSelectedReceiptBill(data.bill)
      }
    } catch (err) {
      console.error('Error fetching bill for receipt:', err)
    }
  }

  // Send Invoice Email to Customer (Active when Pending, 1-time clickable turns red)
  const handleSendInvoiceEmail = async (bill) => {
    // 1. Check if already sent
    if (bill.invoice_sent === 1 || bill.invoice_sent === true) {
      const sentDate = bill.invoice_sent_at
        ? new Date(bill.invoice_sent_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'an earlier date'
      Swal.fire({
        icon: 'info',
        title: 'Invoice Already Sent',
        html: `<p class="text-sm text-gray-600 dark:text-slate-300">Tax Invoice <b>${bill.invoice_number}</b> has already been emailed to the customer on <b>${sentDate}</b>.</p><p class="text-xs text-gray-400 mt-2">To prevent duplicate emails, invoice email can only be sent once.</p>`,
        confirmButtonColor: '#043486'
      })
      return
    }

    // 2. Obtain & confirm recipient email
    let targetEmail = (bill.customer_email || '').trim()

    if (!targetEmail) {
      const promptResult = await Swal.fire({
        title: 'Send Tax Invoice',
        text: `Customer email is missing for "${bill.customer_name}". Please enter recipient email:`,
        input: 'email',
        inputPlaceholder: 'customer@example.com',
        showCancelButton: true,
        confirmButtonColor: '#043486',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Send Invoice PDF',
        inputValidator: (val) => {
          if (!val || !val.trim()) {
            return 'Please enter a valid email address!'
          }
        }
      })

      if (!promptResult.isConfirmed || !promptResult.value) return
      targetEmail = promptResult.value.trim()
    }

    // 3. Dispatch Invoice Email API with client-generated PDF Base64
    try {
      Swal.fire({
        title: 'Sending Invoice...',
        text: 'Generating PDF and sending email...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Fetch full bill with items if needed
      let fullBill = bill
      if (!fullBill.items || fullBill.items.length === 0) {
        try {
          const detailRes = await fetch(API_ENDPOINTS.BILL_BY_ID(bill.id))
          const detailData = await detailRes.json()
          if (detailData.success && detailData.bill) {
            fullBill = detailData.bill
          }
        } catch (e) {}
      }

      // Generate Base64 PDF directly on the frontend
      let pdfBase64 = null
      try {
        pdfBase64 = await generateInvoicePdfBase64(fullBill, settings)
      } catch (pdfErr) {
        console.warn('Frontend PDF generation fallback note:', pdfErr)
      }

      const res = await fetch(API_ENDPOINTS.EMAIL_SEND_BILL(bill.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: targetEmail, pdf_base64: pdfBase64 })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setBills(prev => prev.map(b => b.id === bill.id ? { ...b, invoice_sent: 1, invoice_sent_at: new Date().toISOString() } : b))
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        }).fire({
          icon: 'success',
          title: `Invoice sent to ${targetEmail}`
        })
      } else {
        throw new Error(data.message || 'Failed to dispatch invoice email.')
      }
    } catch (err) {
      console.error('Error sending invoice email:', err)
      Swal.fire({
        icon: 'error',
        title: 'Dispatch Failed',
        text: err.message || 'Unable to send invoice email. Please verify SMTP settings.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Send Receipt Email to Customer (Active ONLY when Paid, one-time clickable)
  const handleSendReceiptEmail = async (bill) => {
    // 1. Validate status
    if (bill.payment_status !== 'Paid') {
      Swal.fire({
        icon: 'warning',
        title: 'Payment Pending',
        text: 'Receipt email can only be sent once the invoice status is marked as PAID.',
        confirmButtonColor: '#043486'
      })
      return
    }

    // 2. Check if already sent
    if (bill.receipt_sent === 1 || bill.receipt_sent === true) {
      const sentDate = bill.receipt_sent_at
        ? new Date(bill.receipt_sent_at).toLocaleDateString('en-GB', {
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
        html: `<p class="text-sm text-gray-600 dark:text-slate-300">Payment receipt for invoice <b>${bill.invoice_number}</b> has already been emailed to the customer on <b>${sentDate}</b>.</p><p class="text-xs text-gray-400 mt-2">To prevent duplicate emails, receipts can only be sent once.</p>`,
        confirmButtonColor: '#043486'
      })
      return
    }

    // 3. Obtain & confirm recipient email
    let targetEmail = (bill.customer_email || '').trim()

    if (!targetEmail) {
      const promptResult = await Swal.fire({
        title: 'Send Payment Receipt',
        text: `Customer email is missing for "${bill.customer_name}". Please enter recipient email:`,
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
        title: 'Send Payment Receipt?',
        html: `<p class="text-sm text-gray-600">Send official receipt PDF for invoice <b>${bill.invoice_number}</b> to <b>${targetEmail}</b>?</p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#043486',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Send Email'
      })

      if (!confirmResult.isConfirmed) return
    }

    // 4. Dispatch Email API with client-generated PDF Base64
    try {
      Swal.fire({
        title: 'Sending Receipt...',
        text: 'Generating PDF and sending email...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Fetch full bill with items if needed
      let fullBill = bill
      if (!fullBill.items || fullBill.items.length === 0) {
        try {
          const detailRes = await fetch(API_ENDPOINTS.BILL_BY_ID(bill.id))
          const detailData = await detailRes.json()
          if (detailData.success && detailData.bill) {
            fullBill = detailData.bill
          }
        } catch (e) {}
      }

      // Generate Base64 PDF directly on the frontend
      let pdfBase64 = null
      try {
        pdfBase64 = await generateReceiptPdfBase64(fullBill, settings)
      } catch (pdfErr) {
        console.warn('Frontend receipt PDF generation fallback note:', pdfErr)
      }

      const res = await fetch(API_ENDPOINTS.BILL_SEND_RECEIPT(bill.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, recipient: targetEmail, pdf_base64: pdfBase64 })
      })
      const data = await res.json()

      if (data.success) {
        setBills(prev => prev.map(b => b.id === bill.id ? { ...b, receipt_sent: 1, receipt_sent_at: new Date().toISOString() } : b))
        Swal.fire({
          icon: 'success',
          title: 'Receipt Sent Successfully!',
          text: `Payment receipt PDF has been emailed to ${targetEmail}.`,
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

  // Delete Bill
  const handleDeleteBill = async (id, invoiceNumber) => {
    const result = await Swal.fire({
      title: 'Delete Invoice?',
      text: `Are you sure you want to delete invoice "${invoiceNumber}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(API_ENDPOINTS.BILL_BY_ID(id), { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
          Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          }).fire({
            icon: 'success',
            title: `Invoice "${invoiceNumber}" deleted successfully`
          })
          setBills(prev => prev.filter(b => b.id !== id))
          setSelectedBillIds(prev => prev.filter(billId => billId !== id))
          fetchInitialData()
          if (selectedBill && selectedBill.id === id) {
            setSelectedBill(null)
          }
        } else {
          throw new Error(data.message || 'Failed to delete')
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err.message,
          confirmButtonColor: '#043486'
        })
      }
    }
  }

  // Inline change Payment Type
  const handleUpdatePaymentType = async (billId, newType) => {
    try {
      const res = await fetch(API_ENDPOINTS.BILL_PAYMENT_UPDATE(billId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_mode: newType })
      })
      const data = await res.json()
      if (data.success) {
        setBills(prev => prev.map(b => b.id === billId ? { ...b, payment_mode: newType } : b))
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        }).fire({
          icon: 'success',
          title: `Payment type updated to ${newType}`
        })
      } else {
        throw new Error(data.message || 'Failed to update payment type')
      }
    } catch (err) {
      console.error('Error updating payment type:', err)
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Could not update payment type.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Show Cancellation Reason Modal
  const handleShowCancellationReason = (bill) => {
    const rawCancelDate = bill.cancelled_at || bill.updated_at || bill.created_at
    const formattedCancelDate = rawCancelDate
      ? new Date(rawCancelDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-GB')

    Swal.fire({
      title: 'Cancellation Reason',
      html: `
        <div style="text-align:left; font-size:13px; color:#334155;">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #e2e8f0;">
            <div><strong>Invoice:</strong> <span style="font-family:monospace; color:#043486; font-weight:700;">#${bill.invoice_number}</span></div>
            <div><strong>Cancelled Date:</strong> <span style="font-weight:600; color:#dc2626;">${formattedCancelDate}</span></div>
          </div>
          <p style="margin-bottom:10px;"><strong>Customer:</strong> ${bill.customer_name}</p>
          <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:6px; padding:12px; margin-top:8px; color:#9f1239;">
            <div style="font-weight:700; font-size:12px; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">Reason:</div>
            <div style="font-size:13px; line-height:1.5;">${bill.cancellation_reason || 'No cancellation reason specified.'}</div>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
      confirmButtonColor: '#043486'
    })
  }

  // Inline change Payment Status with Cancellation Reason Prompt
  const handleUpdatePaymentStatus = async (billId, newStatus) => {
    const targetBill = bills.find(b => b.id === billId)
    if (newStatus === 'Paid') {
      const mode = targetBill?.payment_mode
      if (!mode || mode === 'Select' || String(mode).trim() === '') {
        Swal.fire({
          icon: 'warning',
          title: 'Payment Type Required',
          text: 'Please select a Payment Type (Cash, UPI, etc.) before changing status to PAID.',
          confirmButtonColor: '#043486'
        })
        return
      }
    }

    let cancellationReason = null
    if (newStatus === 'Cancelled') {
      const promptResult = await Swal.fire({
        title: 'Cancel Outward Invoice?',
        html: `
          <p style="font-size:13px; color:#475569; text-align:left; margin-bottom:10px;">
            Are you sure you want to cancel Invoice <strong>#${targetBill?.invoice_number}</strong>?
          </p>
          <div style="font-size:12px; color:#059669; font-weight:600; text-align:left; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:10px; margin-bottom:12px;">
            ✓ Billed items stock will be restored to inventory.<br/>
            ✓ Billed serial numbers will be released back to Available.
          </div>
          <p style="font-size:12px; color:#64748b; text-align:left; margin-bottom:6px; font-weight:600;">
            Reason for cancellation: <span style="color:#e11d48;">*</span>
          </p>
        `,
        input: 'textarea',
        inputPlaceholder: 'Please enter reason for cancellation...',
        inputAttributes: {
          'aria-label': 'Cancellation Reason'
        },
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Cancel Invoice',
        cancelButtonText: 'Close',
        inputValidator: (val) => {
          if (!val || !val.trim()) {
            return 'Cancellation reason is mandatory!'
          }
        }
      })

      if (!promptResult.isConfirmed || !promptResult.value) return
      cancellationReason = promptResult.value.trim()
    }

    try {
      const payload = { payment_status: newStatus }
      if (cancellationReason) {
        payload.cancellation_reason = cancellationReason
      }

      const res = await fetch(API_ENDPOINTS.BILL_PAYMENT_UPDATE(billId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        const nowIso = new Date().toISOString()
        setBills(prev => {
          const updated = prev.map(b => b.id === billId ? { 
            ...b, 
            payment_status: newStatus, 
            cancellation_reason: cancellationReason || b.cancellation_reason,
            cancelled_at: (newStatus === 'Cancelled' || newStatus === 'Cancel') ? nowIso : null,
            updated_at: nowIso
          } : b)
          const paidCount = updated.filter(b => b.payment_status === 'Paid').length
          const pendingCount = updated.filter(b => b.payment_status === 'Pending').length
          setStats(s => ({ ...s, paidCount, pendingCount }))
          return updated
        })

        // Move to respective tab automatically
        if (newStatus === 'Paid') {
          setActiveTab('paid')
          setCurrentPage(1)
        } else if (newStatus === 'Cancelled') {
          setActiveTab('cancelled')
          setCurrentPage(1)
        } else if (newStatus === 'Pending') {
          setActiveTab('pending')
          setCurrentPage(1)
        }

        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        }).fire({
          icon: 'success',
          title: `Payment status updated to ${newStatus}`
        })
      } else {
        throw new Error(data.message || 'Failed to update status')
      }
    } catch (err) {
      console.error('Error updating payment status:', err)
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Could not update status.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Tab Badge Counts
  const tabCounts = useMemo(() => {
    const pending = bills.filter(b => (b.payment_status || 'Pending').toUpperCase() === 'PENDING').length
    const paid = bills.filter(b => (b.payment_status || '').toUpperCase() === 'PAID').length
    const cancelled = bills.filter(b => {
      const st = (b.payment_status || '').toUpperCase()
      return st === 'CANCELLED' || st === 'CANCEL'
    }).length
    return { pending, paid, cancelled }
  }, [bills])

  // Filter Logic with Tab Segmentation
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const st = (bill.payment_status || 'Pending').toUpperCase()

      // 0. Tab Filter
      if (activeTab === 'pending') {
        if (st !== 'PENDING') return false
      } else if (activeTab === 'paid') {
        if (st !== 'PAID') return false
      } else if (activeTab === 'cancelled') {
        if (st !== 'CANCELLED' && st !== 'CANCEL') return false
      }

      // 1. Search Query
      const matchesSearch =
        bill.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.customer_phone && bill.customer_phone.includes(searchTerm))

      // 2. Invoice Type Filter (GST vs NON_GST)
      const matchesType = typeFilter === 'ALL' || bill.invoice_type === typeFilter

      // 3. Payment Mode Filter
      const matchesMode =
        paymentModeFilter === 'ALL' ||
        bill.payment_mode === paymentModeFilter ||
        (paymentModeFilter === 'UPI' && (bill.payment_mode === 'UPI' || bill.payment_mode === 'UPI / Online')) ||
        (paymentModeFilter === 'Online / Net Banking' && (bill.payment_mode === 'Online / Net Banking' || bill.payment_mode === 'Net Banking' || bill.payment_mode === 'Bank Transfer (NEFT/RTGS)')) ||
        (paymentModeFilter === 'Credit' && (bill.payment_mode === 'Credit' || bill.payment_mode === 'Credit / Debit Card' || bill.payment_mode === 'Card'))

      // 4. Date Range Filter
      if (startDate || endDate) {
        const billDate = getLocalDateString(bill.invoice_date || bill.created_at)
        if (startDate && billDate < startDate) return false
        if (endDate && billDate > endDate) return false
      }

      return matchesSearch && matchesType && matchesMode
    })

    // Cancelled tab: sort by latest cancellation / cancelled_at DESC (most recently cancelled first)
    if (activeTab === 'cancelled') {
      return [...list].sort((a, b) => {
        const timeA = a.cancelled_at
          ? new Date(a.cancelled_at).getTime()
          : (a.updated_at ? new Date(a.updated_at).getTime() : (a.id || 0))
        const timeB = b.cancelled_at
          ? new Date(b.cancelled_at).getTime()
          : (b.updated_at ? new Date(b.updated_at).getTime() : (b.id || 0))

        if (timeB !== timeA) return timeB - timeA
        return (b.id || 0) - (a.id || 0)
      })
    }

    return list
  }, [bills, activeTab, searchTerm, typeFilter, paymentModeFilter, startDate, endDate])

  // Pagination Calculations
  const totalItems = filteredBills.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedBills = filteredBills.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Selection Logic
  const isAllPaginatedSelected =
    paginatedBills.length > 0 && paginatedBills.every((b) => selectedBillIds.includes(b.id))
  const isSomePaginatedSelected =
    paginatedBills.some((b) => selectedBillIds.includes(b.id)) && !isAllPaginatedSelected

  const handleToggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      const pageIds = paginatedBills.map((b) => b.id)
      setSelectedBillIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      const pageIds = paginatedBills.map((b) => b.id)
      setSelectedBillIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleToggleSelectRow = (id) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Excel Export Handler
  const handleExportExcel = () => {
    const targetBills =
      selectedBillIds.length > 0
        ? filteredBills.filter((b) => selectedBillIds.includes(b.id))
        : filteredBills

    if (targetBills.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Invoices to Export',
        text: 'No billing records match the current selection or filter.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const excelRows = []
    let serialCounter = 1

    targetBills.forEach((b) => {
      const items =
        b.items && b.items.length > 0
          ? b.items
          : [
              {
                item_name: 'Standard Bill Items',
                hsn_code: '-',
                quantity: b.total_items || 1,
                unit: 'NOS',
                rate: b.taxable_amount,
                tax_rate: b.cgst_rate ? parseFloat(b.cgst_rate) * 2 : 18,
                tax_amount: b.total_tax,
                amount: b.total_amount
              }
            ]

      items.forEach((item, itemIdx) => {
        excelRows.push({
          'S.No': serialCounter++,
          'Invoice #': b.invoice_number,
          'Type': b.invoice_type || 'GST',
          'Date': new Date(b.invoice_date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          'Customer Name': b.customer_name || '',
          'Mobile Number': b.customer_phone || '-',
          'Item Description': item.item_name || item.name || '-',
          'HSN / SAC': item.hsn_code || '-',
          'Quantity': parseFloat(item.quantity) || 1,
          'Unit': item.unit || 'NOS',
          'Rate (₹)': parseFloat(item.rate || 0).toFixed(2),
          'Tax (%)': `${parseFloat(item.tax_rate || 0)}%`,
          'Tax Amount (₹)': parseFloat(item.tax_amount || 0).toFixed(2),
          'Item Total (₹)': parseFloat(item.amount || 0).toFixed(2),
          'Bill Grand Total (₹)': itemIdx === 0 ? parseFloat(b.total_amount || 0).toFixed(2) : '',
          'Payment Status': b.payment_status || 'Paid',
          'Payment Mode': b.payment_mode || 'Cash'
        })
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Simcha Invoices')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 18 }, // Invoice #
      { wch: 10 }, // Type
      { wch: 14 }, // Date
      { wch: 22 }, // Customer Name
      { wch: 15 }, // Mobile Number
      { wch: 28 }, // Item Description
      { wch: 12 }, // HSN / SAC
      { wch: 10 }, // Quantity
      { wch: 8 },  // Unit
      { wch: 12 }, // Rate (₹)
      { wch: 10 }, // Tax (%)
      { wch: 14 }, // Tax Amount (₹)
      { wch: 14 }, // Item Total (₹)
      { wch: 18 }, // Bill Grand Total (₹)
      { wch: 14 }, // Payment Status
      { wch: 14 }  // Payment Mode
    ]

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Simcha_Invoices_Detailed_${dateStr}.xlsx`)

    Swal.fire({
      icon: 'success',
      title: 'Excel Export Ready',
      text: `Successfully exported ${excelRows.length} item record(s) across ${targetBills.length} invoice(s) to Excel.`,
      timer: 2000,
      showConfirmButton: false
    })
  }

  return (
    <div className="space-y-6 font-['Poppins',sans-serif] pb-16 animate-in fade-in duration-200">
      
      {/* 1. Transparent Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
            <List className="text-[#043486] dark:text-blue-400" size={22} />
            <span>OUTWARD LIST</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Manage billing records, export customer receipts, and review payment status.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {canDownload && (
            <Button
              variant="export"
              icon={Download}
              onClick={handleExportExcel}
              className="w-full justify-center text-[11px] sm:text-xs font-semibold px-2 sm:px-4 py-2"
              title={selectedBillIds.length > 0 ? `Export ${selectedBillIds.length} Selected Bill(s)` : 'Export All Filtered Bills'}
            >
              <span className="truncate">{selectedBillIds.length > 0 ? `EXPORT (${selectedBillIds.length})` : 'EXPORT TO EXCEL'}</span>
            </Button>
          )}
          {canAdd && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                if (setActiveRoute) setActiveRoute('create-bill')
                navigate('/outward')
              }}
              className="w-full justify-center text-[11px] sm:text-xs font-semibold px-2 sm:px-4 py-2"
            >
              <span className="truncate">CREATE NEW BILL</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ListKpiCard
          label="Total Invoices"
          value={stats.totalBills}
          icon={Receipt}
          variant="blue"
        />
        <ListKpiCard
          label="Total Revenue"
          value={`₹ ${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={IndianRupee}
          variant="blueValue"
        />
        <ListKpiCard
          label="Paid Invoices"
          value={stats.paidCount}
          icon={CheckCircle2}
          variant="emerald"
        />
        <ListKpiCard
          label="Pending / Partial"
          value={stats.pendingCount}
          icon={Clock}
          variant="amber"
        />
      </div>

      {/* 3. Advanced Multi-Filter Bar & Date Range Filtering */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        
        {/* Top Filter Row: Search & Type / Mode Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-5">
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
              placeholder="Search invoice ID, customer name, phone..."
            />
          </div>

          {/* Invoice Type Dropdown */}
          <div className="col-span-1 lg:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2.5 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
            >
              <option value="ALL">All Invoice Types</option>
              <option value="GST">GST Tax Invoice</option>
              <option value="NON_GST">NON-GST Invoice</option>
            </select>
          </div>

          {/* Payment Mode Dropdown */}
          <div className="col-span-1 lg:col-span-3">
            <select
              value={paymentModeFilter}
              onChange={(e) => {
                setPaymentModeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2.5 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Online / Net Banking">Online / Net Banking</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          {/* Reset / Reload Filters */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                handleResetFilters()
                fetchInitialData()
              }}
              title="Reload Outward Data"
              className="w-full lg:w-auto p-2.5 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span className="lg:hidden text-xs font-semibold">Reset Filters</span>
            </button>
          </div>

        </div>

        {/* Date to Date Range Filter Row */}
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

      {/* 4. Three Navigation Tabs (Velzon Wizard / Chevron Tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TabNav>
          <TabButton
            active={activeTab === 'pending'}
            onClick={() => {
              setActiveTab('pending')
              setCurrentPage(1)
            }}
            icon={Clock}
            badge={tabCounts.pending}
            variant="amber"
          >
            PENDING
          </TabButton>
          <TabButton
            active={activeTab === 'paid'}
            onClick={() => {
              setActiveTab('paid')
              setCurrentPage(1)
            }}
            icon={CheckCircle2}
            badge={tabCounts.paid}
            variant="emerald"
          >
            PAID
          </TabButton>
          <TabButton
            active={activeTab === 'cancelled'}
            onClick={() => {
              setActiveTab('cancelled')
              setCurrentPage(1)
            }}
            icon={X}
            badge={tabCounts.cancelled}
            variant="rose"
          >
            CANCELLED
          </TabButton>
        </TabNav>
      </div>

      {/* 5. Bills Table (Crisp Boxie Layout) */}
      <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <div className="h-9 bg-slate-100 dark:bg-slate-800 flex items-center px-4 gap-4 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-3 bg-slate-200 dark:bg-slate-700 rounded-xs flex-1" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, rIdx) => (
              <div
                key={rIdx}
                className="h-11 border-b border-gray-100 dark:border-slate-800/70 flex items-center px-4 gap-4 animate-pulse"
              >
                {Array.from({ length: 8 }).map((_, cIdx) => (
                  <div
                    key={cIdx}
                    className={`h-3 bg-slate-200/80 dark:bg-slate-800 rounded-xs ${
                      cIdx === 0 ? 'w-10' : cIdx === 7 ? 'w-16' : 'flex-1'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : paginatedBills.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Receipt size={36} className="mx-auto text-gray-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No matching invoices found</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-xs uppercase tracking-wider text-gray-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-3.5 text-center w-10">
                    <Checkbox
                      checked={isAllPaginatedSelected}
                      indeterminate={isSomePaginatedSelected}
                      onChange={handleToggleSelectAll}
                      title="Select / Deselect all on this page"
                    />
                  </th>
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  {activeTab !== 'cancelled' && (
                    <th className="py-3 px-3 text-center">Payment Type</th>
                  )}
                  <th className="py-3 px-3 text-center">Status</th>
                  {activeTab === 'cancelled' ? (
                    <th className="py-3 px-4 text-center">Reason</th>
                  ) : (
                    <th className="py-3 px-4 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-xs font-medium">
                {paginatedBills.map((bill) => {
                  const isSelected = selectedBillIds.includes(bill.id)
                  const isPaid = bill.payment_status === 'Paid'
                  const isCancelled = bill.payment_status === 'Cancelled' || bill.payment_status === 'Cancel'

                  return (
                    <tr
                      key={bill.id}
                      className={`transition-colors ${
                        isCancelled
                          ? 'opacity-65 bg-gray-50/80 dark:bg-slate-900/60'
                          : isSelected
                          ? 'bg-blue-50/60 dark:bg-blue-950/30'
                          : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3.5 px-3.5 text-center">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(bill.id)}
                        />
                      </td>

                      {/* Invoice # */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleViewBill(bill.id)}
                          className={`font-mono font-bold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center text-left ${
                            isCancelled ? 'line-through text-slate-500 dark:text-slate-400' : ''
                          }`}
                          title="Click to view Invoice"
                        >
                          <span>{bill.invoice_number}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className={`py-3.5 px-4 text-gray-600 dark:text-slate-400 whitespace-nowrap ${isCancelled ? 'line-through' : ''}`}>
                        {new Date(bill.invoice_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4">
                        <p className={`font-semibold text-gray-900 dark:text-white ${isCancelled ? 'line-through text-slate-500' : ''}`}>{bill.customer_name}</p>
                      </td>

                      {/* Mobile Number (Dedicated Column) */}
                      <td className={`py-3.5 px-4 font-mono text-gray-600 dark:text-slate-300 ${isCancelled ? 'line-through' : ''}`}>
                        {bill.customer_phone ? (
                          <span>{bill.customer_phone}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Items count */}
                      <td className={`py-3.5 px-4 text-center font-mono font-semibold text-gray-700 dark:text-slate-300 ${isCancelled ? 'line-through' : ''}`}>
                        {bill.total_items || 1}
                      </td>

                      {/* Total Amount */}
                      <td className={`py-3.5 px-4 text-right font-mono font-bold text-[#043486] dark:text-blue-400 ${isCancelled ? 'line-through text-slate-500' : ''}`}>
                        ₹ {parseFloat(bill.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Payment Type Dropdown (Hidden in Cancelled Tab) */}
                      {activeTab !== 'cancelled' && (
                        <td className="py-3.5 px-3 text-center">
                          <select
                            value={bill.payment_mode || ''}
                            onChange={(e) => handleUpdatePaymentType(bill.id, e.target.value)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors cursor-pointer hover:border-gray-400"
                          >
                            <option value="">Select</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Online / Net Banking">Online / Net Banking</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Credit">Credit</option>
                          </select>
                        </td>
                      )}

                      {/* Status Dropdown / Pill */}
                      <td className="py-3.5 px-3 text-center">
                        {isCancelled ? (
                          <StatusPill status="Cancelled" size="sm" />
                        ) : (
                          <select
                            value={bill.payment_status || 'Pending'}
                            onChange={(e) => handleUpdatePaymentStatus(bill.id, e.target.value)}
                            className={`px-2.5 py-1.5 text-[11px] font-bold uppercase rounded-none border focus:outline-none cursor-pointer transition-colors ${
                              isPaid
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Cancelled">Cancel</option>
                          </select>
                        )}
                      </td>

                      {/* Actions Column OR Reason Column */}
                      {activeTab === 'cancelled' ? (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <ActionButton
                              icon={FileText}
                              onClick={() => handleShowCancellationReason(bill)}
                              className="!text-[#043486] dark:!text-blue-400 hover:!bg-blue-50 dark:hover:!bg-slate-800"
                              title="View Cancellation Reason"
                            />
                          </div>
                        </td>
                      ) : (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* In Pending Tab: Send Invoice Email */}
                            {activeTab === 'pending' && (
                              <ActionButton
                                icon={Send}
                                onClick={() => handleSendInvoiceEmail(bill)}
                                className={
                                  bill.invoice_sent
                                    ? '!text-red-500 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-slate-800'
                                    : '!text-[#043486] dark:!text-blue-400 hover:!bg-blue-50 dark:hover:!bg-slate-800'
                                }
                                title={
                                  bill.invoice_sent
                                    ? 'Invoice Already Sent (Click for details)'
                                    : 'Send Tax Invoice Email to Customer'
                                }
                              />
                            )}

                            {/* In Paid Tab: View/Print Receipt + Send Receipt Email */}
                            {activeTab === 'paid' && (
                              <>
                                <ActionButton
                                  icon={FileCheck}
                                  onClick={() => handlePrintReceipt(bill.id)}
                                  className="!text-purple-600 dark:!text-purple-400 hover:!bg-purple-50 dark:hover:!bg-slate-800"
                                  title="Print / View Payment Receipt"
                                />
                                <ActionButton
                                  icon={Send}
                                  onClick={() => handleSendReceiptEmail(bill)}
                                  className={
                                    bill.receipt_sent
                                      ? '!text-red-500 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-slate-800'
                                      : '!text-emerald-600 dark:!text-emerald-400 hover:!bg-emerald-50 dark:hover:!bg-slate-800'
                                  }
                                  title={
                                    bill.receipt_sent
                                      ? 'Receipt Already Sent (Click for details)'
                                      : 'Send Receipt Email to Customer'
                                  }
                                />
                              </>
                            )}

                            {/* Edit Invoice (Active ONLY in Pending, Disabled in Paid/Cancelled) */}
                            {canEdit && (
                              <ActionButton
                                type="edit"
                                onClick={() => !isPaid && !isCancelled && navigate(`/outward?editId=${bill.id}`)}
                                disabled={isPaid || isCancelled}
                                className={
                                  isPaid || isCancelled
                                    ? '!text-gray-300 dark:!text-slate-700 opacity-30 cursor-not-allowed'
                                    : '!text-amber-600 dark:!text-amber-400 hover:!bg-amber-50 dark:hover:!bg-slate-800'
                                }
                                title={
                                  isCancelled
                                    ? 'Cannot edit a cancelled invoice'
                                    : isPaid
                                    ? 'Cannot edit a paid invoice'
                                    : 'Edit Invoice'
                                }
                              />
                            )}

                            {/* Delete Invoice (Active ONLY in Pending, Disabled in Paid/Cancelled) */}
                            {canDelete && (
                              <ActionButton
                                type="delete"
                                onClick={() => !isPaid && !isCancelled && handleDeleteBill(bill.id, bill.invoice_number)}
                                disabled={isPaid || isCancelled}
                                className={
                                  isPaid || isCancelled
                                    ? '!text-gray-300 dark:!text-slate-700 opacity-30 cursor-not-allowed'
                                    : '!text-gray-400 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-slate-800'
                                }
                                title={
                                  isCancelled
                                    ? 'Cannot delete a cancelled invoice'
                                    : isPaid
                                    ? 'Cannot delete a paid invoice'
                                    : 'Delete Invoice'
                                }
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Exact Pagination Bar */}
        <ListPagePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBills.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val)
            setCurrentPage(1)
          }}
          onPageChange={handlePageChange}
        />

      </div>

      {/* 5. High-Fidelity Invoice Preview, Print & PDF Modal */}
      <InvoiceModal
        isOpen={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        bill={selectedBill}
        settings={settings}
      />

      {/* 6. High-Fidelity Payment Receipt Preview, Print & PDF Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptBill)}
        onClose={() => setSelectedReceiptBill(null)}
        bill={selectedReceiptBill}
        settings={settings}
      />

      {/* 7. Direct Printable Invoice Portal for instant window.print() */}
      {selectedBill && typeof document !== 'undefined' && createPortal(
        <div id="invoice-print-wrapper">
          <InvoiceTemplate bill={selectedBill} settings={settings} />
        </div>,
        document.body
      )}

      {/* 8. Direct Printable Receipt Portal for instant window.print() */}
      {selectedReceiptBill && typeof document !== 'undefined' && createPortal(
        <div id="receipt-print-wrapper">
          <ReceiptTemplate bill={selectedReceiptBill} settings={settings} />
        </div>,
        document.body
      )}

    </div>
  )
}
