import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
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
  BadgeCheck,
  CreditCard,
  FileText,
  HelpCircle,
  Printer,
  ChevronDown,
  User,
  Phone,
  Hash,
  Layers,
  ArrowUpRight,
  Pencil,
  Edit3
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'
import { getUserPermissions } from '../utils/access'
import ListPageHeader from '../components/common/ListPageHeader'
import ListKpiCard from '../components/common/ListKpiCard'
import ListPagePagination from '../components/common/ListPagePagination'
import ReturnVoucherTemplate from '../components/invoice/ReturnVoucherTemplate'
import InvoiceModal from '../components/invoice/InvoiceModal'
import { Button, ActionButton, StatusPill, SearchInput, TabNav, TabButton } from '../components/ui'

// Initial default empty data for Returns & Adjustments
const DEFAULT_RETURNS = []

export default function ReturnsAdjustmentsPage({ setActiveRoute }) {
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('returns_new', 'Add') || can('returns_list', 'Add') || can('returns', 'Add')
  const canEdit = hasAny('returns_list', ['Edit']) || hasAny('returns_new', ['Edit']) || hasAny('returns', ['Edit'])
  const canDelete = hasAny('returns_list', ['Delete']) || hasAny('returns_new', ['Delete']) || hasAny('returns', ['Delete'])
  const canDownload = hasAny('returns_list', ['Download']) || hasAny('returns_new', ['Download']) || hasAny('returns', ['Download'])

  const navigate = useNavigate()

  // Active Tab: 'entry' | 'all' | 'pending' | 'restocked' | 'refunded'
  const [activeTab, setActiveTab] = useState(canAdd ? 'entry' : 'pending')

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
  const [previewInvoiceBill, setPreviewInvoiceBill] = useState(null)

  // QC Form State (REPLACE | REFUND | REJECT)
  const [qcDecision, setQcDecision] = useState('REPLACE')
  const [qcCondition, setQcCondition] = useState('PASS')
  const [qcNotes, setQcNotes] = useState('')
  const [qcRefundAmount, setQcRefundAmount] = useState('')
  const [refundMode, setRefundMode] = useState('Credit Note')
  const [replacementSerial, setReplacementSerial] = useState('')
  const [availableSerialsList, setAvailableSerialsList] = useState([])
  const [serialDropdownOpen, setSerialDropdownOpen] = useState(false)
  const [serialSearchTerm, setSerialSearchTerm] = useState('')
  const [isLoadingSerials, setIsLoadingSerials] = useState(false)
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

  // Fetch materials, bills, services, company settings, and returns from DB API
  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [matRes, billsRes, servRes, setRes, retRes] = await Promise.all([
        fetch(API_ENDPOINTS.MATERIALS).catch(() => null),
        fetch(API_ENDPOINTS.BILLS).catch(() => null),
        fetch(API_ENDPOINTS.SERVICES).catch(() => null),
        fetch(API_ENDPOINTS.SETTINGS).catch(() => null),
        fetch(API_ENDPOINTS.RETURNS).catch(() => null)
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
      if (retRes && retRes.ok) {
        const rData = await retRes.json()
        if (rData.success && rData.returns) {
          setReturnsList(rData.returns)
          try {
            localStorage.setItem('simcha_returns_registry', JSON.stringify(rData.returns))
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to load data for returns:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Open Invoice Preview Modal for clicked bill number
  const handleOpenInvoicePreview = async (billNumber) => {
    if (!billNumber || billNumber === '—' || billNumber === '-') return

    // 1. Try finding in loaded outward bills
    let foundBill = bills.find(b =>
      b.invoice_number === billNumber ||
      b.bill_number === billNumber ||
      String(b.id) === String(billNumber)
    )

    // 2. Try finding in loaded services list
    if (!foundBill) {
      const foundService = servicesList.find(s =>
        s.service_number === billNumber ||
        s.service_bill_number === billNumber ||
        String(s.id) === String(billNumber)
      )
      if (foundService) {
        foundBill = {
          ...foundService,
          invoice_number: foundService.service_number || foundService.service_bill_number || billNumber,
          invoice_date: foundService.service_date || foundService.created_at,
          total_amount: foundService.total_amount,
          items: foundService.items || [
            {
              item_name: foundService.device_name || 'Service Product',
              quantity: 1,
              rate: foundService.total_amount,
              total: foundService.total_amount
            }
          ]
        }
      }
    }

    // 3. Fallback: Find matching return record
    if (!foundBill) {
      const matchingReturn = returnsList.find(r => r.bill_number === billNumber || r.invoice_number === billNumber)
      foundBill = {
        invoice_number: billNumber,
        invoice_date: matchingReturn?.return_date || new Date().toISOString(),
        customer_name: matchingReturn?.customer_name || 'Customer',
        customer_phone: matchingReturn?.customer_phone || '',
        customer_address: matchingReturn?.customer_address || '',
        total_amount: matchingReturn?.unit_price || matchingReturn?.rate || matchingReturn?.refund_amount || 0,
        items: matchingReturn
          ? [
              {
                item_name: matchingReturn.item_name,
                quantity: matchingReturn.quantity || 1,
                unit: matchingReturn.unit || 'Nos',
                rate: matchingReturn.unit_price || matchingReturn.rate || 0,
                total: matchingReturn.unit_price || matchingReturn.rate || 0,
                serial_number: matchingReturn.serial_number
              }
            ]
          : []
      }
    }

    setPreviewInvoiceBill(foundBill)
  }

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

  // Helper: Check if a Bill is Cancelled
  const isBillCancelled = (b) => {
    if (!b) return false
    const pStatus = (b.payment_status || '').toLowerCase().trim()
    const bStatus = (b.status || '').toLowerCase().trim()
    return pStatus === 'cancelled' || pStatus === 'cancel' || bStatus === 'cancelled' || bStatus === 'cancel'
  }

  // Helper: Check if a Bill is currently in Pending QC
  const isBillInPendingQc = (b) => {
    if (!b) return false
    const billNo = (b.invoice_number || b.service_number || '').toLowerCase().trim()
    const recNo = (b.receipt_number || '').toLowerCase().trim()
    const bId = b.id
    return returnsList.some(r => {
      if (r.qc_status !== 'Pending QC') return false
      if (r.bill_id && bId && String(r.bill_id) === String(bId)) return true
      if (r.bill_number) {
        const rBillNo = r.bill_number.toLowerCase().trim()
        if (billNo && rBillNo === billNo) return true
        if (recNo && rBillNo === recNo) return true
      }
      return false
    })
  }

  // Helper: Check if a Serial Number has already been submitted for return / QC
  const isSerialAlreadyInReturn = (serial, materialId, billId, billNumber) => {
    if (!serial) return false
    const snClean = String(serial).toLowerCase().trim()
    return returnsList.some(r => {
      if (!r.serial_number) return false
      if (r.qc_status === 'Rejected' || r.qc_decision === 'REJECT') return false
      const rSerials = r.serial_number.toLowerCase().split(',').map(s => s.trim())
      if (!rSerials.includes(snClean)) return false
      
      // Match against this specific bill
      const matchBillId = billId && r.bill_id && String(r.bill_id) === String(billId)
      const matchBillNo = billNumber && r.bill_number && r.bill_number.trim().toLowerCase() === String(billNumber).trim().toLowerCase()
      return matchBillId || matchBillNo
    })
  }

  // Helper: Get remaining returnable quantity for a bill item
  const getItemRemainingReturnableQty = (it, billId, billNumber) => {
    const totalQty = parseFloat(it.quantity) || 1
    const serials = parseItemSerials(it)
    if (serials.length > 0) {
      const activeSerials = serials.filter(sn => !isSerialAlreadyInReturn(sn, it.material_id, billId, billNumber))
      return activeSerials.length
    }
    const returnedQty = returnsList
      .filter(r => {
        if (r.qc_status === 'Rejected' || r.qc_decision === 'REJECT') return false
        const matchBill = (billId && r.bill_id && String(r.bill_id) === String(billId)) ||
          (billNumber && r.bill_number && r.bill_number.trim().toLowerCase() === String(billNumber).trim().toLowerCase())
        const matchMat = (it.material_id && r.material_id && String(r.material_id) === String(it.material_id)) ||
          (r.item_name && (r.item_name.toLowerCase().trim() === (it.product_name || it.item_name || '').toLowerCase().trim()))
        return matchBill && matchMat
      })
      .reduce((sum, r) => sum + (parseFloat(r.quantity) || 1), 0)
    return Math.max(0, totalQty - returnedQty)
  }

  // Helper: Check if all items in bill are already fully returned
  const isBillFullyReturned = (b) => {
    if (!b) return false
    if (!b.items || b.items.length === 0) return false
    return b.items.every(it => getItemRemainingReturnableQty(it, b.id, b.invoice_number) <= 0)
  }

  // Filtered Bill suggestions for Invoice Search (All active non-cancelled matching bills)
  const filteredBillSuggestions = useMemo(() => {
    if (!invoiceQuery.trim()) return []
    const q = invoiceQuery.toLowerCase().trim()
    return bills.filter(b => {
      if (isBillCancelled(b)) return false
      return (
        b.invoice_number?.toLowerCase().includes(q) ||
        b.customer_name?.toLowerCase().includes(q) ||
        b.customer_phone?.toLowerCase().includes(q)
      )
    }).slice(0, 8)
  }, [bills, invoiceQuery])

  // Filtered Receipt suggestions for Receipt Search (STRICTLY Receipt Number ONLY)
  const filteredReceiptSuggestions = useMemo(() => {
    if (!receiptQuery.trim()) return []
    const q = receiptQuery.toLowerCase().trim()
    return bills.filter(b => {
      if (!b.receipt_number || !b.receipt_number.trim()) return false
      if (isBillCancelled(b)) return false
      return b.receipt_number.toLowerCase().includes(q)
    }).slice(0, 8)
  }, [bills, receiptQuery])

  // Select Bill / Invoice for Return Entry
  const handleSelectBill = async (billObj, isService = false) => {
    try {
      if (isBillCancelled(billObj)) {
        Swal.fire({
          icon: 'error',
          title: 'Cancelled Invoice',
          text: `Invoice "${billObj.invoice_number || billObj.id}" has been CANCELLED in Outward List and cannot be returned.`,
          confirmButtonColor: '#043486'
        })
        return
      }

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
    const availableSerials = serials.filter(sn => !isSerialAlreadyInReturn(sn, item.material_id, selectedBill?.id, selectedBill?.invoice_number))
    const remainingQty = getItemRemainingReturnableQty(item, selectedBill?.id, selectedBill?.invoice_number)

    if (remainingQty <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Item Already Returned',
        text: 'All purchased units for this line item have already been returned or are in QC.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setSelectedReturnItems(prev => {
      const next = { ...prev }
      if (next[itemKey]) {
        delete next[itemKey]
      } else {
        const hasMultipleSerials = serials.length > 1
        const initialSerials = hasMultipleSerials ? [...availableSerials] : (availableSerials.length === 1 ? [availableSerials[0]] : [])
        const initialQty = hasMultipleSerials ? availableSerials.length : remainingQty
        next[itemKey] = {
          checked: true,
          selected_serials: initialSerials,
          return_qty: initialQty,
          max_qty: remainingQty,
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
    if (isSerialAlreadyInReturn(serial, item.material_id, selectedBill?.id, selectedBill?.invoice_number)) {
      Swal.fire({
        icon: 'info',
        title: 'Serial Already In Return',
        text: `Serial number "${serial}" is already in Return or Pending QC.`,
        confirmButtonColor: '#043486'
      })
      return
    }

    const itemKey = item.id || `${item.item_name}_${item.product_name}`
    const remainingQty = getItemRemainingReturnableQty(item, selectedBill?.id, selectedBill?.invoice_number)

    setSelectedReturnItems(prev => {
      const next = { ...prev }
      const current = next[itemKey] || {
        checked: true,
        selected_serials: [],
        return_qty: 0,
        max_qty: remainingQty,
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

  // Handle Item Return Qty Change
  const handleItemQtyChange = (itemKey, qty) => {
    setSelectedReturnItems(prev => {
      if (!prev[itemKey]) return prev
      const max = prev[itemKey].max_qty || 1
      const num = parseFloat(qty)
      const clamped = isNaN(num) || num < 1 ? 1 : Math.min(max, num)
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

  const executeCreateReturns = async () => {
    try {
      const selectedEntries = Object.values(selectedReturnItems)
      const payloadItems = selectedEntries.map(entry => {
        const it = entry.item_data
        const serialStr = entry.selected_serials && entry.selected_serials.length > 0
          ? entry.selected_serials.join(', ')
          : (it.serial_number || '')

        return {
          return_date: new Date().toISOString().split('T')[0],
          bill_id: selectedBill.id || null,
          bill_number: selectedBill.invoice_number || selectedBill.service_number || 'N/A',
          customer_name: selectedBill.customer_name || 'Customer',
          customer_phone: selectedBill.customer_phone || null,
          customer_email: selectedBill.customer_email || null,
          item_name: it.product_name || it.item_name || 'Product',
          material_id: it.material_id || null,
          serial_number: serialStr,
          quantity: entry.return_qty || 1,
          unit: it.unit || 'Nos',
          unit_price: parseFloat(it.rate || it.selling_price || 0),
          total_amount: parseFloat(it.rate || it.selling_price || 0) * (entry.return_qty || 1),
          reason: entry.reason,
          custom_reason: entry.custom_reason || ''
        }
      })

      const res = await fetch(API_ENDPOINTS.RETURNS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems })
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to create return record')
      }

      await fetchAllData()

      Swal.fire({
        icon: 'success',
        title: 'Return Request Created!',
        text: `${payloadItems.length} item(s) submitted for return. Proceeding to QC Inspection...`,
        timer: 1800,
        showConfirmButton: false
      })

      // Reset return entry form and switch to pending QC tab
      handleClearSelectedBill()
      setActiveTab('pending')
      setCurrentPage(1)
    } catch (err) {
      console.error('Error creating returns:', err)
      Swal.fire({
        icon: 'error',
        title: 'Return Request Failed',
        text: err.message || 'Could not save return record to database.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Helper: Check if an item is a Defective / QC Failed unit
  const isDefectiveItem = (r) => {
    if (r.qc_status === 'Pending QC') return false
    const cond = (r.qc_condition || '').toUpperCase().trim()
    const dec = (r.qc_decision || '').toUpperCase().trim()
    return cond === 'FAIL' || cond === 'DEFECTIVE' || cond === 'DAMAGED' || dec === 'REJECT'
  }

  // Helper: Check if an item is a Completed & Resolved unit (Pass condition)
  const isCompletedItem = (r) => {
    if (r.qc_status === 'Pending QC') return false
    return !isDefectiveItem(r)
  }

  // KPI Metrics Calculation
  const summaryMetrics = useMemo(() => {
    const total = returnsList.length
    const pending = returnsList.filter(r => r.qc_status === 'Pending QC').length
    const defective = returnsList.filter(r => isDefectiveItem(r)).length
    const completed = returnsList.filter(r => isCompletedItem(r)).length
    const creditNotes = returnsList.filter(r => r.qc_decision === 'REFUND' || (r.resolution_ref && r.resolution_ref.includes('CN'))).length
    const replaced = returnsList.filter(r => r.qc_decision === 'REPLACE').length
    const refunded = returnsList.filter(r => r.qc_decision === 'REFUND').length
    const rejected = returnsList.filter(r => r.qc_decision === 'REJECT' || r.qc_status === 'Rejected').length
    return { total, pending, defective, completed, creditNotes, replaced, refunded, rejected }
  }, [returnsList])

  // Filter Logic
  const filteredReturns = useMemo(() => {
    return returnsList.filter(item => {
      // Tab Filtering: 'pending' vs 'completed' vs 'credit_notes' vs 'defective'
      if (activeTab === 'pending' && item.qc_status !== 'Pending QC') return false
      if (activeTab === 'completed' && !isCompletedItem(item)) return false
      if (activeTab === 'credit_notes' && !(item.qc_decision === 'REFUND' || (item.resolution_ref && item.resolution_ref.includes('CN')))) return false
      if (activeTab === 'defective' && !isDefectiveItem(item)) return false

      // Search Filter
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.return_number?.toLowerCase().includes(q) ||
        item.customer_name?.toLowerCase().includes(q) ||
        item.customer_phone?.toLowerCase().includes(q) ||
        item.bill_number?.toLowerCase().includes(q) ||
        item.item_name?.toLowerCase().includes(q) ||
        item.serial_number?.toLowerCase().includes(q) ||
        item.replacement_serial?.toLowerCase().includes(q)

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

  // Filtered available serials for searchable replacement dropdown
  const filteredAvailableSerials = useMemo(() => {
    if (!Array.isArray(availableSerialsList)) return []
    if (!serialSearchTerm.trim()) return availableSerialsList
    const q = serialSearchTerm.toLowerCase().trim()
    return availableSerialsList.filter(s => s.serial_number?.toLowerCase().includes(q))
  }, [availableSerialsList, serialSearchTerm])

  // Open QC Inspection Modal and load material available serials
  const handleOpenQcModal = async returnItem => {
    setSelectedReturnForQc(returnItem)
    setQcDecision(returnItem.qc_decision || 'REPLACE')
    setQcCondition(returnItem.qc_condition === 'FAIL' || returnItem.qc_condition === 'Defective' || returnItem.qc_condition === 'Damaged' ? 'FAIL' : 'PASS')
    setQcNotes(returnItem.qc_notes || '')
    setQcRefundAmount(returnItem.refund_amount ? String(returnItem.refund_amount) : (returnItem.total_amount ? String(returnItem.total_amount) : ''))
    setReplacementSerial(returnItem.replacement_serial || '')
    setSerialSearchTerm(returnItem.replacement_serial || '')
    setSerialDropdownOpen(false)
    setRefundMode('Credit Note')
    setAvailableSerialsList([])
    setQcModalOpen(true)

    if (returnItem.material_id) {
      try {
        setIsLoadingSerials(true)
        const res = await fetch(API_ENDPOINTS.INVENTORY_MATERIAL_SERIALS(returnItem.material_id, 'Available'))
        const data = await res.json()
        if (data.success && Array.isArray(data.serials)) {
          setAvailableSerialsList(data.serials)
        }
      } catch (e) {
        console.error('Failed to load available serials for replacement:', e)
      } finally {
        setIsLoadingSerials(false)
      }
    }
  }

  // Submit QC Inspection Decision (REPLACE | REFUND | REJECT)
  const handleSaveQcDecision = async e => {
    e.preventDefault()
    if (!selectedReturnForQc) return

    if (qcDecision === 'REPLACE' && availableSerialsList.length > 0 && !replacementSerial) {
      Swal.fire({
        icon: 'warning',
        title: 'Replacement Serial Required',
        text: 'Please choose an available serial number from stock for replacement.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSubmittingQc(true)
    try {
      const res = await fetch(API_ENDPOINTS.RETURN_QC_DECISION(selectedReturnForQc.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qc_decision: qcDecision,
          qc_condition: qcCondition,
          qc_notes: qcNotes || `QC Decision: ${qcDecision} (${qcCondition})`,
          refund_amount: qcDecision === 'REFUND' ? (parseFloat(qcRefundAmount) || 0) : 0,
          replacement_serial: qcDecision === 'REPLACE' ? replacementSerial : null
        })
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to update QC decision in database.')
      }

      await fetchAllData()

      let titleMessage = 'QC Decision Recorded'
      let textMessage = ''
      if (qcDecision === 'REPLACE') {
        textMessage = `Replacement dispatched. Outward Slip ${data.resolutionRef || ''} generated.`
      } else if (qcDecision === 'REFUND') {
        textMessage = `Credit Note ${data.resolutionRef || ''} generated for customer refund balance.`
      } else if (qcDecision === 'REJECT') {
        titleMessage = 'Return Rejected'
        textMessage = 'Return request has been marked as Rejected.'
      }

      Swal.fire({
        icon: qcDecision === 'REJECT' ? 'info' : 'success',
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
        text: err.message || 'Failed to record QC inspection decision.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSubmittingQc(false)
    }
  }

  // Handle Manual Modal Return Form Submission
  const handleCreateNewReturnSubmit = async e => {
    e.preventDefault()
    if (!newForm.customer_name.trim() || !newForm.item_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields Missing',
        text: 'Customer Name and Item Name are mandatory.',
        confirmButtonColor: '#043486'
      })
      return
    }

    try {
      const payload = {
        return_date: new Date().toISOString().split('T')[0],
        bill_number: newForm.bill_number.trim() || 'MANUAL-ENTRY',
        customer_name: newForm.customer_name.trim(),
        customer_phone: newForm.customer_phone.trim() || null,
        item_name: newForm.item_name.trim(),
        material_id: newForm.material_id || null,
        quantity: Number(newForm.quantity) || 1,
        unit: newForm.unit || 'Nos',
        reason: newForm.reason === 'Other' ? newForm.custom_reason : newForm.reason,
        custom_reason: newForm.custom_reason || ''
      }

      const res = await fetch(API_ENDPOINTS.RETURNS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to create return record.')
      }

      await fetchAllData()
      setNewReturnModalOpen(false)

      Swal.fire({
        icon: 'success',
        title: 'Return Request Created',
        text: 'New return request has been queued for Quality Check (QC).',
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
    } catch (err) {
      console.error('Error creating manual return:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to create return request.',
        confirmButtonColor: '#043486'
      })
    }
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
      'Contact Phone': item.customer_phone || '-',
      'Product / Item': item.item_name,
      'Returned Serial': item.serial_number || '-',
      'Return Qty': `${item.quantity} ${item.unit || 'Nos'}`,
      'Return Reason': item.reason,
      'QC Condition': item.qc_condition || (item.qc_status === 'Pending QC' ? 'Pending' : 'PASS'),
      'QC Status': item.qc_status,
      'QC Outcome': item.qc_decision || 'Pending',
      'Replacement Serial': item.replacement_serial || '-',
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
            {canDownload && (
              <Button
                variant="secondary"
                icon={Download}
                onClick={handleExportExcel}
                title={selectedIds.length > 0 ? `Export ${selectedIds.length} Selected Record(s)` : 'Export All Filtered Records'}
              >
                {selectedIds.length > 0 ? `EXPORT SELECTED (${selectedIds.length})` : 'EXPORT TO EXCEL'}
              </Button>
            )}

            {/* Blue New Return Request Button */}
            {canAdd && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setActiveTab('entry')
                  handleClearSelectedBill()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                NEW RETURN REQUEST
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Top Summary KPI Metrics Cards (4 Dedicated Category Cards) */}
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
          label="Completed & Resolved"
          value={summaryMetrics.completed}
          icon={CheckCircle2}
          variant="emerald"
        />
        <ListKpiCard
          label="Defective / QC Failed"
          value={summaryMetrics.defective}
          icon={AlertTriangle}
          variant="rose"
        />
      </div>

      {/* 3. Tab Navigation Bar (Modular Tabs: Entry, Pending QC, Completed, Defective, Credit Notes) */}
      <TabNav>
        {/* 1. Return Entry Tab */}
        {canAdd && (
          <TabButton
            active={activeTab === 'entry'}
            icon={PackagePlus}
            label="Return Entry"
            onClick={() => {
              setActiveTab('entry')
              setCurrentPage(1)
              setSelectedIds([])
            }}
          />
        )}

        {/* 2. Pending QC Inspection */}
        <TabButton
          active={activeTab === 'pending'}
          icon={Clock}
          label={`Pending QC (${summaryMetrics.pending})`}
          onClick={() => {
            setActiveTab('pending')
            setCurrentPage(1)
            setSelectedIds([])
          }}
        />

        {/* 3. Completed & Resolved Returns */}
        <TabButton
          active={activeTab === 'completed'}
          icon={CheckCircle2}
          label={`Completed & Resolved (${summaryMetrics.completed})`}
          onClick={() => {
            setActiveTab('completed')
            setCurrentPage(1)
            setSelectedIds([])
          }}
        />

        {/* 4. Defective & QC Failed Products */}
        <TabButton
          active={activeTab === 'defective'}
          icon={AlertTriangle}
          label={`Defective & QC Failed (${summaryMetrics.defective})`}
          onClick={() => {
            setActiveTab('defective')
            setCurrentPage(1)
            setSelectedIds([])
          }}
        />

        {/* 5. Credit Notes Tab */}
        <TabButton
          active={activeTab === 'credit_notes'}
          icon={CreditCard}
          label={`Credit Notes (${summaryMetrics.creditNotes})`}
          onClick={() => {
            setActiveTab('credit_notes')
            setCurrentPage(1)
            setSelectedIds([])
          }}
        />
      </TabNav>

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
                                  {item.receipt_number}
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
                            const mat = materials.find(m => (it.material_id && m.id === it.material_id) || m.name === (it.product_name || it.item_name))
                            const baseReturnable = 
                              it.is_returnable === 1 || it.is_returnable === true || it.is_returnable === '1' ||
                              it.return_policy === true || it.return_policy === 1 || it.return_policy === '1' || it.return_policy === 'true' ||
                              (mat && (mat.is_returnable === 1 || mat.is_returnable === true || mat.is_returnable === '1')) ||
                              (it.is_returnable === undefined && it.return_policy === undefined)
                            const remainingQty = getItemRemainingReturnableQty(it, selectedBill?.id, selectedBill?.invoice_number)
                            const isFullyReturned = remainingQty <= 0
                            const isReturnable = baseReturnable && !isFullyReturned
                            const isChecked = Boolean(selectedReturnItems[itemKey])
                            const selectedState = selectedReturnItems[itemKey] || {}
                            const serials = parseItemSerials(it)
                            const hasMultipleSerials = serials.length > 1

                            return (
                              <tr
                                key={itemKey}
                                className={`transition-colors ${
                                  !baseReturnable
                                    ? 'bg-gray-50/80 dark:bg-slate-950/40 opacity-70'
                                    : isFullyReturned
                                    ? 'bg-amber-50/40 dark:bg-amber-950/20 opacity-80'
                                    : isChecked
                                    ? 'bg-blue-50/80 dark:bg-blue-950/40'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                }`}
                              >
                                {/* Checkbox (Enabled ONLY if return_policy is enabled and items remain) */}
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
                                          const isSnAlreadyReturned = isSerialAlreadyInReturn(sn, it.material_id, selectedBill?.id, selectedBill?.invoice_number)
                                          const isSnChecked = selectedState.selected_serials?.includes(sn) || false
                                          return (
                                            <label
                                              key={sIdx}
                                              className={`inline-flex items-center gap-1.5 px-2 py-1 border text-[11px] font-mono transition-all ${
                                                !baseReturnable || isSnAlreadyReturned
                                                  ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400'
                                                  : isSnChecked
                                                  ? 'bg-blue-100/80 dark:bg-blue-900/50 border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-300 font-bold cursor-pointer'
                                                  : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400 cursor-pointer'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSnChecked}
                                                disabled={!baseReturnable || isSnAlreadyReturned}
                                                onChange={() => handleToggleItemSerial(it, sn)}
                                                className="w-3.5 h-3.5 accent-[#043486] rounded-none cursor-pointer"
                                              />
                                              <span>{sn}</span>
                                              {isSnAlreadyReturned && (
                                                <span className="text-[9px] font-sans font-bold px-1 bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-300 rounded-none ml-0.5">
                                                  In QC / Returned
                                                </span>
                                              )}
                                            </label>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ) : (serials.length === 1 || it.serial_number) ? (
                                    (() => {
                                      const singleSn = serials[0] || it.serial_number
                                      const isSingleAlreadyReturned = isSerialAlreadyInReturn(singleSn, it.material_id, selectedBill?.id, selectedBill?.invoice_number)
                                      return (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                                            SN: {singleSn}
                                          </span>
                                          {isSingleAlreadyReturned && (
                                            <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-300 rounded-none">
                                              In QC / Returned
                                            </span>
                                          )}
                                        </div>
                                      )
                                    })()
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
                                  {isFullyReturned ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                                      <CheckCircle2 size={11} /> Returned / In QC
                                    </span>
                                  ) : isReturnable ? (
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
                                    <span className="inline-block px-2.5 py-1 font-bold font-mono text-xs bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 min-w-8">
                                      {hasMultipleSerials ? (selectedState.selected_serials?.length || 1) : (selectedState.return_qty !== undefined ? selectedState.return_qty : remainingQty)}
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
            <div className="w-full md:w-80">
              <SearchInput
                placeholder={
                  activeTab === 'defective'
                    ? 'Search Defective #, Serial, Customer, Issue...'
                    : activeTab === 'completed'
                    ? 'Search Completed Return #, Bill, Customer...'
                    : 'Search Return #, Customer, Bill #, Item...'
                }
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                onClear={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
              />
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

              {activeTab !== 'pending' && (
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
                    <option value="REJECT">Rejected</option>
                  </select>
                </div>
              )}

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
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={handleToggleSelectAll}
                      disabled={loading || paginatedReturns.length === 0}
                      className="w-4 h-4 text-[#043486] rounded-none border-gray-300 dark:border-slate-600 focus:ring-0 cursor-pointer accent-[#043486]"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">S.NO</th>
                  <th className="py-3 px-4">Return ID &amp; Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Bill ID</th>
                  {activeTab === 'defective' && (
                    <>
                      <th className="py-3 px-4">Defective Item</th>
                      <th className="py-3 px-4">QC Inspection Findings / Remarks</th>
                      <th className="py-3 px-4 text-center">Resolution</th>
                    </>
                  )}
                  {activeTab === 'completed' && (
                    <>
                      <th className="py-3 px-4">Product &amp; QTY</th>
                      <th className="py-3 px-4">Returned Serial</th>
                      <th className="py-3 px-4 text-center">Resolution</th>
                    </>
                  )}
                  {activeTab === 'credit_notes' && (
                    <>
                      <th className="py-3 px-4">Credit Note ID</th>
                      <th className="py-3 px-4">Returned Product &amp; QTY</th>
                      <th className="py-3 px-4">Serial Number</th>
                      <th className="py-3 px-4 text-right">Refund Amount (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'pending' && (
                    <>
                      <th className="py-3 px-4">Product &amp; QTY</th>
                      <th className="py-3 px-4">Return Reason</th>
                      <th className="py-3 px-4 text-center">QC Status</th>
                    </>
                  )}
                  {(activeTab === 'pending' || activeTab === 'credit_notes') && (
                    <th className="py-3 px-4 text-center">Actions</th>
                  )}
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
                        {activeTab === 'defective' ? (
                          <>
                            <CheckCircle2 size={28} className="text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              No defective or QC failed products found in registry.
                            </span>
                          </>
                        ) : (
                          <>
                            <RotateCcw size={28} className="text-gray-300 dark:text-slate-600" />
                            <span className="text-xs font-semibold">
                              No return records found matching current criteria.
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedReturns.map((item, idx) => {
                    const rowNumber = startIndex + idx + 1
                    const isSelected = selectedIds.includes(item.id)

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-2 border-[#043486] dark:border-blue-500'
                            : activeTab === 'defective'
                            ? 'hover:bg-rose-50/30 dark:hover:bg-rose-950/20'
                            : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/40'
                        }`}
                      >
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
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[#043486] dark:text-blue-400">
                            {item.return_number}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400">
                            {item.return_date
                              ? new Date(item.return_date).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800 dark:text-slate-200">
                            {item.customer_name}
                          </div>
                          <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                            {item.customer_phone || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenInvoicePreview(item.bill_number || item.invoice_number)}
                            className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-[#043486] dark:text-blue-400 hover:underline transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Click to view Original Invoice Bill"
                          >
                            <span>{item.bill_number}</span>
                            <ArrowUpRight size={11} className="opacity-70" />
                          </button>
                        </td>
                        {activeTab === 'defective' && (
                          <>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                <AlertTriangle size={13} className="shrink-0 text-rose-600" />
                                <span>{item.item_name}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono font-bold mt-0.5">
                                Qty: {item.quantity} {item.unit || 'Nos'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                                {item.qc_notes || item.reason || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {item.qc_decision === 'REPLACE' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                  <RotateCcw size={10} /> Replaced
                                </span>
                              ) : item.qc_decision === 'REFUND' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                  <CreditCard size={10} /> Credit Note
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <XCircle size={10} /> Rejected
                                </span>
                              )}
                            </td>
                          </>
                        )}
                        {activeTab === 'completed' && (
                          <>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-800 dark:text-slate-200">
                                {item.item_name}
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono font-bold mt-0.5">
                                Qty: {item.quantity} {item.unit || 'Nos'}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                              {item.serial_number ? (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                                  {item.serial_number}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {item.qc_decision === 'REFUND' || item.qc_decision === 'Credit Note' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                  <CreditCard size={10} /> Credit Note
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                  <RotateCcw size={10} /> Replaced
                                </span>
                              )}
                            </td>
                          </>
                        )}
                        {activeTab === 'credit_notes' && (
                          <>
                            <td className="py-3 px-4 whitespace-nowrap font-mono">
                              <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold">
                                {item.resolution_ref || 'CN-PENDING'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-800 dark:text-slate-200">
                                {item.item_name}
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono font-bold mt-0.5">
                                Qty: {item.quantity} {item.unit || 'Nos'}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                              {item.serial_number ? (
                                <span className="font-semibold text-gray-800 dark:text-slate-200">
                                  {item.serial_number}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-mono">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                              ₹{parseFloat(item.refund_amount || item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                <CreditCard size={10} /> Credit Note Issued
                              </span>
                            </td>
                          </>
                        )}
                        {activeTab === 'pending' && (
                          <>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-800 dark:text-slate-200">
                                {item.item_name}
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono font-bold mt-0.5">
                                Qty: {item.quantity} {item.unit || 'Nos'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-700 dark:text-slate-300 font-medium">
                                {item.reason}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                                <Clock size={11} /> Pending QC
                              </span>
                            </td>
                          </>
                        )}
                        {(activeTab === 'pending' || activeTab === 'credit_notes') && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {activeTab === 'pending' && (
                                <>
                                  {canEdit && (
                                    <button
                                      onClick={() => handleOpenQcModal(item)}
                                      className="p-1.5 text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-none transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center"
                                      title="Perform Quality Inspection (QC)"
                                    >
                                      <HelpCircle size={16} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedReturnView(item)
                                      setViewModalOpen(true)
                                    }}
                                    className="p-1.5 text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-none transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                                    title="View Return Voucher Slip"
                                  >
                                    <FileText size={15} />
                                  </button>
                                </>
                              )}
                              {activeTab === 'credit_notes' && (
                                <button
                                  onClick={() => {
                                    setSelectedReturnView(item)
                                    setViewModalOpen(true)
                                  }}
                                  className="p-1.5 text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-none transition-all cursor-pointer shadow-2xs"
                                  title="View Return Voucher / Credit Note Slip"
                                >
                                  <FileText size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
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
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wider">
                QC Quality Inspection &amp; Decision
              </h3>
              <button
                onClick={() => setQcModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Return Request Clean Vertical Summary */}
            <div className="my-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                <span className="text-gray-500 dark:text-slate-400">Return ID:</span>
                <span className="font-mono font-bold text-[#043486] dark:text-blue-400">{selectedReturnForQc.return_number}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                <span className="text-gray-500 dark:text-slate-400">Invoice Number:</span>
                <button
                  type="button"
                  onClick={() => handleOpenInvoicePreview(selectedReturnForQc.bill_number || selectedReturnForQc.invoice_number || selectedReturnForQc.original_invoice_number)}
                  className="font-mono font-bold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                  title="Click to view full original invoice bill"
                >
                  <span>{selectedReturnForQc.bill_number || selectedReturnForQc.invoice_number || selectedReturnForQc.original_invoice_number || '—'}</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                <span className="text-gray-500 dark:text-slate-400">Product Name:</span>
                <span className="font-bold text-gray-800 dark:text-slate-200">{selectedReturnForQc.item_name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                <span className="text-gray-500 dark:text-slate-400">QTY:</span>
                <span className="font-bold text-gray-800 dark:text-slate-200">{selectedReturnForQc.quantity} {selectedReturnForQc.unit || 'Nos'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                <span className="text-gray-500 dark:text-slate-400">Serial No:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedReturnForQc.serial_number || '—'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                <span className="text-gray-500 dark:text-slate-400">Product Rate / Price (NON GST):</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{parseFloat(selectedReturnForQc.unit_price || selectedReturnForQc.rate || (selectedReturnForQc.total_amount ? (selectedReturnForQc.total_amount / (selectedReturnForQc.quantity || 1)) : 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-slate-400">Reported Issue:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{selectedReturnForQc.reason}</span>
              </div>
            </div>

            <form onSubmit={handleSaveQcDecision} className="space-y-4">
              {/* Step A: QC Inspection Result (PASS / FAIL) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  1. QC Inspection Result:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label
                    className={`p-2.5 border text-center cursor-pointer transition-all flex items-center justify-center gap-2 font-bold text-xs ${
                      qcCondition === 'PASS'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qcConditionRadio"
                      value="PASS"
                      checked={qcCondition === 'PASS'}
                      onChange={() => setQcCondition('PASS')}
                      className="sr-only"
                    />
                    <CheckCircle2 size={16} className={qcCondition === 'PASS' ? 'text-emerald-600' : 'text-gray-400'} />
                    <span>QC PASS (Good / Sealed)</span>
                  </label>

                  <label
                    className={`p-2.5 border text-center cursor-pointer transition-all flex items-center justify-center gap-2 font-bold text-xs ${
                      qcCondition === 'FAIL'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qcConditionRadio"
                      value="FAIL"
                      checked={qcCondition === 'FAIL'}
                      onChange={() => setQcCondition('FAIL')}
                      className="sr-only"
                    />
                    <AlertTriangle size={16} className={qcCondition === 'FAIL' ? 'text-rose-600' : 'text-gray-400'} />
                    <span>QC FAIL (Defective / Faulty)</span>
                  </label>
                </div>
              </div>

              {/* Step B: Customer Resolution Action (REPLACE | REFUND | REJECT) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  2. Customer Resolution Action:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Option 1: REPLACE */}
                  <label
                    className={`p-2.5 border text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 font-bold text-xs uppercase ${
                      qcDecision === 'REPLACE'
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                    }`}
                  >
                    <RotateCcw size={14} className={qcDecision === 'REPLACE' ? 'text-blue-600' : 'text-gray-400'} />
                    <span>Replace</span>
                    <input
                      type="radio"
                      name="qcDecisionRadio"
                      value="REPLACE"
                      checked={qcDecision === 'REPLACE'}
                      onChange={() => setQcDecision('REPLACE')}
                      className="sr-only"
                    />
                  </label>

                  {/* Option 2: REFUND */}
                  <label
                    className={`p-2.5 border text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 font-bold text-xs uppercase ${
                      qcDecision === 'REFUND'
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard size={14} className={qcDecision === 'REFUND' ? 'text-purple-600' : 'text-gray-400'} />
                    <span>Refund</span>
                    <input
                      type="radio"
                      name="qcDecisionRadio"
                      value="REFUND"
                      checked={qcDecision === 'REFUND'}
                      onChange={() => setQcDecision('REFUND')}
                      className="sr-only"
                    />
                  </label>

                  {/* Option 3: REJECT */}
                  <label
                    className={`p-2.5 border text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 font-bold text-xs uppercase ${
                      qcDecision === 'REJECT'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                    }`}
                  >
                    <XCircle size={14} className={qcDecision === 'REJECT' ? 'text-rose-600' : 'text-gray-400'} />
                    <span>Reject</span>
                    <input
                      type="radio"
                      name="qcDecisionRadio"
                      value="REJECT"
                      checked={qcDecision === 'REJECT'}
                      onChange={() => setQcDecision('REJECT')}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Conditional: Searchable Replacement Serial Number Dropdown */}
              {qcDecision === 'REPLACE' && (
                <div className="space-y-1.5 pt-1 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Select In-Stock Serial for Replacement:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {isLoadingSerials && <Loader2 size={12} className="animate-spin text-blue-600" />}
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-800">
                        {availableSerialsList.length} In-Stock Available
                      </span>
                    </div>
                  </div>

                  {/* Searchable Input + Dropdown Box */}
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search size={14} className="absolute left-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder={availableSerialsList.length > 0 ? "Type to search or select in-stock serial..." : "Enter replacement serial number..."}
                        value={replacementSerial}
                        onFocus={() => {
                          setSerialDropdownOpen(true)
                          setSerialSearchTerm(replacementSerial || '')
                        }}
                        onChange={e => {
                          setReplacementSerial(e.target.value)
                          setSerialSearchTerm(e.target.value)
                          setSerialDropdownOpen(true)
                        }}
                        className="w-full pl-8 pr-16 py-2 text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none font-mono focus:outline-none focus:border-[#043486]"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        {replacementSerial && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplacementSerial('')
                              setSerialSearchTerm('')
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                            title="Clear selection"
                          >
                            <X size={13} />
                          </button>
                        )}
                        {availableSerialsList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSerialDropdownOpen(prev => !prev)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                            title="Toggle suggestions"
                          >
                            <ChevronDown size={14} className={`transition-transform duration-150 ${serialDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Autocomplete Suggestions Popup */}
                    {serialDropdownOpen && availableSerialsList.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl divide-y divide-gray-100 dark:divide-slate-800 text-xs mt-1">
                        {filteredAvailableSerials.length === 0 ? (
                          <div className="p-3 text-gray-400 text-center italic text-xs">
                            No matching available serials found for "{serialSearchTerm}".
                          </div>
                        ) : (
                          filteredAvailableSerials.map(s => {
                            const isSelected = replacementSerial === s.serial_number
                            return (
                              <button
                                key={s.id || s.serial_number}
                                type="button"
                                onClick={() => {
                                  setReplacementSerial(s.serial_number)
                                  setSerialSearchTerm(s.serial_number)
                                  setSerialDropdownOpen(false)
                                }}
                                className={`w-full text-left p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 font-bold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 font-mono">
                                  <span>{s.serial_number}</span>
                                  {isSelected && <CheckCircle2 size={13} className="text-[#043486] dark:text-blue-400" />}
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-800">
                                  In-Stock Available
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Conditional: Refund / Credit Note Calculator */}
              {qcDecision === 'REFUND' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Refund Amount (₹):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter refund amount"
                      value={qcRefundAmount}
                      onChange={e => setQcRefundAmount(e.target.value)}
                      required={qcDecision === 'REFUND'}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none font-mono font-bold focus:outline-none focus:border-[#043486]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Refund Mode:
                    </label>
                    <select
                      value={refundMode}
                      onChange={e => setRefundMode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-none focus:outline-none focus:border-[#043486] font-medium"
                    >
                      <option value="Credit Note">GST Credit Note</option>
                      <option value="Cash">Cash Refund</option>
                      <option value="UPI">UPI Refund</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              )}

              {/* QC Inspector Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  QC Inspection Findings / Remarks:
                </label>
                <textarea
                  rows={2}
                  value={qcNotes}
                  onChange={e => setQcNotes(e.target.value)}
                  placeholder="Enter observation notes, serial verification..."
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
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {selectedReturnView.return_date
                    ? new Date(selectedReturnView.return_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {selectedReturnView.customer_name} {selectedReturnView.customer_phone ? `(${selectedReturnView.customer_phone})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Original Invoice #:</span>
                <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">{selectedReturnView.bill_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">Product Returned:</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {selectedReturnView.item_name} (Qty: {parseFloat(selectedReturnView.quantity || 1).toFixed(2)} {selectedReturnView.unit || 'Nos'})
                </span>
              </div>
              {selectedReturnView.serial_number && (
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-gray-500">Returned Serial #:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedReturnView.serial_number}</span>
                </div>
              )}
              {selectedReturnView.replacement_serial && (
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-gray-500">Replacement Serial #:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedReturnView.replacement_serial}</span>
                </div>
              )}
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
                  <span className="font-mono font-bold text-purple-600">₹{parseFloat(selectedReturnView.refund_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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

            <div className={`pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center ${selectedReturnView.qc_status === 'Pending QC' ? 'justify-end' : 'justify-between'}`}>
              {selectedReturnView.qc_status !== 'Pending QC' && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-none cursor-pointer flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print Slip</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none cursor-pointer"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Direct Printable Return Voucher Portal for instant window.print() */}
      {selectedReturnView && typeof document !== 'undefined' && createPortal(
        <div id="return-slip-print-wrapper">
          <ReturnVoucherTemplate returnItem={selectedReturnView} settings={settings} />
        </div>,
        document.body
      )}

      {/* 10. Original Invoice Bill Preview & Print Modal */}
      {previewInvoiceBill && (
        <InvoiceModal
          isOpen={Boolean(previewInvoiceBill)}
          onClose={() => setPreviewInvoiceBill(null)}
          bill={previewInvoiceBill}
          settings={settings}
        />
      )}

    </div>
  )
}
