import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Tag,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  PackageOpen,
  CheckSquare,
  Square,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from '../components/common/icons'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'
import { getUserPermissions } from '../utils/access'
import ListKpiCard from '../components/common/ListKpiCard'
import { Button, ActionButton, StatusPill, SearchInput } from '../components/ui'

export default function AllMaterialsPage({ setActiveRoute: setActiveRouteProp, onEditMaterial }) {
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('materials_add', 'Add') || can('materials_list', 'Add') || can('materials', 'Add')
  const canEdit = hasAny('materials_list', ['Edit']) || hasAny('materials_add', ['Edit']) || hasAny('materials', ['Edit'])
  const canDelete = hasAny('materials_list', ['Delete']) || hasAny('materials_add', ['Delete']) || hasAny('materials', ['Delete'])
  const canDownload = hasAny('materials_list', ['Download']) || hasAny('materials_add', ['Download']) || hasAny('materials', ['Download'])

  const navigate = useNavigate()

  const handleAddMaterial = () => {
    if (setActiveRouteProp) {
      setActiveRouteProp('add-material')
    } else {
      navigate('/materials/add')
    }
  }

  const handleEdit = (id) => {
    if (onEditMaterial) {
      onEditMaterial(id)
    } else {
      navigate(`/materials/add?id=${id}`, { state: { editMaterialId: id } })
    }
  }

  const [materials, setMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Undo Delete State (Optimistic ID suppression)
  const [pendingDeleteIds, setPendingDeleteIds] = useState([])

  const fetchMaterials = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(API_ENDPOINTS.MATERIALS)
      const data = await res.json()
      if (data.success) {
        setMaterials(data.materials || [])
      }
    } catch (err) {
      console.error('Failed to load materials:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to retrieve materials from TiDB.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.CATEGORIES)
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  useEffect(() => {
    fetchMaterials()
    fetchCategories()
  }, [])

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedStatus, selectedUnit, pageSize])

  // Compute available unique units from materials
  const availableUnits = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.unit).filter(Boolean)))
  }, [materials])

  // Filter materials (excluding items currently in pending delete)
  const availableMaterials = materials.filter(m => !pendingDeleteIds.includes(m.id))

  const filteredMaterials = availableMaterials.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.brand && m.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.category_name && m.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.barcode && m.barcode.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory ? String(m.category_id) === String(selectedCategory) : true
    const matchesStatus = selectedStatus ? m.status === selectedStatus : true
    const matchesUnit = selectedUnit ? m.unit === selectedUnit : true

    return matchesSearch && matchesCategory && matchesStatus && matchesUnit
  })

  // Pagination calculations
  const totalItems = filteredMaterials.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex)

  // Select / Deselect Handlers
  const handleToggleSelect = (id) => {
    if (!canDelete) return
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (!canDelete) return
    if (selectedIds.length === filteredMaterials.length && filteredMaterials.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredMaterials.map(m => m.id))
    }
  }

  const isAllSelected = canDelete && filteredMaterials.length > 0 && selectedIds.length === filteredMaterials.length
  const isPartiallySelected = canDelete && selectedIds.length > 0 && selectedIds.length < filteredMaterials.length

  // Execute Actual Permanent Backend Deletion
  const executePermanentDelete = async (ids) => {
    try {
      if (ids.length === 1) {
        await fetch(API_ENDPOINTS.MATERIAL_BY_ID(ids[0]), { method: 'DELETE' })
      } else {
        await fetch(API_ENDPOINTS.MATERIAL_BULK_DELETE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids })
        })
      }

      setMaterials(prev => prev.filter(m => !ids.includes(m.id)))
    } catch (err) {
      console.error('Permanent delete failed:', err)
      fetchMaterials()
    }
  }

  // Start SweetAlert Toast with Live Seconds Countdown and Undo Action
  const scheduleDeleteWithUndo = (ids, labelText) => {
    // Clear selection for deleted IDs
    setSelectedIds(prev => prev.filter(id => !ids.includes(id)))

    // Optimistically hide from UI table immediately
    setPendingDeleteIds(prev => [...prev, ...ids])

    let timerInterval = null

    Swal.fire({
      icon: 'warning',
      title: `Deleted ${labelText}`,
      html: `Action permanent in <b id="swal-undo-timer" style="color: #dc2626; font-weight: 700; font-family: monospace;">4</b>s`,
      timer: 4000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: '↺ UNDO',
      cancelButtonColor: '#043486',
      customClass: {
        popup: 'rounded-none border border-gray-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 text-[#292424] dark:text-white',
        title: 'text-xs font-bold text-gray-900 dark:text-white',
        htmlContainer: 'text-xs text-gray-600 dark:text-slate-300',
        cancelButton: 'px-3 py-1.5 text-xs font-bold tracking-wide uppercase rounded-none cursor-pointer'
      },
      didOpen: () => {
        const timerElem = document.getElementById('swal-undo-timer')
        timerInterval = setInterval(() => {
          const timerLeft = Swal.getTimerLeft()
          if (timerElem && timerLeft !== null) {
            timerElem.textContent = `${Math.ceil(timerLeft / 1000)}`
          }
        }, 150)
      },
      willClose: () => {
        if (timerInterval) clearInterval(timerInterval)
      }
    }).then(async (result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        // User clicked UNDO button!
        setPendingDeleteIds(prev => prev.filter(id => !ids.includes(id)))
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true
        }).fire({
          icon: 'info',
          title: 'Action Undone',
          text: `${labelText} restored successfully.`
        })
      } else {
        // Countdown timer expired -> Permanently delete in TiDB
        await executePermanentDelete(ids)
        setPendingDeleteIds(prev => prev.filter(id => !ids.includes(id)))
      }
    })
  }

  // Single Material Delete
  const handleDelete = async (id, matName) => {
    if (!canDelete) return

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete material "${matName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#043486',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    scheduleDeleteWithUndo([id], `"${matName}"`)
  }

  // Bulk Delete Action
  const handleBulkDelete = async () => {
    if (!canDelete || selectedIds.length === 0) return

    const count = selectedIds.length
    const result = await Swal.fire({
      title: 'Delete Selected Materials?',
      text: `Are you sure you want to delete ${count} selected material(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#043486',
      confirmButtonText: `Yes, delete (${count}) items`,
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    scheduleDeleteWithUndo([...selectedIds], `${count} items`)
  }

  // Page Numbers Generator with Ellipsis
  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages)
      } else if (safeCurrentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
            <Boxes className="text-[#043486] dark:text-blue-400" size={22} />
            ALL MATERIALS
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Manage your billing items, stocks, categories and rates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canAdd && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleAddMaterial}
            >
              Add New Material
            </Button>
          )}
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ListKpiCard
          label="Total Materials"
          value={materials.length}
          icon={Boxes}
          variant="blueValue"
        />
        <ListKpiCard
          label="Total Stock Units"
          value={materials.reduce((acc, m) => acc + (parseInt(m.opening_stock, 10) || 0), 0).toLocaleString('en-IN')}
          icon={Layers}
          variant="emerald"
        />
        <ListKpiCard
          label="Low Stock Items"
          value={materials.filter(m => (parseInt(m.opening_stock, 10) || 0) <= (parseInt(m.reorder_level, 10) || 0)).length}
          icon={AlertTriangle}
          variant="amber"
        />
      </div>


      {/* Bulk Action Bar (White BG / Dark Slate, Protected with canDelete) */}
      {canDelete && selectedIds.length > 0 && (
        <div className="bg-white dark:bg-slate-900 text-[#292424] dark:text-white px-4 py-2.5 rounded-sm shadow-sm flex flex-wrap items-center justify-between gap-3 border border-gray-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-bold text-[#043486] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">
              {selectedIds.length === 1 ? 'material selected' : 'materials selected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={XCircle}
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              icon={Trash2}
              isLoading={isBulkDeleting}
              onClick={handleBulkDelete}
            >
              {isBulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Card (Boxy) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-xs transition-colors">
        
        {/* Filters & Search Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Search by material name, code, brand, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>

          {/* Category, Unit & Status Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Unit Filter */}
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-2 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Units</option>
              {availableUnits.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Count Badge */}
            <span className="px-2.5 py-1.5 text-xs font-bold text-[#043486] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-sm">
              {totalItems} Items
            </span>
          </div>

        </div>

        {/* Materials Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-100/80 dark:bg-slate-800/90 border-b border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wide">
                {/* Select All Checkbox (Only if canDelete) */}
                {canDelete && (
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isPartiallySelected
                      }}
                      onChange={handleSelectAll}
                      disabled={isLoading || filteredMaterials.length === 0}
                      className="w-4 h-4 text-[#043486] rounded-xs border-gray-300 dark:border-slate-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#043486]"
                    />
                  </th>
                )}
                <th className="py-3 px-3.5 w-14">S.No</th>
                <th className="py-3 px-3.5">Material Name</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">HSN Code</th>
                <th className="py-3 px-3.5">Brand &amp; Unit</th>
                <th className="py-3 px-3.5 text-right">Selling Price</th>
                <th className="py-3 px-3.5 text-center">Stock</th>
                <th className="py-3 px-3.5">Last Edited</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right w-24">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {/* Skeleton Loading State (Boxy Shimmer Rows) */}
              {isLoading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {canDelete && (
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700/80 rounded-xs mx-auto" />
                      </td>
                    )}
                    <td className="py-3.5 px-3.5">
                      <div className="w-6 h-3 bg-gray-200 dark:bg-slate-700/80 rounded-xs" />
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-44 mb-1.5" />
                      <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-xs w-24" />
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="h-5 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-28" />
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="h-3.5 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-24 mb-1" />
                      <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-xs w-12" />
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-20 ml-auto" />
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="h-5 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-16 mx-auto" />
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-20" />
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="h-5 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-14 mx-auto" />
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700/80 rounded-xs" />
                        <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700/80 rounded-xs" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 11 : 10} className="text-center py-12 text-gray-400 dark:text-slate-500">
                    <Boxes size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-gray-600 dark:text-slate-400">No materials found.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Click "Add New Material" to create your first item.</p>
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((mat, idx) => {
                  const isSelected = selectedIds.includes(mat.id)
                  const rowNumber = startIndex + idx + 1
                  return (
                    <tr
                      key={mat.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-2 border-[#043486] dark:border-blue-500'
                          : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox (Only if canDelete) */}
                      {canDelete && (
                        <td className="py-3.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(mat.id)}
                            className="w-4 h-4 text-[#043486] rounded-xs border-gray-300 dark:border-slate-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#043486]"
                          />
                        </td>
                      )}

                      {/* S.No */}
                      <td className="py-3.5 px-3.5 text-gray-500 dark:text-slate-400 font-medium">
                        {rowNumber}
                      </td>

                      {/* Material Name */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-[#292424] dark:text-white text-xs sm:text-sm">
                          {mat.name}
                        </div>
                        {(mat.return_policy === 1 || mat.return_policy === '1' || mat.return_policy === true) && (
                          <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px] font-semibold tracking-wide">
                            <span>↩ Returnable</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                          {mat.category_name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* HSN Code */}
                      <td className="py-3.5 px-3.5">
                        <span className="font-mono text-xs font-semibold text-gray-700 dark:text-slate-300">
                          {mat.hsn_code || '—'}
                        </span>
                      </td>

                      {/* Brand & Unit */}
                      <td className="py-3.5 px-3.5 text-gray-600 dark:text-slate-300">
                        <div>{mat.brand || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-semibold">{mat.unit}</div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-3.5 text-right font-bold text-[#043486] dark:text-blue-400">
                        ₹ {parseFloat(mat.selling_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        {mat.tax_inclusive && (
                          <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-normal">
                            (Incl. Tax)
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-xs text-[11px] font-bold ${
                          (mat.opening_stock || 0) <= (mat.reorder_level || 0)
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {mat.opening_stock || 0} {mat.unit}
                        </span>
                      </td>

                      {/* Last Edited Date */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap text-gray-700 dark:text-slate-300 font-medium text-xs">
                        {mat.updated_at || mat.created_at
                          ? new Date(mat.updated_at || mat.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5 text-center">
                        <StatusPill status={mat.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <ActionButton
                              type="edit"
                              onClick={() => handleEdit(mat.id)}
                              title="Edit Material"
                            />
                          )}

                          {canDelete && (
                            <ActionButton
                              type="delete"
                              onClick={() => handleDelete(mat.id, mat.name)}
                              title="Delete Material"
                            />
                          )}

                          {!canEdit && !canDelete && (
                            <span className="text-gray-400 dark:text-slate-500 text-xs italic">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Exact Pagination Bar matching AllBillsPage */}
        {!isLoading && (
          <div className="px-6 py-3 bg-[#f8fafc] dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-600 dark:text-slate-300">
            
            {/* Items Per Page Selector */}
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 font-semibold text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Item Count Summary (e.g. 1-10 of 100 items) */}
            <div className="text-gray-500 dark:text-slate-400 font-mono text-xs">
              {totalItems === 0 ? (
                '0 of 0 items'
              ) : (
                <span>{startIndex + 1}-{endIndex} of {totalItems} items</span>
              )}
            </div>

            {/* Page Selector & Prev / Next Arrows */}
            <div className="flex items-center gap-3">
              
              {/* Page Select Dropdown */}
              <div className="flex items-center gap-1.5">
                <span>Page</span>
                <select
                  value={safeCurrentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="px-2 py-1 font-semibold text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span>of {totalPages} pages</span>
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-1 border border-gray-300 dark:border-slate-700 rounded-none hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-gray-700 dark:text-slate-300"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1 border border-gray-300 dark:border-slate-700 rounded-none hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-gray-700 dark:text-slate-300"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  )
}


