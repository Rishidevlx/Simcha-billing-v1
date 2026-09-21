import { useState, useEffect } from 'react'
import {
  Building2,
  Percent,
  Landmark,
  FileText,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Hash,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
  Info,
  Edit2,
  X,
  Lock,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  ZoomIn
} from 'lucide-react'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('company') // 'company' | 'taxes' | 'bank' | 'terms'
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Edit mode per tab
  const [editStates, setEditStates] = useState({
    company: false,
    taxes: false,
    bank: false,
    terms: false
  })

  // Company Details
  const [companyName, setCompanyName] = useState('SIMCHA INFO SOLUTIONS')
  const [address, setAddress] = useState('7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.')
  const [phone, setPhone] = useState('8122022060')
  const [email, setEmail] = useState('simchainfosolutions@gmail.com')
  const [gstin, setGstin] = useState('33GEZPM1178G1ZY')
  
  // Dynamic Invoice Numbering Settings
  const [invoicePrefix, setInvoicePrefix] = useState('SIS')
  const [invoiceFinancialYear, setInvoiceFinancialYear] = useState('2026-27')
  const [invoiceStartingNumber, setInvoiceStartingNumber] = useState('0001')
  const [invoicePaddingDigits, setInvoicePaddingDigits] = useState('4')
  const [invoiceSeparator, setInvoiceSeparator] = useState('/')

  // Dynamic Receipt Numbering Settings
  const [receiptPrefix, setReceiptPrefix] = useState('SIS-REC')
  const [receiptFinancialYear, setReceiptFinancialYear] = useState('2026-27')
  const [receiptStartingNumber, setReceiptStartingNumber] = useState('0001')
  const [receiptPaddingDigits, setReceiptPaddingDigits] = useState('4')
  const [receiptSeparator, setReceiptSeparator] = useState('/')

  // Dynamic Service Numbering Settings
  const [servicePrefix, setServicePrefix] = useState('SIS-SR')
  const [serviceFinancialYear, setServiceFinancialYear] = useState('2026-27')
  const [serviceStartingNumber, setServiceStartingNumber] = useState('0001')
  const [servicePaddingDigits, setServicePaddingDigits] = useState('4')
  const [serviceSeparator, setServiceSeparator] = useState('/')

  // Tax Rates
  const [cgstRate, setCgstRate] = useState('9.00')
  const [sgstRate, setSgstRate] = useState('9.00')
  const [igstRate, setIgstRate] = useState('18.00')

  // Bank Details
  const [bankName, setBankName] = useState('Canara Bank')
  const [accountName, setAccountName] = useState('Simcha Info Solutions')
  const [accountNo, setAccountNo] = useState('120041754011')
  const [ifscCode, setIfscCode] = useState('CNRB0002732')
  const [branch, setBranch] = useState('Peelamedu')
  const [bankImageUrl, setBankImageUrl] = useState('')
  const [isUploadingBankImg, setIsUploadingBankImg] = useState(false)
  const [signatureUrl, setSignatureUrl] = useState('')
  const [isUploadingSign, setIsUploadingSign] = useState(false)
  const [previewZoomImg, setPreviewZoomImg] = useState(null)

  // Terms & Conditions
  const [terms, setTerms] = useState([
    'Warranty as per manufacturer’s norms & should be claimed directly.',
    'Warranty claim takes 1 to 8 weeks.',
    'Please carry invoice copy for warranty.',
    'Goods Once Sold will not be taken back or exchanged.'
  ])
  const [returnDays, setReturnDays] = useState('7')
  const [dueDateDays, setDueDateDays] = useState('15')
  const [newTermInput, setNewTermInput] = useState('')

  // Original snapshot for reset
  const [savedSettings, setSavedSettings] = useState(null)

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(API_ENDPOINTS.SETTINGS)
      const data = await res.json()
      if (data.success && data.settings) {
        const s = data.settings
        setSavedSettings(s)
        populateFields(s)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const populateFields = (s) => {
    if (!s) return
    setCompanyName(s.company_name || 'SIMCHA INFO SOLUTIONS')
    setAddress(s.address || '')
    setPhone(s.phone || '')
    setEmail(s.email || '')
    setGstin(s.gstin || '')
    setSignatureUrl(s.signature_url || '')
    
    // Invoice numbering
    setInvoicePrefix(s.invoice_prefix !== undefined ? s.invoice_prefix : 'SIS')
    setInvoiceFinancialYear(s.invoice_financial_year || '2026-27')
    setInvoiceStartingNumber(s.invoice_starting_number !== undefined ? String(s.invoice_starting_number).padStart(parseInt(s.invoice_padding_digits || 4, 10), '0') : '0001')
    setInvoicePaddingDigits(s.invoice_padding_digits !== undefined ? String(s.invoice_padding_digits) : '4')
    setInvoiceSeparator(s.invoice_separator || '/')

    // Receipt numbering
    setReceiptPrefix(s.receipt_prefix !== undefined ? s.receipt_prefix : 'SIS-REC')
    setReceiptFinancialYear(s.receipt_financial_year || '2026-27')
    setReceiptStartingNumber(s.receipt_starting_number !== undefined ? String(s.receipt_starting_number).padStart(parseInt(s.receipt_padding_digits || 4, 10), '0') : '0001')
    setReceiptPaddingDigits(s.receipt_padding_digits !== undefined ? String(s.receipt_padding_digits) : '4')
    setReceiptSeparator(s.receipt_separator || '/')

    // Service numbering
    setServicePrefix(s.service_prefix !== undefined ? s.service_prefix : 'SIS-SR')
    setServiceFinancialYear(s.service_financial_year || '2026-27')
    setServiceStartingNumber(s.service_starting_number !== undefined ? String(s.service_starting_number).padStart(parseInt(s.service_padding_digits || 4, 10), '0') : '0001')
    setServicePaddingDigits(s.service_padding_digits !== undefined ? String(s.service_padding_digits) : '4')
    setServiceSeparator(s.service_separator || '/')

    setCgstRate(s.cgst_rate !== undefined ? String(s.cgst_rate) : '9.00')
    setSgstRate(s.sgst_rate !== undefined ? String(s.sgst_rate) : '9.00')
    setIgstRate(s.igst_rate !== undefined ? String(s.igst_rate) : '18.00')

    setBankName(s.bank_name || 'Canara Bank')
    setAccountName(s.account_name || 'Simcha Info Solutions')
    setAccountNo(s.account_no || '')
    setIfscCode(s.ifsc_code || '')
    setBranch(s.branch || '')
    setBankImageUrl(s.bank_image_url || '')
    setReturnDays(s.return_days !== undefined && s.return_days !== null ? String(s.return_days) : '7')
    setDueDateDays(s.due_date_days !== undefined && s.due_date_days !== null ? String(s.due_date_days) : '15')

    if (Array.isArray(s.terms_conditions)) {
      setTerms(s.terms_conditions)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const toggleEditTab = (tabId, state) => {
    setEditStates(prev => ({
      ...prev,
      [tabId]: state !== undefined ? state : !prev[tabId]
    }))
  }

  const handleCancelTab = (tabId) => {
    if (savedSettings) {
      populateFields(savedSettings)
    }
    toggleEditTab(tabId, false)
  }

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return
    setTerms(prev => [...prev, newTermInput.trim()])
    setNewTermInput('')
  }

  const handleRemoveTerm = (index) => {
    setTerms(prev => prev.filter((_, i) => i !== index))
  }

  const handleTermChange = (index, val) => {
    setTerms(prev => {
      const updated = [...prev]
      updated[index] = val
      return updated
    })
  }

  // Helper function to compress image files before upload while preserving PNG transparency
  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      if (!file.type || !file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const isTransparentFormat = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/svg+xml'

        // If it's a transparent image (e.g. signature PNG) and under 2MB, preserve original data URL directly to retain 100% transparency
        if (isTransparentFormat && file.size < 2 * 1024 * 1024) {
          resolve(e.target.result)
          return
        }

        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDimension = 1400

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
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          const outputMime = isTransparentFormat ? 'image/png' : 'image/jpeg'
          const compressedBase64 = canvas.toDataURL(outputMime, isTransparentFormat ? undefined : 0.85)
          resolve(compressedBase64)
        }
        img.onerror = () => resolve(e.target.result)
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleUploadBankImage = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please upload an image smaller than 5MB.',
        confirmButtonColor: '#043486'
      })
      return
    }

    try {
      setIsUploadingBankImg(true)
      const compressedDataUrl = await compressImageFile(file)
      try {
        const res = await fetch(API_ENDPOINTS.CLOUDINARY_UPLOAD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: compressedDataUrl,
            folder: 'simcha_billing/bank'
          })
        })
        const data = await res.json()
        if (data.success && data.url) {
          setBankImageUrl(data.url)
          Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          }).fire({
            icon: 'success',
            title: 'Bank image uploaded to Cloudinary'
          })
        } else {
          setBankImageUrl(compressedDataUrl)
          Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          }).fire({
            icon: 'info',
            title: 'Bank image attached locally'
          })
        }
      } catch (uploadErr) {
        setBankImageUrl(compressedDataUrl)
      } finally {
        setIsUploadingBankImg(false)
      }
    } catch (err) {
      console.error('Error uploading bank image:', err)
      setIsUploadingBankImg(false)
    }
  }

  const handleUploadSignature = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please upload a signature image smaller than 5MB.',
        confirmButtonColor: '#043486'
      })
      return
    }

    try {
      setIsUploadingSign(true)
      const compressedDataUrl = await compressImageFile(file)
      try {
        const res = await fetch(API_ENDPOINTS.CLOUDINARY_UPLOAD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: compressedDataUrl,
            folder: 'simcha_billing/signatures'
          })
        })
        const data = await res.json()
        if (data.success && data.url) {
          setSignatureUrl(data.url)
          Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          }).fire({
            icon: 'success',
            title: 'Signature uploaded to Cloudinary'
          })
        } else {
          setSignatureUrl(compressedDataUrl)
          Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          }).fire({
            icon: 'info',
            title: 'Signature attached locally'
          })
        }
      } catch (uploadErr) {
        setSignatureUrl(compressedDataUrl)
      } finally {
        setIsUploadingSign(false)
      }
    } catch (err) {
      console.error('Error uploading signature:', err)
      setIsUploadingSign(false)
    }
  }

  const handleSubmit = async (e, tabId = activeTab) => {
    if (e && e.preventDefault) e.preventDefault()

    // Validation per tab
    if (tabId === 'company') {
      if (!companyName.trim() || companyName.trim().length < 2) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please enter a valid Company / Business Name (minimum 2 characters).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (gstin.trim().length !== 15) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid GSTIN',
          text: 'Company GSTIN must be exactly 15 characters (e.g. 33GEZPM1178G1ZY).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (phone.trim().length < 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Phone Number',
          text: 'Please enter a valid 10-digit mobile / phone number.',
          confirmButtonColor: '#043486'
        })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Email',
          text: 'Please enter a valid email address.',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!address.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Address Required',
          text: 'Please provide company address.',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!invoicePrefix.trim() || invoicePrefix.trim().length > 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Invoice Prefix',
          text: 'Invoice Prefix is required (maximum 10 characters).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!receiptPrefix.trim() || receiptPrefix.trim().length > 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Receipt Prefix',
          text: 'Receipt Prefix is required (maximum 10 characters).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!servicePrefix.trim() || servicePrefix.trim().length > 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Service Prefix',
          text: 'Service Prefix is required (maximum 10 characters).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!invoiceFinancialYear.trim() || invoiceFinancialYear.trim().length > 7) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Financial Year',
          text: 'Invoice Financial Year is required (maximum 7 characters, e.g. 2026-27).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!receiptFinancialYear.trim() || receiptFinancialYear.trim().length > 7) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Financial Year',
          text: 'Receipt Financial Year is required (maximum 7 characters, e.g. 2026-27).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!serviceFinancialYear.trim() || serviceFinancialYear.trim().length > 7) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Financial Year',
          text: 'Service Financial Year is required (maximum 7 characters, e.g. 2026-27).',
          confirmButtonColor: '#043486'
        })
        return
      }

      const invStart = parseInt(invoiceStartingNumber, 10)
      if (isNaN(invStart) || invStart < 1 || invStart > 999999) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Starting Number',
          text: 'Invoice starting number must be between 1 and 999999.',
          confirmButtonColor: '#043486'
        })
        return
      }

      const recStart = parseInt(receiptStartingNumber, 10)
      if (isNaN(recStart) || recStart < 1 || recStart > 999999) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Starting Number',
          text: 'Receipt starting number must be between 1 and 999999.',
          confirmButtonColor: '#043486'
        })
        return
      }

      const srvStart = parseInt(serviceStartingNumber, 10)
      if (isNaN(srvStart) || srvStart < 1 || srvStart > 999999) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Starting Number',
          text: 'Service starting number must be between 1 and 999999.',
          confirmButtonColor: '#043486'
        })
        return
      }
    }

    if (tabId === 'bank') {
      if (ifscCode.trim() && ifscCode.trim().length !== 11) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid IFSC Code',
          text: 'IFSC Code must be exactly 11 characters (e.g. CNRB0002732).',
          confirmButtonColor: '#043486'
        })
        return
      }
    }

    if (tabId === 'taxes') {
      const cgst = parseFloat(cgstRate)
      const sgst = parseFloat(sgstRate)
      const igst = parseFloat(igstRate)
      if (isNaN(cgst) || cgst < 0 || cgst > 100 || isNaN(sgst) || sgst < 0 || sgst > 100 || isNaN(igst) || igst < 0 || igst > 100) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Tax Rates',
          text: 'Tax rates must be between 0% and 100%.',
          confirmButtonColor: '#043486'
        })
        return
      }
    }

    setIsSaving(true)

    try {
      const payload = {
        company_name: companyName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstin: gstin.trim(),
        signature_url: signatureUrl || null,
        invoice_prefix: invoicePrefix.trim(),
        invoice_financial_year: invoiceFinancialYear.trim(),
        invoice_starting_number: parseInt(invoiceStartingNumber, 10) || 1,
        invoice_padding_digits: parseInt(invoicePaddingDigits, 10) || 4,
        invoice_separator: invoiceSeparator || '/',
        receipt_prefix: receiptPrefix.trim(),
        receipt_financial_year: receiptFinancialYear.trim(),
        receipt_starting_number: parseInt(receiptStartingNumber, 10) || 1,
        receipt_padding_digits: parseInt(receiptPaddingDigits, 10) || 4,
        receipt_separator: receiptSeparator || '/',
        service_prefix: servicePrefix.trim(),
        service_financial_year: serviceFinancialYear.trim(),
        service_starting_number: parseInt(serviceStartingNumber, 10) || 1,
        service_padding_digits: parseInt(servicePaddingDigits, 10) || 4,
        service_separator: serviceSeparator || '/',
        cgst_rate: parseFloat(cgstRate) || 9.00,
        sgst_rate: parseFloat(sgstRate) || 9.00,
        igst_rate: parseFloat(igstRate) || 18.00,
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        account_no: accountNo.trim(),
        ifsc_code: ifscCode.trim(),
        branch: branch.trim(),
        bank_image_url: bankImageUrl || null,
        return_days: parseInt(returnDays, 10) || 7,
        due_date_days: parseInt(dueDateDays, 10) || 15,
        terms_conditions: terms.filter(t => t.trim())
      }

      const res = await fetch(API_ENDPOINTS.SETTINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        setSavedSettings(payload)
        toggleEditTab(tabId, false)

        Swal.fire({
          icon: 'success',
          title: 'Settings Saved',
          text: 'Settings updated successfully!',
          confirmButtonColor: '#043486',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error(data.message || 'Failed to update settings')
      }
    } catch (err) {
      console.error('Error updating settings:', err)
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message || 'Unable to update settings.',
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

  const isCurrentTabEditing = editStates[activeTab]

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'taxes', label: 'Tax & GST Rates', icon: Percent },
    { id: 'bank', label: 'Bank Account', icon: Landmark },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, badge: terms.length }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-['Poppins',sans-serif]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-[#292424] dark:text-white">System &amp; Company Settings</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Configure Company profile, Invoice &amp; Receipt numbering schemes, Tax rates, Bank accounts and Terms.</p>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 dark:bg-slate-950 p-1.5 border border-gray-200 dark:border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isTabEditing = editStates[tab.id]
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 p-3 text-left transition-all cursor-pointer rounded-none relative ${
                isActive
                  ? 'bg-[#043486] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className={`p-1.5 rounded-none ${isActive ? 'bg-white/15 text-white' : 'bg-gray-100 dark:bg-slate-800 text-[#043486] dark:text-blue-400'}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <span className="text-xs font-bold truncate">{tab.label}</span>
                {isTabEditing ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-none animate-pulse ml-1 shrink-0">
                    EDITING
                  </span>
                ) : tab.badge !== undefined ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none ml-1 shrink-0 ${isActive ? 'bg-white text-[#043486]' : 'bg-blue-100 dark:bg-blue-950 text-[#043486] dark:text-blue-300'}`}>
                    {tab.badge}
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      <form onSubmit={(e) => handleSubmit(e, activeTab)} className="space-y-6">
        
        {/* ================= TAB 1: COMPANY PROFILE ================= */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            {/* 1. Company Profile & Billing Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Building2 size={18} className="text-[#043486] dark:text-blue-400" />
                  <h2 className="text-base font-bold text-[#292424] dark:text-white">Company Profile &amp; Billing Header</h2>
                </div>
                
                {/* Tab Header Edit Button */}
                {!editStates.company ? (
                  <button
                    type="button"
                    onClick={() => toggleEditTab('company', true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit2 size={13} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                    Editing Mode Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Company / Business Name *</label>
                  <input
                    type="text"
                    disabled={!editStates.company}
                    value={companyName}
                    maxLength={100}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                      editStates.company
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Company GSTIN Number *</label>
                  <input
                    type="text"
                    disabled={!editStates.company}
                    value={gstin}
                    maxLength={15}
                    onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                    required
                    className={`w-full px-3.5 py-2.5 text-sm uppercase rounded-none font-mono font-semibold transition-all ${
                      editStates.company
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                    placeholder="Enter GSTIN number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Official Phone / Mobile Number *</label>
                  <input
                    type="text"
                    disabled={!editStates.company}
                    value={phone}
                    maxLength={10}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    className={`w-full px-3.5 py-2.5 text-sm font-medium font-mono rounded-none transition-all ${
                      editStates.company
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Official Email Address *</label>
                  <input
                    type="email"
                    disabled={!editStates.company}
                    value={email}
                    maxLength={60}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                      editStates.company
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                    placeholder="Enter official email"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Company Full Address *</label>
                  <textarea
                    rows={2}
                    disabled={!editStates.company}
                    value={address}
                    maxLength={250}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                      editStates.company
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                    placeholder="Enter company address"
                  />
                </div>

                {/* Authorized Company Sign Upload */}
                <div className="md:col-span-2 pt-3 border-t border-gray-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-xs font-bold text-gray-800 dark:text-slate-200">
                      Authorized Signatory Signature / Seal
                    </label>
                    {signatureUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={12} /> Signature Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                    {/* Signature Preview Thumbnail */}
                    <div className="relative group w-36 h-18 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-2xs">
                      {signatureUrl ? (
                        <>
                          <img
                            src={signatureUrl}
                            alt="Authorized Signature"
                            className="max-h-full max-w-full object-contain cursor-pointer"
                            onClick={() => setPreviewZoomImg(signatureUrl)}
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewZoomImg(signatureUrl)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1"
                            title="Preview signature"
                          >
                            <ZoomIn size={14} /> View
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-center px-2">
                          <ImageIcon size={18} className="mb-1 opacity-60" />
                          <span className="text-[10px] leading-tight">No Signature</span>
                        </div>
                      )}
                    </div>

                    {/* Actions / Upload Controls */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow-xs ${
                            editStates.company && !isUploadingSign
                              ? 'bg-[#043486] hover:bg-[#0248BC] text-white cursor-pointer'
                              : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <UploadCloud size={14} />
                          <span>{isUploadingSign ? 'Processing...' : signatureUrl ? 'Change Signature' : 'Upload Signature'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!editStates.company || isUploadingSign}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUploadSignature(file)
                              e.target.value = ''
                            }}
                          />
                        </label>

                        {signatureUrl && editStates.company && (
                          <button
                            type="button"
                            onClick={() => setSignatureUrl('')}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">
                        {editStates.company 
                          ? 'Supports transparent PNG or JPG (Max 5MB).'
                          : 'Click "Edit Profile" above to change signature.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Bill & Receipt Numbering Schemes Card (Neutral & Clean) */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Hash size={18} className="text-[#043486] dark:text-blue-400" />
                  <h2 className="text-base font-bold text-[#292424] dark:text-white">Bill, Receipt &amp; Service Numbering Settings</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- CARD 1: TAX INVOICE NUMBERING CONFIGURATION --- */}
                <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
                  <div className="pb-2 border-b border-gray-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                      Tax Invoice Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Prefix *
                      </label>
                      <input
                        type="text"
                        disabled={!editStates.company}
                        value={invoicePrefix}
                        maxLength={10}
                        onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                        placeholder="SIS"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Financial Year *
                      </label>
                      <input
                        type="text"
                        disabled={!editStates.company}
                        value={invoiceFinancialYear}
                        maxLength={7}
                        onChange={(e) => setInvoiceFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 7))}
                        placeholder="2026-27"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Starting Number *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999999"
                        disabled={!editStates.company}
                        value={invoiceStartingNumber}
                        onChange={(e) => setInvoiceStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="1"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Separator / Delimiter
                      </label>
                      <select
                        disabled={!editStates.company}
                        value={invoiceSeparator}
                        onChange={(e) => setInvoiceSeparator(e.target.value)}
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <option value="/">Slash ( / )</option>
                        <option value="-">Hyphen ( - )</option>
                        <option value=".">Dot ( . )</option>
                      </select>
                    </div>

                    {/* Dynamic Default Due Date Days Setting */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Default Invoice Due Date Period (Days) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="365"
                          disabled={!editStates.company}
                          value={dueDateDays}
                          onChange={(e) => setDueDateDays(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          placeholder="15"
                          className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                            editStates.company
                              ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                              : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                          Days
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                        Outward invoices will calculate Due Date as: (Invoice Date + {dueDateDays || 15} Days).
                      </p>
                    </div>
                  </div>

                  {/* Live Invoice Preview Box */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Invoice Preview:
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
                      <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-gray-400 dark:border-slate-600 flex items-center justify-between">
                        <span className="truncate">{invoicePrefix || 'SIS'}{invoiceSeparator}{invoiceFinancialYear || '2026-27'}{invoiceSeparator}{String(parseInt(invoiceStartingNumber, 10) || 1).padStart(parseInt(invoicePaddingDigits, 10) || 4, '0')}</span>
                        <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Bill)</span>
                      </div>
                      <div className="p-1.5 bg-gray-50/60 dark:bg-slate-850 border-l-2 border-gray-300 dark:border-slate-700 flex items-center justify-between text-gray-700 dark:text-slate-300">
                        <span className="truncate">{invoicePrefix || 'SIS'}{invoiceSeparator}{invoiceFinancialYear || '2026-27'}{invoiceSeparator}{String((parseInt(invoiceStartingNumber, 10) || 1) + 1).padStart(parseInt(invoicePaddingDigits, 10) || 4, '0')}</span>
                        <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(2nd Bill)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- CARD 2: PAYMENT RECEIPT NUMBERING CONFIGURATION --- */}
                <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
                  <div className="pb-2 border-b border-gray-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                      Receipt Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Prefix *
                      </label>
                      <input
                        type="text"
                        disabled={!editStates.company}
                        value={receiptPrefix}
                        maxLength={10}
                        onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                        placeholder="SIS-REC"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Financial Year *
                      </label>
                      <input
                        type="text"
                        disabled={!editStates.company}
                        value={receiptFinancialYear}
                        maxLength={7}
                        onChange={(e) => setReceiptFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 7))}
                        placeholder="2026-27"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Starting Number *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999999"
                        disabled={!editStates.company}
                        value={receiptStartingNumber}
                        onChange={(e) => setReceiptStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="1"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Separator / Delimiter
                      </label>
                      <select
                        disabled={!editStates.company}
                        value={receiptSeparator}
                        onChange={(e) => setReceiptSeparator(e.target.value)}
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <option value="/">Slash ( / )</option>
                        <option value="-">Hyphen ( - )</option>
                        <option value=".">Dot ( . )</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Receipt Preview Box */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Receipt Preview:
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
                      <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-gray-400 dark:border-slate-600 flex items-center justify-between">
                        <span className="truncate">{receiptPrefix || 'SIS-REC'}{receiptSeparator}{receiptFinancialYear || '2026-27'}{receiptSeparator}{String(parseInt(receiptStartingNumber, 10) || 1).padStart(parseInt(receiptPaddingDigits, 10) || 4, '0')}</span>
                        <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Rec)</span>
                      </div>
                      <div className="p-1.5 bg-gray-50/60 dark:bg-slate-850 border-l-2 border-gray-300 dark:border-slate-700 flex items-center justify-between text-gray-700 dark:text-slate-300">
                        <span className="truncate">{receiptPrefix || 'SIS-REC'}{receiptSeparator}{receiptFinancialYear || '2026-27'}{receiptSeparator}{String((parseInt(receiptStartingNumber, 10) || 1) + 1).padStart(parseInt(receiptPaddingDigits, 10) || 4, '0')}</span>
                        <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(2nd Rec)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- CARD 3: SERVICE TICKET & NUMBERING CONFIGURATION --- */}
                <div className="bg-gray-50/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-5 rounded-none space-y-4">
                  <div className="pb-2 border-b border-gray-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                      Service Ticket Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Prefix *
                      </label>
                      <input
                        type="text"
                        disabled={!editStates.company}
                        value={servicePrefix}
                        maxLength={10}
                        onChange={(e) => setServicePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10))}
                        placeholder="SIS-SR"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none uppercase transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Financial Year *
                      </label>
                      <input
                        type="text"
                        disabled={!editStates.company}
                        value={serviceFinancialYear}
                        maxLength={7}
                        onChange={(e) => setServiceFinancialYear(e.target.value.replace(/[^0-9-]/g, '').slice(0, 7))}
                        placeholder="2026-27"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Starting Number *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999999"
                        disabled={!editStates.company}
                        value={serviceStartingNumber}
                        onChange={(e) => setServiceStartingNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="1"
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Separator / Delimiter
                      </label>
                      <select
                        disabled={!editStates.company}
                        value={serviceSeparator}
                        onChange={(e) => setServiceSeparator(e.target.value)}
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-none transition-all ${
                          editStates.company
                            ? 'bg-white dark:bg-slate-900 text-[#292424] dark:text-white border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] cursor-pointer'
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <option value="/">Slash ( / )</option>
                        <option value="-">Hyphen ( - )</option>
                        <option value=".">Dot ( . )</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Service Preview Box */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Service Ticket Preview:
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] font-bold text-gray-800 dark:text-slate-200">
                      <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border-l-2 border-gray-400 dark:border-slate-600 flex items-center justify-between">
                        <span className="truncate">{servicePrefix || 'SIS-SR'}{serviceSeparator}{serviceFinancialYear || '2026-27'}{serviceSeparator}{String(parseInt(serviceStartingNumber, 10) || 1).padStart(parseInt(servicePaddingDigits, 10) || 4, '0')}</span>
                        <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(1st Ticket)</span>
                      </div>
                      <div className="p-1.5 bg-gray-50/60 dark:bg-slate-850 border-l-2 border-gray-300 dark:border-slate-700 flex items-center justify-between text-gray-700 dark:text-slate-300">
                        <span className="truncate">{servicePrefix || 'SIS-SR'}{serviceSeparator}{serviceFinancialYear || '2026-27'}{serviceSeparator}{String((parseInt(serviceStartingNumber, 10) || 1) + 1).padStart(parseInt(servicePaddingDigits, 10) || 4, '0')}</span>
                        <span className="text-[9px] text-gray-400 font-sans font-normal ml-1 shrink-0">(2nd Ticket)</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TAX & GST RATES ================= */}
        {activeTab === 'taxes' && (
          <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Percent size={18} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-base font-bold text-[#292424] dark:text-white">Tax &amp; GST Rate Percentages</h2>
              </div>
              
              {/* Tab Header Edit Button */}
              {!editStates.taxes ? (
                <button
                  type="button"
                  onClick={() => toggleEditTab('taxes', true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Tax Rates</span>
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Editing Mode Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">CGST (Central Tax)</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">Intra-State</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    disabled={!editStates.taxes}
                    value={cgstRate}
                    onChange={(e) => setCgstRate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                      editStates.taxes
                        ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied when customer place of supply is within Tamil Nadu (33).</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">SGST (State Tax)</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">Intra-State</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    disabled={!editStates.taxes}
                    value={sgstRate}
                    onChange={(e) => setSgstRate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                      editStates.taxes
                        ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied alongside CGST for within-state sales (Total {Number(cgstRate || 0) + Number(sgstRate || 0)}%).</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">IGST (Integrated Tax)</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">Inter-State</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    disabled={!editStates.taxes}
                    value={igstRate}
                    onChange={(e) => setIgstRate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                      editStates.taxes
                        ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied automatically when customer is from outside Tamil Nadu (e.g. Kerala, Karnataka).</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: BANK ACCOUNT ================= */}
        {activeTab === 'bank' && (
          <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Landmark size={18} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-base font-bold text-[#292424] dark:text-white">Bank Account Information</h2>
              </div>
              
              {/* Tab Header Edit Button */}
              {!editStates.bank ? (
                <button
                  type="button"
                  onClick={() => toggleEditTab('bank', true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Bank Details</span>
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Editing Mode Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Bank Name</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter bank name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Beneficiary / Account Name</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter account name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Account Number</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-semibold font-mono rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">IFSC Code</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className={`w-full px-3.5 py-2.5 text-sm font-semibold uppercase font-mono rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#043486] dark:text-blue-400 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-[#043486]/70 dark:text-blue-400/70 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter IFSC code"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Branch Location</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter branch name"
                />
              </div>
            </div>

            {/* Bank UPI QR / Cheque Image Upload Option */}
            <div className="p-5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#043486] dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wide">
                    Bank UPI QR Code / Passbook Image
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                  Cloud Media Upload
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                
                {/* Upload Action Box */}
                <div className="md:col-span-7">
                  {editStates.bank ? (
                    <label className={`border-2 border-dashed p-4 text-center block transition-all cursor-pointer ${
                      isUploadingBankImg
                        ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 cursor-wait'
                        : 'border-gray-300 dark:border-slate-700 hover:border-[#043486] dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-900'
                    }`}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        disabled={isUploadingBankImg}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadBankImage(e.target.files[0])
                          }
                        }}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        {isUploadingBankImg ? (
                          <>
                            <div className="w-7 h-7 border-2 border-[#043486] border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-[#043486] dark:text-blue-400">Uploading to Cloudinary...</p>
                          </>
                        ) : (
                          <>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-400">
                              <UploadCloud size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                                {bankImageUrl ? 'Click to Replace Bank Image / QR' : 'Click to Upload Bank QR / Passbook'}
                              </p>
                              <p className="text-[10.5px] text-gray-400 mt-0.5">Supports PNG, JPG, JPEG, WebP (Max 10MB)</p>
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2.5">
                      <Lock size={15} className="text-gray-400" />
                      <span>Click "Edit Bank Details" above to upload or change Bank QR code image.</span>
                    </div>
                  )}
                </div>

                {/* Image Preview Box */}
                <div className="md:col-span-5 flex items-center justify-center">
                  {bankImageUrl ? (
                    <div className="relative group bg-white dark:bg-slate-900 p-2 border border-gray-200 dark:border-slate-700 shadow-xs flex items-center gap-3 w-full">
                      <img
                        src={bankImageUrl}
                        alt="Bank QR"
                        className="w-16 h-16 object-contain border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 cursor-pointer"
                        onClick={() => setPreviewZoomImg(bankImageUrl)}
                      />
                      <div className="flex-1 min-w-0 text-left text-xs space-y-1">
                        <p className="font-bold text-gray-800 dark:text-slate-200 truncate">Bank QR Attached</p>
                        <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">Ready for Invoices</p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewZoomImg(bankImageUrl)}
                            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <ZoomIn size={11} /> View
                          </button>
                          {editStates.bank && (
                            <button
                              type="button"
                              onClick={() => setBankImageUrl('')}
                              className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-200 dark:border-slate-800 w-full text-center text-xs text-gray-400">
                      No Bank QR image uploaded yet
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Live Invoice Preview Box */}
            <div className="p-4 bg-blue-50/60 dark:bg-slate-950 border border-blue-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#043486] dark:text-blue-300 uppercase">
                  <Info size={14} />
                  <span>Invoice Print Preview</span>
                </div>
                {bankImageUrl && (
                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> QR Included
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 border border-blue-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p><strong>Bank:</strong> {bankName || 'Bank Name'} ({branch || 'Branch'})</p>
                  <p><strong>Beneficiary:</strong> {accountName || 'Beneficiary Name'}</p>
                  <p><strong>A/C:</strong> {accountNo || 'XXXXXXXXXXXX'} | <strong>IFSC:</strong> {ifscCode || 'IFSCXXXXXX'}</p>
                </div>
                {bankImageUrl && (
                  <div className="text-center shrink-0">
                    <img src={bankImageUrl} alt="QR Preview" className="w-14 h-14 object-contain border border-gray-200 dark:border-slate-700 mx-auto" />
                    <span className="text-[9.5px] font-sans font-bold text-gray-500 uppercase">Scan to Pay</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Zoom Image Modal */}
        {previewZoomImg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setPreviewZoomImg(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 p-3 border border-gray-200 dark:border-slate-800 shadow-2xl max-w-lg w-full flex flex-col items-center gap-3 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full pb-2 border-b border-gray-200 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wide">Bank QR / Document Preview</span>
                <button
                  onClick={() => setPreviewZoomImg(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <img src={previewZoomImg} alt="Zoom Preview" className="max-h-[70vh] w-auto object-contain" />
            </div>
          </div>
        )}

        {/* ================= TAB 4: TERMS & CONDITIONS ================= */}
        {activeTab === 'terms' && (
          <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-base font-bold text-[#292424] dark:text-white">Terms &amp; Conditions Clauses</h2>
              </div>
              
              {/* Tab Header Edit Button */}
              {!editStates.terms ? (
                <button
                  type="button"
                  onClick={() => toggleEditTab('terms', true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Terms</span>
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Editing Mode Active
                </span>
              )}
            </div>

            <div className="space-y-3">
              {terms.map((term, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-none bg-gray-100 dark:bg-slate-800 text-[#043486] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    disabled={!editStates.terms}
                    value={term}
                    onChange={(e) => handleTermChange(index, e.target.value)}
                    className={`flex-1 px-3.5 py-2 text-sm font-medium rounded-none transition-all ${
                      editStates.terms
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                  {editStates.terms && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition-colors cursor-pointer"
                      title="Remove clause"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new term input (Visible only when editing terms) */}
            {editStates.terms ? (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTerm()
                    }
                  }}
                  placeholder="Type new terms & condition clause and press Add..."
                  className="flex-1 px-3.5 py-2.5 text-sm text-[#292424] dark:text-white font-medium bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-[#043486] dark:text-blue-300 text-xs font-semibold rounded-none border border-blue-200 dark:border-blue-900 transition-colors shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Clause</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 pt-1 flex items-center gap-1.5">
                <Lock size={12} />
                <span>Click &quot;Edit Terms&quot; above to add or remove invoice clauses.</span>
              </p>
            )}

            {/* Dynamic Return Policy Settings Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-[#043486] dark:text-blue-400" />
                <h3 className="text-xs sm:text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wider">
                  Material Return Policy Configuration
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Configure the return window duration for returnable materials. This clause will be automatically printed on Tax Invoices and Payment Receipts <strong>only if</strong> the bill contains items marked with <em>"Enable Return Policy"</em>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-gray-50 dark:bg-slate-950 p-4 border border-gray-200 dark:border-slate-800">
                <div className="md:col-span-1 space-y-1">
                  <label className="block text-xs font-bold text-[#292424] dark:text-white">
                    Return Policy Window (Days) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      disabled={!editStates.terms}
                      value={returnDays}
                      onChange={(e) => setReturnDays(e.target.value)}
                      placeholder="7"
                      className={`w-full px-3.5 py-2 text-sm font-bold rounded-none transition-all ${
                        editStates.terms
                          ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                          : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                      Days
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1 bg-white dark:bg-slate-900 p-3 border border-blue-100 dark:border-slate-800">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#043486] dark:text-blue-400 block">
                    Dynamic Bill Clause Preview:
                  </span>
                  <p className="text-xs text-gray-700 dark:text-slate-300 font-medium">
                    &bull; Products eligible for return must be returned within <strong>{returnDays || 7} days</strong> of purchase with original invoice copy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action - Only shown when current active tab is being edited */}
        {isCurrentTabEditing && (
          <div className="flex items-center justify-end gap-3 pt-2 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => handleCancelTab(activeTab)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-medium text-sm rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={15} />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-7 py-2.5 bg-[#043486] hover:bg-[#0248BC] text-white font-semibold text-sm rounded-none shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        )}

      </form>

      {/* Signature & Image Fullscreen Zoom Modal */}
      {previewZoomImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setPreviewZoomImg(null)}
        >
          <div 
            className="relative bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 p-6 max-w-lg w-full shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewZoomImg(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
            >
              <X size={18} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-4 self-start">
              Authorized Signature Preview
            </h3>
            <div className="w-full bg-white dark:bg-slate-950 p-6 flex items-center justify-center border border-gray-200 dark:border-slate-800 rounded-none shadow-inner">
              <img
                src={previewZoomImg}
                alt="Zoomed Preview"
                className="max-h-56 max-w-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setPreviewZoomImg(null)}
              className="mt-5 px-5 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
