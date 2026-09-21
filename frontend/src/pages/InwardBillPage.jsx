import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Building2,
  FileText,
  RotateCcw,
  Save,
  IndianRupee,
  UploadCloud,
  FileCheck,
  X,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react'
import Swal from 'sweetalert2'
import SearchableSelect from '../components/common/SearchableSelect'
import InwardLineItems from '../components/inward/InwardLineItems'
import { API_ENDPOINTS } from '../config/api'

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

export default function InwardBillPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const editId = id || searchParams.get('id')
  const isEditMode = Boolean(editId)

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Materials & Settings from API
  const [materials, setMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [settings, setSettings] = useState(null)

  // Inward Meta Specifications
  const [inwardNumber, setInwardNumber] = useState('INW-2026-01')
  const [inwardDate, setInwardDate] = useState(getLocalDateString(new Date()))

  // Step 1: Supplier / Vendor Details
  const [supplierName, setSupplierName] = useState('')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [supplierEmail, setSupplierEmail] = useState('')
  const [supplierLocation, setSupplierLocation] = useState('33 - Tamil Nadu')
  const [supplierGstin, setSupplierGstin] = useState('')

  // Hardcopy Bill Upload (Cloudinary storage)
  const [uploadedBill, setUploadedBill] = useState(null)
  const [hardcopyUrl, setHardcopyUrl] = useState('')
  const [isUploadingBill, setIsUploadingBill] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Step 2: Inward Materials Line Items
  const [items, setItems] = useState([
    {
      material_id: '',
      item_name: '',
      description: '',
      hsn_code: '',
      quantity: 1,
      unit: 'NOS',
      rate: 0,
      amount: 0,
      has_serial: false,
      serial_numbers: ['']
    }
  ])

  // Top-Right Toast Notification Setup
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })

  // Load Materials, Settings & Next Inward Number (or Edit Inward Record) on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        const [matRes, catRes, setRes] = await Promise.all([
          fetch(API_ENDPOINTS.MATERIALS),
          fetch(API_ENDPOINTS.CATEGORIES),
          fetch(API_ENDPOINTS.SETTINGS)
        ])
        const matData = await matRes.json()
        const catData = await catRes.json()
        const setData = await setRes.json()

        if (matData.success && matData.materials) {
          setMaterials(matData.materials.filter(m => m.status === 'Active'))
        }
        if (catData.success && catData.categories) {
          setCategories(catData.categories.filter(c => c.status === 'Active'))
        }
        if (setData.success && setData.settings) {
          setSettings(setData.settings)
        }

        if (editId) {
          // Fetch existing inward record for editing
          const editRes = await fetch(API_ENDPOINTS.INWARD_BY_ID(editId))
          const editData = await editRes.json()
          if (editData.success && editData.inward) {
            const inv = editData.inward
            setInwardNumber(inv.inward_number || '')
            setInwardDate(getLocalDateString(inv.inward_date))
            setSupplierName(inv.supplier_name || '')
            setSupplierPhone(inv.supplier_phone || '')
            setSupplierEmail(inv.supplier_email || '')
            setSupplierLocation(inv.supplier_location || '33 - Tamil Nadu')
            setSupplierGstin(inv.supplier_gstin || '')
            setHardcopyUrl(inv.hardcopy_url || '')

            if (inv.items && inv.items.length > 0) {
              setItems(inv.items.map(it => {
                let serials = []
                if (Array.isArray(it.serial_numbers_list)) {
                  serials = it.serial_numbers_list
                } else if (typeof it.serial_numbers === 'string') {
                  try {
                    serials = JSON.parse(it.serial_numbers)
                  } catch (e) {
                    serials = it.serial_numbers.split(',').map(s => s.trim()).filter(Boolean)
                  }
                }
                return {
                  id: it.id,
                  material_id: it.material_id ? String(it.material_id) : '',
                  item_name: it.item_name || '',
                  description: it.description || '',
                  hsn_code: it.hsn_code || '',
                  quantity: parseFloat(it.quantity) || 1,
                  unit: it.unit || 'NOS',
                  rate: parseFloat(it.rate) || 0,
                  amount: parseFloat(it.amount) || 0,
                  has_serial: Boolean(it.has_serial),
                  serial_numbers: serials.length > 0 ? serials : ['']
                }
              }))
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Inward Entry Not Found',
              text: 'Could not load the specified inward record for editing.',
              confirmButtonColor: '#043486'
            }).then(() => navigate('/inward-list'))
          }
        } else {
          // New Inward: fetch next inward number
          try {
            const numRes = await fetch(API_ENDPOINTS.NEXT_INWARD_NUMBER)
            const numData = await numRes.json()
            if (numData.success && numData.nextInwardNumber) {
              setInwardNumber(numData.nextInwardNumber)
            }
          } catch (numErr) {
            console.error('Error fetching next inward number:', numErr)
          }
        }
      } catch (err) {
        console.error('Error fetching data for inward bill:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [editId])

  // Check if Place of Supply is Intra-State (Tamil Nadu)
  const isIntraState = supplierLocation.includes('33') || supplierLocation.toLowerCase().includes('tamil nadu')

  // Tax rates
  const defaultCgst = settings ? parseFloat(settings.cgst_rate) || 9.00 : 9.00
  const defaultSgst = settings ? parseFloat(settings.sgst_rate) || 9.00 : 9.00
  const defaultIgst = settings ? parseFloat(settings.igst_rate) || 18.00 : 18.00

  // Calculations
  const totalQuantity = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0)
  const totalTaxableAmount = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0)
  const cgstAmount = isIntraState ? (totalTaxableAmount * defaultCgst) / 100 : 0
  const sgstAmount = isIntraState ? (totalTaxableAmount * defaultSgst) / 100 : 0
  const igstAmount = !isIntraState ? (totalTaxableAmount * defaultIgst) / 100 : 0
  const totalTaxAmount = isIntraState ? (cgstAmount + sgstAmount) : igstAmount
  const grandTotalAmount = totalTaxableAmount + totalTaxAmount

  // Find Duplicate Serial Numbers across all line items
  const duplicateSerials = useMemo(() => {
    const counts = {}
    items.forEach(item => {
      if (item.has_serial && Array.isArray(item.serial_numbers)) {
        item.serial_numbers.forEach(s => {
          const trimmed = (s || '').trim().toLowerCase()
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1
          }
        })
      }
    })
    const duplicates = new Set()
    Object.entries(counts).forEach(([val, count]) => {
      if (count > 1) {
        duplicates.add(val)
      }
    })
    return duplicates
  }, [items])

  // Keyboard Shortcuts: Alt+A (Add Item), Ctrl+Enter (Save), Alt+R (Reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's')) {
        e.preventDefault()
        handleSubmit(e)
      } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        handleAddItem()
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        handleReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, supplierName, supplierPhone, supplierEmail, supplierLocation, supplierGstin, inwardDate, duplicateSerials])

  // State options for Location
  const stateOptions = INDIAN_STATES.map(st => ({
    value: st,
    label: st
  }))

  // Material dropdown options for SearchableSelect
  const materialOptions = materials.map(m => ({
    value: m.id,
    label: m.name,
    subLabel: `${m.category_name ? `[${m.category_name}] • ` : ''}Rate: ₹${m.selling_price || 0} / ${m.unit || 'NOS'}${m.hsn_code ? ` • HSN: ${m.hsn_code}` : ''}`
  }))

  // Handle Material Select (Auto-populates HSN, Unit, Rate as non-editable)
  const handleMaterialSelect = (index, materialId) => {
    const selectedMat = materials.find(m => String(m.id) === String(materialId))

    if (selectedMat) {
      // Check if item already selected in another row
      const isDuplicate = items.some((it, i) => i !== index && String(it.material_id) === String(materialId))
      if (isDuplicate) {
        Toast.fire({
          icon: 'warning',
          title: `"${selectedMat.name}" is already added to inward list.`
        })
      }
    }

    setItems(prev => {
      const updated = [...prev]
      if (selectedMat) {
        const qty = Math.min(25, Math.max(1, parseFloat(updated[index].quantity) || 1))
        const rate = parseFloat(selectedMat.purchase_price || selectedMat.selling_price || 0)
        const amt = qty * rate
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
          hsn_code: selectedMat.hsn_code || '',
          unit: selectedMat.unit || 'NOS',
          rate: rate,
          amount: parseFloat(amt.toFixed(2)),
          description: selectedMat.description || '',
          has_serial: hasSerial,
          serial_numbers: currentSerials
        }
      } else {
        updated[index] = {
          ...updated[index],
          material_id: '',
          item_name: '',
          hsn_code: '',
          rate: 0,
          amount: 0
        }
      }
      return updated
    })
  }

  // Handle Item Field Change with Max 25 Quantity Constraint
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev]
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

      const qty = parseFloat(field === 'quantity' ? finalVal : updated[index].quantity) || 0
      const rate = parseFloat(updated[index].rate) || 0
      const totalAmt = qty * rate
      updated[index].amount = parseFloat(totalAmt.toFixed(2))

      // Adjust serial numbers array length if quantity changes and has_serial is enabled
      if (field === 'quantity' && updated[index].has_serial) {
        const qtyCount = Math.min(25, Math.max(1, Math.floor(parseFloat(finalVal) || 1)))
        const existingSerials = updated[index].serial_numbers || []
        updated[index].serial_numbers = Array.from({ length: qtyCount }, (_, i) => existingSerials[i] || '')
      }

      return updated
    })
  }

  // Toggle Serial Number enable/disable
  const handleToggleSerial = (index) => {
    setItems(prev => {
      const updated = [...prev]
      const newHasSerial = !updated[index].has_serial
      const qtyCount = Math.min(25, Math.max(1, Math.floor(parseFloat(updated[index].quantity) || 1)))
      
      updated[index] = {
        ...updated[index],
        has_serial: newHasSerial,
        serial_numbers: newHasSerial
          ? Array.from({ length: qtyCount }, (_, i) => updated[index].serial_numbers?.[i] || '')
          : []
      }
      return updated
    })
  }

  // Handle individual serial number change
  const handleSerialNumberChange = (itemIndex, serialIndex, val) => {
    setItems(prev => {
      const updated = [...prev]
      const serials = [...(updated[itemIndex].serial_numbers || [])]
      serials[serialIndex] = val
      updated[itemIndex].serial_numbers = serials
      return updated
    })
  }

  // Add Item Row (Alt+A)
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        material_id: '',
        item_name: '',
        description: '',
        hsn_code: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        amount: 0,
        has_serial: false,
        serial_numbers: ['']
      }
    ])
  }

  // Duplicate Item Row (Shows toast)
  const handleDuplicateItem = (index) => {
    const itemToClone = items[index]
    const qtyCount = Math.min(25, Math.max(1, Math.floor(itemToClone.quantity || 1)))
    setItems(prev => [
      ...prev.slice(0, index + 1),
      {
        ...itemToClone,
        serial_numbers: itemToClone.has_serial
          ? Array.from({ length: qtyCount }, () => '')
          : []
      },
      ...prev.slice(index + 1)
    ])
    Toast.fire({
      icon: 'success',
      title: 'Line item duplicated'
    })
  }

  // Remove Item Row (Shows top-right SweetAlert toast)
  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      Swal.fire({
        icon: 'warning',
        title: 'At least one material required',
        text: 'An Inward bill must have at least one line item.',
        confirmButtonColor: '#043486'
      })
      return
    }
    const itemToRemove = items[index]
    const itemName = itemToRemove.item_name ? `"${itemToRemove.item_name}"` : `Item #${index + 1}`
    setItems(prev => prev.filter((_, i) => i !== index))
    Toast.fire({
      icon: 'info',
      title: `${itemName} deleted`
    })
  }

  // Helper function to compress images before uploading
  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      if (!file.type || !file.type.startsWith('image/')) {
        // For non-images (like PDF), return raw base64
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDimension = 1600 // High clarity while reducing file size drastically

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            } else {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Compress to JPEG with 0.75 quality (~80-90% smaller file size)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75)
          resolve(compressedBase64)
        }
        img.onerror = () => {
          resolve(e.target.result)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle File Upload (5MB limit & compression before uploading to Cloudinary)
  const handleFileUpload = async (file) => {
    if (!file) return

    // 1. Validation: Max Limit 5MB
    const MAX_SIZE_BYTES = 5 * 1024 * 1024
    if (file.size > MAX_SIZE_BYTES) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'The selected bill file exceeds the 5MB limit. Please upload a file under 5MB.',
        confirmButtonColor: '#043486'
      })
      return
    }

    // 2. Validation: Allowed File Types (Images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Format',
        text: 'Please upload an image (JPG, PNG, WEBP) or a PDF document.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setUploadedBill(file)
    setIsUploadingBill(true)

    try {
      // 3. Compress image on-the-fly
      const processedDataUrl = await compressImageFile(file)

      const res = await fetch(API_ENDPOINTS.CLOUDINARY_UPLOAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: processedDataUrl,
          folder: 'simcha_billing/inward_bills'
        })
      })
      const data = await res.json()
      if (data.success && data.url) {
        setHardcopyUrl(data.url)
        Toast.fire({
          icon: 'success',
          title: 'Bill compressed & uploaded to Cloudinary'
        })
      } else {
        setHardcopyUrl(processedDataUrl)
        Toast.fire({
          icon: 'info',
          title: 'Hardcopy bill attached'
        })
      }
    } catch (err) {
      console.error('Error uploading bill:', err)
      const rawBase64 = await new Promise((res) => {
        const r = new FileReader()
        r.onload = (e) => res(e.target.result)
        r.readAsDataURL(file)
      })
      setHardcopyUrl(rawBase64)
      Toast.fire({
        icon: 'info',
        title: 'Hardcopy bill attached'
      })
    } finally {
      setIsUploadingBill(false)
    }
  }

  const handleReset = () => {
    setSupplierName('')
    setSupplierPhone('')
    setSupplierEmail('')
    setSupplierLocation('33 - Tamil Nadu')
    setSupplierGstin('')
    setInwardDate(new Date().toISOString().split('T')[0])
    setUploadedBill(null)
    setHardcopyUrl('')
    setItems([
      {
        material_id: '',
        item_name: '',
        description: '',
        hsn_code: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        amount: 0,
        has_serial: false,
        serial_numbers: ['']
      }
    ])
  }

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!supplierName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Supplier Name Required',
        text: 'Please enter the Supplier / Company Name.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const validItems = items.filter(it => it.item_name && it.item_name.trim() !== '')
    if (validItems.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Materials Required',
        text: 'Please select at least one material/item.',
        confirmButtonColor: '#043486'
      })
      return
    }

    // 1. Check for Duplicate Serial Numbers within form
    const seenSerials = new Set()
    const duplicates = new Set()

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.item_name && it.has_serial && Array.isArray(it.serial_numbers)) {
        for (const sn of it.serial_numbers) {
          const clean = String(sn || '').trim()
          if (clean) {
            const lower = clean.toLowerCase()
            if (seenSerials.has(lower)) {
              duplicates.add(clean)
            }
            seenSerials.add(lower)
          }
        }
      }
    }

    if (duplicates.size > 0) {
      const duplicateList = Array.from(duplicates).join(', ')
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Serial Numbers',
        text: `Each serial number must be unique. Duplicate found in bill: "${duplicateList}"`,
        confirmButtonColor: '#043486'
      })
      return
    }

    // 2. Validate that all serial number fields are filled if has_serial is true
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.item_name && it.has_serial) {
        const count = Math.min(25, Math.max(1, Math.floor(parseFloat(it.quantity) || 1)))
        const serials = it.serial_numbers || []
        for (let s = 0; s < count; s++) {
          if (!serials[s] || !serials[s].trim()) {
            Swal.fire({
              icon: 'warning',
              title: 'Missing Serial Number',
              text: `Please enter Serial #${s + 1} for item "${it.item_name}" (Item ${i + 1}).`,
              confirmButtonColor: '#043486'
            })
            return
          }
        }
      }
    }

    // 3. Save to backend API (POST for new, PUT for edit)
    const saveInwardToBackend = async () => {
      try {
        setIsSaving(true)
        const payload = {
          inward_number: inwardNumber,
          inward_date: inwardDate,
          supplier_name: supplierName,
          supplier_phone: supplierPhone,
          supplier_email: supplierEmail,
          supplier_location: supplierLocation,
          supplier_gstin: supplierGstin,
          taxable_amount: totalTaxableAmount,
          cgst_rate: isIntraState ? defaultCgst : 0,
          cgst_amount: cgstAmount,
          sgst_rate: isIntraState ? defaultSgst : 0,
          sgst_amount: sgstAmount,
          igst_rate: !isIntraState ? defaultIgst : 0,
          igst_amount: igstAmount,
          total_tax: totalTaxAmount,
          total_amount: grandTotalAmount,
          total_quantity: totalQuantity,
          hardcopy_url: hardcopyUrl || null,
          items: validItems.map(it => ({
            material_id: it.material_id || null,
            item_name: it.item_name,
            description: it.description || '',
            hsn_code: it.hsn_code || '',
            quantity: parseFloat(it.quantity) || 1,
            unit: it.unit || 'NOS',
            rate: parseFloat(it.rate) || 0,
            amount: parseFloat(it.amount) || 0,
            has_serial: it.has_serial || false,
            serial_numbers: it.has_serial ? (it.serial_numbers || []).filter(s => s && s.trim()) : []
          }))
        }

        const url = isEditMode ? API_ENDPOINTS.INWARD_BY_ID(editId) : API_ENDPOINTS.INWARDS
        const method = isEditMode ? 'PUT' : 'POST'

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const data = await res.json()

        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: isEditMode ? 'Inward Entry Updated!' : 'Inward Entry Saved!',
            html: isEditMode
              ? `Inward <b>#${data.inwardNumber || inwardNumber}</b> for <b>${supplierName}</b> has been updated successfully!`
              : `Inward <b>#${data.inwardNumber || inwardNumber}</b> for <b>${supplierName}</b> with ${validItems.length} items (Total: <b>₹ ${grandTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>) saved successfully!`,
            confirmButtonColor: '#043486',
            confirmButtonText: 'Go to Inward List'
          })

          navigate('/inward-list')
        } else {
          Swal.fire({
            icon: 'error',
            title: isEditMode ? 'Failed to Update Inward' : 'Failed to Save Inward',
            text: data.message || 'Error occurred while saving inward bill.',
            confirmButtonColor: '#043486'
          })
        }
      } catch (err) {
        console.error('Error saving inward entry:', err)
        Swal.fire({
          icon: 'error',
          title: 'Server Error',
          text: err.message || 'Failed to connect to backend server. Please check connection.',
          confirmButtonColor: '#043486'
        })
      } finally {
        setIsSaving(false)
      }
    }

    saveInwardToBackend()
  }

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 space-y-6 pb-16 font-['Poppins',sans-serif]">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate('/inward-list')}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-none transition-colors cursor-pointer"
              title="Back to Inward List"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-[#292424] dark:text-white">
              {isEditMode ? `Edit Inward Bill (#${inwardNumber})` : 'Create Inward Bill'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? 'Update incoming stock quantities, supplier details, or serial numbers for this inward entry.'
                : 'Record incoming stock, vendor shipments and purchase materials into your shop inventory.'}
            </p>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950 px-3 py-1.5 border border-gray-200 dark:border-slate-800">
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Ctrl+Enter</kbd> {isEditMode ? 'Update' : 'Save'}</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Alt+A</kbd> Add Item</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Alt+R</kbd> Reset</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Top Grid: Supplier & Specifications (8 cols) + Inward Summary Card & Document Upload (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT MAIN COLUMN (8 COLS) ================= */}
          <div className="lg:col-span-8 space-y-6">

            {/* A. Inward Specifications */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
                  <FileText size={16} />
                  <span>Inward Specifications</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Inward Entry No
                  </label>
                  <input
                    type="text"
                    value={inwardNumber}
                    readOnly
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white font-mono font-bold bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-none cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Inward Date *
                  </label>
                  <input
                    type="date"
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* B. Supplier / Vendor Details */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-slate-800">
                <Building2 size={16} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                  Supplier / Vendor Details
                </h2>
              </div>

              <div className="space-y-4">
                
                {/* 1. Company Name / Supplier Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    required
                    placeholder="Supplier name"
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 2. Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Phone Number <span className="text-gray-400 text-[11px] font-normal">(10 Digits)</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={supplierPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setSupplierPhone(val)
                      }}
                      placeholder="Phone number"
                      className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-mono font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* 3. Email ID */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Email <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 4. Location / Place of Supply */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Location / Place of Supply *
                    </label>
                    <SearchableSelect
                      options={stateOptions}
                      value={supplierLocation}
                      onChange={(val) => setSupplierLocation(val || '33 - Tamil Nadu')}
                      placeholder="Select location"
                    />
                  </div>

                  {/* 5. Supplier GST No (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Supplier GST No <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={supplierGstin}
                      onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
                      placeholder="GSTIN (optional)"
                      className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white uppercase bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-mono font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: LIVE SUMMARY & HARDCOPY UPLOAD (4 COLS) ================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
            
            {/* 1. Inward Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
                  <IndianRupee size={16} />
                  <span>Inward Summary</span>
                </h2>
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-mono font-bold">
                  {inwardNumber}
                </span>
              </div>

              {/* Items Breakdown List (Item Name, Rate, Total Amount) */}
              <div className="space-y-3 text-xs text-gray-600 dark:text-slate-400">
                <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-none border border-gray-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-1 border-b border-gray-200 dark:border-slate-800">
                    <span>Item &amp; Rate</span>
                    <span>Total Amount</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {items.map((it, idx) => {
                      const hasName = it.item_name && it.item_name.trim() !== ''
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-slate-900 last:border-0">
                          <div className="truncate pr-2">
                            <span className="font-semibold text-gray-800 dark:text-slate-200">
                              {hasName ? it.item_name : `Item #${idx + 1}`}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-slate-400 ml-1">
                              ({it.quantity} {it.unit || 'NOS'} @ ₹{Number(it.rate || 0).toFixed(2)})
                            </span>
                          </div>
                          <span className="font-mono font-bold text-gray-900 dark:text-white shrink-0">
                            ₹ {Number(it.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-400">Total Items:</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{items.length} ({totalQuantity} Units)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-400">Taxable Amount:</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-slate-200">
                        ₹ {totalTaxableAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* GST Section (Neutral normal text color per user request) */}
                    {isIntraState ? (
                      <>
                        <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                          <span>CGST ({defaultCgst}%):</span>
                          <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">₹ {cgstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                          <span>SGST ({defaultSgst}%):</span>
                          <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">₹ {sgstAmount.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                        <span>IGST ({defaultIgst}%):</span>
                        <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">₹ {igstAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#292424] dark:text-white">Grand Total</span>
                  <span className="text-2xl font-black text-[#043486] dark:text-blue-400 font-mono">
                    ₹ {grandTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Just Save & Reset */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-sm rounded-none shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Inward' : 'Save')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-medium text-xs rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset Form (Alt+R)</span>
                </button>
              </div>

            </div>

            {/* 2. Upload Hardcopy / Purchase Bill (Compact Sleek Dropzone) */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-4 shadow-sm space-y-2.5 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-xs font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-1.5">
                  <UploadCloud size={14} />
                  <span>Hardcopy / Bill Document</span>
                </h2>
                <span className="text-[9.5px] text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wider">Optional</span>
              </div>

              {!uploadedBill ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0])
                    }
                  }}
                  className={`border-2 border-dashed py-3 px-3 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#043486] bg-blue-50/50 dark:bg-blue-950/30'
                      : isUploadingBill
                      ? 'border-blue-400 bg-blue-50/30 dark:bg-slate-800/40 cursor-wait'
                      : 'border-gray-300 dark:border-slate-700 hover:border-[#043486] dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => !isUploadingBill && document.getElementById('hardcopy-file-input')?.click()}
                >
                  <input
                    id="hardcopy-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0])
                      }
                    }}
                  />
                  <div className="flex items-center justify-center gap-2.5">
                    {isUploadingBill ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#043486] border-t-transparent rounded-full animate-spin shrink-0" />
                        <p className="text-xs font-bold text-[#043486] dark:text-blue-400">Uploading document...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-none bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-400 flex items-center justify-center shrink-0">
                          <UploadCloud size={15} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                            Upload Bill / Invoice
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">
                            Click to browse (Image or PDF)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-none">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 shrink-0 bg-blue-100 dark:bg-blue-950/80 text-[#043486] dark:text-blue-400 flex items-center justify-center">
                        <FileCheck size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate" title={uploadedBill.name}>
                          {uploadedBill.name}
                        </p>
                        <p className="text-[9.5px] text-gray-500 dark:text-slate-400 font-mono">
                          {(uploadedBill.size / (1024 * 1024)).toFixed(2)} MB • Attached
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedBill(null)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove attached document"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ================= MIDDLE SECTION: 100% FULL WIDTH INWARD MATERIALS / LINE ITEMS ================= */}
        <InwardLineItems
          items={items}
          materialOptions={materialOptions}
          duplicateSerials={duplicateSerials}
          onMaterialSelect={handleMaterialSelect}
          onItemChange={handleItemChange}
          onToggleSerial={handleToggleSerial}
          onSerialNumberChange={handleSerialNumberChange}
          onAddItem={handleAddItem}
          onDuplicateItem={handleDuplicateItem}
          onRemoveItem={handleRemoveItem}
        />

      </form>
    </div>
  )
}
