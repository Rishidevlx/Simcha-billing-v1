import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
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
import QuotationModal from '../components/quotation/QuotationModal'
import QuotationTemplate from '../components/quotation/QuotationTemplate'
import ListKpiCard from '../components/common/ListKpiCard'
import ListDateRangeFilter from '../components/common/ListDateRangeFilter'
import ListPagePagination from '../components/common/ListPagePagination'
import { Button, ActionButton, SearchInput, Checkbox, StatusPill, TabNav, TabButton } from '../components/ui'
import { API_ENDPOINTS } from '../config/api'
import { getUserPermissions } from '../utils/access'
import { generateQuotationPdfBase64 } from '../utils/pdfEmailHelper'

// Local Date Helper to eliminate timezone UTC discrepancy
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

export default function AllQuotationsPage({ setActiveRoute }) {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState([])
  const [stats, setStats] = useState({ totalQuotations: 0, totalValue: 0, draftCount: 0, sentCount: 0, approvedCount: 0, convertedCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('quotations', 'Add') || can('quotations_list', 'Add') || true
  const canEdit = hasAny('quotations_list', ['Edit']) || hasAny('quotations', ['Edit']) || true
  const canDelete = hasAny('quotations_list', ['Delete']) || hasAny('quotations', ['Delete']) || true
  const canDownload = hasAny('quotations_list', ['Download']) || hasAny('quotations', ['Download']) || true

  // Selection state for Excel export & batch actions
  // Selection state for Excel export & batch actions
  const [selectedQuotationIds, setSelectedQuotationIds] = useState([])

  // Active Tab State ('registry' | 'converted' | 'cancelled')
  const [activeTab, setActiveTab] = useState('registry')

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  
  // Date Range Filters
  const [datePreset, setDatePreset] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Sort State
  const [sortField, setSortField] = useState('quotation_date')
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'

  // Quotation Modal state
  const [activeQuotation, setActiveQuotation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch Quotations and System Settings
  const fetchQuotations = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(API_ENDPOINTS.QUOTATIONS)
      const data = await res.json()

      if (data.success) {
        setQuotations(data.quotations || data.data || [])
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error('Error fetching quotations:', error)
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      }).fire({
        icon: 'error',
        title: 'Failed to load quotations registry'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS)
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings || data.data)
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  useEffect(() => {
    fetchQuotations()
    fetchSettings()
  }, [])

  // Dynamic Tab Counts
  const tabCounts = useMemo(() => {
    const registry = quotations.filter(q => {
      const st = (q.quotation_status || 'Draft').toUpperCase()
      return st !== 'CONVERTED' && st !== 'CANCELLED' && st !== 'CANCEL'
    }).length
    const converted = quotations.filter(q => (q.quotation_status || '').toUpperCase() === 'CONVERTED').length
    const cancelled = quotations.filter(q => {
      const st = (q.quotation_status || '').toUpperCase()
      return st === 'CANCELLED' || st === 'CANCEL'
    }).length

    return { registry, converted, cancelled }
  }, [quotations])

  // Handle Preset Date Change
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
    const today = new Date()
    const formatDate = (d) => getLocalDateString(d)

    if (preset === 'TODAY') {
      const todayStr = formatDate(today)
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === 'YESTERDAY') {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = formatDate(yesterday)
      setStartDate(yStr)
      setEndDate(yStr)
    } else if (preset === 'THIS_WEEK') {
      const firstDay = new Date(today)
      firstDay.setDate(today.getDate() - today.getDay())
      setStartDate(formatDate(firstDay))
      setEndDate(formatDate(today))
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(formatDate(firstDay))
      setEndDate(formatDate(today))
    } else if (preset === 'THIS_QUARTER') {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3
      const firstDay = new Date(today.getFullYear(), quarterMonth, 1)
      setStartDate(formatDate(firstDay))
      setEndDate(formatDate(today))
    } else if (preset === 'ALL') {
      setStartDate('')
      setEndDate('')
    }
    setCurrentPage(1)
  }

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
    setDatePreset('ALL')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Filter & Sort Logic
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const st = (q.quotation_status || 'Draft').toUpperCase()

      // 0. Tab filter
      if (activeTab === 'registry') {
        if (st === 'CONVERTED' || st === 'CANCELLED' || st === 'CANCEL') return false
      } else if (activeTab === 'converted') {
        if (st !== 'CONVERTED') return false
      } else if (activeTab === 'cancelled') {
        if (st !== 'CANCELLED' && st !== 'CANCEL') return false
      }

      // 1. Search filter
      const searchLower = searchTerm.toLowerCase().trim()
      const matchesSearch = !searchTerm.trim() || (
        (q.quotation_number && q.quotation_number.toLowerCase().includes(searchLower)) ||
        (q.customer_name && q.customer_name.toLowerCase().includes(searchLower)) ||
        (q.customer_phone && q.customer_phone.toLowerCase().includes(searchLower)) ||
        (q.customer_email && q.customer_email.toLowerCase().includes(searchLower)) ||
        (q.total_amount && String(q.total_amount).includes(searchLower))
      )

      // 2. Status filter
      const matchesStatus = statusFilter === 'ALL' || st === statusFilter.toUpperCase()

      // 3. Type filter
      const matchesType = typeFilter === 'ALL' || (q.quotation_type || 'NON_GST').toUpperCase() === typeFilter.toUpperCase()

      // 4. Date filter
      let matchesDate = true
      if (startDate || endDate) {
        const qDateStr = getLocalDateString(q.quotation_date)
        if (startDate && qDateStr < startDate) matchesDate = false
        if (endDate && qDateStr > endDate) matchesDate = false
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate
    }).sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (sortField === 'quotation_date' || sortField === 'valid_until' || sortField === 'created_at') {
        valA = new Date(valA || 0).getTime()
        valB = new Date(valB || 0).getTime()
      } else if (sortField === 'total_amount') {
        valA = parseFloat(valA || 0)
        valB = parseFloat(valB || 0)
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = (valB || '').toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [quotations, activeTab, searchTerm, statusFilter, typeFilter, startDate, endDate, sortField, sortOrder])

  // Pagination Slice
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage) || 1
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredQuotations.slice(start, start + itemsPerPage)
  }, [filteredQuotations, currentPage, itemsPerPage])

  // Selection helpers
  const isAllPaginatedSelected = paginatedQuotations.length > 0 && paginatedQuotations.every(q => selectedQuotationIds.includes(q.id))
  const isSomePaginatedSelected = paginatedQuotations.some(q => selectedQuotationIds.includes(q.id)) && !isAllPaginatedSelected

  const handleToggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      const paginatedIds = paginatedQuotations.map(q => q.id)
      setSelectedQuotationIds(prev => prev.filter(id => !paginatedIds.includes(id)))
    } else {
      const paginatedIds = paginatedQuotations.map(q => q.id)
      setSelectedQuotationIds(prev => Array.from(new Set([...prev, ...paginatedIds])))
    }
  }

  const handleToggleSelectRow = (id) => {
    setSelectedQuotationIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Quick KPI counts
  const kpis = useMemo(() => {
    const totalCount = quotations.length
    const totalVal = quotations.reduce((acc, q) => acc + (parseFloat(q.total_amount) || 0), 0)
    const approvedCount = quotations.filter(q => q.quotation_status === 'Approved').length
    const sentCount = quotations.filter(q => q.quotation_status === 'Sent').length
    const convertedCount = quotations.filter(q => q.quotation_status === 'Converted').length

    return {
      total: totalCount,
      totalValue: totalVal,
      approved: approvedCount,
      sent: sentCount,
      converted: convertedCount
    }
  }, [quotations])

  // Open Quotation Preview Modal
  const handleViewQuotation = async (qtn) => {
    try {
      const res = await fetch(API_ENDPOINTS.QUOTATION_BY_ID(qtn.id))
      const data = await res.json()
      if (data.success && (data.quotation || data.data)) {
        setActiveQuotation(data.quotation || data.data)
        setIsModalOpen(true)
      } else {
        setActiveQuotation(qtn)
        setIsModalOpen(true)
      }
    } catch (e) {
      setActiveQuotation(qtn)
      setIsModalOpen(true)
    }
  }

  // Send Quotation PDF via Email (Instant Dispatch)
  const handleSendQuotationEmail = async (qtn) => {
    let targetEmail = (qtn.customer_email || '').trim()
    if (!targetEmail) {
      const promptResult = await Swal.fire({
        title: 'Customer Email Missing',
        text: 'Enter the email address to receive this quotation:',
        input: 'email',
        inputPlaceholder: 'customer@example.com',
        showCancelButton: true,
        confirmButtonText: 'Send Quotation',
        confirmButtonColor: '#043486',
        cancelButtonColor: '#64748b',
        inputValidator: (value) => {
          if (!value || !value.trim()) return 'Please enter a valid email address!'
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value.trim())) return 'Invalid email address format'
        }
      })
      if (!promptResult.isConfirmed || !promptResult.value) return
      targetEmail = promptResult.value.trim()
    }

    try {
      Swal.fire({
        title: 'Sending Quotation...',
        text: 'Generating PDF and sending email...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Fetch full quotation with items if needed
      let fullQtn = qtn
      if (!fullQtn.items || fullQtn.items.length === 0) {
        try {
          const detailRes = await fetch(API_ENDPOINTS.QUOTATION_BY_ID(qtn.id))
          const detailData = await detailRes.json()
          if (detailData.success && (detailData.quotation || detailData.data)) {
            fullQtn = detailData.quotation || detailData.data
          }
        } catch (e) {}
      }

      // Generate Base64 PDF directly on the frontend
      let pdfBase64 = null
      try {
        pdfBase64 = await generateQuotationPdfBase64(fullQtn, settings)
      } catch (pdfErr) {
        console.warn('Frontend PDF generation fallback note:', pdfErr)
      }

      const res = await fetch(API_ENDPOINTS.QUOTATION_SEND_EMAIL(qtn.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, pdf_base64: pdfBase64 })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        }).fire({
          icon: 'success',
          title: `Quotation sent to ${targetEmail}`
        })
        fetchQuotations()
      } else {
        throw new Error(data.message || 'Failed to dispatch email.')
      }
    } catch (err) {
      console.error('Error sending quotation email:', err)
      Swal.fire({
        icon: 'error',
        title: 'Dispatch Failed',
        text: err.message || 'Unable to send quotation email. Please verify SMTP settings.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Convert Quotation to Invoice (Generates Outward Bill & Deducts Stock)
  const handleConvertToInvoice = async (qtn) => {
    if (qtn.quotation_status === 'Converted') {
      Swal.fire({
        icon: 'info',
        title: 'Already Converted',
        text: `This quotation has already been converted to Invoice #${qtn.converted_invoice_number || ''}.`,
        confirmButtonColor: '#043486'
      })
      return
    }

    const confirm = await Swal.fire({
      title: 'Convert to Outward Bill?',
      html: `Converting Quotation <strong>#${qtn.quotation_number}</strong> will create a new official Outward Invoice and automatically deduct stock.<br/><br/>Do you want to proceed?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Convert to Bill',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#043486'
    })

    if (!confirm.isConfirmed) return

    try {
      Swal.showLoading()
      const res = await fetch(API_ENDPOINTS.QUOTATION_CONVERT(qtn.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()

      if (res.ok && data.success) {
        const invNum = data.invoiceNumber || data.invoice_number || ''
        Swal.fire({
          icon: 'success',
          title: 'Converted to Invoice!',
          html: `Quotation converted successfully! Invoice <strong>#${invNum}</strong> generated.`,
          confirmButtonText: 'View Invoices',
          confirmButtonColor: '#043486'
        }).then(() => {
          fetchQuotations()
          navigate('/outward-list')
        })
      } else if (data.isStockError && data.stockErrors) {
        const listHtml = data.stockErrors.map(e => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:left;">
            <div>
              <div style="font-weight:700; color:#0f172a;">${e.itemName}</div>
              <div style="color:#64748b; font-size:11px;">Shortage: <span style="color:#e11d48; font-weight:700;">${e.shortage} ${e.unit}</span></div>
            </div>
            <div style="text-align:right; font-family:monospace;">
              <span style="color:#043486; font-weight:700;">Req: ${e.required}</span> <span style="color:#94a3b8;">/</span> <span style="color:#10b981; font-weight:700;">Stock: ${e.available}</span>
            </div>
          </div>
        `).join('')

        Swal.fire({
          icon: 'warning',
          title: 'Insufficient Inventory Stock',
          html: `
            <p style="font-size:13px; color:#475569; margin-bottom:12px; text-align:left;">
              Cannot convert Quotation <strong>#${qtn.quotation_number}</strong> because required product quantities exceed currently available stock:
            </p>
            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; padding:8px 12px; margin-bottom:14px; max-height:200px; overflow-y:auto;">
              ${listHtml}
            </div>
            <p style="font-size:12px; color:#64748b; text-align:left;">
              Please create an <strong>Inward Bill (Purchase)</strong> for the shortage items, then try converting again.
            </p>
          `,
          showCancelButton: true,
          confirmButtonText: 'Go to Inward Entry',
          cancelButtonText: 'Close',
          confirmButtonColor: '#043486',
          cancelButtonColor: '#64748b'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/inward')
          }
        })
      } else {
        throw new Error(data.message || 'Failed to convert quotation to invoice.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Conversion Failed',
        text: err.message || 'Unable to convert quotation.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Update Quotation Status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(API_ENDPOINTS.QUOTATION_STATUS(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_status: newStatus })
      })
      const data = await res.json()
      if (res.ok && data.success) {
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
        fetchQuotations()
      } else {
        throw new Error(data.message || 'Failed to update status.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Status Update Failed',
        text: err.message,
        confirmButtonColor: '#043486'
      })
    }
  }

  // Delete Quotation
  const handleDeleteQuotation = async (qtn) => {
    const confirm = await Swal.fire({
      title: 'Delete Quotation?',
      html: `Are you sure you want to delete Quotation <strong>#${qtn.quotation_number}</strong>? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#475569'
    })

    if (!confirm.isConfirmed) return

    try {
      const res = await fetch(API_ENDPOINTS.QUOTATION_BY_ID(qtn.id), {
        method: 'DELETE'
      })
      const data = await res.json()

      if (res.ok && data.success) {
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        }).fire({
          icon: 'info',
          title: `Quotation #${qtn.quotation_number} deleted`
        })
        fetchQuotations()
      } else {
        throw new Error(data.message || 'Failed to delete quotation.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Could not delete quotation.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    const targetQuotations = selectedQuotationIds.length > 0
      ? quotations.filter(q => selectedQuotationIds.includes(q.id))
      : filteredQuotations

    if (targetQuotations.length === 0) {
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      }).fire({
        icon: 'warning',
        title: 'No quotations to export'
      })
      return
    }

    const exportData = targetQuotations.map((q, idx) => ({
      'S.No': idx + 1,
      'Quotation Number': q.quotation_number,
      'Date': getLocalDateString(q.quotation_date),
      'Customer Name': q.customer_name,
      'Customer Type': q.customer_type || 'Individual',
      'Mobile': q.customer_phone || '-',
      'Email': q.customer_email || '-',
      'Type': q.quotation_type || 'NON_GST',
      'Taxable (₹)': parseFloat(q.taxable_amount || 0).toFixed(2),
      'Tax Amount (₹)': parseFloat(q.total_tax || 0).toFixed(2),
      'Grand Total (₹)': parseFloat(q.total_amount || 0).toFixed(2),
      'Status': q.quotation_status || 'Draft',
      'Converted Invoice': q.converted_invoice_number || '-'
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotations')
    XLSX.writeFile(workbook, `Quotations_Registry_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="space-y-6 font-['Poppins',sans-serif] pb-16 animate-in fade-in duration-200">
      
      {/* 1. Transparent Top Bar Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
            <FileText className="text-[#043486] dark:text-blue-400" size={22} />
            <span>QUOTATIONS REGISTRY</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Track, manage, print and convert customer quotations with automated numbering and workflow tracking.
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
              title={selectedQuotationIds.length > 0 ? `Export ${selectedQuotationIds.length} Selected Quotation(s)` : 'Export All Filtered Quotations'}
            >
              {selectedQuotationIds.length > 0 ? `EXPORT SELECTED (${selectedQuotationIds.length})` : 'EXPORT TO EXCEL'}
            </Button>
          )}
          {canAdd && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                if (setActiveRoute) setActiveRoute('quotations')
                navigate('/quotations')
              }}
              className="text-xs font-semibold"
            >
              CREATE NEW QUOTATION
            </Button>
          )}
        </div>
      </div>

      {/* 2. KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ListKpiCard
          label="Total Quotations"
          value={stats.totalQuotations || kpis.total}
          icon={FileText}
          variant="blue"
        />
        <ListKpiCard
          label="Total Quotation Value"
          value={`₹ ${(stats.totalValue || kpis.totalValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={IndianRupee}
          variant="blueValue"
        />
        <ListKpiCard
          label="Approved / Sent"
          value={(stats.approvedCount || kpis.approved) + (stats.sentCount || kpis.sent)}
          icon={CheckCircle2}
          variant="emerald"
        />
        <ListKpiCard
          label="Converted to Bills"
          value={stats.convertedCount || kpis.converted}
          icon={Clock}
          variant="amber"
        />
      </div>

      {/* 2.5. Advanced Multi-Filter Bar & Date Range Filtering */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        
        {/* Top Filter Row: Search & Status / Type Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
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
              placeholder="Search quotation ID, customer name, phone..."
            />
          </div>

          {/* Quotation Status Dropdown */}
          <div className="md:col-span-3">
            {activeTab === 'registry' ? (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2.5 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
              >
                <option value="ALL">All Active Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
              </select>
            ) : activeTab === 'converted' ? (
              <select
                disabled
                value="Converted"
                className="w-full px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-none cursor-not-allowed opacity-80"
              >
                <option value="Converted">Status: Converted to Bill</option>
              </select>
            ) : (
              <select
                disabled
                value="Cancelled"
                className="w-full px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-none cursor-not-allowed opacity-80"
              >
                <option value="Cancelled">Status: Cancelled</option>
              </select>
            )}
          </div>

          {/* Quotation Type Dropdown */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2.5 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
            >
              <option value="ALL">All Quotation Types</option>
              <option value="GST">GST Tax Quotation</option>
              <option value="NON_GST">NON-GST Quotation</option>
            </select>
          </div>

          {/* Reset / Reload Filters Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                handleResetFilters()
                fetchQuotations()
              }}
              title="Reload Quotations Data"
              className="p-2 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
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

      {/* 3. Three Navigation Tabs (Velzon Wizard / Chevron Tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TabNav>
          <TabButton
            active={activeTab === 'registry'}
            onClick={() => {
              setActiveTab('registry')
              setStatusFilter('ALL')
              setCurrentPage(1)
            }}
            icon={FileText}
            badge={tabCounts.registry}
            variant="blue"
          >
            QUOTATIONS
          </TabButton>
          <TabButton
            active={activeTab === 'converted'}
            onClick={() => {
              setActiveTab('converted')
              setStatusFilter('ALL')
              setCurrentPage(1)
            }}
            icon={FileCheck}
            badge={tabCounts.converted}
            variant="emerald"
          >
            CONVERTED
          </TabButton>
          <TabButton
            active={activeTab === 'cancelled'}
            onClick={() => {
              setActiveTab('cancelled')
              setStatusFilter('ALL')
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

      {/* 4. Quotations Table (Crisp Boxie Layout identical to Outward / Inward List) */}
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
        ) : paginatedQuotations.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText size={36} className="mx-auto text-gray-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No matching quotations found</p>
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
                  <th className="py-3 px-4">Quotation ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-xs font-medium">
                {paginatedQuotations.map((q) => {
                  const isSelected = selectedQuotationIds.includes(q.id)
                  const isCancelled = (q.quotation_status || '').toUpperCase() === 'CANCELLED' || (q.quotation_status || '').toUpperCase() === 'CANCEL'
                  const isConverted = (q.quotation_status || '').toUpperCase() === 'CONVERTED'
                  const isApproved = (q.quotation_status || '').toUpperCase() === 'APPROVED'
                  const isSent = (q.quotation_status || '').toUpperCase() === 'SENT'

                  return (
                    <tr
                      key={q.id}
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
                          onChange={() => handleToggleSelectRow(q.id)}
                        />
                      </td>

                      {/* Quotation ID */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleViewQuotation(q)}
                          className={`font-mono font-bold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center text-left ${
                            isCancelled ? 'line-through text-slate-500 dark:text-slate-400' : ''
                          }`}
                          title="Click to view Quotation"
                        >
                          <span>{q.quotation_number}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className={`py-3.5 px-4 text-gray-600 dark:text-slate-400 whitespace-nowrap ${isCancelled ? 'line-through' : ''}`}>
                        {new Date(q.quotation_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4">
                        <p className={`font-semibold text-gray-900 dark:text-white ${isCancelled ? 'line-through text-slate-500' : ''}`}>{q.customer_name}</p>
                      </td>

                      {/* Mobile Number */}
                      <td className={`py-3.5 px-4 font-mono text-gray-600 dark:text-slate-300 ${isCancelled ? 'line-through' : ''}`}>
                        {q.customer_phone ? (
                          <span>{q.customer_phone}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Items count */}
                      <td className={`py-3.5 px-4 text-center font-mono font-semibold text-gray-700 dark:text-slate-300 ${isCancelled ? 'line-through' : ''}`}>
                        {q.total_items || (q.items ? q.items.length : 1)}
                      </td>

                      {/* Total Amount */}
                      <td className={`py-3.5 px-4 text-right font-mono font-bold text-[#043486] dark:text-blue-400 ${isCancelled ? 'line-through text-slate-500' : ''}`}>
                        ₹ {parseFloat(q.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status Dropdown / Pill */}
                      <td className="py-3.5 px-3 text-center">
                        {isConverted ? (
                          <StatusPill status="Converted" size="sm" />
                        ) : isCancelled ? (
                          <StatusPill status="Cancelled" size="sm" />
                        ) : (
                          <select
                            value={q.quotation_status || 'Draft'}
                            onChange={(e) => handleUpdateStatus(q.id, e.target.value)}
                            className={`px-2.5 py-1.5 text-[11px] font-bold uppercase rounded-none border focus:outline-none transition-colors cursor-pointer ${
                              isApproved
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                                : isSent
                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Approved">Approved</option>
                            <option value="Cancelled">Cancel</option>
                          </select>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Actions in Quotations Registry tab */}
                          {activeTab === 'registry' ? (
                            <>
                              {/* 1. Send Email (Indigo) - Disabled if Cancelled */}
                              <ActionButton
                                icon={Send}
                                title={isCancelled ? "Quotation is Cancelled" : "Send Quotation PDF Email"}
                                disabled={isCancelled}
                                onClick={() => !isCancelled && handleSendQuotationEmail(q)}
                                className={
                                  isCancelled
                                    ? "!text-gray-300 dark:!text-slate-700 opacity-40 cursor-not-allowed"
                                    : "!text-indigo-600 dark:!text-indigo-400 hover:!bg-indigo-50 dark:hover:!bg-slate-800"
                                }
                              />

                              {/* 2. Convert to Outward Invoice (Emerald) - Active ONLY when isApproved */}
                              {!isConverted && (
                                <ActionButton
                                  icon={FileCheck}
                                  title={
                                    isCancelled
                                      ? "Quotation is Cancelled"
                                      : !isApproved
                                      ? "Convert available only when status is Approved"
                                      : "Convert to Outward Bill"
                                  }
                                  disabled={!isApproved || isCancelled}
                                  onClick={() => isApproved && !isCancelled && handleConvertToInvoice(q)}
                                  className={
                                    (!isApproved || isCancelled)
                                      ? "!text-gray-300 dark:!text-slate-700 opacity-40 cursor-not-allowed"
                                      : "!text-emerald-600 dark:!text-emerald-400 hover:!bg-emerald-50 dark:hover:!bg-slate-800"
                                  }
                                />
                              )}

                              {/* 3. Edit Quotation (Amber) - Disabled if Approved, Converted, or Cancelled */}
                              {canEdit && (
                                <ActionButton
                                  icon={Pencil}
                                  title={
                                    isCancelled
                                      ? "Cannot edit a cancelled quotation"
                                      : isApproved
                                      ? "Cannot edit an approved quotation"
                                      : isConverted
                                      ? "Cannot edit a converted quotation"
                                      : "Edit Quotation"
                                  }
                                  disabled={isConverted || isApproved || isCancelled}
                                  onClick={() => {
                                    if (!isConverted && !isApproved && !isCancelled) {
                                      navigate(`/quotations?editId=${q.id}`)
                                    }
                                  }}
                                  className={
                                    (isConverted || isApproved || isCancelled)
                                      ? "!text-gray-300 dark:!text-slate-700 opacity-40 cursor-not-allowed"
                                      : "!text-amber-600 dark:!text-amber-400 hover:!bg-amber-50 dark:hover:!bg-slate-800"
                                  }
                                />
                              )}

                              {/* 4. Delete Quotation (Red) - Disabled if Cancelled */}
                              {canDelete && (
                                <ActionButton
                                  icon={Trash2}
                                  title={isCancelled ? "Quotation is Cancelled" : "Delete Quotation"}
                                  disabled={isCancelled}
                                  onClick={() => !isCancelled && handleDeleteQuotation(q)}
                                  className={
                                    isCancelled
                                      ? "!text-gray-300 dark:!text-slate-700 opacity-40 cursor-not-allowed"
                                      : "!text-gray-400 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-slate-800"
                                  }
                                />
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-slate-600 font-mono text-xs">-</span>
                          )}

                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination */}
        <ListPagePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredQuotations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num)
            setCurrentPage(1)
          }}
        />
      </div>

      {/* Direct Printable Quotation Portal for instant window.print() */}
      {activeQuotation && typeof document !== 'undefined' && createPortal(
        <div id="quotation-print-wrapper">
          <QuotationTemplate quotation={activeQuotation} settings={settings} />
        </div>,
        document.body
      )}

      {/* Quotation View, Print & PDF Modal */}
      {activeQuotation && (
        <QuotationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          quotation={activeQuotation}
          settings={settings}
          onQuotationUpdated={(updated) => {
            setActiveQuotation(updated)
            fetchQuotations()
          }}
        />
      )}
    </div>
  )
}
