import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  Wrench,
  Plus,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  User,
  Phone,
  IndianRupee,
  Calendar,
  FileDigit,
  FileText,
  Hash,
  AlertCircle,
  CheckSquare,
  Square,
  Percent
} from 'lucide-react'
import Swal from 'sweetalert2'
import SearchableSelect from '../components/common/SearchableSelect'
import ServiceInvoiceTemplate from '../components/invoice/ServiceInvoiceTemplate'
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

export default function CreateServiceBillPage({ setActiveRoute }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editId = searchParams.get('editId')
  const isEditMode = Boolean(editId)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Settings
  const [settings, setSettings] = useState(null)

  // Service Meta
  const [serviceNumber, setServiceNumber] = useState('SIS-SR/2026-27/0001')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [serviceType, setServiceType] = useState('GST')
  const [customTaxRate, setCustomTaxRate] = useState(18.0)
  const [copyType, setCopyType] = useState('ORIGINAL')
  const [placeOfSupply, setPlaceOfSupply] = useState('33 - Tamil Nadu')

  // Printable Service Data state for window.print()
  const [previewService, setPreviewService] = useState(null)

  // Customer Information
  const [customerType, setCustomerType] = useState('Individual')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerGstin, setCustomerGstin] = useState('')

  // Payment & Remarks
  const [paymentMode, setPaymentMode] = useState('')
  const [serviceStatus, setServiceStatus] = useState('Received')
  const [notes, setNotes] = useState('')

  // Line items state
  const [items, setItems] = useState([
    {
      product_name: '',
      brand_model: '',
      issue_description: '',
      quantity: 1,
      unit: 'NOS',
      rate: 0,
      hsn_code: '9987',
      tax_rate: 18.0,
      tax_amount: 0,
      amount: 0,
      has_serial: false,
      serial_numbers: ['']
    }
  ])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)

      const settingsRes = await fetch(API_ENDPOINTS.SETTINGS)
      const settingsData = await settingsRes.json()
      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings)
        const cgst = parseFloat(settingsData.settings.cgst_rate ?? 9.0)
        const sgst = parseFloat(settingsData.settings.sgst_rate ?? 9.0)
        setCustomTaxRate(cgst + sgst)
      }

      if (isEditMode) {
        const editRes = await fetch(API_ENDPOINTS.SERVICE_BY_ID(editId))
        const editData = await editRes.json()
        if (editData.success && editData.service) {
          const s = editData.service
          setServiceNumber(s.service_number || '')
          setServiceDate(s.service_date ? s.service_date.split('T')[0] : new Date().toISOString().split('T')[0])
          setServiceType(s.service_type || 'GST')
          setCopyType(s.copy_type || 'ORIGINAL')
          setPlaceOfSupply(s.place_of_supply || '33 - Tamil Nadu')
          setCustomerType(s.customer_type || 'Individual')
          setCustomerName(s.customer_name || '')
          setCustomerPhone(s.customer_phone || '')
          setCustomerEmail(s.customer_email || '')
          setCustomerAddress(s.customer_address || '')
          setCustomerGstin(s.customer_gstin || '')
          setPaymentMode(s.payment_mode || '')
          setServiceStatus(s.service_status || 'Received')
          setNotes(s.notes || '')

          if (s.cgst_rate && s.sgst_rate) {
            setCustomTaxRate(parseFloat(s.cgst_rate) + parseFloat(s.sgst_rate))
          }

          if (s.items && s.items.length > 0) {
            setItems(
              s.items.map((it) => {
                let serials = ['']
                if (it.serial_numbers) {
                  try {
                    serials = typeof it.serial_numbers === 'string' && it.serial_numbers.startsWith('[')
                      ? JSON.parse(it.serial_numbers)
                      : it.serial_numbers.split(',').map((x) => x.trim())
                  } catch {
                    serials = it.serial_numbers.split(',').map((x) => x.trim())
                  }
                } else if (it.serial_number) {
                  serials = it.serial_number.split(',').map((x) => x.trim())
                }
                return {
                  material_id: it.material_id || '',
                  product_name: it.product_name || it.item_name || '',
                  brand_model: it.brand_model || '',
                  issue_description: it.issue_description || '',
                  quantity: parseFloat(it.quantity) || 1,
                  unit: it.unit || 'NOS',
                  rate: parseFloat(it.rate) || 0,
                  hsn_code: it.hsn_code || '9987',
                  tax_rate: parseFloat(it.tax_rate) || 18.0,
                  tax_amount: parseFloat(it.tax_amount) || 0,
                  amount: parseFloat(it.amount) || 0,
                  has_serial: Boolean(it.has_serial || (serials.length > 0 && serials[0])),
                  serial_numbers: serials.length > 0 ? serials : [''],
                  return_policy: Boolean(it.return_policy)
                }
              })
            )
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Not Found',
            text: 'Service request record could not be found for editing.',
            confirmButtonColor: '#043486'
          })
          navigate('/services/list')
        }
      } else {
        await fetchNextServiceNumber()
      }
    } catch (err) {
      console.error('Error loading initial service data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNextServiceNumber = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.NEXT_SERVICE_NUMBER)
      const data = await res.json()
      if (data.success && data.nextServiceNumber) {
        setServiceNumber(data.nextServiceNumber)
      }
    } catch (err) {
      console.error('Failed to fetch next service number:', err)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [editId])

  // Place of Supply Change Handler
  const handlePlaceOfSupplyChange = (value) => {
    setPlaceOfSupply(value)
  }

  // GST Rates from settings & state
  const isIntraState = placeOfSupply.startsWith('33')
  const activeTaxRate = serviceType === 'NON_GST' ? 0 : parseFloat(customTaxRate) || 0
  const activeCgst = isIntraState ? parseFloat((activeTaxRate / 2).toFixed(2)) : 0
  const activeSgst = isIntraState ? parseFloat((activeTaxRate / 2).toFixed(2)) : 0
  const activeIgst = !isIntraState ? activeTaxRate : 0

  // Line Item Calculations
  const calculateItemRow = (item, currentServiceType = serviceType, tRateVal = customTaxRate) => {
    const qty = parseFloat(item.quantity) || 0
    const rate = parseFloat(item.rate) || 0
    const rawTotal = qty * rate

    if (currentServiceType === 'NON_GST') {
      return {
        ...item,
        tax_rate: 0,
        tax_amount: 0,
        amount: rawTotal
      }
    }

    const tRate = parseFloat(tRateVal) || 0
    const taxable = tRate > 0 ? rawTotal / (1 + tRate / 100) : rawTotal
    const taxAmt = rawTotal - taxable

    return {
      ...item,
      tax_rate: tRate,
      tax_amount: parseFloat(taxAmt.toFixed(2)),
      amount: parseFloat(rawTotal.toFixed(2))
    }
  }

  // Handle Toggle Service Type (GST vs NON_GST)
  const handleToggleServiceType = (type) => {
    setServiceType(type)
    setItems((prev) =>
      prev.map((item) => calculateItemRow(item, type, customTaxRate))
    )
  }

  // Handle Tax Rate Change
  const handleCustomTaxRateChange = (rateVal) => {
    const numericRate = parseFloat(rateVal) || 0
    setCustomTaxRate(rateVal)
    if (serviceType === 'GST') {
      setItems((prev) =>
        prev.map((item) => calculateItemRow(item, 'GST', numericRate))
      )
    }
  }

  // Update Line Item
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev]
      const current = { ...updated[index], [field]: value }

      if (field === 'quantity') {
        const qtyVal = Math.max(1, Math.floor(parseFloat(value) || 1))
        current.quantity = qtyVal

        // Adjust serial numbers array length if serial tracking is on
        if (current.has_serial) {
          const currentSerials = current.serial_numbers || []
          current.serial_numbers = Array.from(
            { length: qtyVal },
            (_, i) => currentSerials[i] || ''
          )
        }

        const recalculated = calculateItemRow(current, serviceType)
        updated[index] = recalculated
      } else if (field === 'rate') {
        const recalculated = calculateItemRow(current, serviceType)
        updated[index] = recalculated
      } else {
        updated[index] = current
      }
      return updated
    })
  }

  // Toggle Serial Number Checkbox for a Row
  const handleToggleSerial = (index) => {
    setItems((prev) => {
      const updated = [...prev]
      const current = updated[index]
      const nextHasSerial = !current.has_serial
      const qtyCount = Math.max(1, Math.floor(parseFloat(current.quantity) || 1))

      updated[index] = {
        ...current,
        has_serial: nextHasSerial,
        serial_numbers: nextHasSerial
          ? (current.serial_numbers && current.serial_numbers.length === qtyCount)
            ? current.serial_numbers
            : Array.from({ length: qtyCount }, (_, i) => (current.serial_numbers && current.serial_numbers[i]) || '')
          : []
      }
      return updated
    })
  }

  // Handle Serial Number Input Change
  const handleSerialNumberChange = (itemIndex, serialIndex, val) => {
    setItems((prev) => {
      const updated = [...prev]
      const current = updated[itemIndex]
      const serials = [...(current.serial_numbers || [])]
      serials[serialIndex] = val
      updated[itemIndex] = {
        ...current,
        serial_numbers: serials
      }
      return updated
    })
  }

  // Find Duplicate Serial Numbers across all line items
  const duplicateSerials = useMemo(() => {
    const counts = {}
    items.forEach((item) => {
      if (item.has_serial && Array.isArray(item.serial_numbers)) {
        item.serial_numbers.forEach((s) => {
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

  // Add Item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_name: '',
        brand_model: '',
        issue_description: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        hsn_code: '9987',
        tax_rate: serviceType === 'GST' ? activeTaxRate : 0,
        tax_amount: 0,
        amount: 0,
        has_serial: false,
        serial_numbers: ['']
      }
    ])
  }

  // Remove Item
  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      setItems([
        {
          product_name: '',
          brand_model: '',
          issue_description: '',
          quantity: 1,
          unit: 'NOS',
          rate: 0,
          hsn_code: '9987',
          tax_rate: serviceType === 'GST' ? activeTaxRate : 0,
          tax_amount: 0,
          amount: 0,
          has_serial: false,
          serial_numbers: ['']
        }
      ])
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Duplicate Item
  const handleDuplicateItem = (index) => {
    const target = items[index]
    setItems((prev) => [
      ...prev.slice(0, index + 1),
      {
        ...target,
        serial_numbers: target.has_serial
          ? Array.from({ length: target.quantity || 1 }, () => '')
          : []
      },
      ...prev.slice(index + 1)
    ])
  }

  // Summary Computations
  const subtotal = useMemo(() => {
    return items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
  }, [items])

  const { taxableAmount, cgstAmount, sgstAmount, igstAmount, totalTax } = useMemo(() => {
    if (serviceType === 'NON_GST') {
      return {
        taxableAmount: subtotal,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0
      }
    }

    let totalTaxAmt = 0
    let totalTaxable = 0

    items.forEach((item) => {
      const itemAmt = parseFloat(item.amount) || 0
      const tRate = activeTaxRate
      const taxable = itemAmt / (1 + tRate / 100)
      const taxAmt = itemAmt - taxable

      totalTaxable += taxable
      totalTaxAmt += taxAmt
    })

    if (isIntraState) {
      const halfTax = totalTaxAmt / 2
      return {
        taxableAmount: totalTaxable,
        cgstAmount: halfTax,
        sgstAmount: halfTax,
        igstAmount: 0,
        totalTax: totalTaxAmt
      }
    } else {
      return {
        taxableAmount: totalTaxable,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: totalTaxAmt,
        totalTax: totalTaxAmt
      }
    }
  }, [items, serviceType, isIntraState, activeTaxRate, subtotal])

  const rawGrandTotal = serviceType === 'NON_GST' ? subtotal : taxableAmount + totalTax
  const roundedGrandTotal = Math.round(rawGrandTotal)
  const roundOff = parseFloat((roundedGrandTotal - rawGrandTotal).toFixed(2))
  const amountInWords = useMemo(
    () => numberToIndianRupees(roundedGrandTotal),
    [roundedGrandTotal]
  )

  // Keyboard Shortcuts (Alt+A: Add, Alt+R: Reset, Ctrl+Enter: Save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        handleAddItem()
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        handleReset()
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, customerName, customerPhone, serviceNumber, roundedGrandTotal, duplicateSerials])

  const handleReset = () => {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setCustomerAddress('')
    setCustomerGstin('')
    setPaymentMode('')
    setServiceStatus('Received')
    setNotes('')
    setServiceDate(new Date().toISOString().split('T')[0])
    setItems([
      {
        product_name: '',
        brand_model: '',
        issue_description: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        hsn_code: '9987',
        tax_rate: serviceType === 'GST' ? activeTaxRate : 0,
        tax_amount: 0,
        amount: 0,
        has_serial: false,
        serial_numbers: ['']
      }
    ])
    fetchNextServiceNumber()
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!customerName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Name Required',
        text: 'Please enter the Customer / Client name.',
        confirmButtonColor: '#043486'
      })
      return
    }

    if (customerPhone.trim() && customerPhone.trim().length !== 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Mobile Number',
        text: 'Mobile number must be exactly 10 digits.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const validItems = items.filter(
      (item) => item.product_name && item.product_name.trim()
    )
    if (validItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Valid Products',
        text: 'Please enter at least one Product name in the table.',
        confirmButtonColor: '#043486'
      })
      return
    }

    // Duplicate Serial Check
    if (duplicateSerials.size > 0) {
      const duplicateList = Array.from(duplicateSerials).join(', ')
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
      }).fire({
        icon: 'error',
        title: 'Duplicate Serial Numbers!',
        text: `Duplicate serials found: "${duplicateList}". Please ensure all serials are unique.`
      })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        service_number: serviceNumber.trim(),
        service_date: serviceDate,
        service_type: serviceType,
        copy_type: copyType,
        customer_type: customerType || 'Individual',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        customer_address: customerAddress.trim(),
        customer_gstin: customerGstin.trim(),
        place_of_supply: placeOfSupply,
        taxable_amount: parseFloat(taxableAmount.toFixed(2)),
        cgst_rate: activeCgst,
        cgst_amount: parseFloat(cgstAmount.toFixed(2)),
        sgst_rate: activeSgst,
        sgst_amount: parseFloat(sgstAmount.toFixed(2)),
        igst_rate: activeIgst,
        igst_amount: parseFloat(igstAmount.toFixed(2)),
        total_tax: parseFloat(totalTax.toFixed(2)),
        round_off: roundOff,
        total_amount: roundedGrandTotal,
        amount_in_words: amountInWords,
        payment_mode: paymentMode || null,
        service_status: serviceStatus || 'Received',
        notes: notes.trim(),
        items: validItems.map((it) => ({
          ...it,
          item_name: it.product_name.trim(),
          serial_number: it.has_serial
            ? (it.serial_numbers || []).filter((s) => s && s.trim()).join(', ')
            : null,
          serial_numbers: it.has_serial
            ? (it.serial_numbers || []).filter((s) => s && s.trim())
            : []
        }))
      }

      const url = isEditMode ? API_ENDPOINTS.SERVICE_BY_ID(editId) : API_ENDPOINTS.SERVICES
      const method = isEditMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || (isEditMode ? 'Failed to update service request.' : 'Failed to save service request.'))
      }

      const savedServiceData = {
        ...payload,
        id: isEditMode ? editId : (data.serviceId || data.id),
        items: validItems.map((it) => ({
          ...it,
          item_name: it.product_name.trim(),
          serial_number: it.has_serial
            ? (it.serial_numbers || []).filter((s) => s && s.trim()).join(', ')
            : null,
          serial_numbers: it.has_serial
            ? (it.serial_numbers || []).filter((s) => s && s.trim())
            : []
        }))
      }

      // 1. Mount invoice template to DOM
      setPreviewService(savedServiceData)

      // 2. Alert user
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Service Request Updated Successfully!' : 'Service Request Created Successfully!',
        text: `Service #${serviceNumber} ${isEditMode ? 'updated' : 'saved'}. Auto-opening print...`,
        showConfirmButton: false,
        timer: 1200
      })

      // 3. Print and redirect / reset
      setTimeout(() => {
        window.print()
        if (isEditMode) {
          navigate('/services/list')
        } else {
          handleReset()
        }
      }, 450)
    } catch (err) {
      console.error('Error saving service bill:', err)
      Swal.fire({
        icon: 'error',
        title: isEditMode ? 'Update Failed' : 'Save Failed',
        text: err.message || 'Failed to save service request.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-['Poppins',sans-serif]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
            <Wrench className="text-[#043486] dark:text-blue-400" size={22} />
            <span>{isEditMode ? `EDIT SERVICE REQUEST (${serviceNumber})` : 'NEW SERVICE REQUEST'}</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {isEditMode
              ? 'Update existing service job specifications, customer data, and line items'
              : 'Record incoming service products, models, reported issues & repair estimates'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 gap-1.5 font-medium">
            <span>Home</span>
            <span>›</span>
            <span>Services</span>
            <span>›</span>
            <span className="text-[#043486] dark:text-blue-400 font-semibold">
              {isEditMode ? 'Edit Request' : 'New Request'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (setActiveRoute) setActiveRoute('all-services')
              navigate('/services/list')
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Service List</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT MAIN COLUMN (8 COLS) ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Service Specifications */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileDigit size={16} className="text-[#043486] dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                    Service Specifications
                  </h2>
                </div>

                {/* Non-GST / GST Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-none border border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleToggleServiceType('NON_GST')}
                    className={`px-3 py-1 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      serviceType === 'NON_GST'
                        ? 'bg-[#043486] text-white shadow-xs'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    NON-GST
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleServiceType('GST')}
                    className={`px-3 py-1 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      serviceType === 'GST'
                        ? 'bg-[#043486] text-white shadow-xs'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    GST TAX INVOICE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Service Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Service Date <span className="text-blue-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500"
                  />
                </div>

                {/* Place of Supply */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Place of Supply <span className="text-blue-500">*</span>
                  </label>
                  <SearchableSelect
                    options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                    value={placeOfSupply}
                    onChange={handlePlaceOfSupplyChange}
                    placeholder="Select State..."
                  />
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Customer Type <span className="text-blue-500">*</span>
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Individual">Individual (Customer)</option>
                    <option value="Company">Company / Business</option>
                  </select>
                </div>

                {/* Tax Rate % (Editable / Type-able) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Tax Rate (%) {serviceType === 'NON_GST' && <span className="text-gray-400 font-normal">(0% Non-GST)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      disabled={serviceType === 'NON_GST'}
                      value={serviceType === 'NON_GST' ? 0 : customTaxRate}
                      onChange={(e) => handleCustomTaxRateChange(e.target.value)}
                      placeholder="18"
                      className={`w-full pl-3 pr-8 py-2.5 text-xs font-mono font-bold text-[#043486] dark:text-blue-400 rounded-none border focus:outline-none ${
                        serviceType === 'NON_GST'
                          ? 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700 cursor-not-allowed opacity-60'
                          : 'bg-white dark:bg-slate-950 border-gray-300 dark:border-slate-700 focus:border-[#043486] dark:focus:border-blue-500'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs font-bold font-mono">
                      %
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Bill To / Customer Details */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-slate-800">
                <User size={16} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                  Customer &amp; Client Information
                </h2>
              </div>

              <div className="space-y-4">
                {/* 1st row: Customer / Client Name - Mobile / Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      {customerType === 'Company' ? 'Company / Client Name' : 'Customer / Client Name'}{' '}
                      <span className="text-blue-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={
                        customerType === 'Company'
                          ? 'Enter company / enterprise name'
                          : 'Enter customer / client full name'
                      }
                      className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Mobile / Phone Number{' '}
                      <span className="text-gray-400 text-[11px] font-normal">(10 Digits)</span>
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
                      Customer Email ID{' '}
                      <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
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
                      {customerType === 'Company' ? 'Company GSTIN' : 'Customer GSTIN'}{' '}
                      <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
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
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Billing Address
                  </label>
                  <textarea
                    rows={3}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter billing address"
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SUMMARY COLUMN (4 COLS) ================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
                  <IndianRupee size={16} />
                  <span>Service Summary</span>
                </h2>
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-mono font-bold">
                  {serviceNumber}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Taxable Amount</span>
                  <span className="font-medium font-mono text-gray-900 dark:text-white">
                    ₹{' '}
                    {taxableAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                {isIntraState ? (
                  <>
                    <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                      <span>CGST ({activeCgst}%)</span>
                      <span className="font-mono text-gray-800 dark:text-slate-200">
                        ₹{' '}
                        {cgstAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                      <span>SGST ({activeSgst}%)</span>
                      <span className="font-mono text-gray-800 dark:text-slate-200">
                        ₹{' '}
                        {sgstAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                    <span>IGST ({activeIgst}%)</span>
                    <span className="font-mono text-gray-800 dark:text-slate-200">
                      ₹{' '}
                      {igstAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Total Tax</span>
                  <span className="font-medium font-mono text-blue-900 dark:text-blue-300">
                    ₹{' '}
                    {totalTax.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                {roundOff !== 0 && (
                  <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs">
                    <span>Round Off</span>
                    <span className="font-mono">
                      {roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#292424] dark:text-white">
                    Service Total
                  </span>
                  <span className="text-2xl font-black text-[#043486] dark:text-blue-400 font-mono">
                    ₹{' '}
                    {roundedGrandTotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                {/* Amount in words */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-none">
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Amount in Words
                  </span>
                  <p className="text-xs font-semibold text-[#043486] dark:text-blue-300 mt-0.5 capitalize leading-relaxed">
                    {amountInWords}
                  </p>
                </div>

                {settings && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-none border border-gray-200 dark:border-slate-800 text-[11px] text-gray-600 dark:text-slate-400 space-y-0.5">
                    <p className="font-semibold text-gray-800 dark:text-slate-200">
                      Bank: {settings.bank_name} ({settings.branch || 'Main'})
                    </p>
                    <p>
                      A/C:{' '}
                      <span className="font-mono text-gray-900 dark:text-white font-bold">
                        {settings.account_no}
                      </span>{' '}
                      | IFSC:{' '}
                      <span className="font-mono text-gray-900 dark:text-white font-bold">
                        {settings.ifsc_code}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-sm rounded-none shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{isEditMode ? 'Update Service Request (Ctrl+Enter)' : 'Save Service Request (Ctrl+Enter)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isEditMode) {
                      navigate('/services/list')
                    } else {
                      handleReset()
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-medium text-xs rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{isEditMode ? 'Cancel Edit / Back to List' : 'Reset Form (Alt+R)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MIDDLE SECTION: CUSTOM SERVICE PRODUCTS & REPAIR TABLE ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors w-full">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-[#043486] dark:text-blue-400" />
              <h2 className="text-base font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                Service Description &amp; Spare Parts ({items.length})
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

          {/* Clean Aligned Service Table */}
          <div className="space-y-4">
            {items.map((item, index) => {
              const qtyCount = Math.max(1, Math.floor(parseFloat(item.quantity) || 1))
              const serialsList = item.serial_numbers || []

              return (
                <div
                  key={index}
                  className="p-4 rounded-none border border-gray-300 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/60 hover:border-[#043486] dark:hover:border-blue-600 transition-all space-y-3"
                >
                  {/* Main Service Row (Horizontal Layout) */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2.5">
                    {/* 1. Item Index */}
                    <div className="shrink-0 flex items-center">
                      <span className="w-8 h-[38px] bg-[#043486] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                    </div>

                    {/* 2. Product Name (e.g. Laptop, Monitor, Printer) */}
                    <div className="flex-[1.4] min-w-[120px]">
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1">
                        Product <span className="text-blue-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.product_name}
                        onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                        placeholder="Enter Product name"
                        className="w-full px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-semibold h-[38px]"
                      />
                    </div>

                    {/* 3. Brand / Model (e.g. Dell Inspiron 15, HP LaserJet) */}
                    <div className="flex-1 min-w-[100px]">
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1">
                        Brand / Model
                      </label>
                      <input
                        type="text"
                        value={item.brand_model}
                        onChange={(e) => handleItemChange(index, 'brand_model', e.target.value)}
                        placeholder="Brand / Model"
                        className="w-full px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium h-[38px]"
                      />
                    </div>

                    {/* 4. Issue / Reported Problem */}
                    <div className="flex-1 min-w-[100px]">
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1">
                        Issue
                      </label>
                      <input
                        type="text"
                        value={item.issue_description}
                        onChange={(e) => handleItemChange(index, 'issue_description', e.target.value)}
                        placeholder="Enter issue"
                        className="w-full px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium h-[38px]"
                      />
                    </div>

                    {/* 5. Quantity */}
                    <div className="w-full sm:w-16 shrink-0">
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1 text-center">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-1.5 py-1.5 text-xs text-center font-bold text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 h-[38px]"
                      />
                    </div>

                    {/* 6. Rate (₹) */}
                    <div className="w-full sm:w-24 shrink-0">
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1 text-right">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-xs text-right font-bold text-[#043486] dark:text-blue-400 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-mono h-[38px]"
                      />
                    </div>

                    {/* 7. Amount (₹) */}
                    <div className="w-full sm:w-28 shrink-0">
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1 text-right">
                        Amount (₹)
                      </label>
                      <div className="px-2 py-1.5 text-xs text-right font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-none font-mono h-[38px] flex items-center justify-end">
                        ₹{' '}
                        {parseFloat(item.amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </div>

                    {/* 8. Actions (Duplicate & Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(index)}
                        title="Duplicate Row"
                        className="w-[38px] h-[38px] text-gray-500 hover:text-blue-600 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:border-blue-500 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        title="Delete Row"
                        className="w-[38px] h-[38px] text-gray-500 hover:text-red-600 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:border-red-500 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Right-Bottom Checkbox: Serial Number Option */}
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-gray-400 dark:text-slate-500">
                      {item.product_name && (
                        <span>
                          Product: <b>{item.product_name}</b> {item.brand_model ? `(${item.brand_model})` : ''}
                        </span>
                      )}
                    </div>

                    <label
                      onClick={() => handleToggleSerial(index)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer select-none hover:text-[#043486] dark:hover:text-blue-400 transition-colors"
                    >
                      {item.has_serial ? (
                        <CheckSquare size={16} className="text-[#043486] dark:text-blue-400" />
                      ) : (
                        <Square size={16} className="text-gray-400" />
                      )}
                      <span>Has Serial Number?</span>
                    </label>
                  </div>

                  {/* Dynamic Serial Number Input Fields (when checked) */}
                  {item.has_serial && (
                    <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-none space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs font-bold text-[#043486] dark:text-blue-300">
                        <span className="flex items-center gap-1.5">
                          <Hash size={14} />
                          <span>Enter Serial Number ({qtyCount} item{qtyCount > 1 ? 's' : ''})</span>
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 font-normal">
                          Provide unique hardware serial / barcode number
                        </span>
                      </div>

                      {/* 3 Fields per row on desktop (grid-cols-1 sm:grid-cols-2 md:grid-cols-3) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Array.from({ length: qtyCount }).map((_, sIdx) => {
                          const serialVal = serialsList[sIdx] || ''
                          const isDuplicate =
                            serialVal.trim() !== '' &&
                            duplicateSerials.has(serialVal.trim().toLowerCase())

                          return (
                            <div key={sIdx} className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs font-mono font-bold">
                                #{sIdx + 1}
                              </div>
                              <input
                                type="text"
                                value={serialVal}
                                onChange={(e) =>
                                  handleSerialNumberChange(index, sIdx, e.target.value)
                                }
                                placeholder={`Serial #${sIdx + 1}`}
                                className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-mono text-[#292424] dark:text-white rounded-none focus:outline-none transition-colors ${
                                  isDuplicate
                                    ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-500 text-red-700 dark:text-red-300 focus:border-red-600'
                                    : 'bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-[#043486] dark:focus:border-blue-500'
                                } placeholder:text-gray-400 dark:placeholder:text-slate-500`}
                              />
                              {isDuplicate && (
                                <div
                                  title="Duplicate serial number detected!"
                                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-red-500 pointer-events-none"
                                >
                                  <AlertCircle size={15} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </form>

      {/* Direct Printable Service Invoice Portal to document.body for reliable print without blank page */}
      {previewService && typeof document !== 'undefined' && createPortal(
        <div id="invoice-print-wrapper">
          <ServiceInvoiceTemplate service={previewService} settings={settings} />
        </div>,
        document.body
      )}
    </div>
  )
}
