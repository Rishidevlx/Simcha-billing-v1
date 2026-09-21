import { useState, useEffect, useMemo } from 'react'
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
  Pencil
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import ServiceInvoiceTemplate from '../components/invoice/ServiceInvoiceTemplate'
import ServiceReceiptTemplate from '../components/receipt/ServiceReceiptTemplate'
import ListPageHeader from '../components/common/ListPageHeader'
import ListKpiCard from '../components/common/ListKpiCard'
import ListDateRangeFilter from '../components/common/ListDateRangeFilter'
import ListPagePagination from '../components/common/ListPagePagination'
import { API_ENDPOINTS } from '../config/api'

export const SERVICE_STATUS_STAGES = [
  'Received',
  'Quotation',
  'Customer Approval',
  'Payment Received',
  'Repair In-Progress',
  'Ready',
  'Delivered'
]

export default function AllServicesPage({ setActiveRoute }) {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
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

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)

      // 1. Fetch Services
      const res = await fetch(API_ENDPOINTS.SERVICES)
      const data = await res.json()
      if (data.success) {
        setServices(data.services || [])
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
      console.error('Error fetching services data:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to retrieve service history from database.',
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
    const formatDateLocal = (d) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (preset === 'ALL') {
      setStartDate('')
      setEndDate('')
    } else if (preset === 'TODAY') {
      const formatted = formatDateLocal(today)
      setStartDate(formatted)
      setEndDate(formatted)
    } else if (preset === 'THIS_WEEK') {
      const day = today.getDay() || 7
      const firstDay = new Date(today)
      firstDay.setDate(today.getDate() - day + 1)
      setStartDate(formatDateLocal(firstDay))
      setEndDate(formatDateLocal(today))
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(formatDateLocal(firstDay))
      setEndDate(formatDateLocal(today))
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

  // Quick Status Update
  const handleStatusChange = async (serviceId, newStatus) => {
    try {
      const res = await fetch(API_ENDPOINTS.SERVICE_STATUS_UPDATE(serviceId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        setServices(prev =>
          prev.map(s => (s.id === serviceId ? { ...s, service_status: newStatus } : s))
        )
        // Refresh full list to get updated stats
        fetchInitialData()

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
      console.error('Error updating status:', err)
      Swal.fire({
        icon: 'error',
        title: 'Status Update Failed',
        text: err.message || 'Could not update service status.',
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
          fetchInitialData()
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

  // Filter Logic
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // 1. Search filter
      const search = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !search ||
        service.service_number?.toLowerCase().includes(search) ||
        service.customer_name?.toLowerCase().includes(search) ||
        service.customer_phone?.toLowerCase().includes(search) ||
        service.service_title?.toLowerCase().includes(search) ||
        service.item_details?.toLowerCase().includes(search)

      // 2. Status filter
      const matchesStatus =
        statusFilter === 'ALL' || service.service_status === statusFilter

      // 3. Payment Mode filter
      const matchesPaymentMode =
        paymentModeFilter === 'ALL' || service.payment_mode === paymentModeFilter

      // 4. Date Range filter
      let matchesDate = true
      if (service.service_date) {
        let sDateStr = ''
        if (typeof service.service_date === 'string') {
          sDateStr = service.service_date.slice(0, 10)
        } else if (service.service_date instanceof Date) {
          const y = service.service_date.getFullYear()
          const m = String(service.service_date.getMonth() + 1).padStart(2, '0')
          const d = String(service.service_date.getDate()).padStart(2, '0')
          sDateStr = `${y}-${m}-${d}`
        }

        if (startDate && sDateStr) {
          matchesDate = matchesDate && sDateStr >= startDate
        }
        if (endDate && sDateStr) {
          matchesDate = matchesDate && sDateStr <= endDate
        }
      }

      return matchesSearch && matchesStatus && matchesPaymentMode && matchesDate
    })
  }, [services, searchTerm, statusFilter, paymentModeFilter, startDate, endDate])

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
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
      case 'Customer Approval':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
      case 'Payment Received':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
      case 'Repair In-Progress':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
      case 'Ready':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800'
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Component */}
      <ListPageHeader
        title="Services & Repairs Registry"
        subtitle="Manage end-to-end service requests, track lifecycle stages, process invoices & dispatch receipts"
        actions={
          <>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs rounded-none shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              title={selectedServiceIds.length > 0 ? `Export ${selectedServiceIds.length} Selected Record(s)` : 'Export All Filtered Records'}
            >
              <Download size={15} />
              <span>
                {selectedServiceIds.length > 0 ? `EXPORT SELECTED (${selectedServiceIds.length})` : 'EXPORT TO EXCEL'}
              </span>
            </button>
            <button
              onClick={() => {
                if (setActiveRoute) setActiveRoute('new-service')
                navigate('/services/new')
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-xs rounded-none shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <Plus size={15} />
              <span>NEW REQUEST</span>
            </button>
          </>
        }
      />

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ListKpiCard
          label="Total Service Requests"
          value={stats.totalServices || 0}
          icon={Wrench}
          accentColor="#043486"
        />
        <ListKpiCard
          label="Total Service Revenue"
          value={`₹${Number(stats.totalValue || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          icon={IndianRupee}
          accentColor="#059669"
        />
        <ListKpiCard
          label="Active In-Progress / Repairs"
          value={stats.inProgressCount || 0}
          icon={Clock}
          accentColor="#d97706"
        />
        <ListKpiCard
          label="Ready & Delivered"
          value={stats.readyDeliveredCount || 0}
          icon={CheckCircle2}
          accentColor="#10b981"
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by Service #, Customer Name, Phone, Item / Issue..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#043486] transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#043486] transition-colors"
            >
              <option value="ALL">All Service Stages (7 Stages)</option>
              {SERVICE_STATUS_STAGES.map((st) => (
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

          {/* Reset Filters */}
          <div className="md:col-span-1">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="w-full h-full min-h-[34px] flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-none border border-gray-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
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

      {/* 4. Service Records Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllCurrentSelected}
                    onChange={handleSelectAll}
                    className="cursor-pointer accent-[#043486]"
                  />
                </th>
                <th className="p-3">Service ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Mobile Number</th>
                <th className="p-3">Product &amp; QTY</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#043486] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading service registry records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">
                    No service requests found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedServices.map((service) => {
                  const isSelected = selectedServiceIds.includes(service.id)
                  const isReceiptActive = [
                    'Payment Received',
                    'Repair In-Progress',
                    'Ready',
                    'Delivered'
                  ].includes(service.service_status)
                  const isEmailSent =
                    service.receipt_email_sent === 1 || service.receipt_email_sent === true
                  const itemsList = service.items || []

                  return (
                    <tr
                      key={service.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(service.id)}
                          className="cursor-pointer accent-[#043486]"
                        />
                      </td>

                      {/* 2. Service ID (Clean plain text, no spanner icon) */}
                      <td className="p-3 font-semibold text-[#043486] dark:text-blue-400 font-mono whitespace-nowrap">
                        {service.service_number}
                      </td>

                      {/* 3. Date */}
                      <td className="p-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {service.service_date
                          ? new Date(service.service_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>

                      {/* 4. Customer (Just Name only) */}
                      <td className="p-3 min-w-[140px] font-semibold text-slate-800 dark:text-slate-200">
                        {service.customer_name}
                      </td>

                      {/* 5. Mobile Number Column */}
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {service.customer_phone ? (
                          <span>{service.customer_phone}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 6. Product & QTY (No outer box, no brand name, just simple clean text) */}
                      <td className="p-3 min-w-[160px]">
                        {itemsList.length > 0 ? (
                          <div className="space-y-1">
                            {itemsList.map((it, idx) => (
                              <div key={idx} className="text-xs text-slate-800 dark:text-slate-200">
                                <span className="font-semibold">{it.product_name || it.item_name}</span>
                                <span className="text-slate-600 dark:text-slate-400 ml-1.5 font-mono">
                                  - {parseFloat(it.quantity) || 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* 7. Total */}
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono whitespace-nowrap">
                        ₹{' '}
                        {Number(service.grand_total || service.total_amount || 0).toLocaleString(
                          'en-IN',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }
                        )}
                      </td>

                      {/* 8. Status (7-Stage Lifecycle Dropdown with enhanced padding like Outward) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <select
                          value={service.service_status}
                          onChange={(e) => handleStatusChange(service.id, e.target.value)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-none border focus:outline-none cursor-pointer transition-colors shadow-2xs ${getStatusBadgeClass(
                            service.service_status
                          )}`}
                        >
                          {SERVICE_STATUS_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 9. Actions (Print, View, Serial Numbers Check, Send, Delete) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Print Invoice Icon (Emerald) */}
                          <button
                            type="button"
                            onClick={() => handleDirectPrintService(service.id)}
                            title="Print Service Invoice"
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* 2. View Service Invoice Modal Icon (Purple) */}
                          <button
                            type="button"
                            onClick={() => handleViewService(service.id)}
                            title="View Service Invoice"
                            className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 3. Check Serial Numbers Modal Icon (FileDigit icon from Stock) */}
                          <button
                            type="button"
                            onClick={() => handleViewSerials(service)}
                            title="Check Hardware Serial Numbers"
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <FileDigit className="w-4 h-4" />
                          </button>

                          {/* 4. Send Receipt Email Icon (Indigo / Red when sent) */}
                          <button
                            type="button"
                            disabled={!isReceiptActive}
                            onClick={() => handleSendReceiptEmail(service)}
                            title={
                              !isReceiptActive
                                ? 'Receipt email available from Payment Received stage onwards'
                                : isEmailSent
                                ? 'Receipt Email Sent'
                                : 'Send Receipt PDF via Email'
                            }
                            className={`p-1.5 transition-colors cursor-pointer ${
                              !isReceiptActive
                                ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                                : isEmailSent
                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-slate-800'
                                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* 5. Edit Service Record (Amber / Orange box matching Stock) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (setActiveRoute) setActiveRoute('new-service')
                              navigate(`/services/new?editId=${service.id}`)
                            }}
                            title="Edit Service Request"
                            className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border border-amber-200 dark:border-amber-800 rounded-none transition-all cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* 6. Delete Service Record (Red) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteService(service.id, service.service_number)}
                            title="Delete Service Record"
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Component */}
        <ListPagePagination
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
                    company={settings}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 7. Printable Service Receipt Modal */}
      {selectedReceiptService &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:hidden">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl my-8 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Official Service Payment Receipt — {selectedReceiptService.service_number}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDirectPrintReceiptService(selectedReceiptService)
                      setTimeout(() => {
                        window.print()
                      }, 250)
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptService(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Receipt Template Container */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950/50">
                <div className="max-w-[700px] mx-auto bg-white shadow-md">
                  <ServiceReceiptTemplate
                    service={selectedReceiptService}
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
            <ServiceInvoiceTemplate service={directPrintService} settings={settings} />
          </div>,
          document.body
        )}

      {/* 10. Direct Printable Receipt Portal for instant table action window.print() */}
      {directPrintReceiptService &&
        typeof document !== 'undefined' &&
        createPortal(
          <div id="receipt-print-wrapper">
            <ServiceReceiptTemplate service={directPrintReceiptService} company={settings} />
          </div>,
          document.body
        )}
    </div>
  )
}
