import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  XCircle,
  Download,
  Filter,
  Package,
  PackagePlus,
  Boxes,
  Plus,
  X,
  Loader2,
  FileCheck,
  Receipt,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  User,
  Phone,
  Hash,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'
import ListPageHeader from '../components/common/ListPageHeader'
import ListKpiCard from '../components/common/ListKpiCard'
import ListPagePagination from '../components/common/ListPagePagination'

// Initial standard sample data for Returns & Adjustments
const DEFAULT_RETURNS = [
  {
    id: 1,
    return_number: 'RET-2026-0001',
    return_date: '2026-09-18',
    bill_number: 'INV-2026-0042',
    customer_name: 'Anand Kumar',
    customer_phone: '9876543210',
    item_name: 'Dell 24" IPS Monitor',
    material_id: 1,
    quantity: 1,
    unit: 'Nos',
    reason: 'Defective Screen Panel',
    qc_status: 'Completed', // 'Pending QC' | 'Completed' | 'Rejected'
    qc_decision: 'REPLACE', // 'STOCK' | 'REPLACE' | 'REFUND'
    qc_notes: 'Panel flickering verified. Replaced with brand new sealed unit.',
    resolution_ref: 'DISP-2026-0881',
    refund_amount: 0,
    created_at: '2026-09-18T10:30:00Z'
  },
  {
    id: 2,
    return_number: 'RET-2026-0002',
    return_date: '2026-09-19',
    bill_number: 'INV-2026-0048',
    customer_name: 'Priya Sharma',
    customer_phone: '9840123456',
    item_name: 'Logitech MX Wireless Mouse',
    material_id: 2,
    quantity: 1,
    unit: 'Nos',
    reason: 'Wrong Color / Unopened Box',
    qc_status: 'Completed',
    qc_decision: 'STOCK',
    qc_notes: 'Factory seal intact. Returned to inventory shelf (+1).',
    resolution_ref: 'RESTOCK-LOG-004',
    refund_amount: 0,
    created_at: '2026-09-19T09:15:00Z'
  },
  {
    id: 3,
    return_number: 'RET-2026-0003',
    return_date: '2026-09-19',
    bill_number: 'INV-2026-0051',
    customer_name: 'Venkatesh S',
    customer_phone: '9790887766',
    item_name: 'Kingston 16GB DDR4 RAM',
    material_id: 3,
    quantity: 2,
    unit: 'Nos',
    reason: 'Customer Requested Refund',
    qc_status: 'Completed',
    qc_decision: 'REFUND',
    qc_notes: 'RAM modules verified functional. Credit Note issued to customer ledger.',
    resolution_ref: 'CN-2026-0001',
    refund_amount: 6400.00,
    created_at: '2026-09-19T11:45:00Z'
  },
  {
    id: 4,
    return_number: 'RET-2026-0004',
    return_date: '2026-09-19',
    bill_number: 'INV-2026-0055',
    customer_name: 'Karthik Raja',
    customer_phone: '9444112233',
    item_name: 'SanDisk 1TB NVMe SSD',
    material_id: 4,
    quantity: 1,
    unit: 'Nos',
    reason: 'Read/Write Speed issue reported',
    qc_status: 'Pending QC',
    qc_decision: null,
    qc_notes: '',
    resolution_ref: '',
    refund_amount: 0,
    created_at: '2026-09-19T13:00:00Z'
  }
]

export default function ReturnsAdjustmentsPage({ setActiveRoute }) {
  const navigate = useNavigate()

  // Active Tab: 'entry' | 'all' | 'pending' | 'restocked' | 'refunded'
  const [activeTab, setActiveTab] = useState('entry')

  // Data States
  const [loading, setLoading] = useState(false)
  const [returnsList, setReturnsList] = useState(() => {
    try {
      const saved = localStorage.getItem('simcha_returns_registry')
      return saved ? JSON.parse(saved) : DEFAULT_RETURNS
    } catch {
      return DEFAULT_RETURNS
    }
  })

  // Auxiliary Data for Return Entry
  const [materials, setMaterials] = useState([])
  const [bills, setBills] = useState([])
  const [servicesList, setServicesList] = useState([])
  const [settings, setSettings] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  // Return Entry Workflow States
  const [invoiceQuery, setInvoiceQuery] = useState('')
  const [receiptQuery, setReceiptQuery] = useState('')
  const [selectedBill, setSelectedBill] = useState(null)
  const [selectedReturnItems, setSelectedReturnItems] = useState({})
  const [isLoadingBill, setIsLoadingBill] = useState(false)

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReason, setSelectedReason] = useState('ALL')
  const [selectedDecision, setSelectedDecision] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Modals State
  const [newReturnModalOpen, setNewReturnModalOpen] = useState(false)
  const [qcModalOpen, setQcModalOpen] = useState(false)
  const [selectedReturnForQc, setSelectedReturnForQc] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedReturnView, setSelectedReturnView] = useState(null)

  // QC Form State (Option 1: STOCK | Option 2: REPLACE | Option 3: REFUND)
  const [qcDecision, setQcDecision] = useState('STOCK')
  const [qcNotes, setQcNotes] = useState('')
  const [qcRefundAmount, setQcRefundAmount] = useState('')
  const [isSubmittingQc, setIsSubmittingQc] = useState(false)

  // New Return Form State
  const [newForm, setNewForm] = useState({
    customer_name: '',
    customer_phone: '',
    bill_number: '',
    item_name: '',
    material_id: '',
    quantity: 1,
    unit: 'Nos',
    reason: 'Defective Product',
    custom_reason: ''
  })

  // Save returns to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('simcha_returns_registry', JSON.stringify(returnsList))
    } catch (e) {
      console.error('Failed to sync returns with localStorage:', e)
    }
  }, [returnsList])

  // Fetch materials, bills, services, and company settings
  useEffect(() => {
    const fetchAuxiliaryData = async () => {
      try {
        setLoading(true)
        const [matRes, billsRes, servRes, setRes] = await Promise.all([
          fetch(API_ENDPOINTS.MATERIALS).catch(() => null),
          fetch(API_ENDPOINTS.BILLS).catch(() => null),
          fetch(API_ENDPOINTS.SERVICES).catch(() => null),
          fetch(API_ENDPOINTS.SETTINGS).catch(() => null)
        ])

        if (matRes && matRes.ok) {
          const mData = await matRes.json()
          if (mData.success && mData.materials) setMaterials(mData.materials)
        }
        if (billsRes && billsRes.ok) {
          const bData = await billsRes.json()
          if (bData.success && bData.bills) setBills(bData.bills)
        }
        if (servRes && servRes.ok) {
          const sData = await servRes.json()
          if (sData.success && sData.services) setServicesList(sData.services)
        }
        if (setRes && setRes.ok) {
          const stData = await setRes.json()
          if (stData.success && stData.settings) setSettings(stData.settings)
        }
      } catch (err) {
        console.error('Failed to load auxiliary data for returns:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAuxiliaryData()
  }, [])

  // Return Policy Window (Days) from Settings (Default 7 Days)
  const returnPolicyDays = settings?.return_days ? parseInt(settings.return_days, 10) : 7

  // Calculate Policy Validity & Days Elapsed for Selected Bill
  const billPolicyDetails = useMemo(() => {
    if (!selectedBill) return null
    const dateStr = selectedBill.invoice_date || selectedBill.service_date || selectedBill.created_at
    if (!dateStr) return { daysElapsed: 0, isWithinWindow: true, billDateFormatted: '-' }

    const billDate = new Date(dateStr)
    const today = new Date()
    const diffTime = today.getTime() - billDate.getTime()
    const daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
    const isWithinWindow = daysElapsed <= returnPolicyDays

    const billDateFormatted = billDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    return { daysElapsed, isWithinWindow, billDateFormatted }
  }, [selectedBill, returnPolicyDays])

  // Filtered Bill suggestions for Invoice Search
  const filteredBillSuggestions = useMemo(() => {
    if (!invoiceQuery.trim()) return []
    const q = invoiceQuery.toLowerCase().trim()
    return bills.filter(b => 
      b.invoice_number?.toLowerCase().includes(q) ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.customer_phone?.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [bills, invoiceQuery])

  // Filtered Receipt suggestions for Receipt Search (Only Sales Receipts)
  const filteredReceiptSuggestions = useMemo(() => {
    if (!receiptQuery.trim()) return []
    const q = receiptQuery.toLowerCase().trim()
    return bills.filter(b => 
      b.receipt_number?.toLowerCase().includes(q) ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.customer_phone?.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [bills, receiptQuery])

  // Select Bill / Invoice for Return Entry
  const handleSelectBill = async (billObj, isService = false) => {
    try {
      setIsLoadingBill(true)
      let fullBill = billObj
      if (isService) {
        const res = await fetch(API_ENDPOINTS.SERVICE_BY_ID(billObj.id))
        const data = await res.json()
        if (data.success && data.service) {
          fullBill = { ...data.service, is_service: true }
        }
      } else {
        const res = await fetch(API_ENDPOINTS.BILL_BY_ID(billObj.id))
        const data = await res.json()
        if (data.success && data.bill) {
          fullBill = { ...data.bill, is_service: false }
        }
      }

      setSelectedBill(fullBill)
      setSelectedReturnItems({})
      setInvoiceQuery(fullBill.invoice_number || '')
      setReceiptQuery(fullBill.receipt_number || fullBill.service_number || '')
    } catch (err) {
      console.error('Error loading bill items:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Bill',
        text: 'Could not retrieve line items for the selected invoice.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsLoadingBill(false)
    }
  }

  // Parse serial numbers helper
  const parseItemSerials = (it) => {
    if (!it) return []
    if (Array.isArray(it.serial_numbers) && it.serial_numbers.length > 0) {
      return it.serial_numbers.map(s => String(s).trim()).filter(Boolean)
    }
    if (Array.isArray(it.serials) && it.serials.length > 0) {
      return it.serials.map(s => String(s).trim()).filter(Boolean)
    }
    if (typeof it.serial_number === 'string' && it.serial_number.trim()) {
      return it.serial_number.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (typeof it.serialNumber === 'string' && it.serialNumber.trim()) {
      return it.serialNumber.split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  // Clear Selected Bill
  const handleClearSelectedBill = () => {
    setSelectedBill(null)
    setSelectedReturnItems({})
    setInvoiceQuery('')
    setReceiptQuery('')
  }

  // Toggle Return Item Checkbox (Main row select)
  const handleToggleItemCheckbox = (item) => {
    const itemKey = item.id || `${item.item_name}_${item.product_name}`
    const serials = parseItemSerials(item)
    setSelectedReturnItems(prev => {
      const next = { ...prev }
      if (next[itemKey]) {
        delete next[itemKey]
      } else {
        const hasMultipleSerials = serials.length > 1
        const initialSerials = hasMultipleSerials ? [...serials] : (serials.length === 1 ? [serials[0]] : [])
        const initialQty = hasMultipleSerials ? serials.length : 1
        next[itemKey] = {
          checked: true,
          selected_serials: initialSerials,
          return_qty: initialQty,
          max_qty: parseFloat(item.quantity) || 1,
          reason: 'Defective Product',
          custom_reason: '',
          item_data: item
        }
      }
      return next
    })
  }

  // Toggle individual serial checkbox for multi-serial items
  const handleToggleItemSerial = (item, serial) => {
    const itemKey = item.id || `${item.item_name}_${item.product_name}`
    setSelectedReturnItems(prev => {
      const next = { ...prev }
      const current = next[itemKey] || {
        checked: true,
        selected_serials: [],
        return_qty: 0,
        max_qty: parseFloat(item.quantity) || 1,
        reason: 'Defective Product',
        custom_reason: '',
        item_data: item
      }

      let updatedSerials = Array.isArray(current.selected_serials) ? [...current.selected_serials] : []
      if (updatedSerials.includes(serial)) {
        updatedSerials = updatedSerials.filter(s => s !== serial)
      } else {
        updatedSerials.push(serial)
      }

      if (updatedSerials.length === 0) {
        delete next[itemKey]
      } else {
        next[itemKey] = {
          ...current,
          checked: true,
          selected_serials: updatedSerials,
          return_qty: updatedSerials.length,
          item_data: item
        }
      }
      return next
    })
  }

  // Handle Item Return Qty Change (if needed programmatically)
  const handleItemQtyChange = (itemKey, qty) => {
    setSelectedReturnItems(prev => {
      if (!prev[itemKey]) return prev
      const max = prev[itemKey].max_qty || 1
      const clamped = Math.max(1, Math.min(max, parseFloat(qty) || 1))
      return {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          return_qty: clamped
        }
      }
    })
  }

  // Handle Item Return Reason Change
  const handleItemReasonChange = (itemKey, reason) => {
    setSelectedReturnItems(prev => {
      if (!prev[itemKey]) return prev
      return {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          reason
        }
      }
    })
  }

  // Proceed to Next Step: Submit Return Request & Switch to QC
  const handleProceedToNextStep = () => {
    const selectedKeys = Object.keys(selectedReturnItems)
    if (selectedKeys.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Items Selected',
        text: 'Please select at least one eligible product to return by checking the box.',
        confirmButtonColor: '#043486'
      })
      return
    }

    if (billPolicyDetails && !billPolicyDetails.isWithinWindow) {
      Swal.fire({
        title: 'Return Window Exceeded',
        html: `<p class="text-sm text-gray-600 dark:text-slate-300">This invoice was issued <b>${billPolicyDetails.daysElapsed} days ago</b>, exceeding the standard policy window of <b>${returnPolicyDays} days</b>.</p><p class="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2">Do you want to proceed under authorized manager override?</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#043486',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Proceed Override',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          executeCreateReturns()
        }
      })
      return
    }

    executeCreateReturns()
  }

  const executeCreateReturns = () => {
    const selectedEntries = Object.values(selectedReturnItems)
    const newReturnEntries = selectedEntries.map((entry, idx) => {
      const it = entry.item_data
      const returnNum = `RET-2026-${String(returnsList.length + idx + 1).padStart(4, '0')}`
      const serialStr = entry.selected_serials && entry.selected_serials.length > 0
        ? entry.selected_serials.join(', ')
        : (it.serial_number || '')

      return {
        id: Date.now() + idx,
        return_number: returnNum,
        return_date: new Date().toISOString().split('T')[0],
        bill_number: selectedBill.invoice_number || selectedBill.service_number || 'N/A',
        receipt_number: selectedBill.receipt_number || null,
        customer_name: selectedBill.customer_name || 'Customer',
        customer_phone: selectedBill.customer_phone || '-',
        item_name: it.product_name || it.item_name || 'Product',
        material_id: it.material_id || null,
        serial_number: serialStr,
        quantity: entry.return_qty || 1,
        unit: it.unit || 'Nos',
        reason: entry.reason,
        qc_status: 'Pending QC',
        qc_decision: null,
        qc_notes: '',
        resolution_ref: '',
        refund_amount: (parseFloat(it.rate || 0) * (entry.return_qty || 1)).toFixed(2),
        created_at: new Date().toISOString()
      }
    })

    setReturnsList(prev => [...newReturnEntries, ...prev])

    Swal.fire({
      icon: 'success',
      title: 'Return Request Created!',
      text: `${newReturnEntries.length} item(s) submitted for return. Proceeding to QC Inspection...`,
      timer: 1800,
      showConfirmButton: false
    })

    // Reset return entry form and switch to pending QC tab
    handleClearSelectedBill()
    setActiveTab('pending')
    setCurrentPage(1)
  }

  // KPI Metrics Calculation
  const summaryMetrics = useMemo(() => {
    const total = returnsList.length
    const pending = returnsList.filter(r => r.qc_status === 'Pending QC').length
    const restocked = returnsList.filter(r => r.qc_decision === 'STOCK').length
    const replaced = returnsList.filter(r => r.qc_decision === 'REPLACE').length
    const refunded = returnsList.filter(r => r.qc_decision === 'REFUND').length
    return { total, pending, restocked, replaced, refunded }
  }, [returnsList])

  // Filter Logic
  const filteredReturns = useMemo(() => {
    return returnsList.filter(item => {
      // Tab Filtering
      if (activeTab === 'pending' && item.qc_status !== 'Pending QC') return false
      if (activeTab === 'restocked' && item.qc_decision !== 'STOCK') return false
      if (activeTab === 'replaced' && item.qc_decision !== 'REPLACE') return false
      if (activeTab === 'refunded' && item.qc_decision !== 'REFUND') return false

      // Search Filter
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.return_number?.toLowerCase().includes(q) ||
        item.customer_name?.toLowerCase().includes(q) ||
        item.customer_phone?.toLowerCase().includes(q) ||
        item.bill_number?.toLowerCase().includes(q) ||
        item.item_name?.toLowerCase().includes(q)

      // Reason Filter
      const matchReason =
        selectedReason === 'ALL' || item.reason === selectedReason

      // Decision Filter
      const matchDecision =
        selectedDecision === 'ALL' || item.qc_decision === selectedDecision

      // Status Filter
      const matchStatus =
        selectedStatus === 'ALL' || item.qc_status === selectedStatus

      return matchSearch && matchReason && matchDecision && matchStatus
    })
  }, [returnsList, activeTab, searchQuery, selectedReason, selectedDecision, selectedStatus])

  // Pagination Logic
  const totalItems = filteredReturns.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedReturns = filteredReturns.slice(startIndex, endIndex)

  // Selection Logic
  const isAllPaginatedSelected =
    paginatedReturns.length > 0 &&
    paginatedReturns.every(item => selectedIds.includes(item.id))

  const handleToggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      const pageIds = paginatedReturns.map(item => item.id)
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const pageIds = paginatedReturns.map(item => item.id)
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleToggleSelectRow = id => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Open QC Inspection Modal
  const handleOpenQcModal = returnItem => {
    setSelectedReturnForQc(returnItem)
    setQcDecision(returnItem.qc_decision || 'STOCK')
    setQcNotes(returnItem.qc_notes || '')
    setQcRefundAmount(returnItem.refund_amount ? String(returnItem.refund_amount) : '')
    setQcModalOpen(true)
  }

  // Submit QC Inspection Decision (Option 1: STOCK, Option 2: REPLACE, Option 3: REFUND)
  const handleSaveQcDecision = async e => {
    e.preventDefault()
    if (!selectedReturnForQc) return

    setIsSubmittingQc(true)
    try {
      let refCode = ''
      if (qcDecision === 'STOCK') {
        refCode = `RESTOCK-${Date.now().toString().slice(-4)}`
      } else if (qcDecision === 'REPLACE') {
        refCode = `DISP-${Date.now().toString().slice(-4)}`
      } else if (qcDecision === 'REFUND') {
        refCode = `CN-2026-${String(Math.floor(1000 + Math.random() * 9000))}`
      }

      setReturnsList(prev =>
        prev.map(r =>
          r.id === selectedReturnForQc.id
            ? {
                ...r,
                qc_status: 'Completed',
                qc_decision: qcDecision,
                qc_notes: qcNotes || 'QC inspection completed successfully.',
                resolution_ref: refCode,
                refund_amount: qcDecision === 'REFUND' ? parseFloat(qcRefundAmount) || 0 : 0
              }
            : r
        )
      )

      let titleMessage = 'QC Decision Recorded'
      let textMessage = ''
      if (qcDecision === 'STOCK') {
        textMessage = `Item approved for restock. Stock (+${selectedReturnForQc.quantity}) recorded in inventory.`
      } else if (qcDecision === 'REPLACE') {
        textMessage = `Replacement dispatched. Dispatched Slip ${refCode} generated.`
      } else if (qcDecision === 'REFUND') {
        textMessage = `Credit Note ${refCode} generated for customer refund balance.`
      }

      Swal.fire({
        icon: 'success',
        title: titleMessage,
        text: textMessage,
        confirmButtonColor: '#043486',
        timer: 2200,
        showConfirmButton: false
      })

      setQcModalOpen(false)
    } catch (err) {
      console.error('Error saving QC decision:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to record QC inspection decision.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSubmittingQc(false)
    }
  }

  // Create New Return Request
  const handleCreateReturn = e => {
    e.preventDefault()
    if (!newForm.customer_name.trim() || !newForm.item_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Required Fields',
        text: 'Please enter customer name and product/item name.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const nextId = returnsList.length + 1
    const newReturnObj = {
      id: Date.now(),
      return_number: `RET-2026-000${nextId}`,
      return_date: new Date().toISOString().split('T')[0],
      bill_number: newForm.bill_number.trim() || 'N/A',
      customer_name: newForm.customer_name.trim(),
      customer_phone: newForm.customer_phone.trim() || '-',
      item_name: newForm.item_name.trim(),
      material_id: newForm.material_id || null,
      quantity: Number(newForm.quantity) || 1,
      unit: newForm.unit || 'Nos',
      reason: newForm.reason === 'Other' ? newForm.custom_reason : newForm.reason,
      qc_status: 'Pending QC',
      qc_decision: null,
      qc_notes: '',
      resolution_ref: '',
      refund_amount: 0,
      created_at: new Date().toISOString()
    }

    setReturnsList(prev => [newReturnObj, ...prev])
    setNewReturnModalOpen(false)

    Swal.fire({
      icon: 'success',
      title: 'Return Request Created',
      html: `<p class="text-sm">Return reference <b>${newReturnObj.return_number}</b> has been queued for Quality Check (QC).</p>`,
      confirmButtonColor: '#043486'
    })

    setNewForm({
      customer_name: '',
      customer_phone: '',
      bill_number: '',
      item_name: '',
      material_id: '',
      quantity: 1,
      unit: 'Nos',
      reason: 'Defective Product',
      custom_reason: ''
    })
  }

  // Export to Excel
  const handleExportExcel = () => {
    const targetItems =
      selectedIds.length > 0
        ? returnsList.filter(item => selectedIds.includes(item.id))
        : filteredReturns

    if (targetItems.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Return Records to Export',
        text: 'No return records match the current filter or selection.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const excelRows = targetItems.map((item, idx) => ({
      'S.No': idx + 1,
      'Return ID': item.return_number,
      'Return Date': item.return_date,
      'Bill #': item.bill_number,
      'Customer Name': item.customer_name,
      'Contact Phone': item.customer_phone,
      'Product / Item': item.item_name,
      'Return Qty': `${item.quantity} ${item.unit || 'Nos'}`,
      'Return Reason': item.reason,
      'QC Status': item.qc_status,
      'QC Outcome': item.qc_decision || 'Pending',
      'Reference / Credit Note': item.resolution_ref || '-',
      'Refund Amount (₹)': parseFloat(item.refund_amount || 0).toFixed(2),
      'QC Notes': item.qc_notes || '-'
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Returns_Adjustments')
    XLSX.writeFile(
      workbook,
      `Simcha_Returns_Adjustments_${new Date().toISOString().split('T')[0]}.xlsx`
    )

    Swal.fire({
      icon: 'success',
      title: 'Excel Export Ready',
      text: `Successfully exported ${excelRows.length} return record(s).`,
      timer: 2000,
      showConfirmButton: false
    })
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-['Poppins',sans-serif]">
      {/* 1. Header with Global Actions (Excel & New Request Button) */}
      <ListPageHeader
        title="Returns & Stock Adjustments"
        subtitle="Manage product returns, inspection quality checks (QC), restock movements, replacements, and credit notes."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Green Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs rounded-none shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              title={selectedIds.length > 0 ? `Export ${selectedIds.length} Selected Record(s)` : 'Export All Filtered Records'}
            >
              <Download size={15} />
              <span>
                {selectedIds.length > 0 ? `EXPORT SELECTED (${selectedIds.length})` : 'EXPORT TO EXCEL'}
              </span>
            </button>

            {/* Blue New Return Request Button */}
            <button
              onClick={() => setNewReturnModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 border border-[#043486] dark:border-blue-600 rounded-none shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>NEW RETURN REQUEST</span>
            </button>
          </div>
        }
      />

      {/* 2. Top Summary KPI Metrics Cards (Identical Layout & Styling as Inventory) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ListKpiCard
          label="Total Return Requests"
          value={summaryMetrics.total}
          icon={RotateCcw}
          variant="blueValue"
        />
        <ListKpiCard
          label="Pending QC Inspection"
          value={summaryMetrics.pending}
          icon={Clock}
          variant="amber"
        />
        <ListKpiCard
          label="Restocked to Inventory (+1)"
          value={summaryMetrics.restocked}
          icon={CheckCircle2}
          variant="emerald"
        />
        <ListKpiCard
          label="Replacements & Credit Notes"
          value={summaryMetrics.replaced + summaryMetrics.refunded}
          icon={CreditCard}
          variant="rose"
        />
      </div>

      {/* 3. Tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-xs flex items-center justify-between px-2 pt-2 transition-colors">
        <div className="flex items-center gap-1 flex-wrap">
          {/* 1. Return Entry Tab (Primary Intake) */}
          <button
            onClick={() => {
              setActiveTab('entry')
              setCurrentPage(1)
              setSelectedIds([])
            }}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'entry'
                ? 'border-[#043486] text-[#043486] dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <PackagePlus size={14} />
            <span>Return Entry</span>
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-[#043486] dark:text-blue-300 text-[10px] font-extrabold">
              NEW
            </span>
          </button>

          {/* 2. All Returns Registry (Commented out for now - Can be enabled in the future) */}
          {/* 
          <button
            onClick={() => {
              setActiveTab('all')
              setCurrentPage(1)
              setSelectedIds([])
            }}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'border-[#043486] text-[#043486] dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw size={14} />
            <span>All Returns ({summaryMetrics.total})</span>
          </button>
          */}

          {/* 3. Pending QC Inspection */}
          <button
            onClick={() => {
              setActiveTab('pending')
              setCurrentPage(1)
              setSelectedIds([])
            }}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>Pending QC ({summaryMetrics.pending})</span>
          </button>

          {/* 4. Restocked to Inventory (+1) */}
          <button
            onClick={() => {
              setActiveTab('restocked')
              setCurrentPage(1)
              setSelectedIds([])
            }}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'restocked'
                ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Restocked to Inventory ({summaryMetrics.restocked})</span>
          </button>

          {/* 5. Credit Notes & Refunds */}
          <button
            onClick={() => {
              setActiveTab('refunded')
              setCurrentPage(1)
              setSelectedIds([])
            }}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'refunded'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CreditCard size={14} />
            <span>Credit Notes &amp; Refunds ({summaryMetrics.refunded})</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA: Return Entry Workspace vs Returns Registry Table */}
      {activeTab === 'entry' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Return Entry Intake Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-sm p-6 space-y-6">
            
            {/* Dual Search & Select Inputs with (OR) & Clear Button */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                  <Search size={14} className="text-[#043486] dark:text-blue-400" />
                  <span>Search Invoice or Receipt</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[11px] text-[#043486] dark:text-blue-300 font-semibold flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Policy Window: <b>{returnPolicyDays} Days</b></span>
                  </div>

                  {(selectedBill || invoiceQuery || receiptQuery) && (
                    <button
                      type="button"
                      onClick={handleClearSelectedBill}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Clear search and reset bill"
                    >
                      <RotateCcw size={12} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-11 items-start gap-4">
                {/* Option 1: Search by Invoice Number */}
                <div className="lg:col-span-5 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                    Search by Sales Invoice Number:
                  </label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={invoiceQuery}
                      onChange={(e) => setInvoiceQuery(e.target.value)}
                      placeholder="Search Sales Invoice Number..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] font-medium"
                    />

                    {/* Absolute Autocomplete Dropdown suggestions for Invoice (Overlay without shifting UI) */}
                    {invoiceQuery.trim() && !selectedBill && (
                      <div className="absolute top-full left-0 right-0 z-30 max-h-56 overflow-y-auto border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl divide-y divide-gray-100 dark:divide-slate-800 text-xs mt-1">
                        {filteredBillSuggestions.length === 0 ? (
                          <div className="p-3 text-gray-400 text-center italic text-xs">
                            No matching sales invoices found.
                          </div>
                        ) : (
                          filteredBillSuggestions.map(b => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => handleSelectBill(b, false)}
                              className="w-full text-left p-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#043486] dark:text-blue-400 font-mono">{b.invoice_number}</span>
                                <span className="text-gray-700 dark:text-slate-300 font-medium truncate max-w-[180px]">{b.customer_name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-right">
                                <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                  {b.invoice_date ? new Date(b.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white font-mono">
                                  ₹{parseFloat(b.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: (OR) Divider */}
                <div className="lg:col-span-1 flex items-center justify-center pt-2 lg:pt-6">
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-black text-xs border border-amber-300 dark:border-amber-700 rounded-full shadow-2xs">
                    OR
                  </span>
                </div>

                {/* Option 2: Search by Receipt Number */}
                <div className="lg:col-span-5 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                    Search by Receipt Number:
                  </label>
                  <div className="relative">
                    <Receipt size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={receiptQuery}
                      onChange={(e) => setReceiptQuery(e.target.value)}
                      placeholder="Search Receipt Number..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] font-medium"
                    />

                    {/* Absolute Autocomplete Dropdown suggestions for Receipt (Overlay without shifting UI) */}
                    {receiptQuery.trim() && !selectedBill && (
                      <div className="absolute top-full left-0 right-0 z-30 max-h-56 overflow-y-auto border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl divide-y divide-gray-100 dark:divide-slate-800 text-xs mt-1">
                        {filteredReceiptSuggestions.length === 0 ? (
                          <div className="p-3 text-gray-400 text-center italic text-xs">
                            No matching receipts found.
                          </div>
                        ) : (
                          filteredReceiptSuggestions.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectBill(item, false)}
                              className="w-full text-left p-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                  {item.receipt_number || item.invoice_number}
                                </span>
                                <span className="text-gray-700 dark:text-slate-300 font-medium truncate max-w-[180px]">{item.customer_name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-right">
                                <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                  {item.invoice_date ? new Date(item.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white font-mono">
                                  ₹{parseFloat(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Selected Bill Card & Policy Window Status */}
            {isLoadingBill ? (
              <div className="p-12 text-center text-gray-400 dark:text-slate-500">
                <Loader2 size={24} className="animate-spin text-[#043486] mx-auto mb-2" />
                <p className="text-xs font-semibold">Loading Bill Products &amp; Return Eligibility...</p>
              </div>
            ) : selectedBill ? (
              <div className="space-y-4">
                
                {/* Customer & Invoice Summary Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Invoice / Bill #:</span>
                    <span className="font-mono font-bold text-[#043486] dark:text-blue-400 text-sm">
                      {selectedBill.invoice_number || selectedBill.service_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Customer Details:</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{selectedBill.customer_name}</span>
                    <span className="text-gray-500 block text-[11px] font-mono">{selectedBill.customer_phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Payment Mode &amp; Status:</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{selectedBill.payment_mode || 'Cash'}</span>
                    <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {selectedBill.payment_status || selectedBill.service_status || 'Paid'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Invoice Grand Total:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                      ₹{parseFloat(selectedBill.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Products List Table with Checkboxes & Policy Restriction */}
                <div className="border border-gray-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wide text-gray-800 dark:text-slate-200">
                      Invoice Products ({selectedBill.items?.length || 0} Items)
                    </span>
                    <span className="text-xs text-gray-500">
                      Check eligible products below to return:
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase">
                          <th className="p-3 w-12 text-center">Select</th>
                          <th className="p-3">Product Name &amp; Description</th>
                          <th className="p-3 text-center">Billed Qty</th>
                          <th className="p-3 text-right">Rate (₹)</th>
                          <th className="p-3 text-right">Amount (₹)</th>
                          <th className="p-3 text-center">Policy Status</th>
                          <th className="p-3 text-center w-28">Return Qty</th>
                          <th className="p-3 w-56">Return Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-xs">
                        {(!selectedBill.items || selectedBill.items.length === 0) ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-400">
                              No product items found for this invoice.
                            </td>
                          </tr>
                        ) : (
                          selectedBill.items.map((it, idx) => {
                            const itemKey = it.id || `${it.item_name}_${it.product_name}_${idx}`
                            const isReturnable = it.return_policy === true || it.return_policy === 1 || it.return_policy === '1' || it.return_policy === 'true'
                            const isChecked = Boolean(selectedReturnItems[itemKey])
                            const selectedState = selectedReturnItems[itemKey] || {}
                            const serials = parseItemSerials(it)
                            const hasMultipleSerials = serials.length > 1

                            return (
                              <tr
                                key={itemKey}
                                className={`transition-colors ${
                                  !isReturnable
                                    ? 'bg-gray-50/80 dark:bg-slate-950/40 opacity-70'
                                    : isChecked
                                    ? 'bg-blue-50/80 dark:bg-blue-950/40'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                }`}
                              >
                                {/* Checkbox (Enabled ONLY if return_policy is enabled) */}
                                <td className="p-3 text-center align-top pt-3.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={!isReturnable}
                                    onChange={() => handleToggleItemCheckbox(it)}
                                    className={`w-4 h-4 rounded-none focus:ring-0 cursor-pointer ${
                                      isReturnable
                                        ? 'accent-[#043486] text-[#043486]'
                                        : 'opacity-40 cursor-not-allowed'
                                    }`}
                                  />
                                </td>

                                {/* Product Name & Description + Multi-serial Checkboxes */}
                                <td className="p-3">
                                  <div className="font-bold text-gray-900 dark:text-white">
                                    {it.product_name || it.item_name}
                                  </div>
                                  {it.brand_model && (
                                    <div className="text-[11px] text-gray-500 dark:text-slate-400">
                                      Model: {it.brand_model}
                                    </div>
                                  )}
                                  
                                  {/* If Multiple Serial Numbers: Display individual checkboxes for each serial */}
                                  {hasMultipleSerials ? (
                                    <div className="mt-2 space-y-1.5">
                                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                                        Select Serial Number(s) to Return:
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {serials.map((sn, sIdx) => {
                                          const isSnChecked = selectedState.selected_serials?.includes(sn) || false
                                          return (
                                            <label
                                              key={sIdx}
                                              className={`inline-flex items-center gap-1.5 px-2 py-1 border text-[11px] font-mono cursor-pointer transition-all ${
                                                !isReturnable
                                                  ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-slate-800 text-gray-400'
                                                  : isSnChecked
                                                  ? 'bg-blue-100/80 dark:bg-blue-900/50 border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-300 font-bold'
                                                  : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSnChecked}
                                                disabled={!isReturnable}
                                                onChange={() => handleToggleItemSerial(it, sn)}
                                                className="w-3.5 h-3.5 accent-[#043486] rounded-none cursor-pointer"
                                              />
                                              <span>{sn}</span>
                                            </label>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ) : serials.length === 1 ? (
                                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                      SN: {serials[0]}
                                    </div>
                                  ) : it.serial_number ? (
                                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                      SN: {it.serial_number}
                                    </div>
                                  ) : null}
                                </td>

                                {/* Invoiced Qty */}
                                <td className="p-3 text-center font-bold align-top pt-3.5">
                                  {it.quantity} {it.unit || 'Nos'}
                                </td>

                                {/* Rate */}
                                <td className="p-3 text-right font-mono font-medium align-top pt-3.5">
                                  ₹{parseFloat(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>

                                {/* Amount */}
                                <td className="p-3 text-right font-mono font-bold text-gray-900 dark:text-white align-top pt-3.5">
                                  ₹{parseFloat(it.amount || (parseFloat(it.quantity || 1) * parseFloat(it.rate || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>

                                {/* Return Policy Status Badge */}
                                <td className="p-3 text-center align-top pt-3.5">
                                  {isReturnable ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                      <CheckCircle2 size={11} /> Returnable
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-700 text-[10px] font-bold" title="Return policy was unchecked during billing or in material master">
                                      <XCircle size={11} /> Non-Returnable
                                    </span>
                                  )}
                                </td>

                                {/* Return Qty (Non-editable display) */}
                                <td className="p-3 text-center align-top pt-3.5">
                                  {isChecked ? (
                                    <span className="inline-block px-2 py-1 font-bold text-xs bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white border border-slate-200 dark:border-slate-700 min-w-10">
                                      {selectedState.return_qty || 1}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>

                                {/* Return Reason Dropdown */}
                                <td className="p-3 align-top pt-3">
                                  {isChecked ? (
                                    <select
                                      value={selectedState.reason || 'Defective Product'}
                                      onChange={(e) => handleItemReasonChange(itemKey, e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] font-medium"
                                    >
                                      <option value="Defective Product">Defective / Malfunctioning</option>
                                      <option value="Wrong Item Shipped">Wrong Item / Color Mismatch</option>
                                      <option value="Transit / Physical Damage">Transit / Physical Damage</option>
                                      <option value="Customer Requested Refund">Customer Requested Refund</option>
                                      <option value="Unopened Box / Not Needed">Unopened Box / Not Needed</option>
                                      <option value="Other">Other Reason</option>
                                    </select>
                                  ) : (
                                    <span className="text-gray-400 text-xs block pt-0.5">-</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Action: Proceed to QC & Resolution */}
                <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-gray-600 dark:text-slate-400">
                    Selected for Return: <b className="text-[#043486] dark:text-blue-400 text-sm">{Object.keys(selectedReturnItems).length} Product(s)</b>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClearSelectedBill}
                      className="px-4 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                    >
                      Cancel / Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToNextStep}
                      disabled={Object.keys(selectedReturnItems).length === 0}
                      className="px-6 py-2.5 bg-[#043486] hover:bg-[#0248BC] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span>Proceed to QC &amp; Resolution ({Object.keys(selectedReturnItems).length})</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 dark:text-slate-500 border border-dashed border-gray-300 dark:border-slate-700 p-6">
                <Search size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold">Please search and select a Sales Invoice or Receipt number above to view billed items and start return processing.</p>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* 5. Returns Registry Data Table & Filters */
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-xs transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Search Return #, Customer, Bill #, Item..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 transition-colors"
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

            {/* Dropdown Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Reason:
                </span>
                <select
                  value={selectedReason}
                  onChange={e => {
                    setSelectedReason(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
                >
                  <option value="ALL">All Reasons</option>
                  <option value="Defective Product">Defective Product</option>
                  <option value="Defective Screen Panel">Defective Screen Panel</option>
                  <option value="Wrong Color / Unopened Box">Wrong Color / Unopened Box</option>
                  <option value="Customer Requested Refund">Customer Requested Refund</option>
                  <option value="Read/Write Speed issue reported">Read/Write Speed issue reported</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  QC Decision:
                </span>
                <select
                  value={selectedDecision}
                  onChange={e => {
                    setSelectedDecision(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
                >
                  <option value="ALL">All Decisions</option>
                  <option value="STOCK">Restock to Inventory (+1)</option>
                  <option value="REPLACE">Exchange / Replace</option>
                  <option value="REFUND">Credit Note / Refund</option>
                </select>
              </div>

              {/* Reload Button */}
              <button
                onClick={() => {
                  setLoading(true)
                  setTimeout(() => setLoading(false), 400)
                }}
                className="p-1.5 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer ml-1"
                title="Refresh Return Records"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* 5. Returns Data Table */}
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
                      disabled={loading || paginatedReturns.length === 0}
                      className="w-4 h-4 text-[#043486] rounded-none border-gray-300 dark:border-slate-600 focus:ring-0 cursor-pointer accent-[#043486]"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Return ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer &amp; Phone</th>
                  <th className="py-3 px-4">Original Bill #</th>
                  <th className="py-3 px-4">Product &amp; QTY</th>
                  <th className="py-3 px-4">Return Reason</th>
                  <th className="py-3 px-4 text-center">QC Status &amp; Decision</th>
                  <th className="py-3 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-xs text-gray-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="animate-spin text-[#043486] dark:text-blue-400" />
                        <span className="text-xs font-semibold">Loading Return Records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedReturns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RotateCcw size={28} className="text-gray-300 dark:text-slate-600" />
                        <span className="text-xs font-semibold">
                          No product return records found matching current criteria.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedReturns.map((item, idx) => {
                    const rowNumber = startIndex + idx + 1
                    const isSelected = selectedIds.includes(item.id)
                    const isPending = item.qc_status === 'Pending QC'

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

                        {/* Return ID */}
                        <td className="py-3 px-4 font-mono font-bold text-[#043486] dark:text-blue-400">
                          {item.return_number}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-slate-400">
                          {item.return_date
                            ? new Date(item.return_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'}
                        </td>

                        {/* Customer & Phone */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800 dark:text-slate-200">
                            {item.customer_name}
                          </div>
                          <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                            {item.customer_phone || '-'}
                          </div>
                        </td>

                        {/* Original Bill # */}
                        <td className="py-3 px-4 font-mono text-gray-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[11px]">
                            {item.bill_number}
                          </span>
                        </td>

                        {/* Product & Qty */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-800 dark:text-slate-200">
                            {item.item_name}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono font-bold">
                            Qty: {item.quantity} {item.unit || 'Nos'}
                          </div>
                        </td>

                        {/* Return Reason */}
                        <td className="py-3 px-4">
                          <span className="text-gray-700 dark:text-slate-300 font-medium">
                            {item.reason}
                          </span>
                        </td>

                        {/* QC Status & Decision */}
                        <td className="py-3 px-4 text-center">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                              <Clock size={11} /> Pending QC
                            </span>
                          ) : item.qc_decision === 'STOCK' ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <Boxes size={11} /> Restocked (+{item.quantity})
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">{item.resolution_ref}</span>
                            </div>
                          ) : item.qc_decision === 'REPLACE' ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                <RotateCcw size={11} /> Replaced (New Unit)
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">{item.resolution_ref}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                <CreditCard size={11} /> Credit Note (₹{item.refund_amount})
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">{item.resolution_ref}</span>
                            </div>
                          )}
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Quality Check Inspection Action */}
                            <button
                              onClick={() => handleOpenQcModal(item)}
                              className={`p-1.5 rounded-none border transition-all cursor-pointer shadow-2xs ${
                                isPending
                                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-600 hover:text-white border-amber-300 dark:border-amber-700 font-bold'
                                  : 'text-[#043486] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-[#043486] hover:text-white border-blue-200 dark:border-blue-800'
                              }`}
                              title={isPending ? 'Perform QC Quality Check' : 'Edit QC Inspection'}
                            >
                              <ShieldCheck size={15} />
                            </button>

                            {/* View Details / Slip */}
                            <button
                              onClick={() => {
                                setSelectedReturnView(item)
                                setViewModalOpen(true)
                              }}
                              className="p-1.5 text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-none transition-all cursor-pointer shadow-2xs"
                              title="View Return Details Slip"
                            >
                              <FileText size={15} />
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

          {/* Pagination Controls */}
          <ListPagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={val => {
              setItemsPerPage(val)
              setCurrentPage(1)
            }}
            onPageChange={val => setCurrentPage(val)}
          />
        </div>
      )}

      {/* 6. QC Quality Check Inspection Modal (Option 1: STOCK, Option 2: REPLACE, Option 3: REFUND) */}
      {qcModalOpen && selectedReturnForQc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-[#292424] dark:text-white flex items-center gap-2">
                  <ShieldCheck className="text-[#043486] dark:text-blue-400" size={20} />
                  <span>QC Quality Inspection &amp; Decision</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Inspect product condition and assign resolution workflow.
                </p>
              </div>
              <button
                onClick={() => setQcModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Return Request Summary Preview */}
            <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Return ID:</span>{' '}
                <span className="font-mono font-bold text-[#043486] dark:text-blue-400">
                  {selectedReturnForQc.return_number}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Customer:</span>{' '}
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {selectedReturnForQc.customer_name}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Product:</span>{' '}
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {selectedReturnForQc.item_name} (Qty: {selectedReturnForQc.quantity})
                </span>
              </div>
              <div>
                <span className="text-gray-400">Reported Issue:</span>{' '}
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {selectedReturnForQc.reason}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveQcDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select QC Outcome (Flow Option):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: STOCK (+1) */}
                  <label
                    className={`p-3 border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      qcDecision === 'STOCK'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                        <Boxes size={14} className="text-emerald-600" />
                        1. STOCK
                      </span>
                      <input
                        type="radio"
                        name="qcDecisionRadio"
                        value="STOCK"
                        checked={qcDecision === 'STOCK'}
                        onChange={() => setQcDecision('STOCK')}
                        className="accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
                      Good condition. Re-stock +{selectedReturnForQc.quantity} to warehouse inventory.
                    </p>
                  </label>

                  {/* Option 2: REPLACE */}
                  <label
                    className={`p-3 border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      qcDecision === 'REPLACE'
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                        <RotateCcw size={14} className="text-blue-600" />
                        2. REPLACE
                      </span>
                      <input
                        type="radio"
                        name="qcDecisionRadio"
                        value="REPLACE"
                        checked={qcDecision === 'REPLACE'}
                        onChange={() => setQcDecision('REPLACE')}
                        className="accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
                      Defective item. Dispatch a new unit / replacement slip to customer.
                    </p>
                  </label>

                  {/* Option 3: REFUND (Credit Note) */}
                  <label
                    className={`p-3 border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      qcDecision === 'REFUND'
                        ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                        <CreditCard size={14} className="text-purple-600" />
                        3. REFUND
                      </span>
                      <input
                        type="radio"
                        name="qcDecisionRadio"
                        value="REFUND"
                        checked={qcDecision === 'REFUND'}
                        onChange={() => setQcDecision('REFUND')}
                        className="accent-purple-600 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
                      Customer refund. Issue GST Credit Note / balance adjustment.
                    </p>
                  </label>
                </div>
              </div>

              {/* Conditional Refund Amount Field for Option 3 */}
              {qcDecision === 'REFUND' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Refund / Credit Note Value (₹):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter refund amount (e.g. 2400.00)"
                    value={qcRefundAmount}
                    onChange={e => setQcRefundAmount(e.target.value)}
                    required={qcDecision === 'REFUND'}
                    className="w-full px-3 py-2 text-xs border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}

              {/* QC Inspector Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  QC Inspection Remarks / Findings:
                </label>
                <textarea
                  rows={3}
                  value={qcNotes}
                  onChange={e => setQcNotes(e.target.value)}
                  placeholder="Enter physical condition observation, serial verification details..."
                  className="w-full p-2.5 text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQcModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQc}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingQc && <Loader2 size={13} className="animate-spin" />}
                  <span>Save QC Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. New Return Request Modal */}
      {newReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-[#292424] dark:text-white flex items-center gap-2">
                  <RotateCcw className="text-[#043486] dark:text-blue-400" size={18} />
                  <span>Log New Product Return Request</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Record returned items to queue for Quality Check (QC).
                </p>
              </div>
              <button
                onClick={() => setNewReturnModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter customer name"
                    value={newForm.customer_name}
                    onChange={e => setNewForm({ ...newForm, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={newForm.customer_phone}
                    onChange={e => setNewForm({ ...newForm, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                    Outward Bill #
                  </label>
                  <input
                    type="text"
                    placeholder="INV-2026-0001"
                    value={newForm.bill_number}
                    onChange={e => setNewForm({ ...newForm, bill_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                    Return Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newForm.quantity}
                    onChange={e => setNewForm({ ...newForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                  Product / Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logitech Wireless Mouse M331"
                  value={newForm.item_name}
                  onChange={e => setNewForm({ ...newForm, item_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                  Reason for Return *
                </label>
                <select
                  value={newForm.reason}
                  onChange={e => setNewForm({ ...newForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486] cursor-pointer"
                >
                  <option value="Defective Product">Defective Product / Hardware Fault</option>
                  <option value="Damaged in Transit">Damaged in Transit</option>
                  <option value="Wrong Item Received">Wrong Item Received</option>
                  <option value="Customer Changed Mind">Customer Changed Mind / Unopened Box</option>
                  <option value="Other">Other Custom Reason</option>
                </select>
              </div>

              {newForm.reason === 'Other' && (
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                    Specify Reason:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter specific reason"
                    value={newForm.custom_reason}
                    onChange={e => setNewForm({ ...newForm, custom_reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486]"
                  />
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none cursor-pointer"
                >
                  Submit for QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. View Return Details Slip Modal */}
      {viewModalOpen && selectedReturnView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 relative font-['Poppins',sans-serif]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="text-[#043486] dark:text-blue-400" size={20} />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Return Voucher Slip
                </h3>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Return ID:</span>
                <span className="font-mono font-bold text-[#043486] dark:text-blue-400">{selectedReturnView.return_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Return Date:</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{selectedReturnView.return_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{selectedReturnView.customer_name} ({selectedReturnView.customer_phone})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Original Invoice #:</span>
                <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">{selectedReturnView.bill_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Product Returned:</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{selectedReturnView.item_name} (Qty: {selectedReturnView.quantity})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Reason:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{selectedReturnView.reason}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">QC Status:</span>
                <span className="font-bold">{selectedReturnView.qc_status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">QC Outcome Decision:</span>
                <span className="font-mono font-bold text-[#043486] dark:text-blue-400">{selectedReturnView.qc_decision || 'Pending Inspection'}</span>
              </div>
              {selectedReturnView.resolution_ref && (
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-gray-500">Reference / Credit Note:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedReturnView.resolution_ref}</span>
                </div>
              )}
              {selectedReturnView.refund_amount > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-gray-500">Refund / CN Amount:</span>
                  <span className="font-mono font-bold text-purple-600">₹{selectedReturnView.refund_amount.toFixed(2)}</span>
                </div>
              )}
              {selectedReturnView.qc_notes && (
                <div className="pt-2">
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider font-semibold">QC Findings Note:</span>
                  <p className="mt-1 p-2 bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs italic">
                    "{selectedReturnView.qc_notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none cursor-pointer"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
