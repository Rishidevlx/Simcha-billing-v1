import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Receipt,
  Layers,
  Boxes,
  PackageOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  Circle,
  Wrench
} from 'lucide-react'
import logoImg from '../../assets/Logo/Logo-bg-remove.png'
import faviconImg from '../../assets/Logo/Favicon.jpeg'

export default function Sidebar({
  isCollapsed,
  activeRoute,
  activePath = '',
  setActiveRoute,
  isMobileOpen,
  closeMobileSidebar
}) {
  // State for open dropdown menus when expanded
  const [openMenus, setOpenMenus] = useState({
    bills: false,
    services: true,
    materials: true,
    inventory: true,
    settings: true
  })

  // State for hover flyout when collapsed
  const [hoveredMenuId, setHoveredMenuId] = useState(null)

  // Determine active route from path or fallback
  const currentPath = activePath || (activeRoute ? `/${activeRoute}` : '/dashboard')

  useEffect(() => {
    if (currentPath.includes('settings')) {
      setOpenMenus(prev => ({ ...prev, settings: true }))
    } else if (currentPath.includes('service')) {
      setOpenMenus(prev => ({ ...prev, services: true }))
    } else if (currentPath.includes('material')) {
      setOpenMenus(prev => ({ ...prev, materials: true }))
    } else if (
      currentPath.includes('inventory') ||
      currentPath.includes('stock') ||
      currentPath.includes('return')
    ) {
      setOpenMenus(prev => ({ ...prev, inventory: true }))
    } else if (
      currentPath.includes('inward') ||
      currentPath.includes('outward') ||
      currentPath.includes('bill')
    ) {
      setOpenMenus(prev => ({ ...prev, bills: true }))
    }
  }, [currentPath])

  const toggleMenu = (key) => {
    if (isCollapsed) return
    setOpenMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Menu items list with URL paths
  const menuConfig = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      single: true
    },
    {
      id: 'bills',
      title: 'Bills',
      icon: Receipt,
      subItems: [
        { id: 'inward', title: 'Inward', path: '/inward' },
        { id: 'inward-reports', title: 'Inward List', path: '/inward-list' },
        { id: 'create-bill', title: 'Outward', path: '/outward' },
        { id: 'all-bills', title: 'Outward List', path: '/outward-list' }
      ]
    },
    {
      id: 'services',
      title: 'Services',
      icon: Wrench,
      subItems: [
        { id: 'new-service', title: 'New Request', path: '/services/new' },
        { id: 'all-services', title: 'Service List', path: '/services/list' }
      ]
    },
    {
      id: 'categories',
      title: 'Categories',
      icon: Layers,
      path: '/categories',
      single: true
    },
    {
      id: 'materials',
      title: 'Materials',
      icon: Boxes,
      subItems: [
        { id: 'add-material', title: 'Add Material', path: '/materials/add' },
        { id: 'all-materials', title: 'All Materials', path: '/materials' }
      ]
    },
    {
      id: 'inventory',
      title: 'Stock & Inventory',
      icon: PackageOpen,
      subItems: [
        { id: 'inventory-stock', title: 'Inventory', path: '/inventory' },
        { id: 'returns-adjustments', title: 'Returns & Adjustments', path: '/inventory/returns' }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      subItems: [
        { id: 'profile-settings', title: 'Profile Settings', path: '/settings/profile' },
        { id: 'system-settings', title: 'System Settings', path: '/settings/system' },
        { id: 'configurations-settings', title: 'Configurations Settings', path: '/settings/configurations' }
      ]
    }
  ]

  const isSubActive = (sub) => {
    if (currentPath === sub.path) return true
    if (sub.id === activeRoute) return true
    if (sub.id === 'inward-reports' && (currentPath === '/inward-reports' || currentPath === '/inward-list')) return true
    if (sub.id === 'create-bill' && (currentPath === '/create-bill' || currentPath === '/outward')) return true
    if (sub.id === 'all-bills' && (currentPath === '/all-bills' || currentPath === '/outward-list' || currentPath === '/bills')) return true
    if (sub.id === 'new-service' && (currentPath === '/new-service' || currentPath === '/services/new' || currentPath === '/service/new')) return true
    if (sub.id === 'all-services' && (currentPath === '/all-services' || currentPath === '/services/list' || currentPath === '/services' || currentPath === '/service')) return true
    if (sub.id === 'all-materials' && (currentPath === '/all-materials' || currentPath === '/materials')) return true
    if (sub.id === 'add-material' && (currentPath === '/add-material' || currentPath === '/materials/add')) return true
    if (sub.id === 'inventory-stock' && (currentPath === '/inventory' || currentPath === '/stock')) return true
    if (sub.id === 'returns-adjustments' && (currentPath === '/inventory/returns' || currentPath === '/returns' || currentPath === '/returns-adjustments')) return true
    if (sub.id === 'profile-settings' && (currentPath === '/profile-settings' || currentPath === '/settings/profile' || currentPath === '/profile')) return true
    if (sub.id === 'system-settings' && (currentPath === '/system-settings' || currentPath === '/settings/system')) return true
    if (sub.id === 'configurations-settings' && (currentPath === '/configurations-settings' || currentPath === '/settings/configurations')) return true
    return false
  }

  const handleItemClick = (target) => {
    if (setActiveRoute) {
      setActiveRoute(target)
    }
    setHoveredMenuId(null)
    if (closeMobileSidebar) closeMobileSidebar()
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container (Velzon #405189 Light Theme & Slate Dark Theme) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-[#405189] dark:bg-[#0f172a] text-slate-100 dark:text-slate-300 border-r border-[#364574] dark:border-slate-800/90 transition-all duration-300 ease-in-out flex flex-col justify-between shadow-xl dark:shadow-2xl ${
          isCollapsed ? 'w-20 overflow-visible' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand Logo with Increased Size when Open */}
        <div className="relative">
          <div className={`${isCollapsed ? 'h-20' : 'h-24'} flex items-center justify-center px-4 border-b border-white/10 dark:border-slate-800 bg-[#364574] dark:bg-[#090d16] transition-all duration-300`}>
            {isCollapsed ? (
              <div className="w-11 h-11 rounded-xs bg-white/10 dark:bg-slate-800 flex items-center justify-center shadow-xs p-2 overflow-hidden hover:scale-105 transition-transform border border-white/15 dark:border-slate-700">
                <img src={faviconImg} alt="Simcha" className="w-full h-full object-contain rounded-xs" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full px-2">
                <img
                  src={logoImg}
                  alt="Simcha Billing"
                  className="h-16 sm:h-18 max-w-[210px] w-auto object-contain brightness-0 invert transition-transform hover:scale-105 duration-200 drop-shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Menu Section */}
          <div className={`p-3 sidebar-scrollbar ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto max-h-[calc(100vh-96px)]'}`}>
            {!isCollapsed && (
              <div className="px-3 py-2 text-[11px] font-bold text-blue-200/70 dark:text-slate-400 uppercase tracking-widest">
                Menu
              </div>
            )}

            <nav className="space-y-1.5">
              {menuConfig.map((item) => {
                const Icon = item.icon
                const isSingle = item.single
                const isMenuOpen = openMenus[item.id]
                const isActiveParent = !isSingle && item.subItems.some(sub => isSubActive(sub))
                const isSingleActive = isSingle && (currentPath === item.path || (item.id === 'dashboard' && (currentPath === '/' || currentPath === '/dashboard')) || currentPath === `/${item.id}`)
                const isHovered = isCollapsed && hoveredMenuId === item.id

                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => isCollapsed && setHoveredMenuId(item.id)}
                    onMouseLeave={() => isCollapsed && setHoveredMenuId(null)}
                  >
                    {isSingle ? (
                      /* Single Item (e.g. Dashboard, Categories) */
                      <button
                        onClick={() => handleItemClick(item.path || item.id)}
                        className={`w-full flex items-center ${
                          isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                        } rounded-xs text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                          isSingleActive
                            ? 'bg-white/20 dark:bg-[#0248BC] text-white border-l-3 border-white dark:border-blue-500 shadow-sm font-bold'
                            : 'text-blue-100 dark:text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 border border-transparent'
                        }`}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon size={19} className={isSingleActive ? 'text-white' : 'text-blue-200/80 dark:text-slate-400'} />
                          {!isCollapsed && <span className="tracking-wide">{item.title}</span>}
                        </div>
                      </button>
                    ) : (
                      /* Parent Item with Collapsible Submenu in Expanded mode */
                      <div>
                        <button
                          onClick={() => toggleMenu(item.id)}
                          className={`w-full flex items-center ${
                            isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                          } rounded-xs text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                            isActiveParent
                              ? 'bg-white/15 dark:bg-slate-800 text-white dark:text-blue-400 border border-white/20 dark:border-slate-700 shadow-xs font-bold'
                              : 'text-blue-100 dark:text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 border border-transparent'
                          }`}
                          title={isCollapsed ? item.title : undefined}
                        >
                          <div className="flex items-center gap-3.5">
                            <Icon size={19} className={isActiveParent ? 'text-white dark:text-blue-400' : 'text-blue-200/80 dark:text-slate-400'} />
                            {!isCollapsed && <span className="tracking-wide">{item.title}</span>}
                          </div>
                          {!isCollapsed && (
                            <span className="text-blue-200 dark:text-slate-400">
                              {isMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </span>
                          )}
                        </button>

                        {/* Submenu Items (When Expanded) with Boxy Styling */}
                        {!isCollapsed && isMenuOpen && (
                          <div className="mt-1 ml-3.5 pl-3 border-l border-white/20 dark:border-slate-800 space-y-1 py-1">
                            {item.subItems.map((sub) => {
                              const active = isSubActive(sub)
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => handleItemClick(sub.path || sub.id)}
                                  className={`w-full text-left px-3 py-2 rounded-xs text-[13.5px] font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
                                    active
                                      ? 'bg-white/20 dark:bg-blue-600/20 text-white dark:text-blue-400 font-bold border border-white/20 dark:border-blue-500/30'
                                      : 'text-blue-100/90 dark:text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800/70 border border-transparent'
                                  }`}
                                >
                                  <Circle
                                    size={6}
                                    className={active ? 'text-white fill-white dark:text-blue-400 dark:fill-blue-400' : 'text-blue-200/60 dark:text-slate-500 fill-blue-200/60 dark:fill-slate-500'}
                                  />
                                  <span>{sub.title}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Velzon Signature Boxy Flyout Hover Submenu (Floating Outside Sidebar) */}
                    {isCollapsed && isHovered && (
                      <>
                        {isSingle ? (
                          /* Tooltip Badge for Single Items */
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[999] whitespace-nowrap bg-[#405189] dark:bg-[#0f172a] rounded-xs shadow-xl border border-white/20 dark:border-slate-700 px-3.5 py-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                            <div className="flex items-center gap-2 text-white font-semibold text-xs tracking-wide">
                              <Icon size={14} className="text-blue-200 dark:text-blue-400" />
                              <span>{item.title}</span>
                            </div>
                          </div>
                        ) : (
                          /* Floating Flyout Menu for Nested Items */
                          <div className="absolute left-full top-0 ml-3 z-[999] min-w-[210px] bg-[#405189] dark:bg-[#0f172a] rounded-xs shadow-2xl border border-white/20 dark:border-slate-700 p-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 before:absolute before:-left-3 before:top-0 before:w-3 before:h-full">
                            {/* Header Title in Flyout */}
                            <div className="px-3 py-1.5 text-[11px] font-bold text-white dark:text-slate-300 uppercase tracking-wider border-b border-white/15 dark:border-slate-800 mb-1.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon size={14} className="text-blue-200 dark:text-blue-400" />
                                <span>{item.title}</span>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-white/15 dark:bg-slate-800 text-white dark:text-slate-300 font-medium border border-white/20 dark:border-slate-700">
                                {item.subItems.length}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {item.subItems.map((sub) => {
                                const active = isSubActive(sub)
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleItemClick(sub.path || sub.id)}
                                    className={`w-full text-left px-3 py-2 rounded-xs text-[13.5px] font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
                                      active
                                        ? 'bg-white/25 dark:bg-blue-600/20 text-white dark:text-blue-400 font-bold border border-white/30 dark:border-blue-500/30'
                                        : 'text-blue-100 dark:text-slate-300 hover:bg-white/15 dark:hover:bg-slate-800 hover:text-white border border-transparent'
                                    }`}
                                  >
                                    <Circle
                                      size={6}
                                      className={active ? 'text-white fill-white dark:text-blue-400 dark:fill-blue-400' : 'text-blue-200/60 dark:text-slate-500 fill-blue-200/60 dark:fill-slate-500'}
                                    />
                                    <span>{sub.title}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Empty bottom footer space */}
        <div className="p-1" />
      </aside>
    </>
  )
}

