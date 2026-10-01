import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  Receipt,
  Wrench,
  Layers,
  Boxes,
  PackageOpen,
  RotateCcw,
  Building2,
  ShieldCheck,
  Users,
  Settings,
  SlidersHorizontal,
  Palette,
  User,
  BookOpen,
  ArrowRight,
  CornerDownLeft,
  X
} from '../common/icons'

const MODULE_ITEMS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Live business metrics, sales insights & overview',
    category: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    keywords: ['home', 'analytics', 'kpi', 'revenue', 'overview']
  },
  {
    id: 'inward',
    title: 'Inward Bill Entry',
    subtitle: 'Record supplier purchase & incoming stock',
    category: 'Bills',
    icon: Receipt,
    path: '/inward',
    keywords: ['purchase', 'vendor', 'incoming', 'supplier', 'stock in']
  },
  {
    id: 'inward-list',
    title: 'Inward List',
    subtitle: 'Log of inward purchases & vendor records',
    category: 'Bills',
    icon: Receipt,
    path: '/inward-list',
    keywords: ['purchases', 'suppliers', 'inward report', 'vendor bills']
  },
  {
    id: 'outward',
    title: 'Create New Invoice (Outward)',
    subtitle: 'Generate customer invoice with GST tax calculation',
    category: 'Bills',
    icon: Receipt,
    path: '/outward',
    keywords: ['bill', 'sales', 'tax invoice', 'pos', 'customer receipt', 'gst']
  },
  {
    id: 'outward-list',
    title: 'Outward List (Bills)',
    subtitle: 'Manage sales invoices, payments & receipts',
    category: 'Bills',
    icon: Receipt,
    path: '/outward-list',
    keywords: ['sales list', 'invoices', 'receipts', 'payments', 'bill registry']
  },
  {
    id: 'services-new',
    title: 'New Service Request',
    subtitle: 'Book service job, repair issue & estimates',
    category: 'Services',
    icon: Wrench,
    path: '/services/new',
    keywords: ['repair', 'job sheet', 'service intake', 'estimate']
  },
  {
    id: 'services-list',
    title: 'Service Registry & List',
    subtitle: 'Track service stages, repair status & invoices',
    category: 'Services',
    icon: Wrench,
    path: '/services/list',
    keywords: ['services list', 'repairs', 'status', 'quotation', 'delivery']
  },
  {
    id: 'categories',
    title: 'Categories',
    subtitle: 'Product category taxonomy & groupings',
    category: 'Master Data',
    icon: Layers,
    path: '/categories',
    keywords: ['product groups', 'types', 'category management']
  },
  {
    id: 'materials-add',
    title: 'Add New Material',
    subtitle: 'Create inventory SKU, barcode, HSN & rates',
    category: 'Materials',
    icon: Boxes,
    path: '/materials/add',
    keywords: ['new product', 'item creation', 'barcode', 'hsn']
  },
  {
    id: 'materials-list',
    title: 'All Materials',
    subtitle: 'Catalog of billing materials, pricing & stock',
    category: 'Materials',
    icon: Boxes,
    path: '/materials',
    keywords: ['items', 'products', 'sku', 'catalog', 'price list']
  },
  {
    id: 'inventory',
    title: 'Stock & Inventory',
    subtitle: 'Real-time multi-channel stock ledger & alerts',
    category: 'Stock & Inventory',
    icon: PackageOpen,
    path: '/inventory',
    keywords: ['stock', 'low stock', 'reorder level', 'warehouse', 'sku ledger']
  },
  {
    id: 'returns',
    title: 'Returns & Adjustments',
    subtitle: 'Customer returns, QC inspection & credit notes',
    category: 'Stock & Inventory',
    icon: RotateCcw,
    path: '/inventory/returns',
    keywords: ['qc check', 'credit note', 'replacement', 'refund', 'warranty']
  },
  {
    id: 'departments',
    title: 'Departments',
    subtitle: 'Organizational divisions & structure',
    category: 'Roles & Access',
    icon: Building2,
    path: '/departments',
    keywords: ['teams', 'divisions', 'units']
  },
  {
    id: 'roles',
    title: 'Roles & Permissions',
    subtitle: 'Access levels, privileges & module rights',
    category: 'Roles & Access',
    icon: ShieldCheck,
    path: '/roles',
    keywords: ['access control', 'permissions', 'admin privileges', 'security']
  },
  {
    id: 'users',
    title: 'User Management',
    subtitle: 'System operators, staff accounts & credentials',
    category: 'Roles & Access',
    icon: Users,
    path: '/users',
    keywords: ['staff', 'operators', 'employees', 'credentials', 'accounts']
  },
  {
    id: 'settings-profile',
    title: 'Profile Settings',
    subtitle: 'Personal profile, email & security password',
    category: 'Settings',
    icon: User,
    path: '/settings/profile',
    keywords: ['password', 'account', 'profile', 'avatar', 'my info']
  },
  {
    id: 'settings-system',
    title: 'System & Company Settings',
    subtitle: 'Business profile, invoice prefix, GST rates & bank',
    category: 'Settings',
    icon: Settings,
    path: '/settings/system',
    keywords: ['company details', 'gstin', 'bank account', 'invoice numbering', 'prefix']
  },
  {
    id: 'settings-theme',
    title: 'Theme & Branding Settings',
    subtitle: 'Brand colors, logo upload & document layout',
    category: 'Settings',
    icon: Palette,
    path: '/settings/theme',
    keywords: ['colors', 'logo', 'favicon', 'dark mode', 'invoice theme']
  },
  {
    id: 'settings-config',
    title: 'Configurations Settings',
    subtitle: 'SMTP outgoing mail, Cloudinary & Virtual Assistant',
    category: 'Settings',
    icon: SlidersHorizontal,
    path: '/settings/configurations',
    keywords: ['smtp', 'mail', 'cloudinary', 'ai assistant', 'credentials']
  },
  {
    id: 'user-manual',
    title: 'User Manual & Guides',
    subtitle: 'End-to-end operation walkthrough & shortcuts',
    category: 'Documentation',
    icon: BookOpen,
    path: '/user-manual',
    keywords: ['help', 'documentation', 'guide', 'faq', 'instructions']
  }
]

export default function CommandPaletteModal({ isOpen, onClose, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()

  // Reset search and selection on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedIndex(0)
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus()
      }, 50)
    }
  }, [isOpen])

  // Filter modules based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return MODULE_ITEMS

    const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return MODULE_ITEMS.filter((item) => {
      const searchTarget = `${item.title} ${item.subtitle} ${item.category} ${item.path} ${item.keywords.join(' ')}`.toLowerCase()
      return terms.every((t) => searchTarget.includes(t))
    })
  }, [searchQuery])

  // Reset selected index if query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  // Lock background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const handleSelectItem = (item) => {
    onClose()
    if (onNavigate) {
      onNavigate(item.path)
    } else {
      navigate(item.path)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Poppins',sans-serif] overscroll-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <Search size={18} className="text-[#043486] dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Jump to a module, tab or report..."
            className="flex-1 text-xs sm:text-sm bg-transparent text-gray-800 dark:text-slate-100 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
          <kbd
            onClick={onClose}
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            Esc
          </kbd>
        </div>

        {/* Section Label */}
        <div className="px-4 py-2 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-gray-50/70 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 shrink-0">
          {filteredItems.length} {filteredItems.length === 1 ? 'Module Found' : 'Modules & Features'}
        </div>

        {/* Module Items List (Isolated Scroll) */}
        <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1 divide-y-0">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500">
              <Search size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">No matching modules found</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                Try searching for bills, inward, outward, inventory, service, or settings.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon
              const isSelected = index === selectedIndex

              return (
                <button
                  key={item.id}
                  data-index={index}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#043486]/10 dark:bg-blue-600/20 text-[#043486] dark:text-blue-300 ring-1 ring-[#043486]/30 dark:ring-blue-500/40'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-700 dark:text-slate-200'
                  }`}
                >
                  {/* Clean Icon + Sidebar Module Name Only */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#043486] text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <span className="text-xs sm:text-[13px] font-semibold tracking-wide truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#043486] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                        <span>Jump</span>
                        <CornerDownLeft size={10} />
                      </span>
                    ) : (
                      <ArrowRight size={13} className="text-gray-300 dark:text-slate-600" />
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-slate-950/60 border-t border-gray-100 dark:border-slate-800 text-[11px] text-gray-400 dark:text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-gray-200 dark:border-slate-700 text-[10px]">↑</kbd>
              <kbd className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-gray-200 dark:border-slate-700 text-[10px]">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white dark:bg-slate-900 px-1.5 rounded border border-gray-200 dark:border-slate-700 text-[10px]">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-gray-200 dark:border-slate-700 text-[10px]">[</kbd>
            <span>toggle sidebar</span>
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
