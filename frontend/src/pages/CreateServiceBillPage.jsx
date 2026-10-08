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
  Percent,
  List
} from '../components/common/icons'
import Swal from 'sweetalert2'
import SearchableSelect from '../components/common/SearchableSelect'
import ServiceInvoiceTemplate from '../components/invoice/ServiceInvoiceTemplate'
import { Button } from '../components/ui'
import { BillSummaryCard, ServiceLineItems } from '../components/billing'
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
      hsn_code: '',
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
                  hsn_code: it.hsn_code || '',
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
        hsn_code: '',
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
      Swal.fire({
        icon: 'warning',
        title: 'At least one item required',
        text: 'Service request must have at least one product item.',
        confirmButtonColor: '#043486'
      })
      return
    }
    const itemToRemove = items[index]
    const itemName = itemToRemove.product_name ? `"${itemToRemove.product_name}"` : `Item #${index + 1}`
    setItems((prev) => prev.filter((_, i) => i !== index))
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

  // Duplicate Item
  const handleDuplicateItem = (index) => {
    const target = items[index]
    const qtyCount = Math.max(1, Math.floor(target.quantity || 1))
    setItems((prev) => [
      ...prev.slice(0, index + 1),
      {
        ...target,
        serial_numbers: target.has_serial
          ? Array.from({ length: qtyCount }, () => '')
          : ['']
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
      title: 'Service line item duplicated'
    })
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
        hsn_code: '',
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

      // 1. Template mounting & print trigger commented out (first follows quotation / job lifecycle)
      // setPreviewService(savedServiceData)

      // 2. Alert user
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Service Request Updated Successfully!' : 'Service Request Recorded Successfully!',
        text: `Service Job #${serviceNumber} has been ${isEditMode ? 'updated' : 'saved'} successfully.`,
        confirmButtonColor: '#043486',
        confirmButtonText: 'OK',
        timer: 1800
      })

      // 3. Reset form or navigate to list without firing print dialog
      if (isEditMode) {
        navigate('/services/list')
      } else {
        handleReset()
      }

      /*
      setTimeout(() => {
        window.print()
        if (isEditMode) {
          navigate('/services/list')
        } else {
          handleReset()
        }
      }, 450)
      */
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
    <div className="space-y-6 animate-in fade-in duration-200 pb-16 font-['Poppins',sans-serif]">
      {/* 1. Page Header (Transparent Top Bar with Service List Button) */}
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

        {/* Right Side: SERVICE LIST Action Button */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="list"
            icon={List}
            onClick={() => {
              if (setActiveRoute) setActiveRoute('all-services')
              navigate('/services/list')
            }}
            className="text-xs font-semibold"
          >
            SERVICE LIST
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT MAIN COLUMN (8 COLS) ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Service Specifications */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileDigit size={16} className="text-[#043486] dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                    Service Specifications
                  </h2>
                </div>

                {/* Non-GST / GST Toggle */}
                <div className="grid grid-cols-2 sm:flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-none border border-gray-200 dark:border-slate-700 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleToggleServiceType('NON_GST')}
                    className={`px-3 py-1.5 text-center text-xs font-semibold rounded-none transition-all cursor-pointer ${
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
                    className={`px-3 py-1.5 text-center text-xs font-semibold rounded-none transition-all cursor-pointer ${
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
                    Service Date <span className="text-red-500 font-bold">*</span>
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
                    Place of Supply <span className="text-red-500 font-bold">*</span>
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
                    Customer Type <span className="text-red-500 font-bold">*</span>
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
                      {customerType === 'Company' ? (
                        <>Company / Client Name <span className="text-red-500 font-bold">*</span></>
                      ) : (
                        <>Customer / Client Name <span className="text-red-500 font-bold">*</span></>
                      )}
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

            {/* ================= SERVICE LINE ITEMS ================= */}
            <ServiceLineItems
              items={items}
              serviceType={serviceType}
              duplicateSerials={duplicateSerials}
              onItemChange={handleItemChange}
              onToggleSerial={handleToggleSerial}
              onSerialNumberChange={handleSerialNumberChange}
              onAddItem={handleAddItem}
              onDuplicateItem={handleDuplicateItem}
              onRemoveItem={handleRemoveItem}
            />

          </div>

          {/* ================= RIGHT SUMMARY COLUMN (4 COLS) ================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <BillSummaryCard
              title="Service Summary"
              billNumber={serviceNumber}
              taxableAmount={taxableAmount}
              isIntraState={isIntraState}
              cgstRate={activeCgst}
              cgstAmount={cgstAmount}
              sgstRate={activeSgst}
              sgstAmount={sgstAmount}
              igstRate={activeIgst}
              igstAmount={igstAmount}
              totalTax={totalTax}
              roundOff={roundOff}
              grandTotal={roundedGrandTotal}
              amountInWords={amountInWords}
              bankDetails={settings}
              isSaving={isSaving}
              isEditMode={isEditMode}
              saveButtonText={isEditMode ? 'Update Service Request (Ctrl+Enter)' : 'Save Service Request (Ctrl+Enter)'}
              cancelButtonText="Cancel Edit / Back to List"
              onSave={handleSubmit}
              onReset={handleReset}
              onCancel={isEditMode ? () => navigate('/services/list') : null}
            />
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
