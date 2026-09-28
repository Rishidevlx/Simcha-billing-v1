import React, { useState, useEffect } from 'react'
import {
  Palette,
  Image as ImageIcon,
  Receipt,
  RotateCcw,
  Save,
  Edit2,
  X,
  CheckCircle2,
  Trash2,
  Monitor,
  Layout,
  Sliders,
  Type,
  Check,
  ChevronDown
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
  // 3 Tabs only (No "Live Preview" tab)
  const [activeTab, setActiveTab] = useState('colors') // 'colors', 'branding', 'documents'
  const [previewMode, setPreviewMode] = useState('app') // 'app', 'auth'

  // Edit states per tab
  const [isEditingColors, setIsEditingColors] = useState(false)
  const [isEditingBranding, setIsEditingBranding] = useState(false)
  const [isEditingDocs, setIsEditingDocs] = useState(false)

  // App Theme Config (Colors & Sidebar)
  const [themeConfig, setThemeConfig] = useState({
    presetId: 'simcha-classic',
    primaryColor: '#043486',
    secondaryColor: '#0248BC',
    accentColor: '#3B82F6',
    sidebarTheme: 'dark',
    logoUrl: '',
    faviconUrl: '',
    // Independent Invoice Settings (Not affected by app color changes)
    invoiceHeaderStyle: 'banner',
    invoiceAccentColor: '#043486'
  })

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
        console.error('Error reading theme storage', err)
      }
    }
  }, [])

  // Start edit
  const handleStartEdit = (tab) => {
    setBackupConfig({ ...themeConfig })
    if (tab === 'colors') setIsEditingColors(true)
    if (tab === 'branding') setIsEditingBranding(true)
    if (tab === 'documents') setIsEditingDocs(true)
  }

  // Cancel edit
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

  // Save changes
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

  // Select Preset (App Colors only, DOES NOT touch invoiceAccentColor)
  const handleSelectPreset = (preset) => {
    if (!isEditingColors) return
    setThemeConfig(prev => ({
      ...prev,
      presetId: preset.id,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor
      // Notice: invoiceAccentColor is preserved independently
    }))
  }

  // Logo upload
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

  // Favicon upload
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

      {/* 2. Top Navigation Tabs (3 Tabs Only: COLORS, LOGO & FAVICON, INVOICE STYLE) */}
      <div className="flex items-center border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'colors'
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
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'branding'
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
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'documents'
              ? 'border-[#043486] text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <Receipt size={16} />
          <span>Invoice Style</span>
        </button>
      </div>

      {/* 3. TAB 1: COLORS (Element UI Inspired Palette Matrix + Inspector Panel) */}
      {activeTab === 'colors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Main Color Palette Studio (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Palette size={16} className="text-[#043486] dark:text-blue-400" />
                <span>Color Palette Studio</span>
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

            {/* Presets Row */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block">Theme Presets</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = themeConfig.presetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={!isEditingColors}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 border text-left transition-all ${
                        !isEditingColors ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-[#043486] bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-900 dark:text-white block truncate mb-1">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.secondaryColor }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Element UI Style Palette Cards */}
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block">System Palette Matrix</span>

              {/* Row 1: Brand & Secondary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Brand Color Card */}
                <div
                  className="p-4 rounded-none text-white flex flex-col justify-between min-h-[90px] shadow-2xs relative"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold block uppercase tracking-wider">Brand Color</span>
                      <span className="text-[11px] font-mono opacity-90">{themeConfig.primaryColor}</span>
                    </div>
                    {isEditingColors && (
                      <input
                        type="color"
                        value={themeConfig.primaryColor}
                        onChange={(e) =>
                          setThemeConfig(prev => ({
                            ...prev,
                            presetId: 'custom',
                            primaryColor: e.target.value
                          }))
                        }
                        className="w-7 h-7 border-0 p-0 cursor-pointer bg-transparent"
                      />
                    )}
                  </div>
                  {/* Subtle shades footer */}
                  <div className="flex gap-1 pt-2 opacity-80">
                    <div className="h-2 flex-1 bg-white/30" />
                    <div className="h-2 flex-1 bg-white/50" />
                    <div className="h-2 flex-1 bg-white/70" />
                  </div>
                </div>

                {/* Secondary Color Card */}
                <div
                  className="p-4 rounded-none text-white flex flex-col justify-between min-h-[90px] shadow-2xs relative"
                  style={{ backgroundColor: themeConfig.secondaryColor }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold block uppercase tracking-wider">Secondary Color</span>
                      <span className="text-[11px] font-mono opacity-90">{themeConfig.secondaryColor}</span>
                    </div>
                    {isEditingColors && (
                      <input
                        type="color"
                        value={themeConfig.secondaryColor}
                        onChange={(e) =>
                          setThemeConfig(prev => ({
                            ...prev,
                            presetId: 'custom',
                            secondaryColor: e.target.value
                          }))
                        }
                        className="w-7 h-7 border-0 p-0 cursor-pointer bg-transparent"
                      />
                    )}
                  </div>
                  <div className="flex gap-1 pt-2 opacity-80">
                    <div className="h-2 flex-1 bg-white/30" />
                    <div className="h-2 flex-1 bg-white/50" />
                    <div className="h-2 flex-1 bg-white/70" />
                  </div>
                </div>
              </div>

              {/* Row 2: Status Colors Matrix (Success, Warning, Danger, Info) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Success */}
                <div className="bg-[#10B981] p-3 text-white flex flex-col justify-between min-h-[75px]">
                  <span className="text-[11px] font-bold uppercase">Success</span>
                  <span className="text-[10px] font-mono opacity-90">#10B981</span>
                </div>
                {/* Warning */}
                <div className="bg-[#F59E0B] p-3 text-white flex flex-col justify-between min-h-[75px]">
                  <span className="text-[11px] font-bold uppercase">Warning</span>
                  <span className="text-[10px] font-mono opacity-90">#F59E0B</span>
                </div>
                {/* Danger */}
                <div className="bg-[#EF4444] p-3 text-white flex flex-col justify-between min-h-[75px]">
                  <span className="text-[11px] font-bold uppercase">Danger</span>
                  <span className="text-[10px] font-mono opacity-90">#EF4444</span>
                </div>
                {/* Info */}
                <div className="bg-[#64748B] p-3 text-white flex flex-col justify-between min-h-[75px]">
                  <span className="text-[11px] font-bold uppercase">Info</span>
                  <span className="text-[10px] font-mono opacity-90">#64748B</span>
                </div>
              </div>

              {/* Row 3: Text & Neutral Shades */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#0F172A] p-2.5 text-white">
                  <span className="text-[10px] font-bold block">Primary Text</span>
                  <span className="text-[9px] font-mono text-gray-300">#0F172A</span>
                </div>
                <div className="bg-[#475569] p-2.5 text-white">
                  <span className="text-[10px] font-bold block">Regular Text</span>
                  <span className="text-[9px] font-mono text-gray-300">#475569</span>
                </div>
                <div className="bg-[#94A3B8] p-2.5 text-white">
                  <span className="text-[10px] font-bold block">Secondary Text</span>
                  <span className="text-[9px] font-mono text-gray-200">#94A3B8</span>
                </div>
                <div className="bg-[#CBD5E1] p-2.5 text-gray-800">
                  <span className="text-[10px] font-bold block">Placeholder</span>
                  <span className="text-[9px] font-mono text-gray-600">#CBD5E1</span>
                </div>
              </div>

              {/* Row 4: Borders & Backgrounds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#E2E8F0] p-2.5 text-gray-800 border border-gray-300">
                  <span className="text-[10px] font-bold block">Border Base</span>
                  <span className="text-[9px] font-mono text-gray-600">#E2E8F0</span>
                </div>
                <div className="bg-[#F1F5F9] p-2.5 text-gray-800 border border-gray-200">
                  <span className="text-[10px] font-bold block">Border Light</span>
                  <span className="text-[9px] font-mono text-gray-600">#F1F5F9</span>
                </div>
                <div className="bg-[#0F172A] p-2.5 text-white border border-gray-800">
                  <span className="text-[10px] font-bold block">Background Dark</span>
                  <span className="text-[9px] font-mono text-gray-400">#0F172A</span>
                </div>
                <div className="bg-[#FFFFFF] p-2.5 text-gray-800 border border-gray-300">
                  <span className="text-[10px] font-bold block">Background White</span>
                  <span className="text-[9px] font-mono text-gray-500">#FFFFFF</span>
                </div>
              </div>
            </div>

            {/* Typography Preview Section */}
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                <Type size={14} />
                <span>Font &amp; Typography</span>
              </span>
              <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 space-y-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Heading 1 — Simcha Billing &amp; Inventory Management
                </h1>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  Clean, legible Poppins typography optimized for high-density business invoices, stock tracking, and accounting.
                </p>
                <span className="text-[11px] text-gray-400 block">
                  Small label example text: TAX INVOICE • GST 33AAAAA0000A1Z5
                </span>
              </div>
            </div>
          </div>

          {/* Right Inspector & Theme Config Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4 sticky top-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-2xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} className="text-[#043486] dark:text-blue-400" />
                  <span>Theme Inspector</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('app')}
                    className={`px-2 py-0.5 text-[10px] font-bold ${
                      previewMode === 'app'
                        ? 'bg-[#043486] text-white'
                        : 'text-gray-500 hover:text-gray-900 bg-gray-100 dark:bg-slate-800'
                    }`}
                  >
                    App
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('auth')}
                    className={`px-2 py-0.5 text-[10px] font-bold ${
                      previewMode === 'auth'
                        ? 'bg-[#043486] text-white'
                        : 'text-gray-500 hover:text-gray-900 bg-gray-100 dark:bg-slate-800'
                    }`}
                  >
                    Login
                  </button>
                </div>
              </div>

              {/* Tokens list (Like reference image sidebar) */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-mono text-gray-500 block mb-1">$color-btn-primary</span>
                  <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40">
                    <span className="font-mono text-gray-700 dark:text-slate-300 font-bold">$color-brand</span>
                    <div className="w-4 h-4 rounded-full shadow-2xs" style={{ backgroundColor: themeConfig.primaryColor }} />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-gray-500 block mb-1">$color-btn-secondary</span>
                  <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40">
                    <span className="font-mono text-gray-700 dark:text-slate-300 font-bold">$color-secondary</span>
                    <div className="w-4 h-4 rounded-full shadow-2xs" style={{ backgroundColor: themeConfig.secondaryColor }} />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-gray-500 block mb-1">$sidebar-theme-base</span>
                  <select
                    disabled={!isEditingColors}
                    value={themeConfig.sidebarTheme}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, sidebarTheme: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 dark:text-white focus:outline-none disabled:opacity-75"
                  >
                    <option value="dark">Dark Slate (#1E293B)</option>
                    <option value="brand">Brand Primary Tint</option>
                    <option value="midnight">Midnight Onyx (#0F172A)</option>
                  </select>
                </div>
              </div>

              {/* Real-time Component Preview Mock */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 block">
                  Component Simulation
                </span>

                {previewMode === 'app' ? (
                  <div className="border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 space-y-2 text-[10px]">
                    <div className="bg-white dark:bg-slate-900 p-2 border border-gray-200 dark:border-slate-800 flex items-center justify-between">
                      <img src={logoPreview} alt="Logo" className="h-4 object-contain" />
                      <div
                        className="w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        R
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                        className="text-white px-2 py-1 font-bold text-[9px]"
                      >
                        Primary Button
                      </button>
                      <button
                        type="button"
                        style={{ backgroundColor: themeConfig.secondaryColor }}
                        className="text-white px-2 py-1 font-bold text-[9px]"
                      >
                        Hover State
                      </button>
                    </div>

                    <div className="p-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-between">
                      <span>INV-2026-001</span>
                      <span
                        className="font-bold px-1 text-[8px] text-white"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        PAID
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border border-gray-200 dark:border-slate-800 p-3 min-h-[140px] flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${themeConfig.primaryColor}15 0%, ${themeConfig.secondaryColor}30 100%)`
                    }}
                  >
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-2.5 w-full max-w-[180px] text-center space-y-1.5">
                      <img src={logoPreview} alt="Logo" className="h-4 mx-auto object-contain" />
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: LOGO & FAVICON */}
      {activeTab === 'branding' && (
        <div className="max-w-4xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={16} className="text-[#043486] dark:text-blue-400" />
              <span>Brand Logo &amp; Favicon</span>
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
              Software Brand Logo
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
                    <Trash2 size={12} /> Reset to Default Logo
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
                  <span className="text-[11px] font-medium text-gray-700 dark:text-slate-200">Simcha Tab</span>
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
                    <Trash2 size={12} /> Reset to Default Favicon
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: INVOICE STYLE (Completely Independent & Auto Selected for Invoice Simulation) */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Invoice Configuration (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt size={16} className="text-[#043486] dark:text-blue-400" />
                <span>Invoice &amp; Document Style</span>
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

            {/* Header Style */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                Invoice Header Layout
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!isEditingDocs}
                  onClick={() => setThemeConfig(prev => ({ ...prev, invoiceHeaderStyle: 'banner' }))}
                  className={`p-3 text-left border ${
                    !isEditingDocs ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                  } ${
                    themeConfig.invoiceHeaderStyle === 'banner'
                      ? 'border-[#043486] bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold block mb-1">Color Banner</span>
                  <span className="text-[11px] text-gray-500">Filled header band with white title</span>
                </button>

                <button
                  type="button"
                  disabled={!isEditingDocs}
                  onClick={() => setThemeConfig(prev => ({ ...prev, invoiceHeaderStyle: 'minimal' }))}
                  className={`p-3 text-left border ${
                    !isEditingDocs ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                  } ${
                    themeConfig.invoiceHeaderStyle === 'minimal'
                      ? 'border-[#043486] bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold block mb-1">Minimal Border</span>
                  <span className="text-[11px] text-gray-500">Clean white with colored accent line</span>
                </button>
              </div>
            </div>

            {/* Independent Invoice Color (Separate from app theme) */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                Invoice Accent Color (Independent of App Theme)
              </label>
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="color"
                  disabled={!isEditingDocs}
                  value={themeConfig.invoiceAccentColor || '#043486'}
                  onChange={(e) => setThemeConfig(prev => ({ ...prev, invoiceAccentColor: e.target.value }))}
                  className={`w-9 h-9 border border-gray-300 dark:border-slate-700 p-0.5 rounded-none ${
                    !isEditingDocs ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                />
                <input
                  type="text"
                  disabled={!isEditingDocs}
                  value={themeConfig.invoiceAccentColor || '#043486'}
                  onChange={(e) => setThemeConfig(prev => ({ ...prev, invoiceAccentColor: e.target.value }))}
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Right Live Invoice Simulation (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-2xs space-y-3 sticky top-6">
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-slate-800">
              <Receipt size={14} className="text-[#043486] dark:text-blue-400" />
              <span>Invoice Live Preview</span>
            </span>

            {/* Invoice A4 Sheet Mockup */}
            <div className="border border-gray-300 bg-white p-3 space-y-2 text-gray-800 shadow-xs">
              {/* Header Banner */}
              {themeConfig.invoiceHeaderStyle === 'banner' ? (
                <div
                  className="p-2.5 text-white flex items-center justify-between"
                  style={{ backgroundColor: themeConfig.invoiceAccentColor || '#043486' }}
                >
                  <img src={logoPreview} alt="Logo" className="h-4 object-contain bg-white/90 p-0.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">TAX INVOICE</span>
                </div>
              ) : (
                <div
                  className="p-2 flex items-center justify-between border-t-2"
                  style={{ borderColor: themeConfig.invoiceAccentColor || '#043486' }}
                >
                  <img src={logoPreview} alt="Logo" className="h-4 object-contain" />
                  <span
                    className="text-[10px] font-black uppercase"
                    style={{ color: themeConfig.invoiceAccentColor || '#043486' }}
                  >
                    TAX INVOICE
                  </span>
                </div>
              )}

              {/* Table */}
              <div className="border border-gray-200 text-[8px]">
                <div
                  className="p-1 text-white font-bold grid grid-cols-12"
                  style={{ backgroundColor: themeConfig.invoiceAccentColor || '#043486' }}
                >
                  <span className="col-span-8">Description</span>
                  <span className="col-span-4 text-right">Amount (₹)</span>
                </div>
                <div className="p-1 border-b border-gray-100 grid grid-cols-12">
                  <span className="col-span-8">Dell Latitude 5420 i7</span>
                  <span className="col-span-4 text-right font-bold">45,000.00</span>
                </div>
              </div>

              {/* Total Box */}
              <div className="flex justify-end">
                <div
                  className="px-2.5 py-1 text-white font-bold text-[9px]"
                  style={{ backgroundColor: themeConfig.invoiceAccentColor || '#043486' }}
                >
                  TOTAL: ₹ 45,000.00
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
