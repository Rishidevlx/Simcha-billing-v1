import React from 'react'
import { useTheme } from '../../../context/ThemeContext'
import defaultLogo from '../../../assets/Logo/Logo-bg-remove.webp'

export default function TemplateHeader({
  logoUrl,
  companyName,
  companyGstin,
  companyPhone,
  companyEmail,
  companyAddress,
  badgeText = null
}) {
  const { logo: themeLogo, companyName: themeCompanyName } = useTheme()
  const activeLogo = logoUrl || themeLogo || defaultLogo

  const effectiveCompanyName = companyName || themeCompanyName || ''
  const effectiveGstin = companyGstin || ''
  const effectivePhone = companyPhone || ''
  const effectiveEmail = companyEmail || ''
  const effectiveAddress = companyAddress || ''

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-4 pt-0.5">
        {/* Left Compact Logo + Branding */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <img
            src={activeLogo}
            alt={effectiveCompanyName || "Company Logo"}
            className="h-12 sm:h-14 max-h-14 max-w-[150px] w-auto object-contain shrink-0"
            style={{ maxHeight: '56px', maxWidth: '150px', height: '56px', width: 'auto', objectFit: 'contain' }}
          />
          <div className="space-y-0.5 flex-1 min-w-0">
            <h1 className="text-lg font-black text-[#043486] tracking-tight leading-none uppercase">
              {effectiveCompanyName}
            </h1>
            {effectiveAddress && (
              <p className="text-[10px] text-gray-600 leading-normal break-words max-w-lg">
                {effectiveAddress}
              </p>
            )}
            {(effectivePhone || effectiveEmail) && (
              <p className="text-[10px] text-gray-700 font-medium">
                {effectivePhone && <span><strong>Mobile:</strong> {effectivePhone}</span>}
                {effectivePhone && effectiveEmail && <span> &nbsp;|&nbsp; </span>}
                {effectiveEmail && <span><strong>Email:</strong> {effectiveEmail}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Top Right: GSTIN Header & Optional Document Badge */}
        <div className="text-right shrink-0 pt-0.5 pl-3 whitespace-nowrap">
          {effectiveGstin && (
            <div className="text-[11px] font-bold text-[#292424] font-mono tracking-normal inline-block text-right">
              <span className="text-gray-500 font-bold font-sans text-[10.5px]">GSTIN: </span>
              <span className="font-mono">{effectiveGstin}</span>
            </div>
          )}
          {badgeText && (
            <div className="mt-1">
              <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 bg-[#043486]/10 text-[#043486] border border-[#043486]/20">
                {badgeText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Thin Divider Rule */}
      <div className="w-full h-[2px] bg-[#043486] mt-1.5" />
    </div>
  )
}

