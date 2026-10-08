import React from 'react'
import { useTheme } from '../../../context/ThemeContext'
import defaultFavicon from '../../../assets/Logo/Favicon.jpeg'

export default function TemplatePageShell({
  pageIndex = 1,
  totalPages = 1,
  children,
  className = ''
}) {
  const { favicon: themeFavicon } = useTheme()
  const watermarkImg = themeFavicon || defaultFavicon
  const isLastPage = pageIndex === totalPages

  return (
    <div
      className={`invoice-page relative bg-white text-[#292424] font-['Poppins',sans-serif] w-full max-w-[210mm] min-h-[297mm] max-h-[297mm] h-[297mm] mx-auto p-0 flex flex-col justify-between shadow-lg print:shadow-none print:w-full print:max-w-none print:h-[297mm] print:min-h-[297mm] print:max-h-[297mm] text-[11.5px] leading-relaxed overflow-hidden box-border mb-8 print:mb-0 ${className}`}
      style={{
        pageBreakAfter: !isLastPage ? 'always' : 'avoid',
        breakAfter: !isLastPage ? 'page' : 'avoid',
        boxSizing: 'border-box'
      }}
    >
      {/* Background Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          zIndex: 0,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={watermarkImg}
          alt="Favicon Watermark"
          className="w-[280px] max-w-full object-contain filter grayscale"
          style={{ width: '280px', maxWidth: '280px', height: 'auto', objectFit: 'contain', filter: 'grayscale(100%)' }}
        />
      </div>

      {/* Main Page Children (Content + Footer Ribbon) */}
      {children}
    </div>
  )
}
