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
  const { logo: themeLogo, companyName: themeCompanyName, companyDetails } = useTheme()
  const activeLogo = logoUrl || themeLogo || defaultLogo

  const effectiveCompanyName = companyName || themeCompanyName || companyDetails?.name || ''
  const effectiveGstin = companyGstin || companyDetails?.gstin || ''
  const effectivePhone = companyPhone || companyDetails?.phone || ''
  const effectiveEmail = companyEmail || companyDetails?.email || ''
  const effectiveAddress = companyAddress || companyDetails?.address || ''

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-4 pt-0.5">
        {/* Left Compact Logo + Branding */}
        <div className="flex items-start gap-3">
          <img
            src={activeLogo}
            alt={effectiveCompanyName || "Company Logo"}
            className="h-9 sm:h-10 max-h-10 max-w-[130px] w-auto object-contain shrink-0 mt-0.5"
          />
          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-[#043486] tracking-tight leading-none uppercase">
              {effectiveCompanyName}
            </h1>
            {effectiveAddress && (
              <p className="text-[10px] text-gray-600 leading-normal truncate max-w-lg">
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
        <div className="text-right shrink-0 pt-0.5 pr-4 mr-2">
          {effectiveGstin && (
            <div className="text-[11.5px] font-bold text-[#292424] font-mono tracking-normal">
              <span className="text-gray-500 font-bold font-sans text-[11px]">GSTIN: </span>
              {effectiveGstin}
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

