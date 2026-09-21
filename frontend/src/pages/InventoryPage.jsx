import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Boxes,
  Layers,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Filter,
  ExternalLink,
  ChevronRight,
  Package,
  PackagePlus,
  PackageMinus,
  PackageOpen,
  X,
  Loader2,
  Edit3,
  FileDigit,
  Hash,
  Copy,
  Check
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'
import ListPageHeader from '../components/common/ListPageHeader'
import ListKpiCard from '../components/common/ListKpiCard'
import ListPagePagination from '../components/common/ListPagePagination'

export default function InventoryPage({ setActiveRoute }) {
  const navigate = useNavigate()
  // Active Tab: 'overview' | 'reorder'
  const [activeTab, setActiveTab] = useState('overview')

  // Data States
  const [loading, setLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState([])
  const [summaryMetrics, setSummaryMetrics] = useState({
    total_sku_count: 0,
    total_stock_units: 0,
    low_stock_count: 0,
    out_of_stock_count: 0
  })
  const [categories, setCategories] = useState([])

  // Selection state for export & batch actions
  const [selectedIds, setSelectedIds] = useState([])

  // Filter & Search States for Overview
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedUnit, setSelectedUnit] = useState('ALL')
  const [selectedStockStatus, setSelectedStockStatus] = useState('ALL') // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Quick Edit Stock & Reorder Threshold Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editStockVal, setEditStockVal] = useState('')
  const [editThresholdVal, setEditThresholdVal] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Registered Serial Numbers Vault Modal State (Option 1)
  const [serialsModalOpen, setSerialsModalOpen] = useState(false)
  const [selectedMaterialForSerials, setSelectedMaterialForSerials] = useState(null)
  const [serialsList, setSerialsList] = useState([])
  const [serialsSummary, setSerialsSummary] = useState({ total_count: 0, available_count: 0, sold_count: 0, damaged_count: 0 })
  const [serialsLoading, setSerialsLoading] = useState(false)
  const [serialsFilterStatus, setSerialsFilterStatus] = useState('ALL') // 'ALL' | 'Available' | 'Sold'
  const [serialsSearch, setSerialsSearch] = useState('')
  const [copiedSerial, setCopiedSerial] = useState(null)

  // Fetch Inventory List & Summary
  const fetchInventory = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_ENDPOINTS.INVENTORY)
      const data = await res.json()
      if (data.success) {
        setInventoryData(data.data || data.materials || [])
        if (data.summary || data.stats) {
          setSummaryMetrics(data.summary || data.stats)
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Categories for Dropdown Filter
  const fetchCategories = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.CATEGORIES)
      const data = await res.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  useEffect(() => {
    fetchInventory()
    fetchCategories()
  }, [])

  // Available unique units
  const availableUnits = useMemo(() => {
    return Array.from(new Set(inventoryData.map(i => i.unit).filter(Boolean)))
  }, [inventoryData])

  // Filtered Inventory for Overview Tab
  const filteredInventory = useMemo(() => {
    return inventoryData.filter(item => {
      // Search
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.hsn_code?.toLowerCase().includes(q) ||
        item.category_name?.toLowerCase().includes(q)

      // Category
      const matchCat =
        selectedCategory === 'ALL' ||
        String(item.category_id) === String(selectedCategory)

      // Unit
      const matchUnit =
        selectedUnit === 'ALL' ||
        item.unit === selectedUnit

      // Status
      let matchStatus = true
      const stock = parseInt(item.current_stock || 0, 10)
      const reorder = parseInt(item.reorder_level || 0, 10)
      if (selectedStockStatus === 'OUT_OF_STOCK') {
        matchStatus = stock <= 0
      } else if (selectedStockStatus === 'LOW_STOCK') {
        matchStatus = stock > 0 && stock <= reorder
      } else if (selectedStockStatus === 'IN_STOCK') {
        matchStatus = stock > reorder
      }

      return matchSearch && matchCat && matchUnit && matchStatus
    })
  }, [inventoryData, searchQuery, selectedCategory, selectedUnit, selectedStockStatus])

  // Low Stock Items for Reorder Tab
  const lowStockItems = useMemo(() => {
    return inventoryData.filter(item => {
      const stock = parseInt(item.current_stock || 0, 10)
      const reorder = parseInt(item.reorder_level || 0, 10)
      return stock <= reorder
    })
  }, [inventoryData])

  // Paginated Items
  const currentTabList = activeTab === 'reorder' ? lowStockItems : filteredInventory
  const totalItems = currentTabList.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedInventory = currentTabList.slice(startIndex, endIndex)

  // Selection Logic
  const isAllPaginatedSelected =
    paginatedInventory.length > 0 && paginatedInventory.every((item) => selectedIds.includes(item.id))

  const handleToggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      const pageIds = paginatedInventory.map((item) => item.id)
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      const pageIds = paginatedInventory.map((item) => item.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Open Edit Stock & Reorder Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setEditStockVal(item.current_stock !== undefined ? String(item.current_stock) : String(item.opening_stock || 0))
    setEditThresholdVal(item.reorder_level !== undefined ? String(item.reorder_level) : '0')
    setEditModalOpen(true)
  }

  // Save Stock & Reorder Level
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (editStockVal === '' || parseFloat(editStockVal) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Stock Value',
        text: 'Please enter 0 or higher for current stock quantity.',
        confirmButtonColor: '#043486'
      })
      return
    }

    if (editThresholdVal === '' || parseInt(editThresholdVal, 10) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Threshold',
        text: 'Please enter 0 or higher for reorder threshold.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSavingEdit(true)
    try {
      const res = await fetch(API_ENDPOINTS.INVENTORY_UPDATE_STOCK_THRESHOLD, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: editingItem.id,
          current_stock: parseFloat(editStockVal),
          reorder_level: parseInt(editThresholdVal, 10)
        })
      })

      const data = await res.json()
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Stock & Threshold Updated',
          text: `"${editingItem.name}" updated to ${editStockVal} ${editingItem.unit || 'units'} (Threshold: ${editThresholdVal}).`,
          confirmButtonColor: '#043486',
          timer: 1800,
          showConfirmButton: false
        })
        setEditModalOpen(false)
        fetchInventory()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to update stock and threshold.',
          confirmButtonColor: '#043486'
        })
      }
    } catch (err) {
      console.error('Error saving stock & threshold:', err)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Open Registered Serial Numbers Vault Modal
  const handleOpenSerialsModal = async (item) => {
    setSelectedMaterialForSerials(item)
    setSerialsModalOpen(true)
    setSerialsLoading(true)
    setSerialsSearch('')
    setSerialsFilterStatus('ALL')
    try {
      const res = await fetch(API_ENDPOINTS.INVENTORY_MATERIAL_SERIALS(item.id))
      const data = await res.json()
      if (data.success) {
        setSerialsList(data.serials || [])
        setSerialsSummary(data.summary || { total_count: 0, available_count: 0, sold_count: 0, damaged_count: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch serials for material:', err)
    } finally {
      setSerialsLoading(false)
    }
  }

  // Copy single serial number to clipboard
  const handleCopySingleSerial = (sn) => {
    if (!sn) return
    navigator.clipboard.writeText(sn)
    setCopiedSerial(sn)
    setTimeout(() => {
      setCopiedSerial((prev) => (prev === sn ? null : prev))
    }, 2000)
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true
    }).fire({
      icon: 'success',
      title: `Copied: ${sn}`
    })
  }

  // Copy all available serial numbers
  const handleCopyAllAvailable = () => {
    const available = serialsList.filter(s => s.status === 'Available').map(s => s.serial_number)
    if (available.length === 0) {
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      }).fire({
        icon: 'info',
        title: 'No available serial numbers to copy.'
      })
      return
    }
    const textToCopy = available.join(', ')
    navigator.clipboard.writeText(textToCopy)
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    }).fire({
      icon: 'success',
      title: `Copied ${available.length} available serial numbers!`
    })
  }

  // Filtered serials for modal
  const filteredModalSerials = useMemo(() => {
    return serialsList.filter(s => {
      const q = serialsSearch.toLowerCase().trim()
      const matchSearch = !q || (s.serial_number && s.serial_number.toLowerCase().includes(q))
      const matchStatus = serialsFilterStatus === 'ALL' || s.status === serialsFilterStatus
      return matchSearch && matchStatus
    })
  }, [serialsList, serialsSearch, serialsFilterStatus])

  // Export to Excel Handler (Identical to Inward / Outward List)
  const handleExportExcel = () => {
    const targetItems =
      selectedIds.length > 0
        ? currentTabList.filter((item) => selectedIds.includes(item.id))
        : currentTabList

    if (targetItems.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Stock Items to Export',
        text: 'No inventory records match the current selection or filter.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const excelRows = targetItems.map((item, idx) => {
      const stock = parseInt(item.current_stock || 0, 10)
      const reorder = parseInt(item.reorder_level || 0, 10)
      let status = 'In Stock'
      if (stock <= 0) status = 'Out of Stock'
      else if (stock <= reorder) status = 'Low Stock'

      return {
        'S.No': idx + 1,
        'Material Name': item.name || '',
        'Category': item.category_name || 'Uncategorized',
        'HSN / SAC Code': item.hsn_code || '-',
        'Available Stock': stock,
        'Unit': item.unit || 'Nos',
        'Reorder Threshold': reorder,
        'Unit Selling Price (₹)': parseFloat(item.selling_price || 0).toFixed(2),
        'Stock Status': status
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock_Inventory')

    worksheet['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 30 }, // Material Name
      { wch: 20 }, // Category
      { wch: 15 }, // HSN Code
      { wch: 15 }, // Available Stock
      { wch: 10 }, // Unit
      { wch: 18 }, // Reorder Threshold
      { wch: 22 }, // Unit Selling Price
      { wch: 15 }  // Stock Status
    ]

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Simcha_Stock_Inventory_${dateStr}.xlsx`)

    Swal.fire({
      icon: 'success',
      title: 'Excel Export Ready',
      text: `Successfully exported ${excelRows.length} item(s) to Excel.`,
      timer: 2000,
      showConfirmButton: false
    })
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-['Poppins',sans-serif]">
      {/* 1. Header with Global Actions (Green Export to Excel Button) */}
      <ListPageHeader
        title="Stock & Inventory Control"
        subtitle="Real-time multi-channel inventory tracking, automated inward/outward ledger, and reorder planning."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Green Export Excel Button matching Inward & Outward List */}
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs rounded-none shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              title={selectedIds.length > 0 ? `Export ${selectedIds.length} Selected Item(s)` : 'Export All Filtered Items'}
            >
              <Download size={15} />
              <span>
                {selectedIds.length > 0 ? `EXPORT SELECTED (${selectedIds.length})` : 'EXPORT TO EXCEL'}
              </span>
            </button>

            <button
              onClick={() => {
                if (setActiveRoute) setActiveRoute('inward')
                navigate('/inward')
              }}
              className="px-4 py-2.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 border border-[#043486] dark:border-blue-600 rounded-none shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PackagePlus size={15} />
              <span>New Inward</span>
            </button>
          </div>
        }
      />

      {/* 2. Top Summary KPI Metrics Cards (Valuation removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ListKpiCard
          label="Total Active Materials"
          value={inventoryData.length}
          icon={PackageOpen}
          variant="blueValue"
        />
        <ListKpiCard
          label="In-Stock Units"
          value={parseInt(summaryMetrics.total_stock_units || summaryMetrics.totalUnits || 0, 10).toLocaleString('en-IN')}
          icon={Layers}
          variant="emerald"
        />
        <ListKpiCard
          label="Low Stock Alerts"
          value={parseInt(summaryMetrics.low_stock_count || summaryMetrics.lowStockCount || 0, 10)}
          icon={AlertTriangle}
          variant="amber"
        />
        <ListKpiCard
          label="Out of Stock SKUs"
          value={parseInt(summaryMetrics.out_of_stock_count || summaryMetrics.outOfStockCount || 0, 10)}
          icon={XCircle}
          variant="rose"
        />
      </div>

      {/* 3. Tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-xs flex items-center justify-between px-2 pt-2 transition-colors">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('overview')
              setCurrentPage(1)
              setSelectedIds([])
            }}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#043486] text-[#043486] dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Boxes size={15} />
            <span>Stock Overview ({inventoryData.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reorder')
              setCurrentPage(1)
              setSelectedIds([])
            }}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reorder'
                ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle size={15} />
            <span>Low Stock / Reorder ({lowStockItems.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Tab 1 & Tab 2: Material Stock Table */}
      {(activeTab === 'overview' || activeTab === 'reorder') && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-xs transition-colors">
          {/* Filter Bar */}
          {activeTab === 'overview' && (
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Bar with Fixed Width */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={15} />
                <input
                  type="text"
                  placeholder="Search item, HSN code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#043486] dark:focus:ring-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category, Unit, Status Filters & Reload */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Unit:</span>
                  <select
                    value={selectedUnit}
                    onChange={(e) => {
                      setSelectedUnit(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Units</option>
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status:</span>
                  <select
                    value={selectedStockStatus}
                    onChange={(e) => {
                      setSelectedStockStatus(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Stock Levels</option>
                    <option value="IN_STOCK">In Stock (Normal)</option>
                    <option value="LOW_STOCK">Low Stock (Alert)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                  </select>
                </div>

                {/* Reload Button next to filters */}
                <button
                  onClick={fetchInventory}
                  className="p-1.5 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer ml-1"
                  title="Reload Inventory Data"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-['Poppins',sans-serif]">
              <thead>
                <tr className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={handleToggleSelectAll}
                      disabled={loading || paginatedInventory.length === 0}
                      className="w-4 h-4 text-[#043486] rounded-none border-gray-300 dark:border-slate-600 focus:ring-0 cursor-pointer accent-[#043486]"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 font-mono">HSN Code</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Stock Health</th>
                  <th className="py-3 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-xs text-gray-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-400 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="animate-spin text-[#043486] dark:text-blue-400" />
                        <span className="text-xs font-semibold">Loading Live Inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedInventory.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-400 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package size={28} className="text-gray-300 dark:text-slate-600" />
                        <span className="text-xs font-semibold">
                          {activeTab === 'reorder'
                            ? 'All stock levels are healthy! No items below reorder threshold.'
                            : 'No materials matched your search criteria.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedInventory.map((item, idx) => {
                    const rowNumber = startIndex + idx + 1
                    const isSelected = selectedIds.includes(item.id)
                    const stock = parseInt(item.current_stock || 0, 10)
                    const reorder = parseInt(item.reorder_level || 0, 10)
                    const isOutOfStock = stock <= 0
                    const isLowStock = stock > 0 && stock <= reorder
                    const price = parseFloat(item.selling_price || 0)

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-2 border-[#043486] dark:border-blue-500'
                            : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(item.id)}
                            className="w-4 h-4 text-[#043486] rounded-none border-gray-300 dark:border-slate-600 focus:ring-0 cursor-pointer accent-[#043486]"
                          />
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-gray-400 dark:text-slate-500">
                          {rowNumber}
                        </td>

                        {/* Material Name */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#292424] dark:text-white">
                            {item.name}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                            {item.category_name || 'Uncategorized'}
                          </span>
                        </td>

                        {/* HSN Code */}
                        <td className="py-3 px-4 font-mono font-semibold text-gray-700 dark:text-slate-300">
                          {item.hsn_code || '—'}
                        </td>

                        {/* Available Stock */}
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`text-sm font-black font-mono ${
                              isOutOfStock
                                ? 'text-red-600 dark:text-red-400'
                                : isLowStock
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {stock}
                          </span>
                        </td>

                        {/* Unit (Dedicated Column) */}
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-none bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 text-[11px] font-semibold uppercase">
                            {item.unit || 'Nos'}
                          </span>
                        </td>

                        {/* Reorder Threshold */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950 border border-gray-200 dark:border-slate-700 rounded-none transition-colors cursor-pointer group"
                            title="Click to edit stock or alert threshold"
                          >
                            <span>{reorder}</span>
                            <Edit3 size={11} className="text-gray-400 group-hover:text-[#043486] dark:group-hover:text-blue-400" />
                          </button>
                        </td>

                        {/* Unit Price */}
                        <td className="py-3 px-4 text-right font-mono font-medium text-gray-700 dark:text-slate-300">
                          ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Stock Health */}
                        <td className="py-3 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              <XCircle size={11} /> Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                              <AlertTriangle size={11} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                              <CheckCircle2 size={11} /> Healthy
                            </span>
                          )}
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Inward Action (PackagePlus) */}
                            <button
                              onClick={() => navigate('/inward')}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200 dark:border-emerald-800 rounded-none transition-all cursor-pointer shadow-2xs"
                              title="Create Inward (Purchase Stock)"
                            >
                              <PackagePlus size={15} />
                            </button>

                            {/* Outward Action (PackageMinus) */}
                            <button
                              onClick={() => navigate('/outward')}
                              className="p-1.5 text-[#043486] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-[#043486] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-800 rounded-none transition-all cursor-pointer shadow-2xs"
                              title="Create Outward (Sales Invoice)"
                            >
                              <PackageMinus size={15} />
                            </button>

                            {/* View Serial Vault (FileDigit) */}
                            <button
                              onClick={() => handleOpenSerialsModal(item)}
                              className={`p-1.5 rounded-none border transition-all cursor-pointer shadow-2xs ${
                                item.serial_tracking
                                  ? 'text-[#043486] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-[#043486] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border-blue-300 dark:border-blue-700'
                                  : 'text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/50 hover:text-gray-700 dark:hover:text-slate-300 border-gray-200 dark:border-slate-700'
                              }`}
                              title={item.serial_tracking ? "View Registered Serial Numbers Vault" : "View Serial Tracking Records"}
                            >
                              <FileDigit size={15} />
                            </button>

                            {/* Quick Edit Stock & Threshold Action (Edit3) */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border border-amber-200 dark:border-amber-800 rounded-none transition-all cursor-pointer shadow-2xs"
                              title="Quick Edit Stock & Threshold"
                            >
                              <Edit3 size={15} />
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

          {/* Pagination */}
          <ListPagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newSize) => {
              setItemsPerPage(newSize)
              setCurrentPage(1)
            }}
          />
        </div>
      )}

      {/* 5. Quick Edit Stock & Threshold Modal */}
      {editModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins',sans-serif]">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-[#043486] dark:text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#292424] dark:text-white">
                  Quick Edit Stock &amp; Threshold
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 rounded-none">
                <span className="text-xs font-bold text-gray-800 dark:text-white block">
                  {editingItem.name}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400">
                  Category: {editingItem.category_name || 'Uncategorized'} | Unit: {editingItem.unit || 'Nos'}
                </span>
              </div>

              {/* Current Stock Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Current Available Stock ({editingItem.unit || 'Units'}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={editStockVal}
                  onChange={(e) => setEditStockVal(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  Directly adjust current on-hand warehouse inventory units.
                </p>
              </div>

              {/* Reorder Threshold Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Low Stock Reorder Alert Threshold ({editingItem.unit || 'Units'}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editThresholdVal}
                  onChange={(e) => setEditThresholdVal(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  When stock falls below or equals this quantity, low stock warning is triggered.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 border border-[#043486] dark:border-blue-600 rounded-none flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSavingEdit ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Registered Serial Numbers Vault Modal (Option 1 - FileDigit Icon) */}
      {serialsModalOpen && selectedMaterialForSerials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins',sans-serif]">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-none bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#043486] dark:text-blue-400">
                  <FileDigit size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Serial Numbers Vault</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {selectedMaterialForSerials.hsn_code ? `HSN: ${selectedMaterialForSerials.hsn_code}` : 'Live Inventory'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium truncate max-w-md">
                    {selectedMaterialForSerials.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSerialsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* KPI Mini-Bar */}
            <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-slate-800 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="px-4 py-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 block tracking-wider">
                  Total Serials
                </span>
                <span className="text-base font-black font-mono text-[#292424] dark:text-white">
                  {serialsSummary.total_count}
                </span>
              </div>
              <div className="px-4 py-2.5 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block tracking-wider">
                  In Warehouse (Available)
                </span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {serialsSummary.available_count}
                </span>
              </div>
              <div className="px-4 py-2.5 text-center bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-[10px] uppercase font-bold text-gray-600 dark:text-slate-400 block tracking-wider">
                  Sold / Outward
                </span>
                <span className="text-base font-black font-mono text-gray-700 dark:text-slate-300">
                  {serialsSummary.sold_count}
                </span>
              </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={serialsSearch}
                  onChange={(e) => setSerialsSearch(e.target.value)}
                  placeholder="Search serial number..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono text-gray-800 dark:text-white bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500"
                />
              </div>

              {/* Filter Tabs & Copy All */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="inline-flex border border-gray-200 dark:border-slate-700 rounded-none overflow-hidden p-0.5 bg-gray-100 dark:bg-slate-800">
                  <button
                    onClick={() => setSerialsFilterStatus('ALL')}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                      serialsFilterStatus === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-[#043486] dark:text-blue-400 shadow-2xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
                    }`}
                  >
                    All ({serialsSummary.total_count})
                  </button>
                  <button
                    onClick={() => setSerialsFilterStatus('Available')}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                      serialsFilterStatus === 'Available'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
                    }`}
                  >
                    Available ({serialsSummary.available_count})
                  </button>
                  <button
                    onClick={() => setSerialsFilterStatus('Sold')}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                      serialsFilterStatus === 'Sold'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-800'
                    }`}
                  >
                    Sold ({serialsSummary.sold_count})
                  </button>
                </div>

                <button
                  onClick={handleCopyAllAvailable}
                  disabled={serialsSummary.available_count === 0}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white border border-emerald-300 dark:border-emerald-800 rounded-none flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title="Copy all available serial numbers to clipboard"
                >
                  <Copy size={12} />
                  <span>Copy Available</span>
                </button>
              </div>
            </div>

            {/* Modal Body / Serials List */}
            <div className="p-5 overflow-y-auto flex-1 max-h-[380px] bg-gray-50/40 dark:bg-slate-950/50">
              {serialsLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-slate-500">
                  <Loader2 size={24} className="animate-spin text-[#043486] dark:text-blue-400" />
                  <span className="text-xs font-semibold">Loading Registered Serials...</span>
                </div>
              ) : filteredModalSerials.length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-slate-500">
                  <FileDigit size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-400">
                    {serialsList.length === 0
                      ? 'No serial numbers registered yet for this material.'
                      : 'No serial numbers match your search filter.'}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                    Serial numbers entered during Inward Purchases are automatically recorded here for outward billing verification.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredModalSerials.map((sn) => {
                    const isAvailable = sn.status === 'Available'
                    const isCopied = copiedSerial === sn.serial_number

                    return (
                      <div
                        key={sn.id}
                        className={`p-3 border rounded-none flex items-center justify-between transition-all ${
                          isAvailable
                            ? 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-400 shadow-2xs'
                            : 'bg-gray-50 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-none ${
                            isAvailable
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                          }`}>
                            <Hash size={13} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white block truncate">
                              {sn.serial_number}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.2 border ${
                                isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                {sn.status}
                              </span>
                              {sn.created_at && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {new Date(sn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopySingleSerial(sn.serial_number)}
                          className={`p-1.5 rounded-none border transition-colors cursor-pointer shrink-0 ml-2 ${
                            isCopied
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-[#043486] dark:hover:text-blue-400 border-gray-200 dark:border-slate-700'
                          }`}
                          title="Copy Serial Number"
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/80 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                Showing <strong className="font-mono text-gray-800 dark:text-white">{filteredModalSerials.length}</strong> of <strong className="font-mono text-gray-800 dark:text-white">{serialsList.length}</strong> serials
              </span>
              <button
                type="button"
                onClick={() => setSerialsModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 border border-[#043486] dark:border-blue-600 rounded-none transition-colors cursor-pointer shadow-xs"
              >
                Close Vault
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

