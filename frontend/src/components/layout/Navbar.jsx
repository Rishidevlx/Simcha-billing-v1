import { useState, useEffect } from 'react'
import {
  Menu,
  Maximize,
  Minimize,
  Moon,
  Sun,
  User,
  LogOut,
  Settings as SettingsIcon,
  ChevronDown,
  Bell,
  AlertTriangle,
  CheckCheck,
  Check,
  PackagePlus,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  XCircle,
  Trash2,
  X,
  RotateCcw
} from 'lucide-react'
import { API_ENDPOINTS } from '../../config/api'
import defaultPfp from '../../assets/avatar/Deafult Pfp.jpg'
import maleAvatar from '../../assets/avatar/Male avatar.png'
import femaleAvatar from '../../assets/avatar/Female Avatar.png'

const AVATAR_MAP = {
  default: defaultPfp,
  male: maleAvatar,
  female: femaleAvatar
}

export default function Navbar({
  isSidebarCollapsed,
  toggleSidebar,
  isDarkMode,
  toggleDarkMode,
  onLogout,
  user = { name: 'Rishi', role: 'Administrator', avatar: 'male' },
  setActiveRoute
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifFilter, setNotifFilter] = useState('all') // 'all' | 'unread' | 'critical'

  // Low stock notifications state
  const [lowStockItems, setLowStockItems] = useState([])
  
  // Read notifications
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem('simcha_read_notifications')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Cleared / Dismissed notifications
  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem('simcha_cleared_notifications')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Fetch low stock items from inventory API
  const fetchLowStockAlerts = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.INVENTORY)
      const data = await res.json()
      if (data.success && (data.data || data.materials)) {
        const materials = data.data || data.materials || []
        const alerts = materials.filter(m => {
          const stock = parseInt(m.current_stock || 0, 10)
          const reorder = parseInt(m.reorder_level || 0, 10)
          return stock <= reorder
        })
        setLowStockItems(alerts)
      }
    } catch (err) {
      console.error('Failed to fetch low stock alerts for navbar:', err)
    }
  }

  useEffect(() => {
    fetchLowStockAlerts()
    const interval = setInterval(fetchLowStockAlerts, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  // Persist read notifications
  const saveReadNotifs = (ids) => {
    setReadNotifIds(ids)
    localStorage.setItem('simcha_read_notifications', JSON.stringify(ids))
  }

  // Persist cleared notifications
  const saveClearedNotifs = (ids) => {
    setClearedNotifIds(ids)
    localStorage.setItem('simcha_cleared_notifications', JSON.stringify(ids))
  }

  const markAsRead = (id, e) => {
    if (e) e.stopPropagation()
    if (!readNotifIds.includes(id)) {
      saveReadNotifs([...readNotifIds, id])
    }
  }

  const markAllAsRead = (e) => {
    if (e) e.stopPropagation()
    const allIds = lowStockItems.map(item => item.id)
    saveReadNotifs(allIds)
  }

  const clearSingleNotif = (id, e) => {
    if (e) e.stopPropagation()
    if (!clearedNotifIds.includes(id)) {
      saveClearedNotifs([...clearedNotifIds, id])
    }
  }

  const clearAllNotifs = (e) => {
    if (e) e.stopPropagation()
    const allIds = lowStockItems.map(item => item.id)
    saveClearedNotifs(allIds)
  }

  const resetClearedNotifs = (e) => {
    if (e) e.stopPropagation()
    saveClearedNotifs([])
  }

  // Filter out cleared notifications
  const activeNotifs = lowStockItems.filter(item => !clearedNotifIds.includes(item.id))
  const unreadCount = activeNotifs.filter(item => !readNotifIds.includes(item.id)).length
  const criticalCount = activeNotifs.filter(item => parseInt(item.current_stock || 0, 10) <= 0).length

  // Filtered by tab
  const filteredNotifs = activeNotifs.filter(item => {
    if (notifFilter === 'unread') return !readNotifIds.includes(item.id)
    if (notifFilter === 'critical') return parseInt(item.current_stock || 0, 10) <= 0
    return true
  })

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err))
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err))
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const currentAvatarSrc = user.avatar ? (AVATAR_MAP[user.avatar] || AVATAR_MAP.male) : AVATAR_MAP.male

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 font-['Poppins',sans-serif]">
      {/* Left: Sidebar Toggle Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right: Actions (Notifications, Fullscreen, Dark Mode, Profile) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreenToggle}
          title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
          className="p-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
        >
          {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
        </button>

        {/* Dark / Light Mode Button */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
        >
          {isDarkMode ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
        </button>

        {/* 🔔 Premium Notification Bell & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen)
              setIsProfileOpen(false)
            }}
            title="Stock Notifications & Low Stock Alerts"
            className="p-2.5 rounded-full text-gray-500 dark:text-slate-400 hover:text-[#405189] dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800 transition-colors relative cursor-pointer focus:outline-none"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold font-mono text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Ultra-Professional Velzon Notification Dropdown */}
          {isNotifOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNotifOpen(false)} 
              />
              <div className="absolute right-0 mt-2.5 w-84 sm:w-[420px] bg-white dark:bg-[#1e293b] rounded-lg shadow-2xl border border-gray-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 font-['Poppins',sans-serif]">
                
                {/* 1. Header with Deep Velzon Gradient & Clear Options */}
                <div className="bg-gradient-to-r from-[#405189] to-[#364574] px-4 py-3.5 text-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold tracking-wide">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  
                  {/* Action Controls: Mark Read & Clear All */}
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 font-medium transition-all opacity-90 hover:opacity-100 cursor-pointer"
                        title="Mark all active notifications as read"
                      >
                        <CheckCheck size={13} />
                        <span>Read all</span>
                      </button>
                    )}

                    {activeNotifs.length > 0 ? (
                      <button
                        onClick={clearAllNotifs}
                        className="text-[11px] text-white hover:text-white flex items-center gap-1 font-medium transition-all opacity-90 hover:opacity-100 cursor-pointer hover:underline"
                        title="Clear all active notifications"
                      >
                        {/* <Trash2 size={13} /> */}
                        <span>Clear all</span>
                      </button>
                    ) : clearedNotifIds.length > 0 ? (
                      <button
                        onClick={resetClearedNotifs}
                        className="text-[11px] text-blue-200 hover:text-white flex items-center gap-1 font-medium transition-all cursor-pointer"
                        title="Restore cleared notifications"
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* 2. Sleek Filter Tabs */}
                <div className="flex border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/70 text-xs px-2 pt-1.5 gap-1">
                  <button
                    onClick={() => setNotifFilter('all')}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      notifFilter === 'all'
                        ? 'bg-white dark:bg-[#1e293b] text-[#405189] dark:text-blue-400 font-bold border-t-2 border-[#405189] dark:border-blue-400 shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>All</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                      {activeNotifs.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setNotifFilter('unread')}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      notifFilter === 'unread'
                        ? 'bg-white dark:bg-[#1e293b] text-[#405189] dark:text-blue-400 font-bold border-t-2 border-[#405189] dark:border-blue-400 shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Unread</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setNotifFilter('critical')}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      notifFilter === 'critical'
                        ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 font-bold border-t-2 border-rose-500 shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Out of Stock</span>
                    {criticalCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                        {criticalCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* 3. Notification Items List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredNotifs.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 dark:text-slate-500">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2.5 shadow-2xs">
                        <Check size={20} />
                      </div>
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        {clearedNotifIds.length > 0 && activeNotifs.length === 0
                          ? 'Notifications Cleared'
                          : notifFilter === 'unread'
                          ? 'All Alerts Caught Up!'
                          : 'All Stock Healthy!'}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 max-w-[260px] mx-auto">
                        {clearedNotifIds.length > 0 && activeNotifs.length === 0
                          ? 'You have cleared all low stock alerts.'
                          : notifFilter === 'unread'
                          ? 'You have marked all pending alerts as read.'
                          : 'No materials are currently below threshold.'}
                      </p>
                      {clearedNotifIds.length > 0 && (
                        <button
                          onClick={resetClearedNotifs}
                          className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Restore Cleared Alerts</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredNotifs.map((item) => {
                      const isRead = readNotifIds.includes(item.id)
                      const stock = parseInt(item.current_stock || 0, 10)
                      const reorder = parseInt(item.reorder_level || 0, 10)
                      const isOutOfStock = stock <= 0

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 flex items-start gap-3 transition-colors relative group ${
                            !isRead
                              ? isOutOfStock
                                ? 'bg-rose-50/30 dark:bg-rose-950/20 border-l-3 border-rose-500'
                                : 'bg-amber-50/30 dark:bg-amber-950/20 border-l-3 border-amber-500'
                              : 'bg-white dark:bg-[#1e293b] border-l-3 border-transparent opacity-75 hover:opacity-100'
                          } hover:bg-gray-50/80 dark:hover:bg-slate-800/60`}
                        >
                          {/* Circular Icon Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isOutOfStock
                              ? 'bg-rose-100/80 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                              : 'bg-amber-100/80 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                          }`}>
                            {isOutOfStock ? <XCircle size={17} /> : <AlertTriangle size={17} />}
                          </div>

                          {/* Content Body */}
                          <div className="flex-1 min-w-0 pr-5">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <h4 className="text-xs font-bold text-[#1e293b] dark:text-white truncate max-w-[200px]">
                                {item.name}
                              </h4>
                              {item.category_name && (
                                <span className="text-[9px] px-1.5 py-0.2 font-medium bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xs shrink-0">
                                  {item.category_name}
                                </span>
                              )}
                            </div>

                            {/* Stock Description Line */}
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                              {isOutOfStock ? (
                                <span className="font-semibold text-rose-600 dark:text-rose-400">
                                  Out of Stock (0 {item.unit || 'Nos'} available)
                                </span>
                              ) : (
                                <span>
                                  Low Stock: <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">{stock} {item.unit || 'Nos'}</strong> left
                                  <span className="text-gray-400 dark:text-slate-500 ml-1">(Threshold: {reorder})</span>
                                </span>
                              )}
                            </p>

                            {/* Actions Bar */}
                            <div className="mt-2.5 flex items-center justify-between">
                              <button
                                onClick={() => {
                                  setIsNotifOpen(false)
                                  if (setActiveRoute) setActiveRoute('inward')
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xs shadow-2xs transition-all cursor-pointer"
                              >
                                <PackagePlus size={12} />
                                <span>Order Inward</span>
                              </button>

                              {!isRead ? (
                                <button
                                  onClick={(e) => markAsRead(item.id, e)}
                                  className="text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-[#043486] dark:hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Mark this alert as read"
                                >
                                  <Check size={13} />
                                  <span>Mark read</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 italic">
                                  Read
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Individual Clear (X) Button */}
                          <button
                            onClick={(e) => clearSingleNotif(item.id, e)}
                            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                            title="Clear / Dismiss this notification"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* 4. Professional Footer Bar */}
                <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/90 text-center flex items-center justify-between px-4">
                  {activeNotifs.length > 0 ? (
                    <button
                      onClick={clearAllNotifs}
                      className="text-xs text-gray-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Clear All Alerts</span>
                    </button>
                  ) : <div />}

                  <button
                    onClick={() => {
                      setIsNotifOpen(false)
                      if (setActiveRoute) setActiveRoute('inventory')
                    }}
                    className="text-xs font-bold text-[#043486] dark:text-blue-400 hover:text-[#0248BC] hover:underline inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    <span>Stock & Inventory</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen)
              setIsNotifOpen(false)
            }}
            className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 text-white font-bold text-sm flex items-center justify-center shadow-xs border-2 border-gray-200 dark:border-slate-700">
              {currentAvatarSrc ? (
                <img src={currentAvatarSrc} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-bold text-[#292424] dark:text-white leading-tight">
                {user.name}
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-400 font-normal leading-tight">
                {user.role}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400 dark:text-slate-400 hidden md:block" />
          </button>

          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xs shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 md:hidden">
                  <p className="text-xs font-semibold text-[#292424] dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-400">{user.role}</p>
                </div>
                
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    if (setActiveRoute) setActiveRoute('profile-settings')
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[#043486] dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User size={14} />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    if (setActiveRoute) setActiveRoute('system-settings')
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[#043486] dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <SettingsIcon size={14} />
                  <span>System Settings</span>
                </button>

                <div className="my-1 border-t border-gray-100 dark:border-slate-700" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    onLogout()
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
