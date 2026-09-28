import React, { createContext, useContext, useState, useEffect } from 'react'
import defaultLogo from '../assets/Logo/Logo-bg-remove.webp'
import defaultFavicon from '../assets/Logo/Favicon.jpeg'

const ThemeContext = createContext({
  theme: {
    primaryColor: '#043486',
    secondaryColor: '#0248BC',
    accentColor: '#3B82F6',
    sidebarTheme: 'dark',
    logoUrl: '',
    faviconUrl: '',
    invoiceAccentColor: '#043486',
    invoiceHeaderStyle: 'banner'
  },
  logo: defaultLogo,
  favicon: defaultFavicon,
  updateTheme: () => {}
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('simcha_custom_theme')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse theme', e)
      }
    }
    return {
      primaryColor: '#043486',
      secondaryColor: '#0248BC',
      accentColor: '#3B82F6',
      sidebarTheme: 'dark',
      logoUrl: '',
      faviconUrl: '',
      invoiceAccentColor: '#043486',
      invoiceHeaderStyle: 'banner'
    }
  })

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
  }, [theme])

  const updateTheme = (newTheme) => {
    setTheme(prev => {
      const updated = { ...prev, ...newTheme }
      localStorage.setItem('simcha_custom_theme', JSON.stringify(updated))
      return updated
    })
  }

  const activeLogo = theme.logoUrl && theme.logoUrl.trim() ? theme.logoUrl : defaultLogo
  const activeFavicon = theme.faviconUrl && theme.faviconUrl.trim() ? theme.faviconUrl : defaultFavicon

  return (
    <ThemeContext.Provider value={{ theme, logo: activeLogo, favicon: activeFavicon, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
