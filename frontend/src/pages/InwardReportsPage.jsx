import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  IndianRupee,
  Boxes,
  Phone,
  Building2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  X,
  PackageCheck,
  Hash,
  ShieldCheck,
  Clock,
  Receipt,
  ImageDown
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import ListPageHeader from '../components/common/ListPageHeader'
import ListKpiCard from '../components/common/ListKpiCard'
import ListDateRangeFilter from '../components/common/ListDateRangeFilter'
import ListPagePagination from '../components/common/ListPagePagination'
import { API_ENDPOINTS } from '../config/api'

// Local Date Helper to eliminate timezone UTC discrepancy (e.g. 2026-09-18T18:30:00Z -> 2026-09-19 in IST)
const getLocalDateString = (dateVal) => {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) {
    if (typeof dateVal === 'string') {
      const m = dateVal.match(/^(\d{4}-\d{2}-\d{2})/)
      if (m) return m[1]
    }
    return ''
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function InwardReportsPage() {
  const navigate = useNavigate()
  const [inwards, setInwards] = useState([])
  const [stats, setStats] = useState({ totalInwards: 0, totalAmount: 0, totalItems: 0 })
  const [isLoading, setIsLoading] = useState(true)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [datePreset, setDatePreset] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Selected Inward IDs for Row Selection
  const [selectedIds, setSelectedIds] = useState([])

  // Selected Inward for Details Modal
  const [selectedInward, setSelectedInward] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // SweetAlert Toast Notification Instance
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true
  })

  const fetchInwardData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(API_ENDPOINTS.INWARDS)
      const data = await res.json()
      if (data.success) {
        setInwards(data.inwards || [])
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to load inward reports.',
          confirmButtonColor: '#043486'
        })
      }
    } catch (err) {
      console.error('Error fetching inward reports:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to retrieve inward records from database.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInwardData()
  }, [])

  // Handle Date Filter Presets using Local Timezone Dates
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

  const handleResetFilters = () => {
    setSearchTerm('')
    setDatePreset('ALL')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
    setSelectedIds([])
  }

  // Filtered and Searched Inwards
  const filteredInwards = useMemo(() => {
    return inwards.filter((item) => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const inwardNo = (item.inward_number || '').toLowerCase()
        const supplierName = (item.supplier_name || '').toLowerCase()
        const phone = (item.supplier_phone || '').toLowerCase()
        const gstin = (item.supplier_gstin || '').toLowerCase()
        
        const matchSearch =
          inwardNo.includes(query) ||
          supplierName.includes(query) ||
          phone.includes(query) ||
          gstin.includes(query)

        if (!matchSearch) return false
      }

      // 2. Date Range using clean local YYYY-MM-DD
      if (startDate || endDate) {
        const itemDate = getLocalDateString(item.inward_date || item.created_at)
        if (startDate && itemDate < startDate) return false
        if (endDate && itemDate > endDate) return false
      }

      return true
    })
  }, [inwards, searchTerm, startDate, endDate])

  // Pagination Calculations
  const totalPages = Math.ceil(filteredInwards.length / itemsPerPage) || 1
  const paginatedInwards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredInwards.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredInwards, currentPage, itemsPerPage])

  // Row Selection Handlers
  const isAllPaginatedSelected =
    paginatedInwards.length > 0 && paginatedInwards.every((inv) => selectedIds.includes(inv.id))

  const handleToggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      const pageIds = paginatedInwards.map((inv) => inv.id)
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      const pageIds = paginatedInwards.map((inv) => inv.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // View Details Modal Trigger
  const handleOpenDetails = async (inwardId) => {
    try {
      setIsLoadingDetails(true)
      const res = await fetch(API_ENDPOINTS.INWARD_BY_ID(inwardId))
      const data = await res.json()
      if (data.success && data.inward) {
        setSelectedInward(data.inward)
      } else {
        // Fallback to local list
        const local = inwards.find(i => i.id === inwardId)
        if (local) setSelectedInward(local)
      }
    } catch (err) {
      console.error('Error opening inward details:', err)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Delete Inward Record
  const handleDeleteInward = async (id, inwardNumber, supplierName) => {
    const result = await Swal.fire({
      title: 'Delete Inward Record?',
      html: `Are you sure you want to delete Inward entry <b>${inwardNumber}</b> from <b>${supplierName}</b>?<br/><span class="text-xs text-red-500">This action cannot be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(API_ENDPOINTS.INWARD_BY_ID(id), {
          method: 'DELETE'
        })
        const data = await res.json()
        if (data.success) {
          Toast.fire({
            icon: 'success',
            title: data.message || 'Inward record deleted successfully'
          })
          setSelectedIds((prev) => prev.filter((itemId) => itemId !== id))
          fetchInwardData()
          if (selectedInward && selectedInward.id === id) {
            setSelectedInward(null)
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'Failed to delete inward record.',
            confirmButtonColor: '#043486'
          })
        }
      } catch (err) {
        console.error('Error deleting inward:', err)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Server communication error while deleting.',
          confirmButtonColor: '#043486'
        })
      }
    }
  }

  // Download Attached Hardcopy / Bill Document
  const handleDownloadHardcopy = async (url, inwardNumber) => {
    if (!url) {
      Swal.fire({
        icon: 'info',
        title: 'No Document Attached',
        text: 'This inward entry does not have an attached hardcopy bill.',
        confirmButtonColor: '#043486'
      })
      return
    }

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      const ext = blob.type.includes('pdf') ? 'pdf' : (blob.type.includes('png') ? 'png' : 'jpg')
      link.download = `Inward_${inwardNumber || 'Document'}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      Toast.fire({
        icon: 'success',
        title: 'Hardcopy document downloaded'
      })
    } catch {
      // Fallback
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.download = `Inward_${inwardNumber || 'Document'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    const targetInwards =
      selectedIds.length > 0
        ? filteredInwards.filter((i) => selectedIds.includes(i.id))
        : filteredInwards

    if (targetInwards.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: 'There are no inward records to export for the current filters or selection.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const exportData = targetInwards.map((inv, idx) => ({
      'S.No': idx + 1,
      'Inward No': inv.inward_number,
      'Inward Date': new Date(inv.inward_date).toLocaleDateString('en-GB'),
      'Supplier Name': inv.supplier_name,
      'Phone Number': inv.supplier_phone || '-',
      'Email': inv.supplier_email || '-',
      'Location / State': inv.supplier_location || '-',
      'GSTIN': inv.supplier_gstin || '-',
      'Total Items / Qty': inv.total_quantity || inv.total_items || (inv.items ? inv.items.length : 0),
      'Taxable Amount (₹)': parseFloat(inv.taxable_amount || 0).toFixed(2),
      'Total Tax (₹)': parseFloat(inv.total_tax || 0).toFixed(2),
      'Total Amount (₹)': parseFloat(inv.total_amount || 0).toFixed(2)
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inward_List')
    XLSX.writeFile(wb, `Inward_List_${new Date().toISOString().split('T')[0]}.xlsx`)

    Toast.fire({
      icon: 'success',
      title: `Exported ${exportData.length} inward record(s) to Excel`
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-['Poppins',sans-serif]">
      
      {/* 1. Header & Action Buttons */}
      <ListPageHeader
        title="Inward List"
        subtitle="Comprehensive log of all inward inventory purchases, supplier details, and material records."
        actions={
          <>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs rounded-none shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              title={selectedIds.length > 0 ? `Export ${selectedIds.length} Selected Record(s)` : 'Export All Filtered Records'}
            >
              <Download size={15} />
              <span>{selectedIds.length > 0 ? `EXPORT SELECTED (${selectedIds.length})` : 'EXPORT TO EXCEL'}</span>
            </button>
            <button
              onClick={() => {
                if (setActiveRoute) setActiveRoute('inward')
                navigate('/inward')
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-xs rounded-none shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <Plus size={15} />
              <span>CREATE NEW INWARD</span>
            </button>
          </>
        }
      />

      {/* 2. KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ListKpiCard
          label="Total Inward Entries"
          value={stats.totalInwards || inwards.length}
          icon={Receipt}
          variant="blue"
        />
        <ListKpiCard
          label="Total Inward Amount"
          value={`₹ ${parseFloat(stats.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={IndianRupee}
          variant="blueValue"
        />
        <ListKpiCard
          label="Total Materials Received"
          value={`${Number(stats.totalItems || 0)} Units`}
          icon={Boxes}
          variant="blue"
        />
      </div>

      {/* 3. Advanced Multi-Filter Bar & Date Range Filtering */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        
        {/* Top Search & Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-96 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by supplier name, phone, inward #, GSTIN..."
              className="w-full pl-9 pr-4 py-2.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium placeholder:text-gray-400"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="flex items-center justify-center p-2.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-none border border-gray-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Date to Date Range Preset Row */}
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

      {/* Bulk Action Bar when rows are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-white dark:bg-slate-900 text-[#292424] dark:text-white px-4 py-2.5 rounded-none shadow-xs flex flex-wrap items-center justify-between gap-3 border border-gray-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 text-xs font-bold text-[#043486] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">
              {selectedIds.length === 1 ? 'inward record selected' : 'inward records selected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-none border border-gray-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs rounded-none shadow-xs transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Export Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Inward Table (Crisp Boxie Layout) */}
      <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#043486] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400 font-medium">Loading inward entries...</span>
          </div>
        ) : paginatedInwards.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Boxes size={36} className="mx-auto text-gray-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No matching inward records found</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Try adjusting your search filters or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse font-['Poppins',sans-serif]">
              <thead className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-600 dark:text-slate-300 font-bold">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={handleToggleSelectAll}
                      disabled={isLoading || paginatedInwards.length === 0}
                      className="w-4 h-4 text-[#043486] rounded-none border-gray-300 dark:border-slate-600 focus:ring-0 cursor-pointer accent-[#043486]"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Inward Date</th>
                  <th className="py-3 px-4">Inward No</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4 text-center">Total Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-xs font-medium">
                {paginatedInwards.map((inv, idx) => {
                  const serialIndex = (currentPage - 1) * itemsPerPage + idx + 1
                  const isSelected = selectedIds.includes(inv.id)
                  const formattedDate = new Date(inv.inward_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                  const totalItemsCount = inv.total_quantity || inv.total_items || (inv.items ? inv.items.length : 0)

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-2 border-[#043486] dark:border-blue-500'
                          : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(inv.id)}
                          className="w-4 h-4 text-[#043486] rounded-none border-gray-300 dark:border-slate-600 focus:ring-0 cursor-pointer accent-[#043486]"
                        />
                      </td>

                      {/* S.No / Row number */}
                      <td className="py-3.5 px-3 text-center text-gray-500 dark:text-slate-400 font-mono">
                        {serialIndex}
                      </td>

                      {/* Inward Date */}
                      <td className="py-3.5 px-4 text-gray-600 dark:text-slate-400 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Inward No */}
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(inv.id)}
                          className="text-[#043486] dark:text-blue-400 hover:underline cursor-pointer tracking-wide"
                          title="Click to view details"
                        >
                          {inv.inward_number}
                        </button>
                      </td>

                      {/* Supplier Name */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {inv.supplier_name}
                        </p>
                        {inv.supplier_location && (
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate max-w-xs">
                            {inv.supplier_location}
                          </p>
                        )}
                      </td>

                      {/* Phone Number */}
                      <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {inv.supplier_phone || '-'}
                      </td>

                      {/* Total Items */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-gray-700 dark:text-slate-300">
                        {Number(totalItemsCount) || 0}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#043486] dark:text-blue-400 whitespace-nowrap">
                        ₹ {parseFloat(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Attached Hardcopy Button */}
                          <button
                            type="button"
                            onClick={() => handleDownloadHardcopy(inv.hardcopy_url, inv.inward_number)}
                            className={`p-1.5 rounded-none border transition-all cursor-pointer shadow-2xs ${
                              inv.hardcopy_url
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white border-emerald-200 dark:border-emerald-800'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'
                            }`}
                            title={inv.hardcopy_url ? 'Download Hardcopy / Bill Document' : 'No Hardcopy Document Attached'}
                          >
                            <ImageDown size={15} />
                          </button>

                          {/* Quick Edit Inward Record (Orange / Amber) */}
                          <button
                            type="button"
                            onClick={() => navigate(`/inward/edit/${inv.id}`)}
                            className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border border-amber-200 dark:border-amber-800 rounded-none transition-all cursor-pointer shadow-2xs"
                            title="Edit Inward Record"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* View Inward Details (Blue) */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(inv.id)}
                            className="p-1.5 text-[#043486] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-[#043486] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-800 rounded-none transition-all cursor-pointer shadow-2xs"
                            title="View Inward Details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Delete Inward Record */}
                          <button
                            type="button"
                            onClick={() => handleDeleteInward(inv.id, inv.inward_number, inv.supplier_name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-gray-200 dark:border-slate-700 rounded-none transition-all cursor-pointer shadow-2xs"
                            title="Delete Inward Record"
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

        {/* 5. Pagination Bar */}
        <ListPagePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredInwards.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val)
            setCurrentPage(1)
          }}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* 6. Inward Details Modal */}
      {selectedInward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col font-['Poppins',sans-serif]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#405189] dark:bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-none">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Inward Entry Details</h3>
                  <p className="text-xs text-blue-100 opacity-90">Inward No: #{selectedInward.inward_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInward(null)}
                className="p-1.5 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Supplier & Entry Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Supplier Information</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedInward.supplier_name}</p>
                  <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1">
                    <p><span className="font-medium text-gray-500 dark:text-slate-400">Phone:</span> {selectedInward.supplier_phone || '-'}</p>
                    <p><span className="font-medium text-gray-500 dark:text-slate-400">Email:</span> {selectedInward.supplier_email || '-'}</p>
                    <p><span className="font-medium text-gray-500 dark:text-slate-400">Location:</span> {selectedInward.supplier_location || '-'}</p>
                    <p><span className="font-medium text-gray-500 dark:text-slate-400">GSTIN:</span> {selectedInward.supplier_gstin || 'Unregistered'}</p>
                    {selectedInward.hardcopy_url && (
                      <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                        <a
                          href={selectedInward.hardcopy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-[11px] font-bold hover:underline"
                        >
                          <span>View Hardcopy Document</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Inward Summary</p>
                  <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1.5">
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 dark:text-slate-400">Inward Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedInward.inward_date).toLocaleDateString('en-GB')}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 dark:text-slate-400">Total Quantity:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedInward.total_quantity || selectedInward.total_items} Units
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 dark:text-slate-400">Taxable Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹ {parseFloat(selectedInward.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 dark:text-slate-400">Total Tax:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹ {parseFloat(selectedInward.total_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                    <div className="pt-1.5 border-t border-gray-200 dark:border-slate-700 flex justify-between text-sm">
                      <span className="font-bold text-gray-900 dark:text-white">Grand Total:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹ {parseFloat(selectedInward.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  Materials Received ({(selectedInward.items || []).length})
                </h4>
                <div className="overflow-x-auto border border-gray-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-[11px]">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Item / Description</th>
                        <th className="py-2.5 px-3">HSN</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                      {(selectedInward.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-3 text-center font-medium text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-gray-900 dark:text-white">{it.item_name}</p>
                            {it.description && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{it.description}</p>}
                            
                            {/* Serial numbers badge list */}
                            {it.has_serial && it.serial_numbers_list && it.serial_numbers_list.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Serials: </span>
                                <div className="inline-flex flex-wrap gap-1 mt-1">
                                  {it.serial_numbers_list.map((sn, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-[10.5px] font-mono font-medium"
                                    >
                                      {sn}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-slate-400">{it.hsn_code || '-'}</td>
                          <td className="py-3 px-3 text-center font-semibold">{it.quantity} {it.unit || 'NOS'}</td>
                          <td className="py-3 px-3 text-right font-medium">₹ {parseFloat(it.rate || 0).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">
                            ₹ {parseFloat(it.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = selectedInward.id
                  setSelectedInward(null)
                  navigate(`/inward/edit/${id}`)
                }}
                className="px-4 py-2 bg-[#043486] hover:bg-[#0248BC] text-white text-xs font-semibold rounded-none flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit2 size={13} />
                <span>Edit Inward Entry</span>
              </button>
              <button
                onClick={() => setSelectedInward(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-none cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

