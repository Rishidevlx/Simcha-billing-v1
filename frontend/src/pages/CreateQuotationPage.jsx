import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  User,
  Phone,
  MapPin,
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
  List,
  Send
} from '../components/common/icons'
import Swal from 'sweetalert2'
import SearchableSelect from '../components/common/SearchableSelect'
import QuotationTemplate from '../components/quotation/QuotationTemplate'
import QuotationModal from '../components/quotation/QuotationModal'
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

export default function CreateQuotationPage({ setActiveRoute }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editId = searchParams.get('editId')
  const isEditMode = Boolean(editId)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Quotation Preview Modal State
  const [previewQuotation, setPreviewQuotation] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Settings, Categories & Materials
  const [settings, setSettings] = useState(null)
  const [categories, setCategories] = useState([])
  const [materials, setMaterials] = useState([])

  // Quotation Meta
  const [quotationNumber, setQuotationNumber] = useState('SIS-QTN/2026-27/0001')
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0])
  const [quotationType, setQuotationType] = useState('NON_GST')
  const [copyType, setCopyType] = useState('ORIGINAL')
  const [placeOfSupply, setPlaceOfSupply] = useState('33 - Tamil Nadu')
  const [quotationStatus, setQuotationStatus] = useState('Draft')

  // Customer Information
  const [customerType, setCustomerType] = useState('Individual') // 'Individual' | 'Company'
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [sameAsDelivery, setSameAsDelivery] = useState(true)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [customerGstin, setCustomerGstin] = useState('')

  // Remarks / Notes
  const [notes, setNotes] = useState('')

  // Items State
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

  // Serials maps
  const [verifiedSerials, setVerifiedSerials] = useState({})
  const [availableSerialsMap, setAvailableSerialsMap] = useState({})
  const [activeSerialSuggest, setActiveSerialSuggest] = useState(null)

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
      console.error('Failed to fetch serials for material:', err)
    }
  }

  // Duplicate Serials Check across all quotation lines
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

  // Verify serial number against DB
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

  // Fetch Next Number / Quotation Details, Settings & Materials on load
  const loadInitialData = async () => {
    try {
      setIsLoading(true)

      // 1. Fetch Settings
      let loadedSettings = null
      try {
        const sRes = await fetch(API_ENDPOINTS.SETTINGS)
        const sData = await sRes.json()
        if (sData.success) {
          loadedSettings = sData.settings || sData.data
          setSettings(loadedSettings)
        }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }

      // 2. Fetch Categories
      try {
        const cRes = await fetch(API_ENDPOINTS.CATEGORIES)
        const cData = await cRes.json()
        if (cData.success && cData.categories) {
          setCategories(cData.categories.filter(c => c.status === 'Active'))
        } else if (cData.success && cData.data) {
          setCategories(cData.data.filter(c => c.status === 'Active'))
        }
      } catch (e) {
        console.error('Failed to load categories:', e)
      }

      // 3. Fetch Materials
      let loadedMaterials = []
      try {
        const mRes = await fetch(API_ENDPOINTS.MATERIALS)
        const mData = await mRes.json()
        if (mData.success && mData.materials) {
          loadedMaterials = mData.materials.filter(m => m.status === 'Active')
          setMaterials(loadedMaterials)
        } else if (mData.success && mData.data) {
          loadedMaterials = mData.data.filter(m => m.status === 'Active')
          setMaterials(loadedMaterials)
        }
      } catch (e) {
        console.error('Failed to load materials:', e)
      }

      // 4. Fetch Next Quotation Number or Edit Quotation Data
      if (isEditMode) {
        const editRes = await fetch(API_ENDPOINTS.QUOTATION_BY_ID(editId))
        const editData = await editRes.json()
        const qtn = editData.quotation || editData.data
        if (editData.success && qtn) {
          setQuotationNumber(qtn.quotation_number || '')
          setQuotationDate(qtn.quotation_date ? qtn.quotation_date.slice(0, 10) : new Date().toISOString().split('T')[0])
          setQuotationType(qtn.quotation_type || 'NON_GST')
          setCopyType(qtn.copy_type || 'ORIGINAL')
          setQuotationStatus(qtn.quotation_status || 'Draft')
          setCustomerType(qtn.customer_type || 'Individual')
          setCustomerName(qtn.customer_name || '')
          setCustomerPhone(qtn.customer_phone || '')
          setCustomerEmail(qtn.customer_email || '')
          setCustomerAddress(qtn.customer_address || '')
          setSameAsDelivery(Boolean(qtn.same_as_billing))
          setDeliveryAddress(qtn.delivery_address || '')
          setCustomerGstin(qtn.customer_gstin || '')
          setPlaceOfSupply(qtn.place_of_supply || '33 - Tamil Nadu')
          setNotes(qtn.notes || '')

          if (qtn.items && qtn.items.length > 0) {
            const mappedItems = qtn.items.map(it => {
              const rawSerials = it.serial_numbers && Array.isArray(it.serial_numbers) && it.serial_numbers.length > 0
                ? it.serial_numbers
                : (it.serial_number ? it.serial_number.split(',').map(s => s.trim()).filter(Boolean) : [''])
              
              const qtyNum = Math.min(25, Math.max(1, Math.floor(parseFloat(it.quantity) || 1)))
              while (rawSerials.length < qtyNum) {
                rawSerials.push('')
              }

              return {
                material_id: it.material_id ? String(it.material_id) : '',
                item_name: it.item_name || '',
                category_name: it.category_name || '',
                category_id: it.category_id ? String(it.category_id) : '',
                serial_number: it.serial_number || '',
                serial_numbers: rawSerials,
                hsn_code: it.hsn_code || '',
                quantity: parseFloat(it.quantity) || 1,
                unit: it.unit || 'NOS',
                current_stock: it.current_stock !== undefined && it.current_stock !== null ? parseFloat(it.current_stock) : null,
                rate: parseFloat(it.rate) || 0,
                original_rate: parseFloat(it.original_rate || it.rate) || 0,
                has_discount: Boolean(it.has_discount),
                discount_percent: parseFloat(it.discount_percent) || 0,
                discount_amount: parseFloat(it.discount_amount) || 0,
                tax_inclusive: it.tax_inclusive !== false,
                tax_rate: parseFloat(it.tax_rate) || 0,
                tax_amount: parseFloat(it.tax_amount) || 0,
                amount: parseFloat(it.amount) || 0,
                has_serial: Boolean(it.serial_number || (it.serial_numbers && it.serial_numbers.length > 0)),
                return_policy: Boolean(it.return_policy)
              }
            })
            setItems(mappedItems)
          }
        }
      } else {
        await fetchNextQuotationNumber()
      }

    } catch (err) {
      console.error('Error loading initial quotation data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch Next Formatted Quotation Number
  const fetchNextQuotationNumber = async (overrideDate = null) => {
    try {
      const activeDate = overrideDate || quotationDate || new Date().toISOString().split('T')[0]
      const res = await fetch(`${API_ENDPOINTS.NEXT_QUOTATION_NUMBER}?date=${activeDate}`)
      const data = await res.json()
      if (data.success && data.nextQuotationNumber) {
        setQuotationNumber(data.nextQuotationNumber)
      }
    } catch (e) {
      console.error('Failed to get next quotation number:', e)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Check if Place of Supply is Intra-State (Tamil Nadu)
  const isIntraState = placeOfSupply.includes('33') || placeOfSupply.toLowerCase().includes('tamil nadu')

  // Calculate taxes whenever settings or items change
  const defaultCgst = settings ? parseFloat(settings.cgst_rate) || 9.00 : 9.00
  const defaultSgst = settings ? parseFloat(settings.sgst_rate) || 9.00 : 9.00
  const defaultIgst = settings ? parseFloat(settings.igst_rate) || 18.00 : 18.00

  // Helper to determine effective tax rate
  const calculateEffectiveTaxRate = (isTaxEligible, type, intra) => {
    if (type === 'NON_GST') return 0
    if (isTaxEligible === false || isTaxEligible === 0 || isTaxEligible === '0') return 0
    const cgst = settings ? parseFloat(settings.cgst_rate) || 9.00 : 9.00
    const sgst = settings ? parseFloat(settings.sgst_rate) || 9.00 : 9.00
    const igst = settings ? parseFloat(settings.igst_rate) || 18.00 : 18.00
    return intra ? (cgst + sgst) : igst
  }

  // Helper to calculate line item pricing and taxes
  const calculateQuotationItem = (item, currentType = quotationType, isIntra = isIntraState) => {
    const qty = parseFloat(item.quantity) || 0
    const rawRate = parseFloat(item.original_rate ?? item.rate ?? 0)
    const hasDiscount = Boolean(item.has_discount)
    const discountPercent = hasDiscount ? (parseFloat(item.discount_percent) || 0) : 0
    const discountAmount = hasDiscount ? (rawRate * (discountPercent / 100)) : 0
    const effectiveSellingPrice = hasDiscount ? Math.max(0, rawRate - discountAmount) : rawRate

    const isTaxInclusive = item.tax_inclusive !== false && item.tax_inclusive !== 0 && item.tax_inclusive !== '0'
    const effTaxRate = calculateEffectiveTaxRate(true, currentType, isIntra)

    let unitRate = 0
    let taxable = 0
    let taxAmt = 0
    let totalAmt = 0

    if (currentType === 'GST' && effTaxRate > 0) {
      if (isTaxInclusive) {
        totalAmt = parseFloat((qty * effectiveSellingPrice).toFixed(2))
        unitRate = parseFloat((effectiveSellingPrice / (1 + effTaxRate / 100)).toFixed(2))
        taxable = parseFloat((qty * unitRate).toFixed(2))
        taxAmt = parseFloat((totalAmt - taxable).toFixed(2))
      } else {
        unitRate = parseFloat(effectiveSellingPrice.toFixed(2))
        taxable = parseFloat((qty * unitRate).toFixed(2))
        taxAmt = parseFloat((taxable * (effTaxRate / 100)).toFixed(2))
        totalAmt = parseFloat((taxable + taxAmt).toFixed(2))
      }
    } else {
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
      tax_rate: currentType === 'GST' ? effTaxRate : 0,
      tax_amount: taxAmt,
      amount: totalAmt
    }
  }

  // Toggle between NON_GST and GST TAX QUOTATION
  const handleToggleQuotationType = (newType) => {
    setQuotationType(newType)
    setItems(prevItems => prevItems.map(it => calculateQuotationItem(it, newType, isIntraState)))
  }

  // Handle Place of Supply Change
  const handlePlaceOfSupplyChange = (newPlace) => {
    const val = newPlace || ''
    setPlaceOfSupply(val)
    const newIsIntra = !val || val.includes('33') || val.toLowerCase().includes('tamil nadu')
    setItems(prevItems => prevItems.map(it => calculateQuotationItem(it, quotationType, newIsIntra)))
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's')) {
        e.preventDefault()
        handleSubmit(e)
      } else if ((e.altKey && (e.key === 'a' || e.key === 'A')) || e.key === 'F2') {
        e.preventDefault()
        handleAddItem()
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        handleReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, customerName, customerPhone, customerAddress, sameAsDelivery, deliveryAddress, customerGstin, placeOfSupply, quotationNumber, quotationDate, quotationType, copyType, notes, settings])

  // Handle Category Selection
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

  // Handle Material Selection
  const handleMaterialSelect = (index, materialId) => {
    const selectedMat = materials.find(m => String(m.id) === String(materialId))
    
    if (selectedMat) {
      if (selectedMat.serial_tracking || selectedMat.has_serial) {
        fetchAvailableSerialsForMaterial(selectedMat.id)
      }
    }

    setItems(prevItems => {
      const updated = [...prevItems]
      if (selectedMat) {
        const curStock = parseFloat(selectedMat.current_stock ?? selectedMat.opening_stock ?? 0)
        const qty = Math.min(25, Math.max(1, parseFloat(updated[index].quantity) || 1))
        const hasSerial = Boolean(selectedMat.serial_tracking || selectedMat.has_serial)
        const qtyCount = Math.min(25, Math.max(1, Math.floor(qty)))
        const sArray = Array(qtyCount).fill('')

        const rawRate = parseFloat(selectedMat.selling_price) || 0
        const hasDiscount = Boolean(selectedMat.has_discount)
        const discountPercent = hasDiscount ? (parseFloat(selectedMat.discount_percent) || 0) : 0

        const baseItem = {
          ...updated[index],
          material_id: String(selectedMat.id),
          item_name: selectedMat.name || '',
          category_id: selectedMat.category_id ? String(selectedMat.category_id) : '',
          category_name: selectedMat.category_name || '',
          hsn_code: selectedMat.hsn_code || '',
          unit: selectedMat.unit || 'NOS',
          current_stock: curStock,
          original_rate: rawRate,
          rate: rawRate,
          has_discount: hasDiscount,
          discount_percent: discountPercent,
          has_serial: hasSerial,
          serial_numbers: sArray,
          serial_number: '',
          tax_inclusive: true
        }

        updated[index] = calculateQuotationItem(baseItem, quotationType, isIntraState)
      } else {
        updated[index] = {
          ...updated[index],
          material_id: '',
          item_name: '',
          current_stock: null,
          rate: 0,
          original_rate: 0,
          has_discount: false,
          discount_percent: 0,
          discount_amount: 0,
          tax_amount: 0,
          amount: 0,
          has_serial: false,
          serial_numbers: [''],
          serial_number: ''
        }
      }
      return updated
    })
  }

  // Handle generic Item field change
  const handleItemChange = (index, field, value) => {
    setItems(prevItems => {
      const updated = [...prevItems]
      let currentItem = { ...updated[index], [field]: value }

      if (field === 'quantity') {
        const numQty = parseFloat(value) || 0
        const cappedQty = Math.min(25, Math.max(0, numQty))
        currentItem.quantity = cappedQty

        if (currentItem.has_serial) {
          const qtyCount = Math.min(25, Math.max(1, Math.floor(cappedQty || 1)))
          const curSerials = currentItem.serial_numbers || ['']
          const newSerials = [...curSerials]
          if (newSerials.length < qtyCount) {
            while (newSerials.length < qtyCount) newSerials.push('')
          } else if (newSerials.length > qtyCount) {
            newSerials.splice(qtyCount)
          }
          currentItem.serial_numbers = newSerials
          currentItem.serial_number = newSerials.filter(Boolean).join(', ')
        }
      }

      if (field === 'has_discount' && !value) {
        currentItem.discount_percent = 0
        currentItem.discount_amount = 0
      }

      updated[index] = calculateQuotationItem(currentItem, quotationType, isIntraState)
      return updated
    })
  }

  // Handle Serial Number Change
  const handleSerialNumberChange = (itemIndex, serialIndex, value) => {
    setItems(prevItems => {
      const updated = [...prevItems]
      const currentItem = { ...updated[itemIndex] }
      const newSerials = [...(currentItem.serial_numbers || [''])]
      newSerials[serialIndex] = value
      currentItem.serial_numbers = newSerials
      currentItem.serial_number = newSerials.filter(Boolean).join(', ')
      updated[itemIndex] = currentItem
      return updated
    })

    if (value && value.trim()) {
      verifySerialWithDb(value.trim())
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
        tax_rate: quotationType === 'GST' ? (isIntraState ? (defaultCgst + defaultSgst) : defaultIgst) : 0,
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
        text: 'A quotation must have at least one line item.',
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

  // Reset Form
  const handleReset = () => {
    if (!isEditMode) {
      setQuotationDate(new Date().toISOString().split('T')[0])
      fetchNextQuotationNumber()
    }
    setCustomerType('Individual')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setCustomerAddress('')
    setSameAsDelivery(true)
    setDeliveryAddress('')
    setCustomerGstin('')
    setNotes('')
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
        tax_rate: 18.00,
        tax_amount: 0,
        amount: 0,
        has_serial: false,
        return_policy: false
      }
    ])
  }

  // Totals Calculation
  const totalGrossOrigAmt = useMemo(() => {
    return items.reduce((acc, it) => {
      const orig = parseFloat(it.original_rate ?? it.rate ?? 0)
      const q = parseFloat(it.quantity) || 0
      return acc + (orig * q)
    }, 0)
  }, [items])

  const totalDiscountSavings = useMemo(() => {
    return items.reduce((acc, it) => {
      const discAmt = parseFloat(it.discount_amount) || 0
      const q = parseFloat(it.quantity) || 0
      return acc + (discAmt * q)
    }, 0)
  }, [items])

  const taxableAmount = useMemo(() => {
    return items.reduce((acc, it) => {
      const qty = parseFloat(it.quantity) || 0
      const rate = parseFloat(it.rate) || 0
      return acc + (qty * rate)
    }, 0)
  }, [items])

  const cgstAmount = useMemo(() => {
    if (quotationType === 'NON_GST' || !isIntraState) return 0
    return parseFloat((taxableAmount * (defaultCgst / 100)).toFixed(2))
  }, [quotationType, isIntraState, taxableAmount, defaultCgst])

  const sgstAmount = useMemo(() => {
    if (quotationType === 'NON_GST' || !isIntraState) return 0
    return parseFloat((taxableAmount * (defaultSgst / 100)).toFixed(2))
  }, [quotationType, isIntraState, taxableAmount, defaultSgst])

  const igstAmount = useMemo(() => {
    if (quotationType === 'NON_GST' || isIntraState) return 0
    return parseFloat((taxableAmount * (defaultIgst / 100)).toFixed(2))
  }, [quotationType, isIntraState, taxableAmount, defaultIgst])

  const totalTax = useMemo(() => {
    if (quotationType === 'NON_GST') return 0
    return isIntraState ? (cgstAmount + sgstAmount) : igstAmount
  }, [quotationType, isIntraState, cgstAmount, sgstAmount, igstAmount])

  const rawGrandTotal = useMemo(() => {
    return taxableAmount + totalTax
  }, [taxableAmount, totalTax])

  const roundedGrandTotal = useMemo(() => {
    return Math.round(rawGrandTotal)
  }, [rawGrandTotal])

  const roundOff = useMemo(() => {
    return parseFloat((roundedGrandTotal - rawGrandTotal).toFixed(2))
  }, [roundedGrandTotal, rawGrandTotal])

  const amountInWords = useMemo(() => {
    return numberToIndianRupees(roundedGrandTotal)
  }, [roundedGrandTotal])

  // Validation
  const validateQuotation = () => {
    if (!quotationNumber.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Quotation Number Missing',
        text: 'Please enter a valid quotation number.',
        confirmButtonColor: '#043486'
      })
      return false
    }

    if (!customerName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Name Required',
        text: 'Please enter the customer / client name.',
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
        text: 'Please add at least one line item to the quotation.',
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
    }

    return true
  }

  // Handle Form Submission
  const handleSubmit = async (e, isSaveAndNew = false) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!validateQuotation()) return

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
        quotation_number: quotationNumber.trim(),
        quotation_date: quotationDate,
        quotation_type: quotationType,
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
        round_off: parseFloat(roundOff.toFixed(2)),
        total_amount: parseFloat(roundedGrandTotal.toFixed(2)),
        amount_in_words: amountInWords,
        quotation_status: quotationStatus || 'Draft',
        notes: notes.trim(),
        items: validItems
      }

      const url = isEditMode
        ? API_ENDPOINTS.QUOTATION_BY_ID(editId)
        : API_ENDPOINTS.QUOTATIONS

      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save quotation.')
      }

      const savedQuotation = {
        id: result.quotation_id || (isEditMode ? parseInt(editId, 10) : result.data?.id),
        ...payload,
        items: validItems
      }

      setPreviewQuotation(savedQuotation)

      // Success Alert with simple OK button that navigates to quotations list
      await Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Quotation Updated!' : 'Quotation Generated Successfully!',
        html: `Quotation <strong>#${payload.quotation_number}</strong> of <strong>₹${roundedGrandTotal.toLocaleString('en-IN')}</strong> has been saved.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#043486',
        allowEnterKey: true
      })

      navigate('/quotations/list')

    } catch (err) {
      console.error('Error saving quotation:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error Saving Quotation',
        text: err.message || 'Unable to save quotation to database.',
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
      const stockBadge = isOut ? '⚪ (0 stock)' : `🟢 Stock: ${curStock} ${m.unit || 'NOS'}`

      return {
        value: m.id,
        label: m.name,
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
      
      {/* 1. Page Header (Transparent Top Bar with Quotations List Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate('/quotations/list')}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-none transition-colors cursor-pointer"
              title="Back to Quotations List"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
              <FileText className="text-[#043486] dark:text-blue-400" size={22} />
              <span>{isEditMode ? `EDIT QUOTATION (#${quotationNumber})` : 'CREATE NEW QUOTATION'}</span>
              {isEditMode && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 text-[10px] font-bold uppercase">
                  Edit Mode
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {isEditMode ? 'Modify quotation details, line items, and update customer estimate.' : 'Generate customer quotation estimate with automated GST taxes, PDF generation and email delivery.'}
            </p>
          </div>
        </div>

        {/* Right Side: QUOTATIONS LIST Action Button */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="list"
            icon={List}
            onClick={() => navigate('/quotations/list')}
            className="text-xs font-semibold"
          >
            QUOTATIONS LIST
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 2. Responsive Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT MAIN COLUMN (8 COLS) ================= */}
          <div className="lg:col-span-8 space-y-6">

            {/* A. Quotation Specifications */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
                  <FileText size={16} />
                  <span>Quotation Specifications</span>
                </h2>

                {/* Non-GST / GST Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-none border border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleToggleQuotationType('NON_GST')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      quotationType === 'NON_GST'
                        ? 'bg-[#043486] text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    NON-GST QUOTATION
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleQuotationType('GST')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      quotationType === 'GST'
                        ? 'bg-[#043486] text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    GST TAX QUOTATION
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Quotation Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => {
                      const newDate = e.target.value
                      setQuotationDate(newDate)
                      if (!isEditMode && newDate) {
                        fetchNextQuotationNumber(newDate)
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
              </div>
            </div>

            {/* B. Customer Details */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-slate-800">
                <User size={16} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                  Estimate For / Customer Details
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
                      Customer Email ID <span className="text-gray-400 text-[11px] font-normal">(For Automatic Email Dispatch)</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter customer email (e.g. client@example.com)"
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
              title="Quotation Summary"
              billNumber={quotationNumber}
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
              saveButtonText={isEditMode ? 'Update Quotation (Ctrl+Enter)' : 'Save Quotation (Ctrl+Enter)'}
              onSave={(e) => handleSubmit(e, false)}
              onReset={handleReset}
              onCancel={isEditMode ? () => navigate('/quotations/list') : null}
            />
          </div>

        </div>

        {/* ================= MIDDLE SECTION: 100% FULL WIDTH LINE ITEMS ================= */}
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
          isQuotation={true}
        />

      </form>

      {/* Direct Printable Quotation Portal */}
      {previewQuotation && typeof document !== 'undefined' && createPortal(
        <div id="quotation-print-wrapper">
          <QuotationTemplate quotation={previewQuotation} settings={settings} />
        </div>,
        document.body
      )}

      {/* Quotation Modal for Preview, PDF Download & Email */}
      {previewQuotation && (
        <QuotationModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          quotation={previewQuotation}
          settings={settings}
          onQuotationUpdated={(updated) => setPreviewQuotation(updated)}
        />
      )}
    </div>
  )
}
