import React, { useState, useEffect } from 'react'
import {
  SlidersHorizontal,
  Mail,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Server,
  AtSign,
  User,
  Info,
  Edit2,
  X,
  Cloud,
  Folder,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'

export default function ConfigurationsSettingsPage() {
  const [activeTab, setActiveTab] = useState('mail') // 'mail' | 'cloudinary'
  const [isLoading, setIsLoading] = useState(true)

  // Mail Section States
  const [isSavingSmtp, setIsSavingSmtp] = useState(false)
  const [isSavingRecipient, setIsSavingRecipient] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [isEditingSmtp, setIsEditingSmtp] = useState(false)
  const [isEditingRecipient, setIsEditingRecipient] = useState(false)

  const [mailFormData, setMailFormData] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    sender_name: 'SIMCHA INFO SOLUTIONS',
    recipient_email: '',
    auto_email_on_create: true,
    email_customer_copy: true,
    email_subject: 'New Tax Invoice Generated - {invoice_number}',
    email_body: 'Dear Customer / Team,\n\nPlease find attached the official Tax Invoice generated from Simcha Info Solutions Billing System.\n\nThank you for doing business with us!'
  })
  const [originalMailData, setOriginalMailData] = useState({ ...mailFormData })

  // Cloudinary Section States
  const [isSavingCloudinary, setIsSavingCloudinary] = useState(false)
  const [isTestingCloudinary, setIsTestingCloudinary] = useState(false)
  const [isEditingCloudinary, setIsEditingCloudinary] = useState(false)
  const [showCloudinarySecret, setShowCloudinarySecret] = useState(false)

  const [cloudinaryFormData, setCloudinaryFormData] = useState({
    cloud_name: '',
    api_key: '',
    api_secret: '',
    folder_name: 'simcha_billing',
    is_enabled: true
  })
  const [originalCloudinaryData, setOriginalCloudinaryData] = useState({ ...cloudinaryFormData })

  // Fetch configs on mount
  useEffect(() => {
    const fetchAllConfigs = async () => {
      try {
        setIsLoading(true)
        const [emailRes, cloudRes] = await Promise.all([
          fetch(API_ENDPOINTS.EMAIL_CONFIG),
          fetch(API_ENDPOINTS.CLOUDINARY_CONFIG)
        ])

        const emailData = await emailRes.json()
        const cloudData = await cloudRes.json()

        if (emailData.success && emailData.config) {
          const loadedMail = {
            smtp_host: emailData.config.smtp_host || 'smtp.gmail.com',
            smtp_port: emailData.config.smtp_port || 465,
            smtp_secure: Boolean(emailData.config.smtp_secure),
            smtp_user: emailData.config.smtp_user || '',
            smtp_pass: emailData.config.smtp_pass || '',
            sender_name: emailData.config.sender_name || 'SIMCHA INFO SOLUTIONS',
            recipient_email: emailData.config.recipient_email || emailData.config.smtp_user || '',
            auto_email_on_create: emailData.config.auto_email_on_create !== undefined ? Boolean(emailData.config.auto_email_on_create) : true,
            email_customer_copy: emailData.config.email_customer_copy !== undefined ? Boolean(emailData.config.email_customer_copy) : true,
            email_subject: emailData.config.email_subject || 'New Tax Invoice Generated - {invoice_number}',
            email_body: emailData.config.email_body || ''
          }
          setMailFormData(loadedMail)
          setOriginalMailData(loadedMail)
        }

        if (cloudData.success && cloudData.config) {
          const loadedCloud = {
            cloud_name: cloudData.config.cloud_name || '',
            api_key: cloudData.config.api_key || '',
            api_secret: cloudData.config.api_secret || '',
            folder_name: cloudData.config.folder_name || 'simcha_billing',
            is_enabled: cloudData.config.is_enabled !== undefined ? Boolean(cloudData.config.is_enabled) : true
          }
          setCloudinaryFormData(loadedCloud)
          setOriginalCloudinaryData(loadedCloud)
        }
      } catch (err) {
        console.error('Failed to load configurations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllConfigs()
  }, [])

  // ==================== MAIL HANDLERS ====================
  const handleMailChange = (field, value) => {
    setMailFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleToggleAutoEmail = async (checked) => {
    const updated = { ...mailFormData, auto_email_on_create: checked }
    setMailFormData(updated)
    try {
      await fetch(API_ENDPOINTS.EMAIL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      setOriginalMailData(updated)
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: checked ? 'Auto Email Dispatch Enabled' : 'Auto Email Dispatch Disabled'
      })
    } catch (err) {
      console.error('Failed to update toggle:', err)
    }
  }

  const handleToggleCustomerCopy = async (checked) => {
    const updated = { ...mailFormData, email_customer_copy: checked }
    setMailFormData(updated)
    try {
      await fetch(API_ENDPOINTS.EMAIL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      setOriginalMailData(updated)
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: checked ? 'Customer Email Dispatch Enabled' : 'Customer Email Dispatch Disabled'
      })
    } catch (err) {
      console.error('Failed to update customer copy toggle:', err)
    }
  }

  const handleSaveSmtp = async (e) => {
    if (e) e.preventDefault()
    try {
      setIsSavingSmtp(true)
      const res = await fetch(API_ENDPOINTS.EMAIL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mailFormData)
      })
      const data = await res.json()

      if (data.success) {
        setOriginalMailData({ ...mailFormData })
        setIsEditingSmtp(false)
        Swal.fire({
          icon: 'success',
          title: 'SMTP Settings Saved',
          text: 'Outgoing SMTP server configurations updated successfully.',
          confirmButtonColor: '#043486',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error(data.message || 'Failed to save SMTP settings.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message,
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSavingSmtp(false)
    }
  }

  const handleCancelSmtp = () => {
    setMailFormData(prev => ({
      ...prev,
      smtp_host: originalMailData.smtp_host,
      smtp_port: originalMailData.smtp_port,
      smtp_secure: originalMailData.smtp_secure,
      smtp_user: originalMailData.smtp_user,
      smtp_pass: originalMailData.smtp_pass,
      sender_name: originalMailData.sender_name,
      recipient_email: originalMailData.recipient_email
    }))
    setIsEditingSmtp(false)
  }

  const handleSaveRecipient = async (e) => {
    if (e) e.preventDefault()
    try {
      setIsSavingRecipient(true)
      const res = await fetch(API_ENDPOINTS.EMAIL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mailFormData)
      })
      const data = await res.json()

      if (data.success) {
        setOriginalMailData({ ...mailFormData })
        setIsEditingRecipient(false)
        Swal.fire({
          icon: 'success',
          title: 'Email Templates Saved',
          text: 'Email Subject and Message Template updated successfully.',
          confirmButtonColor: '#043486',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error(data.message || 'Failed to save recipient settings.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message,
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSavingRecipient(false)
    }
  }

  const handleCancelRecipient = () => {
    setMailFormData(prev => ({
      ...prev,
      recipient_email: originalMailData.recipient_email,
      email_subject: originalMailData.email_subject,
      email_body: originalMailData.email_body
    }))
    setIsEditingRecipient(false)
  }

  const handleTestEmail = async () => {
    if (!mailFormData.smtp_user || !mailFormData.smtp_pass) {
      Swal.fire({
        icon: 'warning',
        title: 'Credentials Required',
        text: 'Please enter SMTP Email and App Password to test connection.',
        confirmButtonColor: '#043486'
      })
      return
    }

    try {
      setIsTesting(true)
      Swal.fire({
        title: 'Testing SMTP Connection...',
        text: `Sending sample dispatch test to ${mailFormData.recipient_email || mailFormData.smtp_user}`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })

      const res = await fetch(API_ENDPOINTS.EMAIL_TEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mailFormData,
          test_recipient: mailFormData.recipient_email || mailFormData.smtp_user
        })
      })

      const data = await res.json()
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'SMTP Connected & Verified!',
          html: `<p class="text-sm text-gray-600 dark:text-slate-300">Test email successfully sent to <b>${mailFormData.recipient_email || mailFormData.smtp_user}</b>.</p>`,
          confirmButtonColor: '#043486'
        })
      } else {
        throw new Error(data.message || 'SMTP Authentication failed.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'SMTP Connection Failed',
        text: err.message,
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsTesting(false)
    }
  }

  // ==================== CLOUDINARY HANDLERS ====================
  const handleCloudinaryChange = (field, value) => {
    setCloudinaryFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleToggleCloudinary = async (checked) => {
    const updated = { ...cloudinaryFormData, is_enabled: checked }
    setCloudinaryFormData(updated)
    try {
      await fetch(API_ENDPOINTS.CLOUDINARY_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      setOriginalCloudinaryData(updated)
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: checked ? 'Cloudinary Media Storage Enabled' : 'Cloudinary Media Storage Disabled'
      })
    } catch (err) {
      console.error('Failed to update Cloudinary toggle:', err)
    }
  }

  const handleSaveCloudinary = async (e) => {
    if (e) e.preventDefault()
    try {
      setIsSavingCloudinary(true)
      const res = await fetch(API_ENDPOINTS.CLOUDINARY_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudinaryFormData)
      })
      const data = await res.json()

      if (data.success) {
        setOriginalCloudinaryData({ ...cloudinaryFormData })
        setIsEditingCloudinary(false)
        Swal.fire({
          icon: 'success',
          title: 'Cloudinary Configuration Saved',
          text: 'Cloudinary API credentials & upload folder saved successfully.',
          confirmButtonColor: '#043486',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error(data.message || 'Failed to save Cloudinary configurations.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message,
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSavingCloudinary(false)
    }
  }

  const handleCancelCloudinary = () => {
    setCloudinaryFormData({ ...originalCloudinaryData })
    setIsEditingCloudinary(false)
  }

  const handleTestCloudinary = async () => {
    if (!cloudinaryFormData.cloud_name || !cloudinaryFormData.api_key || !cloudinaryFormData.api_secret) {
      Swal.fire({
        icon: 'warning',
        title: 'Credentials Required',
        text: 'Please enter Cloud Name, API Key, and API Secret to test connection.',
        confirmButtonColor: '#043486'
      })
      return
    }

    try {
      setIsTestingCloudinary(true)
      Swal.fire({
        title: 'Testing Cloudinary Connection...',
        text: `Connecting to Cloudinary cloud "${cloudinaryFormData.cloud_name}"...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })

      const res = await fetch(API_ENDPOINTS.CLOUDINARY_TEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudinaryFormData)
      })

      const data = await res.json()
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Cloudinary Connected & Verified!',
          html: `<p class="text-sm text-gray-600 dark:text-slate-300">Successfully verified account <b>"${cloudinaryFormData.cloud_name}"</b>. Billing media will be securely stored and served via Cloudinary CDN.</p>`,
          confirmButtonColor: '#043486'
        })
      } else {
        throw new Error(data.message || 'Cloudinary verification failed.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Cloudinary Verification Failed',
        text: err.message,
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsTestingCloudinary(false)
    }
  }

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 space-y-6 pb-16 font-['Poppins',sans-serif]">
      
      {/* 1. Page Header with Boxy Velzon Aesthetics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-400 rounded-none border border-blue-100 dark:border-blue-800/50">
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#292424] dark:text-white uppercase tracking-wide">
              Configurations Settings
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Manage outgoing SMTP mail server and Cloudinary cloud media storage credentials.
            </p>
          </div>
        </div>

        {/* Tab Action Quick Action */}
        <div className="flex items-center gap-2">
          {activeTab === 'mail' && (
            <button
              onClick={handleTestEmail}
              disabled={isTesting || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-400 hover:bg-[#043486] hover:text-white dark:hover:bg-blue-600 text-xs font-bold rounded-none shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>{isTesting ? 'Testing...' : 'Send Test Email'}</span>
            </button>
          )}

          {activeTab === 'cloudinary' && (
            <button
              onClick={handleTestCloudinary}
              disabled={isTestingCloudinary || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-sky-600 dark:border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-600 hover:text-white text-xs font-bold rounded-none shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap size={14} />
              <span>{isTestingCloudinary ? 'Testing...' : 'Test Cloudinary Connection'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Tab Navigation Strip */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <button
          onClick={() => setActiveTab('mail')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'mail'
              ? 'border-[#043486] text-[#043486] dark:border-blue-400 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/20'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Mail size={17} />
          <span>Mail Settings</span>
          {/* {mailFormData.auto_email_on_create && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950" />
          )} */}
        </button>

        <button
          onClick={() => setActiveTab('cloudinary')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'cloudinary'
              ? 'border-[#043486] text-[#043486] dark:border-blue-400 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/20'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Cloud size={17} />
          <span>Cloudinary Configurations</span>
          {/* {cloudinaryFormData.cloud_name && (
            <span className="w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-200 dark:ring-sky-950" />
          )} */}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MAIL SETTINGS                                     */}
      {/* ========================================================= */}
      {activeTab === 'mail' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Auto-Dispatch Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-400 rounded-none border border-blue-100 dark:border-blue-800/40">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#292424] dark:text-white">Auto-Dispatch on Bill Generation</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                    When enabled, saving a bill (or shortcut <code className="text-[#043486] dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/50 px-1 py-0.5 border border-blue-100 dark:border-blue-900/50">CTRL + ENTER</code>) automatically creates and sends the invoice PDF to the admin/accountant recipient.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Status:
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mailFormData.auto_email_on_create}
                    onChange={(e) => handleToggleAutoEmail(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-[#043486] dark:peer-checked:bg-blue-600"></div>
                  <span className="ml-2.5 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
                    {mailFormData.auto_email_on_create ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>

            {/* Customer Copy Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-none border border-emerald-100 dark:border-emerald-800/40">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#292424] dark:text-white">Send Copy to Customer Email</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                    When enabled, if customer email is provided in Outward, the invoice PDF is automatically emailed directly to the customer as well.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Customer Copy:
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mailFormData.email_customer_copy}
                    onChange={(e) => handleToggleCustomerCopy(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
                  <span className="ml-2.5 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
                    {mailFormData.email_customer_copy ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Form Split: SMTP & Message Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SMTP Server Settings (Left 7 Cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Server size={18} className="text-[#043486] dark:text-blue-400" />
                  <div>
                    <h2 className="text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wide">
                      SMTP Mail Server Settings
                    </h2>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">
                      Configure outgoing sender email, app password & destination recipient
                    </p>
                  </div>
                </div>

                {!isEditingSmtp ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingSmtp(true)}
                    className="px-3 py-1.5 text-xs font-bold text-[#043486] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-none border border-blue-200 dark:border-blue-900/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelSmtp}
                      className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSmtp}
                      disabled={isSavingSmtp}
                      className="px-3 py-1 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-colors flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Save size={12} />
                      <span>{isSavingSmtp ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Sender Email ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-gray-700 dark:text-slate-300">
                      Sender Email ID (From Mail / SMTP User) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10.5px] text-gray-400 dark:text-slate-500">Endha Mail-la irunchu send aaganum</span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      disabled={!isEditingSmtp}
                      value={mailFormData.smtp_user}
                      onChange={(e) => handleMailChange('smtp_user', e.target.value)}
                      placeholder="e.g. simchainfosolutions@gmail.com"
                      className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-none transition-all ${
                        isEditingSmtp
                          ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                          : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                {/* Email App Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-gray-700 dark:text-slate-300">
                      Email App Password / SMTP Password <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-medium">16-Digit Google App Password</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={!isEditingSmtp}
                      value={mailFormData.smtp_pass}
                      onChange={(e) => handleMailChange('smtp_pass', e.target.value)}
                      placeholder="••••••••••••••••"
                      className={`w-full pl-3.5 pr-10 py-2.5 text-xs font-medium rounded-none font-mono transition-all ${
                        isEditingSmtp
                          ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                          : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Recipient Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-gray-700 dark:text-slate-300">
                      Send Invoice Copy To (Recipient Email) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10.5px] text-gray-400 dark:text-slate-500">Yaarukku bill copy deliver aaganum</span>
                  </div>
                  <input
                    type="email"
                    disabled={!isEditingSmtp}
                    value={mailFormData.recipient_email}
                    onChange={(e) => handleMailChange('recipient_email', e.target.value)}
                    placeholder="e.g. accounts@simcha.com"
                    className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-none transition-all ${
                      isEditingSmtp
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  />
                </div>

                {/* Sender Display Name */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Sender Display Name (From Name)
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingSmtp}
                    value={mailFormData.sender_name}
                    onChange={(e) => handleMailChange('sender_name', e.target.value)}
                    placeholder="SIMCHA INFO SOLUTIONS"
                    className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-none transition-all ${
                      isEditingSmtp
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  />
                </div>

                {/* Host & Port Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                      SMTP Host Server
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingSmtp}
                      value={mailFormData.smtp_host}
                      onChange={(e) => handleMailChange('smtp_host', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-600 dark:text-slate-400 rounded-none disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                      SMTP Port & Protocol
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        disabled={!isEditingSmtp}
                        value={mailFormData.smtp_port}
                        onChange={(e) => handleMailChange('smtp_port', e.target.value)}
                        className="w-20 px-3 py-2 text-xs border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-600 dark:text-slate-400 rounded-none disabled:cursor-not-allowed"
                      />
                      <select
                        disabled={!isEditingSmtp}
                        value={mailFormData.smtp_secure ? 'true' : 'false'}
                        onChange={(e) => handleMailChange('smtp_secure', e.target.value === 'true')}
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-600 dark:text-slate-400 rounded-none disabled:cursor-not-allowed"
                      >
                        <option value="true">SSL (Port 465)</option>
                        <option value="false">TLS / STARTTLS (Port 587)</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Email Message Templates (Right 5 Cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <AtSign size={18} className="text-[#043486] dark:text-blue-400" />
                  <div>
                    <h2 className="text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wide">
                      Email Message Templates
                    </h2>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">
                      Customize the email subject and body format
                    </p>
                  </div>
                </div>

                {!isEditingRecipient ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingRecipient(true)}
                    className="px-3 py-1.5 text-xs font-bold text-[#043486] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-none border border-blue-200 dark:border-blue-900/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelRecipient}
                      className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRecipient}
                      disabled={isSavingRecipient}
                      className="px-3 py-1 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-colors flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Save size={12} />
                      <span>{isSavingRecipient ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 text-xs">
                {/* Email Subject */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Email Subject Template
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingRecipient}
                    value={mailFormData.email_subject}
                    onChange={(e) => handleMailChange('email_subject', e.target.value)}
                    placeholder="New Tax Invoice Generated - {invoice_number}"
                    className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-none transition-all ${
                      isEditingRecipient
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  />
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                    Available tags: <code className="text-[#043486] dark:text-blue-400 font-bold">{'{invoice_number}'}</code>, <code className="text-[#043486] dark:text-blue-400 font-bold">{'{customer_name}'}</code>
                  </p>
                </div>

                {/* Message Body Template */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Message Body Template
                  </label>
                  <textarea
                    rows={5}
                    disabled={!isEditingRecipient}
                    value={mailFormData.email_body}
                    onChange={(e) => handleMailChange('email_body', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-none transition-all resize-none ${
                      isEditingRecipient
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  />
                </div>

                {/* Live Dispatch Preview */}
                <div className="p-3.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                    <Info size={13} className="text-[#043486] dark:text-blue-400" />
                    <span>Dispatch Summary:</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-slate-400">
                    <b className="text-gray-800 dark:text-slate-200">From (Sender):</b> {mailFormData.smtp_user || '<Not Configured>'}
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-slate-400">
                    <b className="text-gray-800 dark:text-slate-200">Admin Copy To:</b> {mailFormData.recipient_email || mailFormData.smtp_user || '<Not Configured>'}
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-slate-400">
                    <b className="text-gray-800 dark:text-slate-200">Customer Copy:</b> {mailFormData.email_customer_copy ? 'Enabled (Auto-sends to customer if email is provided in Outward Bill)' : 'Disabled'}
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-slate-400">
                    <b className="text-gray-800 dark:text-slate-200">Attachment:</b> Invoice INV-XXXX-XX.pdf
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CLOUDINARY CONFIGURATIONS                         */}
      {/* ========================================================= */}
      {activeTab === 'cloudinary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Quick Cloudinary Status Banner Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-none border border-sky-100 dark:border-sky-800/40">
                <Cloud size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#292424] dark:text-white">Cloudinary Cloud Media Storage</h3>
                  {cloudinaryFormData.cloud_name ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      Active: {cloudinaryFormData.cloud_name}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      Not Configured
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Store hardcopy inward bills, invoices, and bank QR codes in Cloudinary cloud.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800 justify-between sm:justify-end">
              <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Upload Feature:
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cloudinaryFormData.is_enabled}
                  onChange={(e) => handleToggleCloudinary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-sky-600 dark:peer-checked:bg-sky-500"></div>
                <span className="ml-2.5 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
                  {cloudinaryFormData.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          {/* Cloudinary Credentials Form Card (Clean & Full Width) */}
          <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Key size={18} className="text-sky-600 dark:text-sky-400" />
                <div>
                  <h2 className="text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wide">
                    Cloudinary API Credentials
                  </h2>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">
                    Manage dynamic API keys for automated media uploads
                  </p>
                </div>
              </div>

              {isEditingCloudinary ? (
                <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Editing Mode Active
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* Cloud Name */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Cloud Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditingCloudinary}
                  value={cloudinaryFormData.cloud_name}
                  onChange={(e) => handleCloudinaryChange('cloud_name', e.target.value)}
                  placeholder="e.g. simcha-cloud"
                  className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-none transition-all ${
                    isEditingCloudinary
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-sky-500'
                      : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditingCloudinary}
                  value={cloudinaryFormData.api_key}
                  onChange={(e) => handleCloudinaryChange('api_key', e.target.value)}
                  placeholder="e.g. 123456789012345"
                  className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-none font-mono transition-all ${
                    isEditingCloudinary
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-sky-500'
                      : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* API Secret */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  API Secret <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCloudinarySecret ? 'text' : 'password'}
                    disabled={!isEditingCloudinary}
                    value={cloudinaryFormData.api_secret}
                    onChange={(e) => handleCloudinaryChange('api_secret', e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className={`w-full pl-3.5 pr-10 py-2.5 text-xs font-medium rounded-none font-mono transition-all ${
                      isEditingCloudinary
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-sky-500'
                        : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCloudinarySecret(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showCloudinarySecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Default Upload Folder */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Upload Root Folder
                </label>
                <div className="relative">
                  <Folder size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    disabled={!isEditingCloudinary}
                    value={cloudinaryFormData.folder_name}
                    onChange={(e) => handleCloudinaryChange('folder_name', e.target.value)}
                    placeholder="simcha_billing"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-none transition-all ${
                      isEditingCloudinary
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-sky-500'
                        : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

            </div>

            {/* Bottom Action Controls: Save, Cancel, Test Connection */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={handleTestCloudinary}
                  disabled={isTestingCloudinary}
                  className="px-4 py-2 border border-sky-600 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-bold rounded-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap size={14} />
                  <span>{isTestingCloudinary ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {!isEditingCloudinary ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingCloudinary(true)}
                    className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit2 size={13} />
                    <span>Edit Credentials</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelCloudinary}
                      className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer border border-gray-300 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCloudinary}
                      disabled={isSavingCloudinary}
                      className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-none transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Save size={13} />
                      <span>{isSavingCloudinary ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  )
}
