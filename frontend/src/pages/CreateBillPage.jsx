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
  ArrowLeft
} from 'lucide-react'
import Swal from 'sweetalert2'
import SearchableSelect from '../components/common/SearchableSelect'
import InvoiceTemplate from '../components/invoice/InvoiceTemplate'
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

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.NEXT_INVOICE_NUMBER)
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

  // Toggle between NON_GST and GST TAX INVOICE
  const handleToggleInvoiceType = (newType) => {
    setInvoiceType(newType)
    setItems(prevItems => {
      return prevItems.map(it => {
        const qty = parseFloat(it.quantity) || 0
        const rate = parseFloat(it.rate) || 0
        const taxable = qty * rate
        const isTaxEligible = it.tax_inclusive !== false && it.tax_inclusive !== 0 && it.tax_inclusive !== '0'
        const effRate = calculateEffectiveTaxRate(isTaxEligible, newType, isIntraState)
        const taxAmt = taxable * (effRate / 100)
        const totalAmt = taxable + taxAmt
        return {
          ...it,
          tax_rate: effRate,
          tax_amount: parseFloat(taxAmt.toFixed(2)),
          amount: parseFloat(totalAmt.toFixed(2))
        }
      })
    })
  }

  // Handle Place of Supply Change (Supports full clear)
  const handlePlaceOfSupplyChange = (newPlace) => {
    const val = newPlace || ''
    setPlaceOfSupply(val)
    const newIsIntra = !val || val.includes('33') || val.toLowerCase().includes('tamil nadu')
    setItems(prevItems => {
      return prevItems.map(it => {
        const qty = parseFloat(it.quantity) || 0
        const rate = parseFloat(it.rate) || 0
        const taxable = qty * rate
        const isTaxEligible = it.tax_inclusive !== false && it.tax_inclusive !== 0 && it.tax_inclusive !== '0'
        const effRate = calculateEffectiveTaxRate(isTaxEligible, invoiceType, newIsIntra)
        const taxAmt = taxable * (effRate / 100)
        const totalAmt = taxable + taxAmt
        return {
          ...it,
          tax_rate: effRate,
          tax_amount: parseFloat(taxAmt.toFixed(2)),
          amount: parseFloat(totalAmt.toFixed(2))
        }
      })
    })
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
        const rawRate = parseFloat(selectedMat.selling_price) || 0
        const hasDiscount = Boolean(selectedMat.has_discount)
        const discountPercent = hasDiscount ? (parseFloat(selectedMat.discount_percent) || 0) : 0
        const discountAmount = hasDiscount ? (rawRate * (discountPercent / 100)) : 0
        const effectiveRate = hasDiscount ? Math.max(0, rawRate - discountAmount) : rawRate

        const taxable = qty * effectiveRate
        const isTaxEligible = selectedMat.tax_inclusive !== false && selectedMat.tax_inclusive !== 0 && selectedMat.tax_inclusive !== '0'
        const effectiveTaxRate = calculateEffectiveTaxRate(isTaxEligible, invoiceType, isIntraState)
        const taxAmt = taxable * (effectiveTaxRate / 100)
        const totalAmt = taxable + taxAmt
        const hasSerial = Boolean(selectedMat.serial_tracking || selectedMat.has_serial)
        const qtyCount = Math.min(25, Math.max(1, Math.floor(qty)))

        let currentSerials = updated[index].serial_numbers || []
        if (hasSerial) {
          currentSerials = Array.from({ length: qtyCount }, (_, i) => currentSerials[i] || '')
        }

        updated[index] = {
          ...updated[index],
          material_id: selectedMat.id,
          item_name: selectedMat.name,
          current_stock: curStock,
          category_id: selectedMat.category_id ? String(selectedMat.category_id) : updated[index].category_id,
          category_name: selectedMat.category_name || updated[index].category_name || '',
          hsn_code: selectedMat.hsn_code || '',
          unit: selectedMat.unit || 'NOS',
          original_rate: rawRate,
          has_discount: hasDiscount,
          discount_percent: discountPercent,
          discount_amount: parseFloat(discountAmount.toFixed(2)),
          rate: parseFloat(effectiveRate.toFixed(2)),
          tax_inclusive: isTaxEligible,
          tax_rate: effectiveTaxRate,
          tax_amount: parseFloat(taxAmt.toFixed(2)),
          amount: parseFloat(totalAmt.toFixed(2)),
          has_serial: hasSerial,
          serial_numbers: currentSerials,
          serial_number: currentSerials.filter(Boolean).join(', '),
          return_policy: Boolean(selectedMat.return_policy)
        }
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

      updated[index] = { ...updated[index], [field]: finalVal }

      // Recalculate row amounts
      const qty = parseFloat(field === 'quantity' ? finalVal : updated[index].quantity) || 0
      const rate = parseFloat(field === 'rate' ? finalVal : updated[index].rate) || 0
      const taxRate = parseFloat(field === 'tax_rate' ? finalVal : updated[index].tax_rate) || 0

      const taxable = qty * rate
      const taxAmt = taxable * (taxRate / 100)
      const totalAmt = taxable + taxAmt

      updated[index].tax_amount = parseFloat(taxAmt.toFixed(2))
      updated[index].amount = parseFloat(totalAmt.toFixed(2))

      // Adjust serial numbers array length if quantity changes and has_serial is enabled
      if (field === 'quantity' && updated[index].has_serial) {
        const qtyCount = Math.min(25, Math.max(1, Math.floor(parseFloat(finalVal) || 1)))
        const existingSerials = updated[index].serial_numbers || []
        updated[index].serial_numbers = Array.from({ length: qtyCount }, (_, i) => existingSerials[i] || '')
        updated[index].serial_number = updated[index].serial_numbers.filter(Boolean).join(', ')
      }

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

  const rawGrandTotal = taxableAmount + totalTax
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
          if (!serialVal.trim()) {
            Swal.fire({
              icon: 'warning',
              title: `Serial Number Missing!`,
              text: `Item #${i + 1} (${it.item_name || 'Item'}) requires ${qtyCount} serial numbers. Slot #${sIdx + 1} is empty.`,
              confirmButtonColor: '#043486'
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
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#043486] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const categoryOptions = categories.map(c => ({
    value: String(c.id),
    label: c.name
  }))

  const getMaterialOptionsForRow = (categoryId, hsnCode) => {
    let filtered = materials
    if (categoryId) {
      filtered = filtered.filter(m => String(m.category_id) === String(categoryId))
    }
    if (hsnCode && hsnCode.trim()) {
      const query = hsnCode.trim().toLowerCase()
      filtered = filtered.filter(m => m.hsn_code && m.hsn_code.toLowerCase().includes(query))
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
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 space-y-6 pb-16 font-['Poppins',sans-serif]">
      
      {/* 1. Page Header & Quick Shortcuts Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate('/outward-list')}
              className="p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-[#043486] dark:text-blue-400 rounded-none transition-colors cursor-pointer"
              title="Back to Outward List"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-[#292424] dark:text-white flex items-center gap-2">
              <span>{isEditMode ? `Edit Invoice #${invoiceNumber}` : 'Create New Invoice'}</span>
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

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950 px-3 py-1.5 border border-gray-200 dark:border-slate-800">
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Ctrl+Enter</kbd> {isEditMode ? 'Update' : 'Save'}</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Alt+A</kbd> Add Item</span>
          {!isEditMode && (
            <>
              <span>•</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Alt+R</kbd> Reset</span>
            </>
          )}
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
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Invoice Date *</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Place of Supply *</label>
                  <SearchableSelect
                    options={stateOptions}
                    value={placeOfSupply}
                    onChange={handlePlaceOfSupplyChange}
                    placeholder="Select or search state..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Customer / Party Type *
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
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
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
                      className="w-4 h-4 text-[#043486] rounded-none focus:ring-0 cursor-pointer accent-[#043486]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#292424] dark:text-white">
                        Enable Payment Due Date
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 block sm:inline sm:ml-1.5">
                        (Default: {settings?.due_date_days || 15} days from invoice date)
                      </span>
                    </div>
                  </label>

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
                      {customerType === 'Company' ? 'Company / Business Name *' : 'Customer / Client Name *'}
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
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameAsDelivery}
                      onChange={(e) => setSameAsDelivery(e.target.checked)}
                      className="w-4 h-4 text-[#043486] rounded-none focus:ring-0 cursor-pointer accent-[#043486]"
                    />
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-200">
                      Delivery address same as billing address
                    </span>
                  </label>
                </div>

                {/* Delivery Address Textarea (Visible if unchecked) */}
                {!sameAsDelivery && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Delivery / Shipping Address <span className="text-red-500">*</span>
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
            
            {/* Live Invoice Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
                  <IndianRupee size={16} />
                  <span>Invoice Summary</span>
                </h2>
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-mono font-bold">
                  {invoiceNumber}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                {totalDiscountSavings > 0 && (
                  <>
                    <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                      <span>Gross Amount</span>
                      <span className="font-mono text-gray-800 dark:text-slate-200">₹ {totalGrossOrigAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <span>Discount Savings</span>
                      <span className="font-mono">- ₹ {totalDiscountSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Taxable Amount</span>
                  <span className="font-medium font-mono text-gray-900 dark:text-white">₹ {taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {isIntraState ? (
                  <>
                    <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                      <span>CGST ({defaultCgst}%)</span>
                      <span className="font-mono text-gray-800 dark:text-slate-200">₹ {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                      <span>SGST ({defaultSgst}%)</span>
                      <span className="font-mono text-gray-800 dark:text-slate-200">₹ {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                    <span>IGST ({defaultIgst}%)</span>
                    <span className="font-mono text-gray-800 dark:text-slate-200">₹ {igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Total Tax</span>
                  <span className="font-medium font-mono text-blue-900 dark:text-blue-300">₹ {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {roundOff !== 0 && (
                  <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs">
                    <span>Round Off</span>
                    <span className="font-mono">{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#292424] dark:text-white">Grand Total</span>
                  <span className="text-2xl font-black text-[#043486] dark:text-blue-400 font-mono">
                    ₹ {roundedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Amount in words badge */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-none">
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount in Words</span>
                  <p className="text-xs font-semibold text-[#043486] dark:text-blue-300 mt-0.5 capitalize leading-relaxed">
                    {amountInWords}
                  </p>
                </div>

                {/* Bank details summary pill */}
                {settings && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-none border border-gray-200 dark:border-slate-800 text-[11px] text-gray-600 dark:text-slate-400 space-y-0.5">
                    <p className="font-semibold text-gray-800 dark:text-slate-200">Bank: {settings.bank_name} ({settings.branch || 'Main'})</p>
                    <p>A/C: <span className="font-mono text-gray-900 dark:text-white font-bold">{settings.account_no}</span> | IFSC: <span className="font-mono text-gray-900 dark:text-white font-bold">{settings.ifsc_code}</span></p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-sm rounded-none shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{isEditMode ? 'Update Invoice (Ctrl+Enter)' : 'Save Invoice (Ctrl+Enter)'}</span>
                </button>

                {isEditMode ? (
                  <button
                    type="button"
                    onClick={() => navigate('/outward-list')}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-medium text-xs rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Cancel &amp; Back to List</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-medium text-xs rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Form (Alt+R)</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* ================= MIDDLE SECTION: 100% FULL WIDTH INVOICE LINE ITEMS ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors w-full">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Boxes size={18} className="text-[#043486] dark:text-blue-400" />
              <h2 className="text-base font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                Invoice Line Items ({items.length})
              </h2>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#043486] hover:bg-[#0248BC] text-white font-semibold text-xs rounded-none shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Line Item (Alt+A)</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-none border border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 hover:border-blue-300 dark:hover:border-blue-800 transition-all space-y-3"
              >
                {/* Row 1: Index + Category + Product Select + HSN/SAC + Qty & Unit + Row Actions */}
                <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
                  {/* S.No */}
                  <div className="shrink-0">
                  
                    <span className="w-9 h-[41px] rounded-none bg-[#043486] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                  </div>

                  {/* 1. Category Search & Select Dropdown */}
                  <div className="w-full md:w-60 shrink-0">
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                      Material Category
                    </label>
                    <SearchableSelect
                      options={categoryOptions}
                      value={item.category_id || ''}
                      onChange={(val) => handleCategorySelect(index, val)}
                      placeholder="Select Category..."
                    />
                  </div>

                  {/* 2. Product / Material Search & Select Dropdown (Massive Expanded Width) */}
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                        Item Name <span className="text-blue-500">*</span>
                        {item.material_id && item.current_stock !== null && item.current_stock !== undefined && (
                          <span className={`ml-2 text-[10.5px] font-bold ${
                            parseFloat(item.current_stock) <= 0 
                              ? 'text-red-500' 
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {parseFloat(item.current_stock) <= 0 
                              ? '(0 in Stock - Out of Stock)' 
                              : `(Available: ${item.current_stock} ${item.unit || 'NOS'})`}
                          </span>
                        )}
                      </label>
                    </div>
                    <SearchableSelect
                      options={getMaterialOptionsForRow(item.category_id, item.hsn_code)}
                      value={item.material_id || ''}
                      onChange={(val) => handleMaterialSelect(index, val)}
                      placeholder={
                        item.category_name
                          ? `Select product in "${item.category_name}"...`
                          : (item.hsn_code ? `Select product for HSN "${item.hsn_code}"...` : 'Search & select product / item...')
                      }
                    />

                    {/* Stock Validations Warning Message Under Input Field (Only for error/warning states) */}
                    {item.material_id && item.current_stock !== null && item.current_stock !== undefined && (
                      <>
                        {parseFloat(item.current_stock) <= 0 ? (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 border border-red-200 dark:border-red-900 animate-pulse">
                            <AlertCircle size={12} className="shrink-0 text-red-500" />
                            <span>⚠️ Out of Stock! (0 {item.unit || 'NOS'} in inventory)</span>
                          </div>
                        ) : (parseFloat(item.quantity) || 1) > parseFloat(item.current_stock) ? (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 border border-red-200 dark:border-red-900">
                            <AlertCircle size={12} className="shrink-0 text-red-500" />
                            <span>⚠️ Insufficient Stock! Only ${item.current_stock} ${item.unit || 'NOS'} available (Billed: ${item.quantity})</span>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>

                  {/* 3. HSN / SAC */}
                  <div className="w-full sm:w-36 shrink-0">
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                      HSN / SAC Code
                    </label>
                    <input
                      type="text"
                      value={item.hsn_code}
                      onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value)}
                      placeholder="HSN / SAC"
                      title="HSN / SAC Code"
                      className="w-full px-3 py-2.5 text-xs font-mono text-center text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium h-[41px]"
                    />
                  </div>

                  {/* 4. Quantity & Unit */}
                  <div className="shrink-0">
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                      Qty & Unit
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        title="Quantity"
                        placeholder="Qty"
                        className={`w-20 px-2 py-2.5 text-xs text-center font-bold bg-white dark:bg-slate-900 border rounded-none focus:outline-none h-[41px] ${
                          item.material_id && item.current_stock !== null && (parseFloat(item.current_stock) <= 0 || (parseFloat(item.quantity) || 1) > parseFloat(item.current_stock))
                            ? 'border-red-500 text-red-600 dark:text-red-400 focus:border-red-600 bg-red-50/20'
                            : 'text-[#292424] dark:text-white border-gray-300 dark:border-slate-700 focus:border-[#043486] dark:focus:border-blue-500'
                        }`}
                      />
                      <input
                        type="text"
                        value={item.unit || 'NOS'}
                        readOnly
                        title="Unit (From material)"
                        className="w-18 px-2 py-2.5 text-xs text-center uppercase text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-none cursor-not-allowed select-none focus:outline-none font-semibold h-[41px]"
                      />
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div className="shrink-0 self-end md:self-end">
                    <label className="hidden md:block text-[11px] font-semibold text-transparent select-none mb-1">
                      Action
                    </label>
                    <div className="flex items-center gap-1 h-[41px]">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(index)}
                        title="Duplicate row"
                        className="p-2.5 text-gray-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        title="Delete row"
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Dynamic Serial Number Inputs (If item has serial tracking or serial number entered) */}
                {(item.has_serial || (item.serial_numbers && item.serial_numbers.some(Boolean)) || item.serial_number) && (
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-none space-y-3 pt-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#043486] dark:text-blue-300">
                      <span className="flex items-center gap-1.5">
                        <FileDigit size={15} />
                        <span>Enter Serial Numbers for stock verification ({Math.min(25, Math.max(1, Math.floor(parseFloat(item.quantity) || 1)))} total) <span className="text-red-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 font-normal">
                        Auto-suggest available stock from Warehouse Vault
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Array.from({ length: Math.min(25, Math.max(1, Math.floor(parseFloat(item.quantity) || 1))) }).map((_, sIdx) => {
                        const serialVal = item.serial_numbers?.[sIdx] || (sIdx === 0 ? item.serial_number : '') || ''
                        const trimmed = serialVal.trim().toLowerCase()
                        const isDuplicate = trimmed !== '' && duplicateSerials.has(trimmed)
                        const dbStatus = trimmed ? verifiedSerials[trimmed] : null
                        const isNotFound = dbStatus && dbStatus.found === false
                        const isVerified = dbStatus && dbStatus.found === true
                        const isSuggestOpen = activeSerialSuggest?.itemIndex === index && activeSerialSuggest?.serialIndex === sIdx
                        const availableStockSerials = availableSerialsMap[item.material_id] || []
                        const matchingStockSerials = availableStockSerials.filter(sn => !trimmed || sn.toLowerCase().includes(trimmed))

                        return (
                          <div key={sIdx} className="space-y-1 relative">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs font-mono font-bold">
                                #{sIdx + 1}
                              </div>
                              <input
                                type="text"
                                value={serialVal}
                                onChange={(e) => handleSerialNumberChange(index, sIdx, e.target.value)}
                                onFocus={() => {
                                  setActiveSerialSuggest({ itemIndex: index, serialIndex: sIdx })
                                  if (item.material_id) {
                                    fetchAvailableSerialsForMaterial(item.material_id)
                                  }
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => setActiveSerialSuggest(null), 250)
                                  if (e.target.value.trim()) {
                                    verifySerialWithDb(e.target.value.trim())
                                  }
                                }}
                                placeholder={`Serial #${sIdx + 1}`}
                                className={`w-full pl-9 pr-14 py-2.5 text-xs sm:text-sm font-mono text-[#292424] dark:text-white rounded-none focus:outline-none transition-colors ${
                                  isDuplicate || isNotFound
                                    ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-500 text-red-700 dark:text-red-300 focus:border-red-600'
                                    : isVerified
                                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-[#043486] dark:focus:border-blue-500'
                                } placeholder:text-gray-400 dark:placeholder:text-slate-500`}
                              />
                              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                                {isDuplicate ? (
                                  <AlertCircle size={15} className="text-red-500" title="Duplicate serial in bill" />
                                ) : isNotFound ? (
                                  <AlertCircle size={15} className="text-red-500" title="Not found in stock DB" />
                                ) : isVerified ? (
                                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" title="Verified in stock" />
                                ) : null}

                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    if (isSuggestOpen) {
                                      setActiveSerialSuggest(null)
                                    } else {
                                      setActiveSerialSuggest({ itemIndex: index, serialIndex: sIdx })
                                      if (item.material_id) {
                                        fetchAvailableSerialsForMaterial(item.material_id)
                                      }
                                    }
                                  }}
                                  className="p-1 text-gray-400 hover:text-[#043486] dark:hover:text-blue-400 transition-colors cursor-pointer"
                                  title="Toggle available serials suggestions"
                                >
                                  <ChevronDown size={14} className={`transition-transform duration-150 ${isSuggestOpen ? 'rotate-180 text-[#043486]' : ''}`} />
                                </button>
                              </div>
                            </div>

                            {/* Auto-Suggest Dropdown Popover */}
                            {isSuggestOpen && (
                              <div
                                onMouseDown={(e) => e.preventDefault()}
                                className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 shadow-xl z-50 rounded-none overflow-hidden max-h-52 overflow-y-auto animate-in fade-in duration-100"
                              >
                                <div className="px-3 py-1.5 bg-blue-50 dark:bg-slate-800 border-b border-blue-200 dark:border-slate-700 flex items-center justify-between text-[10px] font-bold text-[#043486] dark:text-blue-300">
                                  <span className="flex items-center gap-1">
                                    <FileDigit size={11} />
                                    <span>In-Stock Serials ({matchingStockSerials.length})</span>
                                  </span>
                                  <span className="text-gray-400">Click to select</span>
                                </div>

                                {matchingStockSerials.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-gray-400 dark:text-slate-500 font-medium">
                                    {availableStockSerials.length === 0
                                      ? 'No registered stock serials found for this item.'
                                      : 'No available serials match filter.'}
                                  </div>
                                ) : (
                                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {matchingStockSerials.map((stockSn) => {
                                      const isAlreadySelectedInBill = duplicateSerials.has(stockSn.toLowerCase()) || items.some((it, i) => {
                                        const sList = it.serial_numbers || (it.serial_number ? [it.serial_number] : [])
                                        return sList.some((s, idx) => !(i === index && idx === sIdx) && (s || '').trim().toLowerCase() === stockSn.toLowerCase())
                                      })

                                      return (
                                        <button
                                          key={stockSn}
                                          type="button"
                                          onClick={() => {
                                            handleSerialNumberChange(index, sIdx, stockSn)
                                            setActiveSerialSuggest(null)
                                          }}
                                          className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                                            isAlreadySelectedInBill
                                              ? 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60'
                                              : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-800 dark:text-slate-200'
                                          }`}
                                        >
                                          <span className="font-bold flex items-center gap-1.5 truncate">
                                            <Hash size={12} className="text-gray-400" />
                                            {stockSn}
                                          </span>
                                          <span className={`text-[9px] px-1.5 py-0.5 font-bold uppercase rounded-none border ${
                                            isAlreadySelectedInBill
                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300'
                                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                                          }`}>
                                            {isAlreadySelectedInBill ? 'Used in Bill' : 'Available'}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Status label under input */}
                            {trimmed && (
                              <div className="text-[10px] font-medium px-1 flex items-center gap-1">
                                {isDuplicate ? (
                                  <span className="text-red-600 dark:text-red-400 font-bold">Duplicate in bill</span>
                                ) : isNotFound ? (
                                  <span className="text-red-600 dark:text-red-400 font-bold">Not in registered stock</span>
                                ) : isVerified ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Verified ({dbStatus.status})</span>
                                ) : (
                                  <span className="text-gray-400">Verifying...</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}


                {/* Row 3 (Last Row): Rate, Tax, Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-slate-800 items-end">
                  {/* Rate (Base Price - Non-editable from material) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                          {item.has_discount ? 'Discounted Rate (₹)' : 'Rate (₹)'}
                        </label>
                        {item.has_discount && (
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono font-medium">
                            (Orig: <span className="line-through text-gray-400">₹{Number(item.original_rate || item.rate || 0).toFixed(2)}</span> -₹{Number(item.discount_amount || 0).toFixed(2)})
                          </span>
                        )}
                      </div>
                      {item.has_discount && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {item.discount_percent}% OFF
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={Number(item.rate || 0).toFixed(2)}
                        readOnly
                        className="w-full px-3 py-2.5 text-xs font-semibold text-right font-mono text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-none cursor-not-allowed select-none focus:outline-none h-[41px]"
                      />
                    </div>
                  </div>

                  {/* Tax % */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">Tax ({item.tax_rate}%)</label>
                    <div className="px-3 py-2.5 text-xs bg-gray-100 dark:bg-slate-800 rounded-none border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-mono font-medium flex items-center justify-end h-[41px]">
                      ₹ {Number(item.tax_amount || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Total Line Amount */}
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Amount (₹)</label>
                    <div className="px-3 py-2.5 text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-center justify-end h-[41px]">
                      ₹ {Number(item.amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
