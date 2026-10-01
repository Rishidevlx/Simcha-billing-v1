import React from 'react'
import { Phone, Mail, MapPin } from '../../common/icons'

export default function TemplateFooterRibbon({
  companyPhone = '8122022060',
  companyEmail = 'simchainfosolutions@gmail.com',
  companyAddress = '7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.'
}) {
  return (
    <div className="w-full bg-[#043486] text-white px-8 py-2.5 flex items-center justify-between text-[9.5px] font-medium tracking-wide z-10 shrink-0">
      {/* Left Contact Pills */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0 shadow-xs">
            <Phone size={10} className="stroke-[2.5]" />
          </div>
          <span className="font-semibold tracking-wider font-mono">+91 {companyPhone}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0 shadow-xs">
            <Mail size={10} className="stroke-[2.5]" />
          </div>
          <span className="tracking-wide">{companyEmail}</span>
        </div>
      </div>

      {/* Slanted Divider */}
      <div className="h-5 w-[1px] bg-blue-300/40 transform rotate-12 mx-2" />

      {/* Right Location Address */}
      <div className="flex items-center gap-4 max-w-md text-right">
        <div className="flex items-center gap-2 text-left">
          <div className="w-5 h-5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0 shadow-xs">
            <MapPin size={10} className="stroke-[2.5]" />
          </div>
          <span className="text-[9px] leading-tight text-blue-100 truncate max-w-xs">
            {companyAddress}
          </span>
        </div>
      </div>
    </div>
  )
}
