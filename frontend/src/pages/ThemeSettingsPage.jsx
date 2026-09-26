import React, { useState, useEffect } from 'react'
import {
  Palette,
  Image,
  Sparkles,
  RotateCcw,
  Save,
  Check,
  Upload,
  Eye,
  FileText,
  Sliders,
  Sun,
  Moon,
  Layout,
  Globe,
  Monitor,
  CheckCircle2,
  Info,
  ExternalLink,
  Trash2,
  Brush,
  Receipt
} from 'lucide-react'
import Swal from 'sweetalert2'
import ListPageHeader from '../components/common/ListPageHeader'
import defaultLogo from '../assets/Logo/Logo-bg-remove.webp'
import defaultFavicon from '../assets/Logo/Favicon.jpeg'

// Curated Theme Presets
const THEME_PRESETS = [
  {
    id: 'simcha-classic',
    name: 'Simcha Classic Blue',
    description: 'Corporate royal blue & deep navy',
    primaryColor: '#043486',
    secondaryColor: '#0248BC',
    accentColor: '#3B82F6',
    sidebarBg: '#043486',
    badgeGradient: 'from-[#043486] to-[#0248BC]'
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Amber & Orange',
    description: 'Vibrant modern orange with energetic warmth',
    primaryColor: '#F97316',
    secondaryColor: '#EA580C',
    accentColor: '#FB923C',
    sidebarBg: '#1E293B',
    badgeGradient: 'from-[#F97316] to-[#EA580C]'
  },
  {
    id: 'royal-purple',
    name: 'Royal Amethyst',
    description: 'Sophisticated deep violet and royal purple',
    primaryColor: '#7C3AED',
    secondaryColor: '#6D28D9',
    accentColor: '#A78BFA',
    sidebarBg: '#1E1B4B',
    badgeGradient: 'from-[#7C3AED] to-[#6D28D9]'
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Green',
    description: 'Clean organic emerald & teal freshness',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    accentColor: '#10B981',
    sidebarBg: '#064E3B',
    badgeGradient: 'from-[#059669] to-[#047857]'
  },
  {
    id: 'crimson-flame',
    name: 'Crimson Flame',
    description: 'Bold vibrant ruby and scarlet red',
    primaryColor: '#E11D48',
    secondaryColor: '#BE123C',
    accentColor: '#FB7185',
    sidebarBg: '#1C1917',
    badgeGradient: 'from-[#E11D48] to-[#BE123C]'
  },
  {
    id: 'cyber-slate',
    name: 'Cyber Graphite & Indigo',
    description: 'Modern sleek dark slate with electric indigo',
    primaryColor: '#4F46E5',
    secondaryColor: '#4338CA',
    accentColor: '#6366F1',
    sidebarBg: '#0F172A',
    badgeGradient: 'from-[#4F46E5] to-[#0F172A]'
  }
]

export default function ThemeSettingsPage() {
  const [activeTab, setActiveTab] = useState('colors') // 'colors', 'branding', 'documents', 'preview'
  const [previewMode, setPreviewMode] = useState('app') // 'app', 'auth', 'invoice'

  // Theme Form State
  const [themeConfig, setThemeConfig] = useState({
    presetId: 'simcha-classic',
    primaryColor: '#043486',
    secondaryColor: '#0248BC',
    accentColor: '#3B82F6',
    sidebarTheme: 'dark', // 'dark', 'brand', 'light'
    navbarTheme: 'light', // 'light', 'glass', 'brand'
    borderRadius: '4px', // '0px', '4px', '8px', '12px'
    logoUrl: '',
    faviconUrl: '',
    invoiceHeaderStyle: 'banner', // 'banner', 'minimal', 'bordered'
    invoiceAccentColor: '#043486'
  })

  const [logoPreview, setLogoPreview] = useState(defaultLogo)
  const [faviconPreview, setFaviconPreview] = useState(defaultFavicon)
  const [isSaving, setIsSaving] = useState(false)

  // Load current theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('simcha_custom_theme')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        setThemeConfig(prev => ({ ...prev, ...parsed }))
        if (parsed.logoUrl) setLogoPreview(parsed.logoUrl)
        if (parsed.faviconUrl) setFaviconPreview(parsed.faviconUrl)
      } catch (err) {
        console.error('Failed to parse theme config', err)
      }
    }
  }, [])

  // Apply Preset
  const handleApplyPreset = (preset) => {
    setThemeConfig(prev => ({
      ...prev,
      presetId: preset.id,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      invoiceAccentColor: preset.primaryColor
    }))
  }

  // Handle Logo Upload (Local Data URL Preview)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire('File Too Large', 'Please upload a logo image smaller than 2MB.', 'warning')
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

  // Handle Favicon Upload
  const handleFaviconUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        Swal.fire('File Too Large', 'Please upload a favicon smaller than 1MB.', 'warning')
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

  // Reset to Factory Default
  const handleResetToDefaults = () => {
    Swal.fire({
      title: 'Reset Theme to Default?',
      text: 'This will revert all colors, logo, and favicon back to default Simcha theme.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#043486',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Reset Theme'
    }).then(result => {
      if (result.isConfirmed) {
        const defaultState = {
          presetId: 'simcha-classic',
          primaryColor: '#043486',
          secondaryColor: '#0248BC',
          accentColor: '#3B82F6',
          sidebarTheme: 'dark',
          navbarTheme: 'light',
          borderRadius: '4px',
          logoUrl: '',
          faviconUrl: '',
          invoiceHeaderStyle: 'banner',
          invoiceAccentColor: '#043486'
        }
        setThemeConfig(defaultState)
        setLogoPreview(defaultLogo)
        setFaviconPreview(defaultFavicon)
        localStorage.removeItem('simcha_custom_theme')

        Swal.fire({
          icon: 'success',
          title: 'Reset Complete',
          text: 'Theme has been reset to default Simcha Classic Blue.',
          timer: 1500,
          showConfirmButton: false
        })
      }
    })
  }

  // Save and Apply Theme
  const handleSaveTheme = () => {
    setIsSaving(true)
    try {
      localStorage.setItem('simcha_custom_theme', JSON.stringify(themeConfig))
      
      // Update browser tab favicon dynamically if available
      if (themeConfig.faviconUrl) {
        const faviconLink = document.querySelector("link[rel*='icon']")
        if (faviconLink) {
          faviconLink.href = themeConfig.faviconUrl
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Theme Applied Successfully!',
        text: 'Your theme colors and branding settings have been saved.',
        confirmButtonColor: themeConfig.primaryColor || '#043486'
      })
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Failed to save theme settings.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-['Poppins',sans-serif]">
      {/* 1. Page Header */}
      <ListPageHeader
        title="THEME & BRAND CUSTOMIZATION"
        subtitle="Manage software color palettes, sidebar accents, dynamic logos, favicons, and invoice document styles."
        breadcrumbs={[
          { label: 'Settings', path: '/settings/system' },
          { label: 'Theme Settings' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 py-2 px-3 sm:px-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold rounded-none shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveTheme}
              disabled={isSaving}
              style={{ backgroundColor: themeConfig.primaryColor }}
              className="flex items-center gap-1.5 py-2 px-4 sm:px-5 text-white text-xs sm:text-sm font-bold rounded-none shadow-xs hover:opacity-90 transition-all cursor-pointer"
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save & Apply Theme'}</span>
            </button>
          </div>
        }
      />

      {/* 2. Top Navigation Tabs */}
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
          <span>Color Palettes & Presets</span>
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
          <Image size={16} />
          <span>Logo & Favicon Studio</span>
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
          <span>Invoice & Document Styling</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'border-[#043486] text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <Eye size={16} />
          <span>Live Interactive Preview Hub</span>
        </button>
      </div>

      {/* 3. Main Content Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Studio Controls (7 cols on large screens) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: COLORS & PRESETS */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              {/* Presets Card */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" />
                      <span>Curated Brand Presets</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Select a pre-configured harmonious palette for instant software transformation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = themeConfig.presetId === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`text-left p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#043486] dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-[#043486]/20'
                            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{preset.name}</span>
                          {isSelected && <CheckCircle2 size={15} className="text-[#043486] dark:text-blue-400" />}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-3 line-clamp-1">
                          {preset.description}
                        </p>
                        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                          <div
                            className="w-5 h-5 rounded-full shadow-2xs border border-white"
                            style={{ backgroundColor: preset.primaryColor }}
                            title={`Primary: ${preset.primaryColor}`}
                          />
                          <div
                            className="w-5 h-5 rounded-full shadow-2xs border border-white"
                            style={{ backgroundColor: preset.secondaryColor }}
                            title={`Secondary: ${preset.secondaryColor}`}
                          />
                          <div
                            className="w-5 h-5 rounded-full shadow-2xs border border-white"
                            style={{ backgroundColor: preset.accentColor }}
                            title={`Accent: ${preset.accentColor}`}
                          />
                          <div
                            className="w-5 h-5 rounded-full shadow-2xs border border-white"
                            style={{ backgroundColor: preset.sidebarBg }}
                            title={`Sidebar Base: ${preset.sidebarBg}`}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Color Wheels Card */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Brush size={16} className="text-blue-600" />
                    <span>Custom Color Controls</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Fine-tune specific hex codes for primary buttons, sidebar tints, and interactive elements.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Primary Color */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Primary Brand Color</span>
                      <span className="font-mono text-[11px] text-gray-500">{themeConfig.primaryColor}</span>
                    </label>
                    <div className="flex items-center gap-2">
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
                        className="w-10 h-10 border border-gray-300 dark:border-slate-700 p-0.5 cursor-pointer rounded-none"
                      />
                      <input
                        type="text"
                        value={themeConfig.primaryColor}
                        onChange={(e) =>
                          setThemeConfig(prev => ({
                            ...prev,
                            presetId: 'custom',
                            primaryColor: e.target.value
                          }))
                        }
                        placeholder="#043486"
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#043486]"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Secondary / Hover Accent</span>
                      <span className="font-mono text-[11px] text-gray-500">{themeConfig.secondaryColor}</span>
                    </label>
                    <div className="flex items-center gap-2">
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
                        className="w-10 h-10 border border-gray-300 dark:border-slate-700 p-0.5 cursor-pointer rounded-none"
                      />
                      <input
                        type="text"
                        value={themeConfig.secondaryColor}
                        onChange={(e) =>
                          setThemeConfig(prev => ({
                            ...prev,
                            presetId: 'custom',
                            secondaryColor: e.target.value
                          }))
                        }
                        placeholder="#0248BC"
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#043486]"
                      />
                    </div>
                  </div>

                  {/* Accent Highlight Color */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Interactive Accent / Focus</span>
                      <span className="font-mono text-[11px] text-gray-500">{themeConfig.accentColor}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig.accentColor}
                        onChange={(e) =>
                          setThemeConfig(prev => ({
                            ...prev,
                            presetId: 'custom',
                            accentColor: e.target.value
                          }))
                        }
                        className="w-10 h-10 border border-gray-300 dark:border-slate-700 p-0.5 cursor-pointer rounded-none"
                      />
                      <input
                        type="text"
                        value={themeConfig.accentColor}
                        onChange={(e) =>
                          setThemeConfig(prev => ({
                            ...prev,
                            presetId: 'custom',
                            accentColor: e.target.value
                          }))
                        }
                        placeholder="#3B82F6"
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#043486]"
                      />
                    </div>
                  </div>

                  {/* Sidebar Theme Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                      <span>Sidebar Base Style</span>
                    </label>
                    <select
                      value={themeConfig.sidebarTheme}
                      onChange={(e) => setThemeConfig(prev => ({ ...prev, sidebarTheme: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#043486]"
                    >
                      <option value="dark">Dark Charcoal / Slate (#1E293B)</option>
                      <option value="brand">Brand Primary Color Tint</option>
                      <option value="midnight">Midnight Onyx (#0F172A)</option>
                      <option value="light">Crisp Light Slate (#F8FAFC)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING LOGO & FAVICON */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* Logo Uploader Card */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Image size={16} className="text-indigo-600" />
                      <span>Software Brand Logo</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Uploaded logo will automatically replace logos across Sidebar, Navbar, Login, Forgot Password, and Invoices.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  {/* Current Logo Preview Frame */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 min-h-[140px]">
                    <img
                      src={logoPreview}
                      alt="Brand Logo Preview"
                      className="max-h-20 max-w-full object-contain drop-shadow-xs"
                    />
                    <span className="text-[10px] text-gray-400 mt-2">Active Logo Preview</span>
                  </div>

                  {/* Upload Controls */}
                  <div className="sm:col-span-7 space-y-3">
                    <label className="block">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">
                        Upload New Logo File (.png, .webp, .svg)
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/svg+xml"
                        onChange={handleLogoUpload}
                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-[#043486] file:text-white hover:file:opacity-90 cursor-pointer"
                      />
                    </label>

                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">
                        Or Paste Logo Image URL:
                      </label>
                      <input
                        type="text"
                        value={themeConfig.logoUrl}
                        onChange={(e) => {
                          const url = e.target.value
                          setThemeConfig(prev => ({ ...prev, logoUrl: url }))
                          if (url.trim()) setLogoPreview(url.trim())
                        }}
                        placeholder="https://your-domain.com/logo.png"
                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#043486]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(defaultLogo)
                        setThemeConfig(prev => ({ ...prev, logoUrl: '' }))
                      }}
                      className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <Trash2 size={12} />
                      <span>Reset to Original Simcha Logo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Favicon Uploader Card */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Globe size={16} className="text-emerald-600" />
                      <span>Browser Tab Favicon</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      The small square icon shown on browser tabs, bookmarks, and mobile shortcuts (Recommended 64x64px).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  {/* Browser Tab Simulation Preview */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 min-h-[140px]">
                    <div className="w-full max-w-[200px] bg-gray-200 dark:bg-slate-700 px-3 py-1.5 rounded-t-md flex items-center gap-2 shadow-xs">
                      <img
                        src={faviconPreview}
                        alt="Favicon Preview"
                        className="w-4 h-4 rounded-xs object-cover"
                      />
                      <span className="text-[11px] font-medium text-gray-700 dark:text-slate-200 truncate">
                        Simcha Billing Software
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-3">Browser Tab Simulation</span>
                  </div>

                  {/* Favicon Controls */}
                  <div className="sm:col-span-7 space-y-3">
                    <label className="block">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">
                        Upload Favicon Icon (.ico, .png, .jpeg)
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/x-icon"
                        onChange={handleFaviconUpload}
                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-[#043486] file:text-white hover:file:opacity-90 cursor-pointer"
                      />
                    </label>

                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">
                        Or Paste Favicon Image URL:
                      </label>
                      <input
                        type="text"
                        value={themeConfig.faviconUrl}
                        onChange={(e) => {
                          const url = e.target.value
                          setThemeConfig(prev => ({ ...prev, faviconUrl: url }))
                          if (url.trim()) setFaviconPreview(url.trim())
                        }}
                        placeholder="https://your-domain.com/favicon.png"
                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#043486]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFaviconPreview(defaultFavicon)
                        setThemeConfig(prev => ({ ...prev, faviconUrl: '' }))
                      }}
                      className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <Trash2 size={12} />
                      <span>Reset to Original Simcha Favicon</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVOICE & DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt size={16} className="text-emerald-600" />
                  <span>Invoice & Document Styling Studio</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Configure top invoice header banner styles, accent highlights, and grand total badges.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-2">
                    Invoice Header Layout Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeConfig(prev => ({ ...prev, invoiceHeaderStyle: 'banner' }))}
                      className={`p-3 text-left border cursor-pointer transition-all ${
                        themeConfig.invoiceHeaderStyle === 'banner'
                          ? 'border-[#043486] bg-blue-50/40 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold block mb-1">Full Color Banner</span>
                      <span className="text-[11px] text-gray-500 block">
                        Bold colored header banner matching primary brand color.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeConfig(prev => ({ ...prev, invoiceHeaderStyle: 'minimal' }))}
                      className={`p-3 text-left border cursor-pointer transition-all ${
                        themeConfig.invoiceHeaderStyle === 'minimal'
                          ? 'border-[#043486] bg-blue-50/40 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold block mb-1">Clean Minimalist</span>
                      <span className="text-[11px] text-gray-500 block">
                        White clean background with colored top accent line.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeConfig(prev => ({ ...prev, invoiceHeaderStyle: 'bordered' }))}
                      className={`p-3 text-left border cursor-pointer transition-all ${
                        themeConfig.invoiceHeaderStyle === 'bordered'
                          ? 'border-[#043486] bg-blue-50/40 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold block mb-1">Framed Border</span>
                      <span className="text-[11px] text-gray-500 block">
                        Full outline frame with tinted section header rows.
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center justify-between mb-2">
                    <span>Document Accent Color Override</span>
                    <span className="font-mono text-[11px] text-gray-500">{themeConfig.invoiceAccentColor}</span>
                  </label>
                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="color"
                      value={themeConfig.invoiceAccentColor || themeConfig.primaryColor}
                      onChange={(e) =>
                        setThemeConfig(prev => ({
                          ...prev,
                          invoiceAccentColor: e.target.value
                        }))
                      }
                      className="w-10 h-10 border border-gray-300 dark:border-slate-700 p-0.5 cursor-pointer rounded-none"
                    />
                    <input
                      type="text"
                      value={themeConfig.invoiceAccentColor || themeConfig.primaryColor}
                      onChange={(e) =>
                        setThemeConfig(prev => ({
                          ...prev,
                          invoiceAccentColor: e.target.value
                        }))
                      }
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE PREVIEW INFO */}
          {activeTab === 'preview' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Live Preview Hub Active</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Check the real-time simulation panel on the right side. Toggle between <b>App Shell</b>, <b>Auth Screens</b>, and <b>Invoice Document</b> to inspect how your selected colors and brand logos look before applying!
              </p>
            </div>
          )}
        </div>

        {/* Right Live Real-Time Interactive Simulation Hub (5 cols on large screens) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
            {/* Preview View Mode Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Monitor size={14} className="text-[#043486] dark:text-blue-400" />
                <span>Real-Time Simulation</span>
              </span>

              <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('app')}
                  className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    previewMode === 'app'
                      ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  App Shell
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('auth')}
                  className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    previewMode === 'auth'
                      ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('invoice')}
                  className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    previewMode === 'invoice'
                      ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Invoice
                </button>
              </div>
            </div>

            {/* PREVIEW VIEW 1: APP SHELL */}
            {previewMode === 'app' && (
              <div className="border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 rounded-none overflow-hidden space-y-3">
                {/* Mock Top Navbar */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <img src={logoPreview} alt="Logo Mock" className="h-5 object-contain" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-2xs"
                      style={{ backgroundColor: themeConfig.primaryColor }}
                    >
                      R
                    </div>
                  </div>
                </div>

                {/* Mock Content Body */}
                <div className="grid grid-cols-12 gap-2">
                  {/* Mock Mini Sidebar */}
                  <div
                    className="col-span-4 p-2 text-white space-y-1.5 min-h-[160px] text-[10px]"
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
                      className="p-1.5 font-bold rounded-xs flex items-center gap-1 shadow-2xs"
                      style={{ backgroundColor: themeConfig.secondaryColor }}
                    >
                      <Layout size={10} /> Dashboard
                    </div>
                    <div className="p-1.5 opacity-70 flex items-center gap-1 hover:opacity-100">
                      <Receipt size={10} /> Bills
                    </div>
                    <div className="p-1.5 opacity-70 flex items-center gap-1 hover:opacity-100">
                      <FileText size={10} /> Inward List
                    </div>
                    <div className="p-1.5 opacity-70 flex items-center gap-1 hover:opacity-100">
                      <Sliders size={10} /> Settings
                    </div>
                  </div>

                  {/* Mock Page Content */}
                  <div className="col-span-8 bg-white dark:bg-slate-900 p-2.5 space-y-2 border border-gray-200 dark:border-slate-800 text-[10px]">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
                      <span className="font-bold text-gray-800 dark:text-white">Active Invoices</span>
                      <button
                        type="button"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                        className="text-white px-2 py-0.5 font-bold text-[9px] rounded-none shadow-2xs cursor-pointer"
                      >
                        + Create Bill
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="p-1.5 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between text-[9px]">
                        <span>INV-2026-001</span>
                        <span
                          className="font-bold px-1 py-0.5 text-[8px] text-white"
                          style={{ backgroundColor: themeConfig.primaryColor }}
                        >
                          PAID
                        </span>
                      </div>
                      <div className="p-1.5 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between text-[9px]">
                        <span>INV-2026-002</span>
                        <span className="font-bold px-1 py-0.5 text-[8px] bg-amber-500 text-white">PENDING</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW VIEW 2: AUTH / LOGIN */}
            {previewMode === 'auth' && (
              <div
                className="border border-gray-200 dark:border-slate-800 p-4 min-h-[220px] flex flex-col items-center justify-center space-y-3"
                style={{
                  background: `linear-gradient(135deg, ${themeConfig.primaryColor}15 0%, ${themeConfig.secondaryColor}30 100%)`
                }}
              >
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 w-full max-w-[240px] shadow-md space-y-2.5 text-center">
                  <img src={logoPreview} alt="Auth Logo" className="h-6 mx-auto object-contain" />
                  <span className="text-[10px] font-bold text-gray-800 dark:text-white block">
                    Welcome to Simcha ERP
                  </span>
                  <div className="w-full h-6 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-[9px] flex items-center px-2 text-gray-400">
                    user@simcha.com
                  </div>
                  <button
                    type="button"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                    className="w-full py-1 text-white text-[10px] font-bold rounded-none shadow-xs"
                  >
                    Secure Login
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW VIEW 3: INVOICE */}
            {previewMode === 'invoice' && (
              <div className="border border-gray-200 dark:border-slate-800 bg-white p-3 shadow-xs space-y-2.5 text-gray-800">
                {/* Invoice Top Banner */}
                <div
                  className="p-2.5 text-white flex items-center justify-between"
                  style={{
                    backgroundColor: themeConfig.invoiceAccentColor || themeConfig.primaryColor
                  }}
                >
                  <img
                    src={logoPreview}
                    alt="Invoice Logo"
                    className="h-5 object-contain bg-white/90 p-0.5 rounded-2xs"
                  />
                  <span className="text-[11px] font-black uppercase tracking-wider">TAX INVOICE</span>
                </div>

                {/* Table Simulation */}
                <div className="border border-gray-200 text-[9px]">
                  <div
                    className="p-1 text-white font-bold grid grid-cols-12"
                    style={{
                      backgroundColor: themeConfig.invoiceAccentColor || themeConfig.primaryColor
                    }}
                  >
                    <span className="col-span-8">Description</span>
                    <span className="col-span-4 text-right">Amount (₹)</span>
                  </div>
                  <div className="p-1 border-b border-gray-100 grid grid-cols-12">
                    <span className="col-span-8 font-medium">Dell Latitude 5420 i7</span>
                    <span className="col-span-4 text-right font-bold">45,000.00</span>
                  </div>
                </div>

                {/* Grand Total Badge */}
                <div className="flex justify-end pt-1">
                  <div
                    className="px-3 py-1 text-white font-black text-[10px] flex items-center gap-2"
                    style={{
                      backgroundColor: themeConfig.invoiceAccentColor || themeConfig.primaryColor
                    }}
                  >
                    <span>GRAND TOTAL:</span>
                    <span>₹ 45,000.00</span>
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
