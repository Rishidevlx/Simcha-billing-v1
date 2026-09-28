import React, { useState, useEffect } from 'react'
import {
  Palette,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Check,
  Eye,
  Layout,
  Globe,
  Monitor,
  CheckCircle2,
  Trash2,
  Receipt,
  Edit2,
  X,
  Sparkles,
  Layers,
  Lock
} from 'lucide-react'
import Swal from 'sweetalert2'
import ListPageHeader from '../components/common/ListPageHeader'
import defaultLogo from '../assets/Logo/Logo-bg-remove.webp'
import defaultFavicon from '../assets/Logo/Favicon.jpeg'

const THEME_PRESETS = [
  {
    id: 'simcha-classic',
    name: 'Classic Blue',
    primaryColor: '#043486',
    secondaryColor: '#0248BC',
    accentColor: '#3B82F6',
    sidebarBg: '#043486'
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    primaryColor: '#F97316',
    secondaryColor: '#EA580C',
    accentColor: '#FB923C',
    sidebarBg: '#1E293B'
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    primaryColor: '#7C3AED',
    secondaryColor: '#6D28D9',
    accentColor: '#A78BFA',
    sidebarBg: '#1E1B4B'
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    accentColor: '#10B981',
    sidebarBg: '#064E3B'
  },
  {
    id: 'crimson-red',
    name: 'Crimson Red',
    primaryColor: '#E11D48',
    secondaryColor: '#BE123C',
    accentColor: '#FB7185',
    sidebarBg: '#1C1917'
  },
  {
    id: 'cyber-slate',
    name: 'Cyber Indigo',
    primaryColor: '#4F46E5',
    secondaryColor: '#4338CA',
    accentColor: '#6366F1',
    sidebarBg: '#0F172A'
  }
]

export default function ThemeSettingsPage() {
  const [activeTab, setActiveTab] = useState('colors') // 'colors', 'branding', 'documents', 'preview'
  const [previewMode, setPreviewMode] = useState('app') // 'app', 'auth', 'invoice'

  // Per-tab Edit Mode States
  const [isEditingColors, setIsEditingColors] = useState(false)
  const [isEditingBranding, setIsEditingBranding] = useState(false)
  const [isEditingDocs, setIsEditingDocs] = useState(false)

  // Theme Config
  const [themeConfig, setThemeConfig] = useState({
    presetId: 'simcha-classic',
    primaryColor: '#043486',
    secondaryColor: '#0248BC',
    accentColor: '#3B82F6',
    sidebarTheme: 'dark',
    logoUrl: '',
    faviconUrl: '',
    invoiceHeaderStyle: 'banner',
    invoiceAccentColor: '#043486'
  })

  // Backup state for canceling edit
  const [backupConfig, setBackupConfig] = useState(null)

  const [logoPreview, setLogoPreview] = useState(defaultLogo)
  const [faviconPreview, setFaviconPreview] = useState(defaultFavicon)

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('simcha_custom_theme')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        setThemeConfig(prev => ({ ...prev, ...parsed }))
        if (parsed.logoUrl) setLogoPreview(parsed.logoUrl)
        if (parsed.faviconUrl) setFaviconPreview(parsed.faviconUrl)
      } catch (err) {
        console.error('Error reading theme from storage', err)
      }
    }
  }, [])

  // Start Edit on a tab
  const handleStartEdit = (tab) => {
    setBackupConfig({ ...themeConfig })
    if (tab === 'colors') setIsEditingColors(true)
    if (tab === 'branding') setIsEditingBranding(true)
    if (tab === 'documents') setIsEditingDocs(true)
  }

  // Cancel Edit on a tab
  const handleCancelEdit = (tab) => {
    if (backupConfig) {
      setThemeConfig({ ...backupConfig })
      if (backupConfig.logoUrl) setLogoPreview(backupConfig.logoUrl)
      else setLogoPreview(defaultLogo)

      if (backupConfig.faviconUrl) setFaviconPreview(backupConfig.faviconUrl)
      else setFaviconPreview(defaultFavicon)
    }
    if (tab === 'colors') setIsEditingColors(false)
    if (tab === 'branding') setIsEditingBranding(false)
    if (tab === 'documents') setIsEditingDocs(false)
  }

  // Save changes for a tab
  const handleSaveTab = (tab) => {
    try {
      localStorage.setItem('simcha_custom_theme', JSON.stringify(themeConfig))
      if (themeConfig.faviconUrl) {
        const faviconLink = document.querySelector("link[rel*='icon']")
        if (faviconLink) faviconLink.href = themeConfig.faviconUrl
      }

      if (tab === 'colors') setIsEditingColors(false)
      if (tab === 'branding') setIsEditingBranding(false)
      if (tab === 'documents') setIsEditingDocs(false)

      Swal.fire({
        icon: 'success',
        title: 'Saved Successfully',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Failed to save settings', 'error')
    }
  }

  // Logo file upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire('Warning', 'File must be under 2MB', 'warning')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        setLogoPreview(dataUrl)
        setThemeConfig(prev => ({ ...prev, logoUrl: dataUrl }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Favicon file upload
  const handleFaviconUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        Swal.fire('Warning', 'File must be under 1MB', 'warning')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        setFaviconPreview(dataUrl)
        setThemeConfig(prev => ({ ...prev, faviconUrl: dataUrl }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Reset to default
  const handleResetToDefaults = () => {
    Swal.fire({
      title: 'Reset Theme?',
      text: 'Revert all colors, logo, and favicon to default Simcha theme?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#043486',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Reset'
    }).then(result => {
      if (result.isConfirmed) {
        const defaultState = {
          presetId: 'simcha-classic',
          primaryColor: '#043486',
          secondaryColor: '#0248BC',
          accentColor: '#3B82F6',
          sidebarTheme: 'dark',
          logoUrl: '',
          faviconUrl: '',
          invoiceHeaderStyle: 'banner',
          invoiceAccentColor: '#043486'
        }
        setThemeConfig(defaultState)
        setLogoPreview(defaultLogo)
        setFaviconPreview(defaultFavicon)
        setIsEditingColors(false)
        setIsEditingBranding(false)
        setIsEditingDocs(false)
        localStorage.removeItem('simcha_custom_theme')

        Swal.fire({
          icon: 'success',
          title: 'Reset Complete',
          timer: 1500,
          showConfirmButton: false
        })
      }
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-['Poppins',sans-serif]">
      {/* 1. Header */}
      <ListPageHeader
        title="THEME SETTINGS"
        subtitle=""
        actions={
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 py-2 px-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold rounded-none shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
        }
      />

      {/* 2. Clean Navigation Tabs */}
      <div className="flex items-center border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'colors'
            ? 'border-[#043486] text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
        >
          <Palette size={16} />
          <span>Colors</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'branding'
            ? 'border-[#043486] text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
        >
          <ImageIcon size={16} />
          <span>Logo &amp; Favicon</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'documents'
            ? 'border-[#043486] text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
        >
          <Receipt size={16} />
          <span>Invoice Style</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'preview'
            ? 'border-[#043486] text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
        >
          <Eye size={16} />
          <span>Live Preview</span>
        </button>
      </div>

      {/* 3. Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: COLORS */}
          {activeTab === 'colors' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
              {/* Card Action Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette size={16} className="text-[#043486] dark:text-blue-400" />
                  <span>Theme Colors</span>
                </span>

                {!isEditingColors ? (
                  <button
                    type="button"
                    onClick={() => handleStartEdit('colors')}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-[#043486] hover:bg-[#0248BC] text-white text-xs font-bold rounded-none shadow-xs transition-all cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelEdit('colors')}
                      className="flex items-center gap-1 py-1.5 px-3 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X size={13} />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveTab('colors')}
                      className="flex items-center gap-1 py-1.5 px-3 bg-[#043486] hover:bg-[#0248BC] text-white text-xs font-bold rounded-none shadow-xs cursor-pointer"
                    >
                      <Save size={13} />
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Presets */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                  Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = themeConfig.presetId === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={!isEditingColors}
                        onClick={() =>
                          setThemeConfig(prev => ({
                            ...prev,
                            presetId: preset.id,
                            primaryColor: preset.primaryColor,
                            secondaryColor: preset.secondaryColor,
                            accentColor: preset.accentColor,
                            invoiceAccentColor: preset.primaryColor
                          }))
                        }
                        className={`p-2.5 border text-left transition-all ${!isEditingColors ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'
                          } ${isSelected
                            ? 'border-[#043486] bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-gray-900 dark:text-white truncate">
                            {preset.name}
                          </span>
                          {isSelected && <CheckCircle2 size={13} className="text-[#043486] dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.secondaryColor }} />
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Hex Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Primary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isEditingColors}
                      value={themeConfig.primaryColor}
                      onChange={(e) =>
                        setThemeConfig(prev => ({
                          ...prev,
                          presetId: 'custom',
                          primaryColor: e.target.value
                        }))
                      }
                      className={`w-9 h-9 border border-gray-300 dark:border-slate-700 p-0.5 rounded-none ${!isEditingColors ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                        }`}
                    />
                    <input
                      type="text"
                      disabled={!isEditingColors}
                      value={themeConfig.primaryColor}
                      onChange={(e) =>
                        setThemeConfig(prev => ({
                          ...prev,
                          presetId: 'custom',
                          primaryColor: e.target.value
                        }))
                      }
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Secondary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    Secondary / Hover
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isEditingColors}
                      value={themeConfig.secondaryColor}
                      onChange={(e) =>
                        setThemeConfig(prev => ({
                          ...prev,
                          presetId: 'custom',
                          secondaryColor: e.target.value
                        }))
                      }
                      className={`w-9 h-9 border border-gray-300 dark:border-slate-700 p-0.5 rounded-none ${!isEditingColors ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                        }`}
                    />
                    <input
                      type="text"
                      disabled={!isEditingColors}
                      value={themeConfig.secondaryColor}
                      onChange={(e) =>
                        setThemeConfig(prev => ({
                          ...prev,
                          presetId: 'custom',
                          secondaryColor: e.target.value
                        }))
                      }
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Accent */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isEditingColors}
                      value={themeConfig.accentColor}
                      onChange={(e) =>
                        setThemeConfig(prev => ({
                          ...prev,
                          presetId: 'custom',
                          accentColor: e.target.value
                        }))
                      }
                      className={`w-9 h-9 border border-gray-300 dark:border-slate-700 p-0.5 rounded-none ${!isEditingColors ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                        }`}
                    />
                    <input
                      type="text"
                      disabled={!isEditingColors}
                      value={themeConfig.accentColor}
                      onChange={(e) =>
                        setThemeConfig(prev => ({
                          ...prev,
                          presetId: 'custom',
                          accentColor: e.target.value
                        }))
                      }
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Sidebar Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    Sidebar Style
                  </label>
                  <select
                    disabled={!isEditingColors}
                    value={themeConfig.sidebarTheme}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, sidebarTheme: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-500"
                  >
                    <option value="dark">Dark Slate (#1E293B)</option>
                    <option value="brand">Brand Primary Tint</option>
                    <option value="midnight">Midnight Onyx (#0F172A)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING */}
          {activeTab === 'branding' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
              {/* Card Action Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#043486] dark:text-blue-400" />
                  <span>Logo &amp; Favicon</span>
                </span>

                {!isEditingBranding ? (
                  <button
                    type="button"
                    onClick={() => handleStartEdit('branding')}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-[#043486] hover:bg-[#0248BC] text-white text-xs font-bold rounded-none shadow-xs transition-all cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelEdit('branding')}
                      className="flex items-center gap-1 py-1.5 px-3 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X size={13} />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveTab('branding')}
                      className="flex items-center gap-1 py-1.5 px-3 bg-[#043486] hover:bg-[#0248BC] text-white text-xs font-bold rounded-none shadow-xs cursor-pointer"
                    >
                      <Save size={13} />
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Logo Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                  Brand Logo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-4 p-3 border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 flex items-center justify-center min-h-[90px]">
                    <img src={logoPreview} alt="Logo" className="max-h-12 max-w-full object-contain" />
                  </div>
                  <div className="sm:col-span-8 space-y-2">
                    <input
                      type="file"
                      disabled={!isEditingBranding}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-[#043486] file:text-white disabled:opacity-50 cursor-pointer"
                    />
                    {isEditingBranding && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(defaultLogo)
                          setThemeConfig(prev => ({ ...prev, logoUrl: '' }))
                        }}
                        className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Reset Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Favicon Section */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                  Browser Tab Favicon
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-4 p-3 border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 flex items-center justify-center min-h-[90px]">
                    <div className="bg-gray-200 dark:bg-slate-700 px-3 py-1.5 rounded-t-sm flex items-center gap-2">
                      <img src={faviconPreview} alt="Favicon" className="w-4 h-4 object-cover" />
                      <span className="text-[11px] font-medium text-gray-700 dark:text-slate-200">Tab</span>
                    </div>
                  </div>
                  <div className="sm:col-span-8 space-y-2">
                    <input
                      type="file"
                      disabled={!isEditingBranding}
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-[#043486] file:text-white disabled:opacity-50 cursor-pointer"
                    />
                    {isEditingBranding && (
                      <button
                        type="button"
                        onClick={() => {
                          setFaviconPreview(defaultFavicon)
                          setThemeConfig(prev => ({ ...prev, faviconUrl: '' }))
                        }}
                        className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Reset Favicon
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVOICE STYLING */}
          {activeTab === 'documents' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
              {/* Card Action Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt size={16} className="text-[#043486] dark:text-blue-400" />
                  <span>Invoice Style</span>
                </span>

                {!isEditingDocs ? (
                  <button
                    type="button"
                    onClick={() => handleStartEdit('documents')}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-[#043486] hover:bg-[#0248BC] text-white text-xs font-bold rounded-none shadow-xs transition-all cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelEdit('documents')}
                      className="flex items-center gap-1 py-1.5 px-3 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X size={13} />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveTab('documents')}
                      className="flex items-center gap-1 py-1.5 px-3 bg-[#043486] hover:bg-[#0248BC] text-white text-xs font-bold rounded-none shadow-xs cursor-pointer"
                    >
                      <Save size={13} />
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Style Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                  Header Banner Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!isEditingDocs}
                    onClick={() => setThemeConfig(prev => ({ ...prev, invoiceHeaderStyle: 'banner' }))}
                    className={`p-3 text-left border ${!isEditingDocs ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                      } ${themeConfig.invoiceHeaderStyle === 'banner'
                        ? 'border-[#043486] bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-slate-800'
                      }`}
                  >
                    <span className="text-xs font-bold block mb-1">Color Banner</span>
                    <span className="text-[11px] text-gray-500">Filled header band</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isEditingDocs}
                    onClick={() => setThemeConfig(prev => ({ ...prev, invoiceHeaderStyle: 'minimal' }))}
                    className={`p-3 text-left border ${!isEditingDocs ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                      } ${themeConfig.invoiceHeaderStyle === 'minimal'
                        ? 'border-[#043486] bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-slate-800'
                      }`}
                  >
                    <span className="text-xs font-bold block mb-1">Minimal Line</span>
                    <span className="text-[11px] text-gray-500">Clean top border line</span>
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  Invoice Accent Color
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="color"
                    disabled={!isEditingDocs}
                    value={themeConfig.invoiceAccentColor || themeConfig.primaryColor}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, invoiceAccentColor: e.target.value }))}
                    className={`w-9 h-9 border border-gray-300 dark:border-slate-700 p-0.5 rounded-none ${!isEditingDocs ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                      }`}
                  />
                  <input
                    type="text"
                    disabled={!isEditingDocs}
                    value={themeConfig.invoiceAccentColor || themeConfig.primaryColor}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, invoiceAccentColor: e.target.value }))}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREVIEW INFO */}
          {activeTab === 'preview' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                Live Preview Mode
              </span>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Use the simulation switchers on the right panel to preview changes across App Shell, Login Screen, and Invoices.
              </p>
            </div>
          )}
        </div>

        {/* Right Sticky Preview Hub */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-2xs space-y-4">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Monitor size={14} className="text-[#043486] dark:text-blue-400" />
                <span>Preview</span>
              </span>

              <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode('app')}
                  className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${previewMode === 'app'
                    ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  App
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('auth')}
                  className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${previewMode === 'auth'
                    ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('invoice')}
                  className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${previewMode === 'invoice'
                    ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Invoice
                </button>
              </div>
            </div>

            {/* PREVIEW: APP SHELL */}
            {previewMode === 'app' && (
              <div className="border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 space-y-2">
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-between shadow-2xs">
                  <img src={logoPreview} alt="Logo" className="h-4 object-contain" />
                  <div
                    className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    R
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div
                    className="col-span-4 p-2 text-white space-y-1 min-h-[140px] text-[10px]"
                    style={{
                      backgroundColor:
                        themeConfig.sidebarTheme === 'brand'
                          ? themeConfig.primaryColor
                          : themeConfig.sidebarTheme === 'dark'
                            ? '#1E293B'
                            : '#0F172A'
                    }}
                  >
                    <div
                      className="p-1 font-bold flex items-center gap-1"
                      style={{ backgroundColor: themeConfig.secondaryColor }}
                    >
                      <Layout size={10} /> Dashboard
                    </div>
                    <div className="p-1 opacity-70 flex items-center gap-1">
                      <Receipt size={10} /> Bills
                    </div>
                  </div>

                  <div className="col-span-8 bg-white dark:bg-slate-900 p-2 space-y-2 border border-gray-200 dark:border-slate-800 text-[10px]">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
                      <span className="font-bold text-gray-800 dark:text-white">Invoices</span>
                      <button
                        type="button"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                        className="text-white px-2 py-0.5 font-bold text-[9px] cursor-pointer"
                      >
                        + Create
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="p-1 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between text-[9px]">
                        <span>INV-001</span>
                        <span
                          className="font-bold px-1 text-[8px] text-white"
                          style={{ backgroundColor: themeConfig.primaryColor }}
                        >
                          PAID
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW: AUTH */}
            {previewMode === 'auth' && (
              <div
                className="border border-gray-200 dark:border-slate-800 p-4 min-h-[190px] flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${themeConfig.primaryColor}15 0%, ${themeConfig.secondaryColor}30 100%)`
                }}
              >
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 w-full max-w-[200px] shadow-sm space-y-2 text-center">
                  <img src={logoPreview} alt="Logo" className="h-5 mx-auto object-contain" />
                  <div className="w-full h-5 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-[8px] flex items-center px-1.5 text-gray-400">
                    user@simcha.com
                  </div>
                  <button
                    type="button"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                    className="w-full py-1 text-white text-[9px] font-bold"
                  >
                    Login
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW: INVOICE */}
            {previewMode === 'invoice' && (
              <div className="border border-gray-200 dark:border-slate-800 bg-white p-3 space-y-2 text-gray-800">
                <div
                  className="p-2 text-white flex items-center justify-between"
                  style={{
                    backgroundColor: themeConfig.invoiceAccentColor || themeConfig.primaryColor
                  }}
                >
                  <img src={logoPreview} alt="Logo" className="h-4 object-contain bg-white/90 p-0.5" />
                  <span className="text-[10px] font-black uppercase">TAX INVOICE</span>
                </div>

                <div className="border border-gray-200 text-[8px]">
                  <div
                    className="p-1 text-white font-bold grid grid-cols-12"
                    style={{
                      backgroundColor: themeConfig.invoiceAccentColor || themeConfig.primaryColor
                    }}
                  >
                    <span className="col-span-8">Description</span>
                    <span className="col-span-4 text-right">Amount (₹)</span>
                  </div>
                  <div className="p-1 grid grid-cols-12">
                    <span className="col-span-8">Sample Item</span>
                    <span className="col-span-4 text-right font-bold">5,900.00</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div
                    className="px-2 py-0.5 text-white font-bold text-[9px]"
                    style={{
                      backgroundColor: themeConfig.invoiceAccentColor || themeConfig.primaryColor
                    }}
                  >
                    TOTAL: ₹ 5,900.00
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
