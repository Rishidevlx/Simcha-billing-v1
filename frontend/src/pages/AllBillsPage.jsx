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
  Pencil
} from 'lucide-react'
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
import { API_ENDPOINTS } from '../config/api'

export default function AllBillsPage({ setActiveRoute }) {
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [stats, setStats] = useState({ totalBills: 0, totalRevenue: 0, paidCount: 0, pendingCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState(null)

  // Selection state for Excel export & batch actions
  const [selectedBillIds, setSelectedBillIds] = useState([])

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
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
    
    if (preset === 'ALL') {
      setStartDate('')
      setEndDate('')
    } else if (preset === 'TODAY') {
      const formatted = today.toISOString().split('T')[0]
      setStartDate(formatted)
      setEndDate(formatted)
    } else if (preset === 'THIS_WEEK') {
      const day = today.getDay() || 7
      const firstDay = new Date(today)
      firstDay.setDate(today.getDate() - day + 1)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(today.toISOString().split('T')[0])
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(today.toISOString().split('T')[0])
    }
    setCurrentPage(1)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
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

      const res = await fetch(API_ENDPOINTS.BILL_SEND_RECEIPT(bill.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
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

  // Inline change Payment Status
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

    try {
      const res = await fetch(API_ENDPOINTS.BILL_PAYMENT_UPDATE(billId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        setBills(prev => {
          const updated = prev.map(b => b.id === billId ? { ...b, payment_status: newStatus } : b)
          const paidCount = updated.filter(b => b.payment_status === 'Paid').length
          const pendingCount = updated.filter(b => b.payment_status === 'Pending').length
          setStats(s => ({ ...s, paidCount, pendingCount }))
          return updated
        })
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

  // Filter Logic
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      // 1. Search Query
      const matchesSearch =
        bill.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.customer_phone && bill.customer_phone.includes(searchTerm))

      // 2. Status Filter
      const matchesStatus = statusFilter === 'ALL' || bill.payment_status === statusFilter

      // 3. Invoice Type Filter (GST vs NON_GST)
      const matchesType = typeFilter === 'ALL' || bill.invoice_type === typeFilter

      // 4. Payment Mode Filter
      const matchesMode = paymentModeFilter === 'ALL' || bill.payment_mode === paymentModeFilter

      // 5. Date Range Filter
      let matchesDate = true
      if (startDate && endDate) {
        const billDate = new Date(bill.invoice_date).toISOString().split('T')[0]
        matchesDate = billDate >= startDate && billDate <= endDate
      } else if (startDate) {
        const billDate = new Date(bill.invoice_date).toISOString().split('T')[0]
        matchesDate = billDate >= startDate
      } else if (endDate) {
        const billDate = new Date(bill.invoice_date).toISOString().split('T')[0]
        matchesDate = billDate <= endDate
      }

      return matchesSearch && matchesStatus && matchesType && matchesMode && matchesDate
    })
  }, [bills, searchTerm, statusFilter, typeFilter, paymentModeFilter, startDate, endDate])

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
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-['Poppins',sans-serif]">
      
      {/* 1. Header & Quick Action Banner */}
      <ListPageHeader
        title="Outward List"
        subtitle="Manage billing records, export customer receipts, and review payment status."
        actions={
          <>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs rounded-none shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              title={selectedBillIds.length > 0 ? `Export ${selectedBillIds.length} Selected Bill(s)` : 'Export All Filtered Bills'}
            >
              <Download size={15} />
              <span>
                {selectedBillIds.length > 0 ? `EXPORT SELECTED (${selectedBillIds.length})` : 'EXPORT TO EXCEL'}
              </span>
            </button>
            <button
              onClick={() => {
                if (setActiveRoute) setActiveRoute('create-bill')
                navigate('/outward')
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-xs rounded-none shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <Plus size={15} />
              <span>CREATE NEW BILL</span>
            </button>
          </>
        }
      />

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
        
        {/* Top Filter Row: Search & Status / Type / Mode Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search invoice #, customer name, phone..."
              className="w-full pl-9 pr-4 py-2.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium placeholder:text-gray-400"
            />
          </div>

          {/* Payment Status Dropdown */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2.5 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
            >
              <option value="ALL">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Invoice Type Dropdown */}
          <div className="md:col-span-2">
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
          <div className="md:col-span-2">
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
              <option value="Credit">Credit</option>
              <option value="Card">Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-1">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="w-full flex items-center justify-center gap-1 py-2.5 px-2 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-none border border-gray-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
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

      {/* 3. Bills Table (Crisp Boxie Layout) */}
      <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#043486] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400 font-medium">Loading invoices...</span>
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
              <thead className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-3.5 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded-none accent-[#043486] cursor-pointer"
                      title="Select / Deselect all on this page"
                    />
                  </th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-3 text-center">Payment Type</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-xs font-medium">
                {paginatedBills.map((bill) => {
                  const isSelected = selectedBillIds.includes(bill.id)
                  const isPaid = bill.payment_status === 'Paid'
                  const isCancelled = bill.payment_status === 'Cancelled' || bill.payment_status === 'Cancel'
                  const isEditDeleteDisabled = isPaid || isCancelled

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
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(bill.id)}
                          className="w-4 h-4 rounded-none accent-[#043486] cursor-pointer"
                        />
                      </td>

                      {/* Invoice # */}
                      <td className={`py-3.5 px-4 font-mono font-bold text-[#043486] dark:text-blue-400 ${isCancelled ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                        <span>{bill.invoice_number}</span>
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

                      {/* Payment Type Dropdown */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={bill.payment_mode || ''}
                          disabled={isCancelled}
                          onChange={(e) => handleUpdatePaymentType(bill.id, e.target.value)}
                          className={`px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors ${
                            isCancelled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'
                          }`}
                        >
                          <option value="">Select</option>
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Online / Net Banking">Online / Net Banking</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Credit">Credit</option>
                        </select>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={bill.payment_status || 'Pending'}
                          onChange={(e) => handleUpdatePaymentStatus(bill.id, e.target.value)}
                          className={`px-2.5 py-1.5 text-[11px] font-bold uppercase rounded-none border focus:outline-none cursor-pointer transition-colors ${
                            isPaid
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : isCancelled
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                              : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancel</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1. Direct Print Invoice */}
                          <button
                            onClick={() => handlePrintDirect(bill.id)}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Direct Print Invoice"
                          >
                            <Printer size={15} />
                          </button>

                          {/* 2. Direct Print Receipt (Active ONLY when Paid) */}
                          <button
                            onClick={() => handlePrintReceipt(bill.id)}
                            disabled={!isPaid}
                            className={`p-1.5 transition-colors ${
                              isPaid
                                ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 cursor-pointer'
                                : 'text-gray-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                            }`}
                            title={
                              isPaid
                                ? 'Print / View Payment Receipt'
                                : 'Receipt available only when status is Paid'
                            }
                          >
                            <FileCheck size={15} />
                          </button>

                          {/* 3. Send Receipt Email (Active ONLY when Paid, icon turns red once sent) */}
                          <button
                            onClick={() => handleSendReceiptEmail(bill)}
                            disabled={!isPaid}
                            className={`p-1.5 transition-colors ${
                              isPaid
                                ? bill.receipt_sent
                                  ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer'
                                  : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer'
                                : 'text-gray-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                            }`}
                            title={
                              !isPaid
                                ? 'Send Receipt (Available only when status is Paid)'
                                : bill.receipt_sent
                                ? 'Receipt Already Sent (Click for details)'
                                : 'Send Receipt Email to Customer'
                            }
                          >
                            <Send size={15} />
                          </button>

                          {/* 4. Edit Invoice (Inactive if Paid or Cancelled) */}
                          <button
                            onClick={() => !isEditDeleteDisabled && navigate(`/outward?editId=${bill.id}`)}
                            disabled={isEditDeleteDisabled}
                            className={`p-1.5 rounded-none border transition-all shadow-2xs ${
                              isEditDeleteDisabled
                                ? 'text-gray-300 dark:text-slate-700 bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-30'
                                : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border-amber-200 dark:border-amber-800 cursor-pointer'
                            }`}
                            title={
                              isCancelled
                                ? 'Cannot edit a cancelled invoice'
                                : isPaid
                                ? 'Cannot edit a paid invoice'
                                : 'Edit Invoice'
                            }
                          >
                            <Pencil size={15} />
                          </button>

                          {/* 5. View Invoice Modal / PDF */}
                          <button
                            onClick={() => handleViewBill(bill.id)}
                            className="p-1.5 text-[#043486] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View / Download Invoice PDF"
                          >
                            <Eye size={15} />
                          </button>

                          {/* 6. Delete Invoice (Inactive if Paid or Cancelled) */}
                          <button
                            onClick={() => !isEditDeleteDisabled && handleDeleteBill(bill.id, bill.invoice_number)}
                            disabled={isEditDeleteDisabled}
                            className={`p-1.5 transition-colors ${
                              isEditDeleteDisabled
                                ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed opacity-30'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer'
                            }`}
                            title={
                              isCancelled
                                ? 'Cannot delete a cancelled invoice'
                                : isPaid
                                ? 'Cannot delete a paid invoice'
                                : 'Delete Invoice'
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
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
