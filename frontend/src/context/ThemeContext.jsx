import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_ENDPOINTS } from '../config/api'
import defaultLogo from '../assets/Logo/Logo-bg-remove.webp'
import defaultFavicon from '../assets/Logo/Favicon.jpeg'

const DEFAULT_THEME = {
  primaryColor: '#043486',
  secondaryColor: '#0248BC',
  accentColor: '#3B82F6',
  sidebarTheme: 'dark',
  logoUrl: '',
  faviconUrl: '',
  invoiceAccentColor: '#043486',
  invoiceHeaderStyle: 'banner'
}

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  logo: defaultLogo,
  favicon: defaultFavicon,
  companyName: '',
  updateTheme: () => {},
  fetchThemeFromBackend: () => {},
  isSyncing: false
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('simcha_custom_theme')
    if (saved) {
      try {
        return { ...DEFAULT_THEME, ...JSON.parse(saved) }
      } catch (e) {
        console.error('Failed to parse theme from localStorage', e)
      }
    }
    return DEFAULT_THEME
  })

  const [isSyncing, setIsSyncing] = useState(false)

  // Fetch latest theme from backend on mount
  const fetchThemeFromBackend = useCallback(async () => {
    try {
      setIsSyncing(true)
      const token = localStorage.getItem('simcha_token') || sessionStorage.getItem('simcha_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      const res = await fetch(API_ENDPOINTS.THEME_SETTINGS, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data?.theme) {
          const backendTheme = { ...DEFAULT_THEME, ...data.theme }
          setTheme(prev => {
            const merged = { ...prev, ...backendTheme }
            try {
              localStorage.setItem('simcha_custom_theme', JSON.stringify(merged))
            } catch {}
            return merged
          })
        }
      }
    } catch (err) {
      console.warn('Theme backend sync note:', err?.message)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    fetchThemeFromBackend()
  }, [fetchThemeFromBackend])

  // Apply CSS Variables to :root and update Favicon
  useEffect(() => {
    const root = document.documentElement
    const primary = theme.primaryColor || '#043486'
    const secondary = theme.secondaryColor || '#0248BC'
    const accent = theme.accentColor || '#3B82F6'

    root.style.setProperty('--brand-primary', primary)
    root.style.setProperty('--brand-secondary', secondary)
    root.style.setProperty('--brand-accent', accent)

    // Favicon update
    if (theme.faviconUrl) {
      const faviconLink = document.querySelector("link[rel*='icon']")
      if (faviconLink) {
        faviconLink.href = theme.faviconUrl
      }
    }

    // Dynamic Title update
    if (theme.companyName) {
      document.title = `${theme.companyName} - Billing Software`
    }
  }, [theme])

  // Update theme with backend DB persistence
  const updateTheme = async (newTheme, persistToBackend = true) => {
    const updated = { ...theme, ...newTheme }
    setTheme(updated)
    try {
      localStorage.setItem('simcha_custom_theme', JSON.stringify(updated))
    } catch {}

    if (persistToBackend) {
      try {
        const token = localStorage.getItem('simcha_token') || sessionStorage.getItem('simcha_token')
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
        await fetch(API_ENDPOINTS.THEME_SETTINGS, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updated)
        })
      } catch (err) {
        console.error('Failed to persist theme to backend DB:', err)
      }
    }
  }

  const activeLogo = theme.logoUrl && theme.logoUrl.trim() ? theme.logoUrl : defaultLogo
  const activeFavicon = theme.faviconUrl && theme.faviconUrl.trim() ? theme.faviconUrl : defaultFavicon
  const activeCompanyName = theme.companyName || ''

  return (
    <ThemeContext.Provider value={{
      theme,
      logo: activeLogo,
      favicon: activeFavicon,
      companyName: activeCompanyName,
      updateTheme,
      fetchThemeFromBackend,
      isSyncing
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

