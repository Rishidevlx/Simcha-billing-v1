import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AiAssistantChatbot from '../ai/AiAssistantChatbot'
import { API_ENDPOINTS } from '../../config/api'

export default function DashboardLayout({
  onLogout,
  user,
  onUpdateUser,
  children
}) {
  const { companyName } = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isAiEnabled, setIsAiEnabled] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('simcha_theme') === 'dark' || document.documentElement.classList.contains('dark')
  })

  const location = useLocation()
  const navigate = useNavigate()

  // Fetch AI Config and listen to live toggle updates
  useEffect(() => {
    const checkAiStatus = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.AI_CONFIG)
        const data = await res.json()
        if (data.success && data.config) {
          setIsAiEnabled(Boolean(data.config.is_enabled))
        }
      } catch (err) {
        console.error('Failed to check AI config status:', err)
      }
    }

    checkAiStatus()

    const handleAiConfigChange = (e) => {
      if (e.detail && e.detail.is_enabled !== undefined) {
        setIsAiEnabled(Boolean(e.detail.is_enabled))
      }
    }

    window.addEventListener('ai_config_updated', handleAiConfigChange)
    return () => window.removeEventListener('ai_config_updated', handleAiConfigChange)
  }, [])

  const ROUTE_MAP = {
    'dashboard': '/dashboard',
    'inward': '/inward',
    'inward-reports': '/inward-list',
    'inward-list': '/inward-list',
    'create-bill': '/outward',
    'outward': '/outward',
    'all-bills': '/outward-list',
    'outward-list': '/outward-list',
    'bills': '/outward-list',
    'categories': '/categories',
    'materials': '/materials',
    'all-materials': '/materials',
    'add-material': '/materials/add',
    'inventory': '/inventory',
    'stock': '/inventory',
    'returns': '/inventory/returns',
    'returns-adjustments': '/inventory/returns',
    'profile-settings': '/settings/profile',
    'profile': '/settings/profile',
    'system-settings': '/settings/system',
    'configurations-settings': '/settings/configurations'
  }

  const setActiveRoute = (route) => {
    const target = ROUTE_MAP[route] || (route && route.startsWith('/') ? route : `/${route || 'dashboard'}`)
    navigate(target)
  }

  // Global Keyboard Shortcut: Alt + F for Fullscreen Toggle across all modules
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {})
          }
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // Keyboard shortcut: [ for Sidebar Toggle (if not in input)
  useEffect(() => {
    const handleBracketKey = (e) => {
      const tag = e.target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return
      if (e.key === '[' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleBracketKey)
    return () => window.removeEventListener('keydown', handleBracketKey)
  }, [isSidebarCollapsed, isMobileOpen])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('simcha_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('simcha_theme', 'light')
    }
  }, [isDarkMode])

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen)
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed)
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  return (
    <div className={`min-h-screen bg-[#F3F3F9] dark:bg-slate-950 font-['Poppins',sans-serif] ${isDarkMode ? 'dark text-slate-100' : 'text-[#292424]'}`}>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        activePath={location.pathname}
        setActiveRoute={setActiveRoute}
        isMobileOpen={isMobileOpen}
        closeMobileSidebar={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={onLogout}
          user={user}
          setActiveRoute={setActiveRoute}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children || <Outlet context={{ setActiveRoute, user, onUpdateUser }} />}
        </main>

        {/* Responsive Footer */}
        <footer className="min-h-12 py-3 bg-white dark:bg-slate-900 border-t border-gray-200/80 dark:border-slate-800 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1.5 text-xs text-gray-500 dark:text-slate-400 transition-colors">
          <span>{new Date().getFullYear()} © {companyName || 'Simcha'}.</span>
          <span>
            Design &amp; Developed by{' '}
            <a
              href="https://nextskilltechnologies.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#043486] dark:text-blue-400 hover:underline font-semibold"
            >
              Nextskill Technologies
            </a>
          </span>
        </footer>
      </div>

      {/* Floating Simcha AI Assistant Chatbot (Only if Enabled) */}
      {isAiEnabled && <AiAssistantChatbot user={user} onNavigate={setActiveRoute} />}
    </div>
  )
}

