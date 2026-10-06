import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Receipt,
  Plus,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  User,
  Phone,
  MapPin,
  FileText,
  Boxes,
  Hash,
  IndianRupee,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileDigit,
  ChevronDown,
  ArrowLeft,
  List
} from '../components/common/icons'
import Swal from 'sweetalert2'
import SearchableSelect from '../components/common/SearchableSelect'
import InvoiceTemplate from '../components/invoice/InvoiceTemplate'
import SkeletonLoader from '../components/common/SkeletonLoader'
import { Button, Checkbox } from '../components/ui'
import { BillSummaryCard, OutwardLineItems } from '../components/billing'
import { API_ENDPOINTS } from '../config/api'
import { numberToIndianRupees } from '../utils/numberToWords'

const INDIAN_STATES = [
  '01 - Jammu & Kashmir',
  '02 - Himachal Pradesh',
  '03 - Punjab',
  '04 - Chandigarh',
  '05 - Uttarakhand',
  '06 - Haryana',
  '07 - Delhi',
  '08 - Rajasthan',
  '09 - Uttar Pradesh',
  '10 - Bihar',
  '11 - Sikkim',
  '12 - Arunachal Pradesh',
  '13 - Nagaland',
  '14 - Manipur',
  '15 - Mizoram',
  '16 - Tripura',
  '17 - Meghalaya',
  '18 - Assam',
  '19 - West Bengal',
  '20 - Jharkhand',
  '21 - Odisha',
  '22 - Chhattisgarh',
  '23 - Madhya Pradesh',
  '24 - Gujarat',
  '26 - Dadra and Nagar Haveli and Daman & Diu',
  '27 - Maharashtra',
  '29 - Karnataka',
  '30 - Goa',
  '31 - Lakshadweep',
  '32 - Kerala',
  '33 - Tamil Nadu',
  '34 - Puducherry',
  '35 - Andaman and Nicobar Islands',
  '36 - Telangana',
  '37 - Andhra Pradesh',
  '38 - Ladakh'
]

export default function CreateBillPage({ setActiveRoute }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editId = searchParams.get('editId')
  const isEditMode = Boolean(editId)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Invoice Preview Modal State
  const [previewBill, setPreviewBill] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Settings, Categories & Materials
  const [settings, setSettings] = useState(null)
  const [categories, setCategories] = useState([])
  const [materials, setMaterials] = useState([])

  // Bill Meta
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-01')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [hasDueDate, setHasDueDate] = useState(true)
  const [dueDate, setDueDate] = useState('')
  const [invoiceType, setInvoiceType] = useState('GST')
  const [copyType, setCopyType] = useState('ORIGINAL')
  const [placeOfSupply, setPlaceOfSupply] = useState('33 - Tamil Nadu')

  // Customer Information
  const [customerType, setCustomerType] = useState('Individual') // 'Individual' | 'Company'
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [sameAsDelivery, setSameAsDelivery] = useState(true)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [customerGstin, setCustomerGstin] = useState('')

  // Payment & Remarks
  const [paymentMode, setPaymentMode] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('Pending')
  const [notes, setNotes] = useState('')

  // Items State (Array of line items with multi serial number support)
  const [items, setItems] = useState([
    {
      material_id: '',
      item_name: '',
      category_name: '',
      category_id: '',
      serial_number: '',
      serial_numbers: [''],
      hsn_code: '',
      quantity: 1,
      unit: 'NOS',
      current_stock: null,
      rate: 0,
      original_rate: 0,
      has_discount: false,
      discount_percent: 0,
      discount_amount: 0,
      tax_inclusive: true,
      tax_rate: 18.00,
      tax_amount: 0,
      amount: 0,
      has_serial: false,
      return_policy: false
    }
  ])

  // Verified Serials Cache from DB: { [serial.toLowerCase()]: { found: true/false, status: 'Available'/'Sold', message: '...' } }
  const [verifiedSerials, setVerifiedSerials] = useState({})

  // Available Serials from Inventory Vault: { [materialId]: ['SN1', 'SN2'] }
  const [availableSerialsMap, setAvailableSerialsMap] = useState({})
  const [activeSerialSuggest, setActiveSerialSuggest] = useState(null) // { itemIndex, serialIndex }

  // Fetch available registered serials for a material
  const fetchAvailableSerialsForMaterial = async (materialId) => {
    if (!materialId || availableSerialsMap[materialId]) return
    try {
      const res = await fetch(API_ENDPOINTS.INVENTORY_MATERIAL_SERIALS(materialId, 'Available'))
      const data = await res.json()
      if (data.success && data.serials) {
        const sList = data.serials.map(s => s.serial_number)
        setAvailableSerialsMap(prev => ({
          ...prev,
          [materialId]: sList
        }))
      }
    } catch (err) {
      console.error('Failed to fetch available serials for material:', err)
    }
  }

  // Find Duplicate Serial Numbers across all invoice line items
  const duplicateSerials = useMemo(() => {
    const counts = {}
    items.forEach(item => {
      const serials = item.serial_numbers && item.serial_numbers.length > 0
        ? item.serial_numbers
        : (item.serial_number ? [item.serial_number] : [])
      
      serials.forEach(s => {
        const trimmed = (s || '').trim().toLowerCase()
        if (trimmed) {
          counts[trimmed] = (counts[trimmed] || 0) + 1
        }
      })
    })
    const duplicates = new Set()
    Object.entries(counts).forEach(([val, count]) => {
      if (count > 1) {
        duplicates.add(val)
      }
    })
    return duplicates
  }, [items])

  // Verify serial number against Database
  const verifySerialWithDb = async (serialVal) => {
    const trimmed = (serialVal || '').trim()
    if (!trimmed || verifiedSerials[trimmed.toLowerCase()] !== undefined) return

    try {
      const res = await fetch(API_ENDPOINTS.VERIFY_SERIAL(trimmed))
      const data = await res.json()
      setVerifiedSerials(prev => ({
        ...prev,
        [trimmed.toLowerCase()]: {
          found: Boolean(data.found),
          status: data.status,
          message: data.message || (data.found ? 'Verified in stock' : 'Not found in DB')
        }
      }))
    } catch (e) {
      console.error('Error verifying serial number with DB:', e)
    }
  }

  // Fetch Next Number / Bill Details, Settings & Materials on load
  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      // 1. Fetch Settings
      let loadedSettings = null
      const settingsRes = await fetch(API_ENDPOINTS.SETTINGS)
      const settingsData = await settingsRes.json()
      if (settingsData.success && settingsData.settings) {
        loadedSettings = settingsData.settings
        setSettings(loadedSettings)
        try {
          localStorage.setItem('simcha_settings', JSON.stringify(loadedSettings))
        } catch {}
      }

      // 2. Fetch Categories
      const catRes = await fetch(API_ENDPOINTS.CATEGORIES)
      const catData = await catRes.json()
      if (catData.success && catData.categories) {
        setCategories(catData.categories.filter(c => c.status === 'Active'))
      }

      // 3. Fetch Materials
      let loadedMaterials = []
      const matRes = await fetch(API_ENDPOINTS.MATERIALS)
      const matData = await matRes.json()
      if (matData.success && matData.materials) {
        loadedMaterials = matData.materials.filter(m => m.status === 'Active')
        setMaterials(loadedMaterials)
      }

      // 4. If Edit Mode, Fetch Existing Bill
      if (editId) {
        const billRes = await fetch(API_ENDPOINTS.BILL_BY_ID(editId))
        const billData = await billRes.json()
        if (billData.success && billData.bill) {
          const b = billData.bill
          setInvoiceNumber(b.invoice_number || '')
          setInvoiceDate(b.invoice_date ? b.invoice_date.split('T')[0] : new Date().toISOString().split('T')[0])
          setHasDueDate(Boolean(b.has_due_date !== undefined ? b.has_due_date : b.due_date))
          setDueDate(b.due_date ? b.due_date.split('T')[0] : '')
          setInvoiceType(b.invoice_type || 'GST')
          setCopyType(b.copy_type || 'ORIGINAL')
          setPlaceOfSupply(b.place_of_supply || '33 - Tamil Nadu')
          setCustomerType(b.customer_type || 'Individual')
          setCustomerName(b.customer_name || '')
          setCustomerPhone(b.customer_phone || '')
          setCustomerEmail(b.customer_email || '')
          setCustomerAddress(b.customer_address || '')
          const isSame = b.same_as_billing !== undefined ? Boolean(b.same_as_billing) : (!b.delivery_address || b.delivery_address === b.customer_address)
          setSameAsDelivery(isSame)
          setDeliveryAddress(b.delivery_address || '')
          setCustomerGstin(b.customer_gstin || '')
          setPaymentMode(b.payment_mode || '')
          setPaymentStatus(b.payment_status || 'Pending')
          setNotes(b.notes || '')

          if (Array.isArray(b.items) && b.items.length > 0) {
            setItems(b.items.map(it => {
              const serials = it.serial_numbers && it.serial_numbers.length > 0
                ? it.serial_numbers
                : (it.serial_number ? it.serial_number.split(',').map(s => s.trim()) : [''])

              const foundMat = loadedMaterials.find(m => String(m.id) === String(it.material_id))
              const dbStock = foundMat 
                ? parseFloat(foundMat.current_stock ?? foundMat.opening_stock ?? 0) 
                : (it.current_stock !== undefined && it.current_stock !== null ? parseFloat(it.current_stock) : null)
              
              const itemQty = parseFloat(it.quantity) || 1
              // For an existing line item in edit mode, it already reserved itemQty in this bill.
              // So available stock for editing this bill = current warehouse stock + itemQty.
              const availableStock = dbStock !== null ? (dbStock + itemQty) : null

              return {
                material_id: it.material_id ? String(it.material_id) : '',
                item_name: it.item_name || it.name || '',
                category_name: it.category_name || (foundMat ? foundMat.category_name : '') || '',
                category_id: it.category_id ? String(it.category_id) : (foundMat ? String(foundMat.category_id) : ''),
                serial_number: it.serial_number || '',
                serial_numbers: serials,
                hsn_code: it.hsn_code || (foundMat ? foundMat.hsn_code : '') || '',
                quantity: itemQty,
                unit: it.unit || (foundMat ? foundMat.unit : 'NOS') || 'NOS',
                current_stock: availableStock,
                rate: parseFloat(it.rate) || 0,
                original_rate: parseFloat(it.original_rate || it.rate) || 0,
                has_discount: Boolean(it.has_discount || parseFloat(it.discount_percent || 0) > 0),
                discount_percent: parseFloat(it.discount_percent) || 0,
                discount_amount: parseFloat(it.discount_amount) || 0,
                tax_inclusive: it.tax_inclusive !== undefined ? Boolean(it.tax_inclusive) : true,
                tax_rate: parseFloat(it.tax_rate) || 0,
                tax_amount: parseFloat(it.tax_amount) || 0,
                amount: parseFloat(it.amount) || 0,
                has_serial: Boolean(it.has_serial || it.serial_tracking || (serials && serials.filter(Boolean).length > 0)),
                return_policy: Boolean(it.return_policy)
              }
            }))
          }
        } else {
          throw new Error(billData.message || 'Invoice not found')
        }
      } else {
        // 5. Fetch Next Invoice Number (New Bill)
        fetchNextInvoiceNumber()
      }

    } catch (err) {
      console.error('Error loading initial billing data:', err)
      Swal.fire({
        icon: 'error',
        title: 'Failed to load bill data',
        text: err.message || 'Could not fetch invoice details.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNextInvoiceNumber = async (selectedDate = null) => {
    if (isEditMode) return
    try {
      const url = selectedDate ? `${API_ENDPOINTS.NEXT_INVOICE_NUMBER}?date=${encodeURIComponent(selectedDate)}` : API_ENDPOINTS.NEXT_INVOICE_NUMBER
      const res = await fetch(url)
      const data = await res.json()
      if (data.success && data.nextInvoiceNumber) {
        setInvoiceNumber(data.nextInvoiceNumber)
      }
    } catch (err) {
      console.error('Error fetching next invoice number:', err)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Auto calculate due date whenever invoice date, settings, or hasDueDate changes
  useEffect(() => {
    if (invoiceDate && hasDueDate) {
      const days = settings?.due_date_days !== undefined ? parseInt(settings.due_date_days, 10) : 15
      const d = new Date(invoiceDate)
      d.setDate(d.getDate() + days)
      setDueDate(d.toISOString().split('T')[0])
    }
  }, [invoiceDate, settings, hasDueDate])

  // Check if Place of Supply is Intra-State (Tamil Nadu)
  const isIntraState = placeOfSupply.includes('33') || placeOfSupply.toLowerCase().includes('tamil nadu')

  // Calculate taxes whenever settings or items change
  const defaultCgst = settings ? parseFloat(settings.cgst_rate) || 9.00 : 9.00
  const defaultSgst = settings ? parseFloat(settings.sgst_rate) || 9.00 : 9.00
  const defaultIgst = settings ? parseFloat(settings.igst_rate) || 18.00 : 18.00
  const activeTaxRate = isIntraState ? (defaultCgst + defaultSgst) : defaultIgst

  // Helper to determine effective tax rate for a material item
  const calculateEffectiveTaxRate = (isTaxEligible, type, intra) => {
    if (type === 'NON_GST') return 0
    if (isTaxEligible === false || isTaxEligible === 0 || isTaxEligible === '0') return 0
    const cgst = settings ? parseFloat(settings.cgst_rate) || 9.00 : 9.00
    const sgst = settings ? parseFloat(settings.sgst_rate) || 9.00 : 9.00
    const igst = settings ? parseFloat(settings.igst_rate) || 18.00 : 18.00
    return intra ? (cgst + sgst) : igst
  }

  // Helper to calculate line item pricing and taxes based on tax_inclusive flag
  const calculateOutwardItem = (item, currentInvoiceType = invoiceType, isIntra = isIntraState) => {
    const qty = parseFloat(item.quantity) || 0
    const rawRate = parseFloat(item.original_rate ?? item.rate ?? 0)
    const hasDiscount = Boolean(item.has_discount)
    const discountPercent = hasDiscount ? (parseFloat(item.discount_percent) || 0) : 0
    const discountAmount = hasDiscount ? (rawRate * (discountPercent / 100)) : 0
    const effectiveSellingPrice = hasDiscount ? Math.max(0, rawRate - discountAmount) : rawRate

    const isTaxInclusive = item.tax_inclusive !== false && item.tax_inclusive !== 0 && item.tax_inclusive !== '0'
    const effTaxRate = calculateEffectiveTaxRate(true, currentInvoiceType, isIntra)

    let unitRate = 0
    let taxable = 0
    let taxAmt = 0
    let totalAmt = 0

    if (currentInvoiceType === 'GST' && effTaxRate > 0) {
      if (isTaxInclusive) {
        // Tax Inclusive: Selling price already includes GST (e.g. 18%) -> Split tax from selling price
        totalAmt = parseFloat((qty * effectiveSellingPrice).toFixed(2))
        unitRate = parseFloat((effectiveSellingPrice / (1 + effTaxRate / 100)).toFixed(2))
        taxable = parseFloat((qty * unitRate).toFixed(2))
        taxAmt = parseFloat((totalAmt - taxable).toFixed(2))
      } else {
        // Tax Exclusive: Selling price does NOT include GST -> Add 18% extra on top
        unitRate = parseFloat(effectiveSellingPrice.toFixed(2))
        taxable = parseFloat((qty * unitRate).toFixed(2))
        taxAmt = parseFloat((taxable * (effTaxRate / 100)).toFixed(2))
        totalAmt = parseFloat((taxable + taxAmt).toFixed(2))
      }
    } else {
      // Non-GST or 0% tax
      unitRate = parseFloat(effectiveSellingPrice.toFixed(2))
      taxable = parseFloat((qty * unitRate).toFixed(2))
      taxAmt = 0
      totalAmt = taxable
    }

    return {
      ...item,
      original_rate: rawRate,
      has_discount: hasDiscount,
      discount_percent: discountPercent,
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      rate: unitRate,
      tax_inclusive: isTaxInclusive,
      tax_rate: currentInvoiceType === 'GST' ? effTaxRate : 0,
      tax_amount: taxAmt,
      amount: totalAmt
    }
  }

  // Toggle between NON_GST and GST TAX INVOICE
  const handleToggleInvoiceType = (newType) => {
    setInvoiceType(newType)
    setItems(prevItems => prevItems.map(it => calculateOutwardItem(it, newType, isIntraState)))
  }

  // Handle Place of Supply Change (Supports full clear)
  const handlePlaceOfSupplyChange = (newPlace) => {
    const val = newPlace || ''
    setPlaceOfSupply(val)
    const newIsIntra = !val || val.includes('33') || val.toLowerCase().includes('tamil nadu')
    setItems(prevItems => prevItems.map(it => calculateOutwardItem(it, invoiceType, newIsIntra)))
  }

  // Add Keyboard Shortcut Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + S or Ctrl + Enter: Save
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's')) {
        e.preventDefault()
        handleSubmit(e)
      }
      // Alt + A or F2: Add Line Item
      else if ((e.altKey && (e.key === 'a' || e.key === 'A')) || e.key === 'F2') {
        e.preventDefault()
        handleAddItem()
      }
      // Alt + R: Reset
      else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        handleReset()
      }
      // F8: Cash
      else if (e.key === 'F8') {
        e.preventDefault()
        setPaymentMode('Cash')
      }
      // F9: UPI
      else if (e.key === 'F9') {
        e.preventDefault()
        setPaymentMode('UPI')
      }
      // F10: Credit
      else if (e.key === 'F10') {
        e.preventDefault()
        setPaymentMode('Credit')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, customerName, customerPhone, customerAddress, sameAsDelivery, deliveryAddress, customerGstin, placeOfSupply, invoiceNumber, invoiceDate, hasDueDate, dueDate, invoiceType, copyType, paymentMode, paymentStatus, notes, settings])

  // Handle Category Selection for an item row
  const handleCategorySelect = (index, categoryId) => {
    const selectedCat = categories.find(c => String(c.id) === String(categoryId))
    setItems(prevItems => {
      const updated = [...prevItems]
      const currentItem = updated[index]
      
      let newMaterialId = currentItem.material_id
      let newItemName = currentItem.item_name
      let newHsn = currentItem.hsn_code
      let newRate = currentItem.rate
      let newOriginalRate = currentItem.original_rate
      let newHasDiscount = currentItem.has_discount
      let newDiscountPercent = currentItem.discount_percent
      let newDiscountAmount = currentItem.discount_amount
      let newCurrentStock = currentItem.current_stock
      let newUnit = currentItem.unit
      let newTaxInclusive = currentItem.tax_inclusive
      let newTaxRate = currentItem.tax_rate
      let newTaxAmount = currentItem.tax_amount
      let newAmount = currentItem.amount
      let newHasSerial = currentItem.has_serial

      // If category changes and selected material doesn't belong to it, reset product selection
      if (categoryId && currentItem.material_id) {
        const mat = materials.find(m => String(m.id) === String(currentItem.material_id))
        if (mat && String(mat.category_id) !== String(categoryId)) {
          newMaterialId = ''
          newItemName = ''
          newHsn = ''
          newRate = 0
          newOriginalRate = 0
          newHasDiscount = false
          newDiscountPercent = 0
          newDiscountAmount = 0
          newCurrentStock = null
          newTaxAmount = 0
          newAmount = 0
          newHasSerial = false
        }
      }

      updated[index] = {
        ...currentItem,
        category_id: categoryId ? String(categoryId) : '',
        category_name: selectedCat ? selectedCat.name : '',
        material_id: newMaterialId,
        item_name: newItemName,
        hsn_code: newHsn,
        rate: newRate,
        original_rate: newOriginalRate,
        has_discount: newHasDiscount,
        discount_percent: newDiscountPercent,
        discount_amount: newDiscountAmount,
        current_stock: newCurrentStock,
        unit: newUnit,
        tax_inclusive: newTaxInclusive,
        tax_rate: newTaxRate,
        tax_amount: newTaxAmount,
        amount: newAmount,
        has_serial: newHasSerial
      }
      return updated
    })
  }

  // Handle Material Selection for an item row with duplicate detection, stock check and discount
  const handleMaterialSelect = (index, materialId) => {
    const selectedMat = materials.find(m => String(m.id) === String(materialId))
    
    if (selectedMat) {
      const curStock = parseFloat(selectedMat.current_stock ?? selectedMat.opening_stock ?? 0)
      if (curStock <= 0) {
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true
        }).fire({
          icon: 'error',
          title: `Out of Stock: "${selectedMat.name}" has 0 stock!`
        })
      }

      // Fetch available warehouse serials if serial tracking enabled
      if (selectedMat.serial_tracking || selectedMat.has_serial) {
        fetchAvailableSerialsForMaterial(selectedMat.id)
      }

      // Check if item already selected in another row
      const isDuplicate = items.some((it, i) => i !== index && String(it.material_id) === String(materialId))
      if (isDuplicate) {
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        }).fire({
          icon: 'info',
          title: `"${selectedMat.name}" is already in the bill.`
        })
      }
    }

    setItems(prevItems => {
      const updated = [...prevItems]
      if (selectedMat) {
        const curStock = parseFloat(selectedMat.current_stock ?? selectedMat.opening_stock ?? 0)
        const qty = Math.min(25, Math.max(1, parseFloat(updated[index].quantity) || 1))
        const hasSerial = Boolean(selectedMat.serial_tracking || selectedMat.has_serial)
        const qtyCount = Math.min(25, Math.max(1, Math.floor(qty)))

        let currentSerials = updated[index].serial_numbers || []
        if (hasSerial) {
          currentSerials = Array.from({ length: qtyCount }, (_, i) => currentSerials[i] || '')
        }

        const rawItem = {
          ...updated[index],
          material_id: selectedMat.id,
          item_name: selectedMat.name,
          current_stock: curStock,
          category_id: selectedMat.category_id ? String(selectedMat.category_id) : updated[index].category_id,
          category_name: selectedMat.category_name || updated[index].category_name || '',
          hsn_code: selectedMat.hsn_code || '',
          unit: selectedMat.unit || 'NOS',
          quantity: qty,
          original_rate: parseFloat(selectedMat.selling_price) || 0,
          has_discount: Boolean(selectedMat.has_discount),
          discount_percent: selectedMat.has_discount ? (parseFloat(selectedMat.discount_percent) || 0) : 0,
          tax_inclusive: selectedMat.tax_inclusive !== false && selectedMat.tax_inclusive !== 0 && selectedMat.tax_inclusive !== '0',
          has_serial: hasSerial,
          serial_numbers: currentSerials,
          serial_number: currentSerials.filter(Boolean).join(', '),
          return_policy: Boolean(selectedMat.return_policy)
        }

        updated[index] = calculateOutwardItem(rawItem, invoiceType, isIntraState)
      } else {
        updated[index] = {
          ...updated[index],
          material_id: '',
          item_name: '',
          current_stock: null,
          serial_number: '',
          serial_numbers: [''],
          hsn_code: '',
          rate: 0,
          original_rate: 0,
          has_discount: false,
          discount_percent: 0,
          discount_amount: 0,
          unit: 'NOS',
          tax_inclusive: true,
          tax_rate: invoiceType === 'GST' ? activeTaxRate : 0,
          tax_amount: 0,
          amount: 0,
          has_serial: false,
          return_policy: false
        }
      }
      return updated
    })
  }

  // Handle Input Changes on Item Row
  const handleItemChange = (index, field, value) => {
    setItems(prevItems => {
      const updated = [...prevItems]
      let finalVal = value

      if (field === 'quantity') {
        const num = parseFloat(value)
        if (isNaN(num) || num < 1) {
          finalVal = value === '' ? '' : 1
        } else if (num > 25) {
          finalVal = 25
        } else {
          finalVal = Math.floor(num)
        }
      }

      let current = { ...updated[index], [field]: finalVal }

      // Adjust serial numbers array length if quantity changes and has_serial is enabled
      if (field === 'quantity' && current.has_serial) {
        const qtyCount = Math.min(25, Math.max(1, Math.floor(parseFloat(finalVal) || 1)))
        const existingSerials = current.serial_numbers || []
        current.serial_numbers = Array.from({ length: qtyCount }, (_, i) => existingSerials[i] || '')
        current.serial_number = current.serial_numbers.filter(Boolean).join(', ')
      }

      updated[index] = calculateOutwardItem(current, invoiceType, isIntraState)
      return updated
    })
  }

  // Handle individual serial number change with duplicate toast warning
  const handleSerialNumberChange = (itemIndex, serialIndex, val) => {
    const trimmedVal = (val || '').trim().toLowerCase()

    // Live Duplicate Check across all line items and slots
    if (trimmedVal) {
      let isDuplicate = false
      items.forEach((it, iIdx) => {
        const itSerials = it.serial_numbers && it.serial_numbers.length > 0
          ? it.serial_numbers
          : (it.serial_number ? [it.serial_number] : [])
        
        itSerials.forEach((sn, sIdx) => {
          if (iIdx === itemIndex && sIdx === serialIndex) return
          if ((sn || '').trim().toLowerCase() === trimmedVal) {
            isDuplicate = true
          }
        })
      })

      if (isDuplicate) {
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true
        }).fire({
          icon: 'warning',
          title: 'Duplicate Serial Number!',
          text: `"${val.trim()}" is already entered in another slot in this invoice.`
        })
      }
    }

    setItems(prev => {
      const updated = [...prev]
      const serials = [...(updated[itemIndex].serial_numbers || [])]
      serials[serialIndex] = val
      updated[itemIndex].serial_numbers = serials
      updated[itemIndex].serial_number = serials.filter(Boolean).join(', ')
      return updated
    })

    if (val.trim()) {
      verifySerialWithDb(val.trim())
    }
  }

  // Add Item Row
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        material_id: '',
        item_name: '',
        category_name: '',
        category_id: '',
        serial_number: '',
        serial_numbers: [''],
        hsn_code: '',
        quantity: 1,
        unit: 'NOS',
        current_stock: null,
        rate: 0,
        original_rate: 0,
        has_discount: false,
        discount_percent: 0,
        discount_amount: 0,
        tax_inclusive: true,
        tax_rate: invoiceType === 'GST' ? activeTaxRate : 0,
        tax_amount: 0,
        amount: 0,
        has_serial: false,
        return_policy: false
      }
    ])
  }

  // Duplicate Item Row
  const handleDuplicateItem = (index) => {
    const itemToClone = items[index]
    const qtyCount = Math.min(25, Math.max(1, Math.floor(itemToClone.quantity || 1)))
    setItems(prev => [
      ...prev.slice(0, index + 1),
      {
        ...itemToClone,
        serial_number: '',
        serial_numbers: itemToClone.has_serial ? Array.from({ length: qtyCount }, () => '') : [''],
        return_policy: itemToClone.return_policy || false
      },
      ...prev.slice(index + 1)
    ])
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    }).fire({
      icon: 'success',
      title: 'Line item duplicated'
    })
  }

  // Remove Item Row
  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      Swal.fire({
        icon: 'warning',
        title: 'At least one item required',
        text: 'A bill must have at least one line item.',
        confirmButtonColor: '#043486'
      })
      return
    }
    const itemToRemove = items[index]
    const itemName = itemToRemove.item_name ? `"${itemToRemove.item_name}"` : `Item #${index + 1}`
    setItems(prev => prev.filter((_, i) => i !== index))
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    }).fire({
      icon: 'info',
      title: `${itemName} deleted`
    })
  }

  // Aggregate Bill Calculations
  const taxableAmount = items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)), 0)
  const totalTax = invoiceType === 'GST' ? items.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0) : 0
  const totalDiscountSavings = items.reduce((sum, item) => sum + ((parseFloat(item.discount_amount) || 0) * (parseFloat(item.quantity) || 1)), 0)
  const totalGrossOrigAmt = items.reduce((sum, item) => sum + (((parseFloat(item.original_rate) || parseFloat(item.rate) || 0)) * (parseFloat(item.quantity) || 1)), 0)

  const cgstAmount = (invoiceType === 'GST' && isIntraState) ? (totalTax / 2) : 0
  const sgstAmount = (invoiceType === 'GST' && isIntraState) ? (totalTax / 2) : 0
  const igstAmount = (invoiceType === 'GST' && !isIntraState) ? totalTax : 0

  const rawGrandTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const roundedGrandTotal = Math.round(rawGrandTotal)
  const roundOff = parseFloat((roundedGrandTotal - rawGrandTotal).toFixed(2))
  const amountInWords = numberToIndianRupees(roundedGrandTotal)

  // Reset form
  const handleReset = () => {
    setCustomerType('Individual')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setCustomerAddress('')
    setSameAsDelivery(true)
    setDeliveryAddress('')
    setCustomerGstin('')
    setPlaceOfSupply('33 - Tamil Nadu')
    setHasDueDate(true)
    const days = settings?.due_date_days !== undefined ? parseInt(settings.due_date_days, 10) : 15
    const d = new Date()
    d.setDate(d.getDate() + days)
    setDueDate(d.toISOString().split('T')[0])
    setNotes('')
    setPaymentMode('')
    setPaymentStatus('Pending')
    setItems([
      {
        material_id: '',
        item_name: '',
        category_name: '',
        category_id: '',
        serial_number: '',
        serial_numbers: [''],
        hsn_code: '',
        quantity: 1,
        unit: 'NOS',
        current_stock: null,
        rate: 0,
        original_rate: 0,
        has_discount: false,
        discount_percent: 0,
        discount_amount: 0,
        tax_inclusive: true,
        tax_rate: invoiceType === 'GST' ? activeTaxRate : 0,
        tax_amount: 0,
        amount: 0,
        has_serial: false,
        return_policy: false
      }
    ])
    fetchNextInvoiceNumber()
  }

  // Validate Bill before saving
  const validateBill = () => {
    if (!customerName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Name Required',
        text: 'Please enter customer / client full name.',
        confirmButtonColor: '#043486'
      })
      return false
    }

    if (customerPhone.trim() && customerPhone.trim().length !== 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Mobile Number',
        text: 'Mobile number must be exactly 10 digits.',
        confirmButtonColor: '#043486'
      })
      return false
    }

    if (!sameAsDelivery && !deliveryAddress.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Delivery Address Required',
        text: 'Please enter the delivery address since it is different from billing address.',
        confirmButtonColor: '#043486'
      })
      return false
    }

    if (items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Items Added',
        text: 'Please add at least one line item to the bill.',
        confirmButtonColor: '#043486'
      })
      return false
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.material_id && !it.item_name.trim()) {
        Swal.fire({
          icon: 'warning',
          title: `Item #${i + 1} Incomplete`,
          text: 'Please select a material or type an item name.',
          confirmButtonColor: '#043486'
        })
        return false
      }

      // Check Out of Stock and Insufficient Stock for warehouse inventory items
      if (it.material_id) {
        const foundMat = materials.find(m => String(m.id) === String(it.material_id))
        const rawStock = it.current_stock !== null && it.current_stock !== undefined
          ? parseFloat(it.current_stock)
          : (foundMat ? parseFloat(foundMat.current_stock ?? foundMat.opening_stock ?? 0) : null)

        const curStock = rawStock !== null ? rawStock : 0
        const reqQty = parseFloat(it.quantity) || 1

        if (rawStock !== null && curStock <= 0) {
          Swal.fire({
            icon: 'error',
            title: 'Product Out of Stock!',
            html: `Cannot bill <strong>"${it.item_name || 'Selected Material'}"</strong> because available stock is <strong>0 ${it.unit || 'NOS'}</strong>.<br/><br/>Please update inventory or remove item before creating outward bill.`,
            confirmButtonColor: '#d33'
          })
          return false
        }
        if (rawStock !== null && reqQty > curStock) {
          Swal.fire({
            icon: 'warning',
            title: 'Insufficient Stock Quantity!',
            html: `Product <strong>"${it.item_name || 'Selected Material'}"</strong> only has <strong>${curStock} ${it.unit || 'NOS'}</strong> in stock, but requested quantity is <strong>${reqQty}</strong>.`,
            confirmButtonColor: '#043486'
          })
          return false
        }
      }

      if (it.has_serial) {
        const qtyCount = Math.min(25, Math.max(1, Math.floor(parseFloat(it.quantity) || 1)))
        for (let sIdx = 0; sIdx < qtyCount; sIdx++) {
          const serialVal = it.serial_numbers?.[sIdx] || (sIdx === 0 ? it.serial_number : '') || ''
          const trimmed = serialVal.trim().toLowerCase()
          if (!trimmed) {
            Swal.fire({
              icon: 'warning',
              title: `Serial Number Missing!`,
              text: `Item #${i + 1} (${it.item_name || 'Item'}) requires ${qtyCount} serial numbers. Slot #${sIdx + 1} is empty.`,
              confirmButtonColor: '#043486'
            })
            return false
          }

          const dbStatus = verifiedSerials[trimmed]
          if (dbStatus && dbStatus.found === true && dbStatus.status && dbStatus.status.toLowerCase() !== 'available') {
            Swal.fire({
              icon: 'error',
              title: 'Unavailable Serial Number!',
              html: `Serial number <strong>"${serialVal.trim()}"</strong> for item <strong>"${it.item_name || 'Item'}"</strong> is already marked as <strong>${dbStatus.status}</strong> in inventory.<br/><br/>You cannot issue or bill an already sold/unavailable product.`,
              confirmButtonColor: '#d33'
            })
            return false
          }
        }
      }
    }

    if (duplicateSerials.size > 0) {
      const dupeList = Array.from(duplicateSerials).join(', ')
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Serial Numbers Found!',
        text: `The following serial numbers are duplicated in this bill: ${dupeList}. Each serial number must be unique.`,
        confirmButtonColor: '#043486'
      })
      return false
    }

    return true
  }

  // Handle Form Submission (Save & Print or Save & New)
  const handleSubmit = async (e, isSaveAndNew = false) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!validateBill()) return

    const validItems = items.map(it => {
      const qtyCount = Math.min(25, Math.max(1, Math.floor(parseFloat(it.quantity) || 1)))
      const serialList = it.has_serial 
        ? (it.serial_numbers && it.serial_numbers.length > 0 ? it.serial_numbers.slice(0, qtyCount).filter(Boolean) : [it.serial_number].filter(Boolean))
        : []
      
      return {
        material_id: it.material_id ? parseInt(it.material_id, 10) : null,
        item_name: it.item_name,
        hsn_code: it.hsn_code,
        quantity: parseFloat(it.quantity) || 1,
        unit: it.unit,
        rate: parseFloat(it.rate) || 0,
        original_rate: parseFloat(it.original_rate || it.rate) || 0,
        has_discount: Boolean(it.has_discount),
        discount_percent: parseFloat(it.discount_percent) || 0,
        discount_amount: parseFloat(it.discount_amount) || 0,
        tax_rate: parseFloat(it.tax_rate) || 0,
        tax_amount: parseFloat(it.tax_amount) || 0,
        amount: parseFloat(it.amount) || 0,
        serial_number: serialList.join(', '),
        serial_numbers: serialList,
        return_policy: Boolean(it.return_policy)
      }
    })

    setIsSaving(true)

    try {
      const payload = {
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        due_date: hasDueDate ? dueDate : null,
        has_due_date: hasDueDate,
        invoice_type: invoiceType,
        copy_type: copyType,
        customer_type: customerType || 'Individual',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        customer_address: customerAddress.trim(),
        same_as_billing: sameAsDelivery,
        delivery_address: sameAsDelivery ? (customerAddress ? customerAddress.trim() : null) : (deliveryAddress ? deliveryAddress.trim() : null),
        customer_gstin: customerGstin.trim(),
        place_of_supply: placeOfSupply,
        taxable_amount: parseFloat(taxableAmount.toFixed(2)),
        cgst_rate: defaultCgst,
        cgst_amount: parseFloat(cgstAmount.toFixed(2)),
        sgst_rate: defaultSgst,
        sgst_amount: parseFloat(sgstAmount.toFixed(2)),
        igst_rate: defaultIgst,
        igst_amount: parseFloat(igstAmount.toFixed(2)),
        total_tax: parseFloat(totalTax.toFixed(2)),
        round_off: roundOff,
        total_amount: roundedGrandTotal,
        amount_in_words: amountInWords,
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        notes: notes.trim(),
        items: validItems
      }

      const endpoint = isEditMode && editId ? API_ENDPOINTS.BILL_BY_ID(editId) : API_ENDPOINTS.BILLS
      const method = isEditMode && editId ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || (isEditMode ? 'Failed to update invoice' : 'Failed to save bill'))
      }

      if (isEditMode) {
        Swal.fire({
          icon: 'success',
          title: 'Invoice Updated Successfully!',
          text: `Invoice #${invoiceNumber} has been updated.`,
          confirmButtonColor: '#043486'
        }).then(() => {
          navigate('/outward-list')
        })
        return
      }

      if (isSaveAndNew) {
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        }).fire({
          icon: 'success',
          title: `Invoice ${invoiceNumber} saved! Ready for next.`
        })
        handleReset()
      } else {
        const savedBillData = {
          ...payload,
          id: data.billId,
          items: validItems
        }
        setPreviewBill(savedBillData)

        Swal.fire({
          icon: 'success',
          title: 'Invoice Created Successfully!',
          text: `Invoice #${invoiceNumber} saved. Auto-dispatching email & opening print...`,
          showConfirmButton: false,
          timer: 1200
        })

        setTimeout(() => {
          window.print()
          handleReset()
          loadInitialData()
        }, 500)
      }

    } catch (err) {
      console.error('Error saving invoice:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error Saving Invoice',
        text: err.message || 'Unable to save bill to database.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <SkeletonLoader type="form" className="max-w-7xl mx-auto" />
  }

  const categoryOptions = categories.map(c => ({
    value: String(c.id),
    label: c.name
  }))

  const getMaterialOptionsForRow = (categoryId) => {
    let filtered = materials
    if (categoryId) {
      filtered = filtered.filter(m => String(m.category_id) === String(categoryId))
    }
    return filtered.map(m => {
      const hasDisc = Boolean(m.has_discount)
      const discPct = hasDisc ? parseFloat(m.discount_percent) || 0 : 0
      const origRate = parseFloat(m.selling_price) || 0
      const discRate = hasDisc ? (origRate * (1 - discPct / 100)).toFixed(2) : origRate.toFixed(2)
      const curStock = parseFloat(m.current_stock ?? m.opening_stock ?? 0)
      const isOut = curStock <= 0
      const stockBadge = isOut ? '🔴 Out of Stock (0 in stock)' : `🟢 Stock: ${curStock} ${m.unit || 'NOS'}`

      return {
        value: m.id,
        label: isOut ? `${m.name} [Out of Stock]` : m.name,
        subLabel: `${stockBadge} • ${m.category_name ? `[${m.category_name}] • ` : ''}${hasDisc ? `₹${discRate} (Disc ${discPct}% from ₹${origRate})` : `₹${m.selling_price}`} / ${m.unit || 'NOS'}${m.hsn_code ? ` • HSN: ${m.hsn_code}` : ''}`
      }
    })
  }

  const stateOptions = INDIAN_STATES.map(st => ({
    value: st,
    label: st
  }))

  return (
    <div className="space-y-6 font-['Poppins',sans-serif] pb-16 animate-in fade-in duration-200">
      
      {/* 1. Page Header (Transparent Top Bar with Outward List Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate('/outward-list')}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-none transition-colors cursor-pointer"
              title="Back to Outward List"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
              <Receipt className="text-[#043486] dark:text-blue-400" size={22} />
              <span>{isEditMode ? `EDIT INVOICE (#${invoiceNumber})` : 'CREATE NEW INVOICE'}</span>
              {isEditMode && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 text-[10px] font-bold uppercase">
                  Edit Mode
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {isEditMode ? 'Modify outward bill details, line items, and update customer invoice.' : 'Generate customer invoice with automated GST taxes and live currency calculation.'}
            </p>
          </div>
        </div>

        {/* Right Side: OUTWARD LIST Action Button */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="list"
            icon={List}
            onClick={() => navigate('/outward-list')}
            className="text-xs font-semibold"
          >
            OUTWARD LIST
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 2. Responsive Split Screen Layout (Left 8 Cols: Forms & Items | Right 4 Cols: Sticky Live Summary) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT MAIN COLUMN (8 COLS) ================= */}
          <div className="lg:col-span-8 space-y-6">

            {/* A. Invoice Specifications */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
                  <FileText size={16} />
                  <span>Invoice Specifications</span>
                </h2>

                {/* Non-GST / GST Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-none border border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleToggleInvoiceType('NON_GST')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      invoiceType === 'NON_GST'
                        ? 'bg-[#043486] text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    NON-GST INVOICE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleInvoiceType('GST')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      invoiceType === 'GST'
                        ? 'bg-[#043486] text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    GST TAX INVOICE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Invoice Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => {
                      const newDate = e.target.value
                      setInvoiceDate(newDate)
                      if (!isEditMode && newDate) {
                        fetchNextInvoiceNumber(newDate)
                      }
                    }}
                    required
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Place of Supply <span className="text-red-500 font-bold">*</span>
                  </label>
                  <SearchableSelect
                    options={stateOptions}
                    value={placeOfSupply}
                    onChange={handlePlaceOfSupplyChange}
                    placeholder="Select or search state..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Customer / Party Type <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full px-3.5 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="Individual">Individual (Customer)</option>
                    <option value="Company">Company (Business / Firm)</option>
                  </select>
                </div>

                {/* Due Date Row Checkbox + Editable Input */}
                <div className="sm:col-span-3 pt-3 border-t border-gray-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60 dark:bg-slate-950/40 p-3">
                  <Checkbox
                    checked={hasDueDate}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      setHasDueDate(isChecked)
                      if (isChecked) {
                        const days = settings?.due_date_days !== undefined ? parseInt(settings.due_date_days, 10) : 15
                        const d = new Date(invoiceDate)
                        d.setDate(d.getDate() + days)
                        setDueDate(d.toISOString().split('T')[0])
                      } else {
                        setDueDate('')
                      }
                    }}
                    label="Enable Payment Due Date"
                    description={`(Default: ${settings?.due_date_days || 15} days from invoice date)`}
                  />

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 whitespace-nowrap">
                      Due Date:
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => {
                        const val = e.target.value
                        setDueDate(val)
                        if (val) {
                          setHasDueDate(true)
                        }
                      }}
                      placeholder="dd-mm-yyyy"
                      className="px-3 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] font-medium"
                    />
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setDueDate('')
                          setHasDueDate(false)
                        }}
                        title="Clear Due Date"
                        className="text-[10px] font-bold text-gray-400 hover:text-red-600 px-1 transition-colors cursor-pointer"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* B. Customer Details */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-slate-800">
                <User size={16} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                  Bill To / Customer Details
                </h2>
              </div>

              <div className="space-y-4">
                {/* 1st row: Customer / Client Name - Mobile / Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      {customerType === 'Company' ? (
                        <>Company / Business Name <span className="text-red-500 font-bold">*</span></>
                      ) : (
                        <>Customer / Client Name <span className="text-red-500 font-bold">*</span></>
                      )}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      placeholder={customerType === 'Company' ? 'Enter company / enterprise name' : 'Enter customer / client full name'}
                      className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Mobile / Phone Number <span className="text-gray-400 text-[11px] font-normal">(10 Digits)</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setCustomerPhone(val)
                      }}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-mono font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* 2nd row: Customer Email ID (Optional) - Customer GSTIN (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Customer Email ID <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter customer email address (e.g. client@gmail.com)"
                      className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      {customerType === 'Company' ? 'Company GSTIN' : 'Customer GSTIN'} <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={customerGstin}
                      onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                      placeholder="ENTER GSTIN (OPTIONAL)"
                      className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white uppercase bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-mono font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* 3rd row full: Billing Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Billing Address</label>
                  <textarea
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter billing address"
                    className="w-full px-4 py-2.5 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium resize-none"
                  />
                </div>

                {/* Delivery Address Checkbox (Same as billing address) */}
                <div className="pt-1">
                  <Checkbox
                    checked={sameAsDelivery}
                    onChange={(e) => setSameAsDelivery(e.target.checked)}
                    label="Delivery address same as billing address"
                  />
                </div>

                {/* Delivery Address Textarea (Visible if unchecked) */}
                {!sameAsDelivery && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Delivery / Shipping Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter separate delivery / shipping address"
                      className="w-full px-4 py-2.5 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ================= RIGHT STICKY SUMMARY COLUMN (4 COLS) ================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <BillSummaryCard
              title="Invoice Summary"
              billNumber={invoiceNumber}
              totalGrossOrigAmt={totalGrossOrigAmt}
              totalDiscountSavings={totalDiscountSavings}
              taxableAmount={taxableAmount}
              isIntraState={isIntraState}
              cgstRate={defaultCgst}
              cgstAmount={cgstAmount}
              sgstRate={defaultSgst}
              sgstAmount={sgstAmount}
              igstRate={defaultIgst}
              igstAmount={igstAmount}
              totalTax={totalTax}
              roundOff={roundOff}
              grandTotal={roundedGrandTotal}
              amountInWords={amountInWords}
              bankDetails={settings}
              isSaving={isSaving}
              isEditMode={isEditMode}
              saveButtonText={isEditMode ? 'Update Invoice (Ctrl+Enter)' : 'Save Invoice (Ctrl+Enter)'}
              onSave={(e) => handleSubmit(e, false)}
              onReset={handleReset}
              onCancel={isEditMode ? () => navigate('/outward-list') : null}
            />
          </div>

        </div>

        {/* ================= MIDDLE SECTION: 100% FULL WIDTH INVOICE LINE ITEMS ================= */}
        <OutwardLineItems
          items={items}
          categoryOptions={categoryOptions}
          materials={materials}
          getMaterialOptionsForRow={getMaterialOptionsForRow}
          duplicateSerials={duplicateSerials}
          verifiedSerials={verifiedSerials}
          availableSerialsMap={availableSerialsMap}
          activeSerialSuggest={activeSerialSuggest}
          setActiveSerialSuggest={setActiveSerialSuggest}
          fetchAvailableSerialsForMaterial={fetchAvailableSerialsForMaterial}
          verifySerialWithDb={verifySerialWithDb}
          onCategorySelect={handleCategorySelect}
          onMaterialSelect={handleMaterialSelect}
          onItemChange={handleItemChange}
          onSerialNumberChange={handleSerialNumberChange}
          onAddItem={handleAddItem}
          onDuplicateItem={handleDuplicateItem}
          onRemoveItem={handleRemoveItem}
        />

      </form>

      {/* Direct Printable Invoice Portal to document.body for reliable A4 print without blank page */}
      {previewBill && typeof document !== 'undefined' && createPortal(
        <div id="invoice-print-wrapper">
          <InvoiceTemplate bill={previewBill} settings={settings} />
        </div>,
        document.body
      )}
    </div>
  )
}
