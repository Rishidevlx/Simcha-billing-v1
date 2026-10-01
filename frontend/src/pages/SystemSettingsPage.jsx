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
} from '../components/common/icons'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'
import { getUserPermissions } from '../utils/access'
import { Button } from '../components/ui'
import SkeletonLoader from '../components/common/SkeletonLoader'
import ArrowNavTabs from '../components/common/ArrowNavTabs'
import {
  CompanyProfileSection,
  NumberingSchemesSection,
  TaxRatesSection,
  BankAccountSection,
  TermsConditionsSection
} from '../components/settings/sections'

export default function SystemSettingsPage() {
  const { can, hasAny } = getUserPermissions()
  const canEdit = hasAny('settings_system', ['Edit']) || hasAny('settings', ['Edit']) || can('settings_system', 'Edit') || can('settings', 'Edit')

  const [activeTab, setActiveTab] = useState('company') // 'company' | 'taxes' | 'bank' | 'terms'
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Edit mode per tab/section
  const [editStates, setEditStates] = useState({
    company: false,
    numbering: false,
    taxes: false,
    bank: false,
    terms: false
  })

  // Company Details
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gstin, setGstin] = useState('')
  
  // Dynamic Invoice Numbering Settings
  const [invoicePrefix, setInvoicePrefix] = useState('')
  const [invoiceFinancialYear, setInvoiceFinancialYear] = useState('')
  const [invoiceStartingNumber, setInvoiceStartingNumber] = useState('')
  const [invoicePaddingDigits, setInvoicePaddingDigits] = useState('')
  const [invoiceSeparator, setInvoiceSeparator] = useState('')

  // Dynamic Receipt Numbering Settings
  const [receiptPrefix, setReceiptPrefix] = useState('')
  const [receiptFinancialYear, setReceiptFinancialYear] = useState('')
  const [receiptStartingNumber, setReceiptStartingNumber] = useState('')
  const [receiptPaddingDigits, setReceiptPaddingDigits] = useState('')
  const [receiptSeparator, setReceiptSeparator] = useState('')

  // Dynamic Service Numbering Settings
  const [servicePrefix, setServicePrefix] = useState('')
  const [serviceFinancialYear, setServiceFinancialYear] = useState('')
  const [serviceStartingNumber, setServiceStartingNumber] = useState('')
  const [servicePaddingDigits, setServicePaddingDigits] = useState('')
  const [serviceSeparator, setServiceSeparator] = useState('')

  // Dynamic Return Numbering Settings
  const [returnPrefix, setReturnPrefix] = useState('')
  const [returnFinancialYear, setReturnFinancialYear] = useState('')
  const [returnStartingNumber, setReturnStartingNumber] = useState('')
  const [returnPaddingDigits, setReturnPaddingDigits] = useState('')
  const [returnSeparator, setReturnSeparator] = useState('')

  // Dynamic Credit Note Numbering Settings
  const [creditNotePrefix, setCreditNotePrefix] = useState('')
  const [creditNoteFinancialYear, setCreditNoteFinancialYear] = useState('')
  const [creditNoteStartingNumber, setCreditNoteStartingNumber] = useState('')
  const [creditNotePaddingDigits, setCreditNotePaddingDigits] = useState('')
  const [creditNoteSeparator, setCreditNoteSeparator] = useState('')

  // Tax Rates
  const [cgstRate, setCgstRate] = useState('')
  const [sgstRate, setSgstRate] = useState('')
  const [igstRate, setIgstRate] = useState('')

  // Bank Details
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [branch, setBranch] = useState('')
  const [bankImageUrl, setBankImageUrl] = useState('')
  const [isUploadingBankImg, setIsUploadingBankImg] = useState(false)
  const [signatureUrl, setSignatureUrl] = useState('')
  const [isUploadingSign, setIsUploadingSign] = useState(false)
  const [previewZoomImg, setPreviewZoomImg] = useState(null)

  // Terms & Conditions
  const [terms, setTerms] = useState([])
  const [returnDays, setReturnDays] = useState('')
  const [returnClause, setReturnClause] = useState('')
  const [dueDateDays, setDueDateDays] = useState('')
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
    setCompanyName(s.company_name || '')
    setAddress(s.address || '')
    setPhone(s.phone || '')
    setEmail(s.email || '')
    setGstin(s.gstin || '')
    setSignatureUrl(s.signature_url || '')
    
    // Invoice numbering
    setInvoicePrefix(s.invoice_prefix || '')
    setInvoiceFinancialYear(s.invoice_financial_year || '')
    setInvoiceStartingNumber(s.invoice_starting_number !== undefined && s.invoice_starting_number !== null ? String(s.invoice_starting_number) : '')
    setInvoicePaddingDigits(s.invoice_padding_digits !== undefined && s.invoice_padding_digits !== null ? String(s.invoice_padding_digits) : '')
    setInvoiceSeparator(s.invoice_separator || '')

    // Receipt numbering
    setReceiptPrefix(s.receipt_prefix || '')
    setReceiptFinancialYear(s.receipt_financial_year || '')
    setReceiptStartingNumber(s.receipt_starting_number !== undefined && s.receipt_starting_number !== null ? String(s.receipt_starting_number) : '')
    setReceiptPaddingDigits(s.receipt_padding_digits !== undefined && s.receipt_padding_digits !== null ? String(s.receipt_padding_digits) : '')
    setReceiptSeparator(s.receipt_separator || '')

    // Service numbering
    setServicePrefix(s.service_prefix || '')
    setServiceFinancialYear(s.service_financial_year || '')
    setServiceStartingNumber(s.service_starting_number !== undefined && s.service_starting_number !== null ? String(s.service_starting_number) : '')
    setServicePaddingDigits(s.service_padding_digits !== undefined && s.service_padding_digits !== null ? String(s.service_padding_digits) : '')
    setServiceSeparator(s.service_separator || '')

    // Return numbering
    setReturnPrefix(s.return_prefix || '')
    setReturnFinancialYear(s.return_financial_year || '')
    setReturnStartingNumber(s.return_starting_number !== undefined && s.return_starting_number !== null ? String(s.return_starting_number) : '')
    setReturnPaddingDigits(s.return_padding_digits !== undefined && s.return_padding_digits !== null ? String(s.return_padding_digits) : '')
    setReturnSeparator(s.return_separator || '')

    // Credit Note numbering
    setCreditNotePrefix(s.credit_note_prefix || '')
    setCreditNoteFinancialYear(s.credit_note_financial_year || '')
    setCreditNoteStartingNumber(s.credit_note_starting_number !== undefined && s.credit_note_starting_number !== null ? String(s.credit_note_starting_number) : '')
    setCreditNotePaddingDigits(s.credit_note_padding_digits !== undefined && s.credit_note_padding_digits !== null ? String(s.credit_note_padding_digits) : '')
    setCreditNoteSeparator(s.credit_note_separator || '')

    setCgstRate(s.cgst_rate !== undefined && s.cgst_rate !== null ? String(s.cgst_rate) : '')
    setSgstRate(s.sgst_rate !== undefined && s.sgst_rate !== null ? String(s.sgst_rate) : '')
    setIgstRate(s.igst_rate !== undefined && s.igst_rate !== null ? String(s.igst_rate) : '')

    setBankName(s.bank_name || '')
    setAccountName(s.account_name || '')
    setAccountNo(s.account_no || '')
    setIfscCode(s.ifsc_code || '')
    setBranch(s.branch || '')
    setBankImageUrl(s.bank_image_url || '')
    setReturnDays(s.return_days !== undefined && s.return_days !== null ? String(s.return_days) : '')
    setReturnClause(s.return_policy_clause || '')
    setDueDateDays(s.due_date_days !== undefined && s.due_date_days !== null ? String(s.due_date_days) : '')

    if (Array.isArray(s.terms_conditions)) {
      setTerms(s.terms_conditions)
    } else {
      setTerms([])
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const toggleEditTab = (tabId, state) => {
    if (!canEdit && state !== false) return
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
      const res = await fetch(API_ENDPOINTS.CLOUDINARY_UPLOAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: compressedDataUrl,
          folder: 'bank'
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
        throw new Error(data.message || 'Cloudinary upload failed')
      }
    } catch (err) {
      console.error('Error uploading bank image:', err)
      Swal.fire({
        icon: 'warning',
        title: 'Cloudinary Upload Required',
        text: err.message || 'Unable to upload image to Cloudinary. Please verify Cloudinary credentials in Settings > Configurations Settings.',
        confirmButtonColor: '#043486'
      })
    } finally {
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
      const res = await fetch(API_ENDPOINTS.CLOUDINARY_UPLOAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: compressedDataUrl,
          folder: 'signatures'
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
        throw new Error(data.message || 'Cloudinary upload failed')
      }
    } catch (err) {
      console.error('Error uploading signature:', err)
      Swal.fire({
        icon: 'warning',
        title: 'Cloudinary Upload Required',
        text: err.message || 'Unable to upload signature to Cloudinary. Please verify Cloudinary credentials in Settings > Configurations Settings.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsUploadingSign(false)
    }
  }

  const handleSubmit = async (e, sectionId = activeTab) => {
    if (e && e.preventDefault) e.preventDefault()

    let payload = {}

    // Validation & payload generation per section
    if (sectionId === 'company') {
      if (!companyName.trim() || companyName.trim().length < 2) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please enter a valid Company / Business Name (minimum 2 characters).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (gstin.trim() && gstin.trim().length !== 15) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid GSTIN',
          text: 'Company GSTIN must be exactly 15 characters (e.g. 33GEZPM1178G1ZY).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (phone.trim() && phone.trim().length < 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Phone Number',
          text: 'Please enter a valid 10-digit mobile / phone number.',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (email.trim()) {
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
      }

      payload = {
        company_name: companyName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstin: gstin.trim(),
        signature_url: signatureUrl || null
      }
    } else if (sectionId === 'numbering') {
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

      if (!returnPrefix.trim() || returnPrefix.trim().length > 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Return Prefix',
          text: 'Return Prefix is required (maximum 10 characters).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!returnFinancialYear.trim() || returnFinancialYear.trim().length > 7) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Financial Year',
          text: 'Return Financial Year is required (maximum 7 characters, e.g. 2026-27).',
          confirmButtonColor: '#043486'
        })
        return
      }

      const retStart = parseInt(returnStartingNumber, 10)
      if (isNaN(retStart) || retStart < 1 || retStart > 999999) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Starting Number',
          text: 'Return starting number must be between 1 and 999999.',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!creditNotePrefix.trim() || creditNotePrefix.trim().length > 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Credit Note Prefix',
          text: 'Credit Note Prefix is required (maximum 10 characters).',
          confirmButtonColor: '#043486'
        })
        return
      }

      if (!creditNoteFinancialYear.trim() || creditNoteFinancialYear.trim().length > 7) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Financial Year',
          text: 'Credit Note Financial Year is required (maximum 7 characters, e.g. 2026-27).',
          confirmButtonColor: '#043486'
        })
        return
      }

      const cnStart = parseInt(creditNoteStartingNumber, 10)
      if (isNaN(cnStart) || cnStart < 1 || cnStart > 999999) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Starting Number',
          text: 'Credit Note starting number must be between 1 and 999999.',
          confirmButtonColor: '#043486'
        })
        return
      }

      payload = {
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
        return_prefix: returnPrefix.trim(),
        return_financial_year: returnFinancialYear.trim(),
        return_starting_number: parseInt(returnStartingNumber, 10) || 1,
        return_padding_digits: parseInt(returnPaddingDigits, 10) || 4,
        return_separator: returnSeparator || '/',
        credit_note_prefix: creditNotePrefix.trim(),
        credit_note_financial_year: creditNoteFinancialYear.trim(),
        credit_note_starting_number: parseInt(creditNoteStartingNumber, 10) || 1,
        credit_note_padding_digits: parseInt(creditNotePaddingDigits, 10) || 4,
        credit_note_separator: creditNoteSeparator || '/',
        due_date_days: dueDateDays !== '' && dueDateDays !== null ? parseInt(dueDateDays, 10) : 15
      }
    } else if (sectionId === 'bank') {
      if (ifscCode.trim() && ifscCode.trim().length !== 11) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid IFSC Code',
          text: 'IFSC Code must be exactly 11 characters (e.g. CNRB0002732).',
          confirmButtonColor: '#043486'
        })
        return
      }

      payload = {
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        account_no: accountNo.trim(),
        ifsc_code: ifscCode.trim(),
        branch: branch.trim(),
        bank_image_url: bankImageUrl || null
      }
    } else if (sectionId === 'taxes') {
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

      payload = {
        cgst_rate: cgst,
        sgst_rate: sgst,
        igst_rate: igst
      }
    } else if (sectionId === 'terms') {
      payload = {
        return_days: parseInt(returnDays, 10) || 0,
        return_policy_clause: returnClause ? returnClause.trim() : null,
        terms_conditions: terms.filter(t => t && t.trim())
      }
    }

    setIsSaving(true)

    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        setSavedSettings(prev => ({ ...prev, ...payload }))
        toggleEditTab(sectionId, false)

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
    return <SkeletonLoader type="form" className="max-w-6xl mx-auto pb-12" />
  }

  const isCurrentTabEditing = activeTab === 'company' 
    ? (editStates.company || editStates.numbering) 
    : editStates[activeTab]

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'taxes', label: 'Tax & GST Rates', icon: Percent },
    { id: 'bank', label: 'Bank Account', icon: Landmark },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, badge: terms.length }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-['Poppins',sans-serif]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
            <Building2 className="text-[#043486] dark:text-blue-400" size={22} />
            <span>SYSTEM SETTINGS</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Configure company profile, numbering schemes, tax rates, and bank accounts.
          </p>
        </div>
      </div>

      {/* Tab Navigation Bar (Velzon Arrow Nav Steps) */}
      <ArrowNavTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <div className="space-y-6">
        
        {/* ================= TAB 1: COMPANY PROFILE & NUMBERING ================= */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            <CompanyProfileSection
              canEdit={canEdit}
              isEditing={editStates.company}
              onToggleEdit={(val) => toggleEditTab('company', val)}
              onSave={() => handleSubmit(null, 'company')}
              onCancel={() => handleCancelTab('company')}
              isSaving={isSaving}
              companyName={companyName}
              setCompanyName={setCompanyName}
              gstin={gstin}
              setGstin={setGstin}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              address={address}
              setAddress={setAddress}
              signatureUrl={signatureUrl}
              setSignatureUrl={setSignatureUrl}
              isUploadingSign={isUploadingSign}
              handleSignatureUpload={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadSignature(file)
                e.target.value = ''
              }}
              handleRemoveSignature={() => setSignatureUrl('')}
              setPreviewZoomImg={setPreviewZoomImg}
            />

            <NumberingSchemesSection
              canEdit={canEdit}
              isEditing={editStates.numbering}
              onToggleEdit={(val) => toggleEditTab('numbering', val)}
              onSave={() => handleSubmit(null, 'numbering')}
              onCancel={() => handleCancelTab('numbering')}
              isSaving={isSaving}
              invoicePrefix={invoicePrefix}
              setInvoicePrefix={setInvoicePrefix}
              invoiceFinancialYear={invoiceFinancialYear}
              setInvoiceFinancialYear={setInvoiceFinancialYear}
              invoiceStartingNumber={invoiceStartingNumber}
              setInvoiceStartingNumber={setInvoiceStartingNumber}
              invoicePaddingDigits={invoicePaddingDigits}
              invoiceSeparator={invoiceSeparator}
              setInvoiceSeparator={setInvoiceSeparator}
              dueDateDays={dueDateDays}
              setDueDateDays={setDueDateDays}
              receiptPrefix={receiptPrefix}
              setReceiptPrefix={setReceiptPrefix}
              receiptFinancialYear={receiptFinancialYear}
              setReceiptFinancialYear={setReceiptFinancialYear}
              receiptStartingNumber={receiptStartingNumber}
              setReceiptStartingNumber={setReceiptStartingNumber}
              receiptPaddingDigits={receiptPaddingDigits}
              receiptSeparator={receiptSeparator}
              setReceiptSeparator={setReceiptSeparator}
              servicePrefix={servicePrefix}
              setServicePrefix={setServicePrefix}
              serviceFinancialYear={serviceFinancialYear}
              setServiceFinancialYear={setServiceFinancialYear}
              serviceStartingNumber={serviceStartingNumber}
              setServiceStartingNumber={setServiceStartingNumber}
              servicePaddingDigits={servicePaddingDigits}
              serviceSeparator={serviceSeparator}
              setServiceSeparator={setServiceSeparator}
              returnPrefix={returnPrefix}
              setReturnPrefix={setReturnPrefix}
              returnFinancialYear={returnFinancialYear}
              setReturnFinancialYear={setReturnFinancialYear}
              returnStartingNumber={returnStartingNumber}
              setReturnStartingNumber={setReturnStartingNumber}
              returnPaddingDigits={returnPaddingDigits}
              returnSeparator={returnSeparator}
              setReturnSeparator={setReturnSeparator}
              creditNotePrefix={creditNotePrefix}
              setCreditNotePrefix={setCreditNotePrefix}
              creditNoteFinancialYear={creditNoteFinancialYear}
              setCreditNoteFinancialYear={setCreditNoteFinancialYear}
              creditNoteStartingNumber={creditNoteStartingNumber}
              setCreditNoteStartingNumber={setCreditNoteStartingNumber}
              creditNotePaddingDigits={creditNotePaddingDigits}
              creditNoteSeparator={creditNoteSeparator}
              setCreditNoteSeparator={setCreditNoteSeparator}
            />
          </div>
        )}

        {/* ================= TAB 2: TAX & GST RATES ================= */}
        {activeTab === 'taxes' && (
          <TaxRatesSection
            canEdit={canEdit}
            isEditing={editStates.taxes}
            onToggleEdit={(val) => toggleEditTab('taxes', val)}
            onSave={() => handleSubmit(null, 'taxes')}
            onCancel={() => handleCancelTab('taxes')}
            isSaving={isSaving}
            cgstRate={cgstRate}
            setCgstRate={setCgstRate}
            sgstRate={sgstRate}
            setSgstRate={setSgstRate}
            igstRate={igstRate}
            setIgstRate={setIgstRate}
          />
        )}

        {/* ================= TAB 3: BANK ACCOUNT ================= */}
        {activeTab === 'bank' && (
          <BankAccountSection
            canEdit={canEdit}
            isEditing={editStates.bank}
            onToggleEdit={(val) => toggleEditTab('bank', val)}
            onSave={() => handleSubmit(null, 'bank')}
            onCancel={() => handleCancelTab('bank')}
            isSaving={isSaving}
            bankName={bankName}
            setBankName={setBankName}
            accountName={accountName}
            setAccountName={setAccountName}
            accountNo={accountNo}
            setAccountNo={setAccountNo}
            ifscCode={ifscCode}
            setIfscCode={setIfscCode}
            branch={branch}
            setBranch={setBranch}
            bankImageUrl={bankImageUrl}
            setBankImageUrl={setBankImageUrl}
            isUploadingBankImg={isUploadingBankImg}
            handleUploadBankImage={handleUploadBankImage}
            setPreviewZoomImg={setPreviewZoomImg}
          />
        )}

        {/* ================= TAB 4: TERMS & CONDITIONS ================= */}
        {activeTab === 'terms' && (
          <TermsConditionsSection
            canEdit={canEdit}
            isEditing={editStates.terms}
            onToggleEdit={(val) => toggleEditTab('terms', val)}
            onSave={() => handleSubmit(null, 'terms')}
            onCancel={() => handleCancelTab('terms')}
            isSaving={isSaving}
            terms={terms}
            handleTermChange={handleTermChange}
            handleRemoveTerm={handleRemoveTerm}
            newTermInput={newTermInput}
            setNewTermInput={setNewTermInput}
            handleAddTerm={handleAddTerm}
            returnDays={returnDays}
            setReturnDays={setReturnDays}
            returnClause={returnClause}
            setReturnClause={setReturnClause}
          />
        )}

      </div>

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
