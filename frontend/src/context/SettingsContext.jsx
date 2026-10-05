import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_ENDPOINTS } from '../config/api'

const SettingsContext = createContext({
  settings: null,
  companyDetails: {
    name: 'SIMCHA INFO SOLUTIONS',
    address: '',
    phone: '',
    email: '',
    gstin: ''
  },
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNo: '',
    ifscCode: '',
    branch: '',
    bankImageUrl: ''
  },
  signatureUrl: '',
  bankImageUrl: '',
  termsList: [],
  taxRates: { cgst: 9, sgst: 9, igst: 18 },
  fetchSettingsFromBackend: () => {},
  isSyncing: false
})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('simcha_settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return null
  })

  const [isSyncing, setIsSyncing] = useState(false)

  // Fetch full system & company settings directly from database API
  const fetchSettingsFromBackend = useCallback(async () => {
    try {
      setIsSyncing(true)
      const token = localStorage.getItem('simcha_token') || sessionStorage.getItem('simcha_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      const res = await fetch(API_ENDPOINTS.SETTINGS, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data?.settings) {
          setSettings(data.settings)
          try {
            localStorage.setItem('simcha_settings', JSON.stringify(data.settings))
          } catch {}
        }
      }
    } catch (err) {
      console.warn('DB settings sync note:', err?.message)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    fetchSettingsFromBackend()
  }, [fetchSettingsFromBackend])

  const termsList = Array.isArray(settings?.terms_conditions)
    ? settings.terms_conditions
    : [
      'Warranty as per manufacturer’s norms & should be claimed directly.',
      'Warranty claim takes 1 to 8 weeks.',
      'Please carry bill copy for warranty claims.',
      'Goods once sold will not be taken back or exchanged unless approved.'
    ]

  return (
    <SettingsContext.Provider value={{
      settings,
      companyDetails: {
        name: settings?.company_name || 'SIMCHA INFO SOLUTIONS',
        address: settings?.address || '',
        phone: settings?.phone || '',
        email: settings?.email || '',
        gstin: settings?.gstin || ''
      },
      bankDetails: {
        bankName: settings?.bank_name || '',
        accountName: settings?.account_name || settings?.company_name || 'SIMCHA INFO SOLUTIONS',
        accountNo: settings?.account_no || '',
        ifscCode: settings?.ifsc_code || '',
        branch: settings?.branch || '',
        bankImageUrl: settings?.bank_image_url || ''
      },
      signatureUrl: settings?.signature_url || '',
      bankImageUrl: settings?.bank_image_url || '',
      termsList,
      taxRates: {
        cgst: parseFloat(settings?.cgst_rate ?? 9),
        sgst: parseFloat(settings?.sgst_rate ?? 9),
        igst: parseFloat(settings?.igst_rate ?? 18)
      },
      fetchSettingsFromBackend,
      isSyncing
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
