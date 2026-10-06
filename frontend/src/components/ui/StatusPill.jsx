import React from 'react'

export default function StatusPill({
  status = 'Active',
  className = '',
  size = 'md' // 'sm', 'md'
}) {
  const normalized = String(status || '').toLowerCase().trim()

  // Velzon Label Flag Badge Solid Background Colors
  const statusStyles = {
    // Success / Active / Healthy / Passed
    active: 'bg-[#0ab39c] text-white',
    paid: 'bg-[#0ab39c] text-white',
    completed: 'bg-[#0ab39c] text-white',
    delivered: 'bg-[#0ab39c] text-white',
    healthy: 'bg-[#0ab39c] text-white',
    'stock healthy': 'bg-[#0ab39c] text-white',
    passed: 'bg-[#0ab39c] text-white',
    'qc passed': 'bg-[#0ab39c] text-white',
    adjusted: 'bg-[#0ab39c] text-white',
    approved: 'bg-[#0ab39c] text-white',
    converted: 'bg-[#0ab39c] text-white',
    'converted to bill': 'bg-[#0ab39c] text-white',
    
    // Warning / Pending / Low Stock / Partial
    pending: 'bg-[#f7b84b] text-white',
    'pending qc': 'bg-[#f7b84b] text-white',
    'qc pending': 'bg-[#f7b84b] text-white',
    'low stock': 'bg-[#f7b84b] text-white',
    partial: 'bg-[#f7b84b] text-white',
    
    // Info / Blue / Purple / Replaced / Credit Note / Numbering Modules
    'in progress': 'bg-[#299cdb] text-white',
    processing: 'bg-[#299cdb] text-white',
    replaced: 'bg-[#299cdb] text-white',
    issued: 'bg-[#299cdb] text-white',
    'sales quotation': 'bg-[#299cdb] text-white',
    'outward sales': 'bg-[#3577f1] text-white',
    'service estimation': 'bg-[#6559cc] text-white',
    'service ticket': 'bg-[#6559cc] text-white',
    'sales receipt': 'bg-[#0ab39c] text-white',
    'sales payment receipt': 'bg-[#0ab39c] text-white',
    'service receipt': 'bg-[#0ab39c] text-white',
    'against invoice': 'bg-[#f7b84b] text-white',
    'financial credit': 'bg-[#6559cc] text-white',
    'credit note': 'bg-[#6559cc] text-white',
    'credit note issued': 'bg-[#6559cc] text-white',
    refunded: 'bg-[#6559cc] text-white',
    refund: 'bg-[#6559cc] text-white',
    
    // Draft / Neutral
    draft: 'bg-[#3577f1] text-white',
    
    // Danger / Inactive / Out of Stock / Rejected / Failed
    inactive: 'bg-[#f06548] text-white',
    cancelled: 'bg-[#f06548] text-white',
    cancel: 'bg-[#f06548] text-white',
    rejected: 'bg-[#f06548] text-white',
    'out of stock': 'bg-[#f06548] text-white',
    'qc failed': 'bg-[#f06548] text-white',
    failed: 'bg-[#f06548] text-white',
    defective: 'bg-[#f06548] text-white',
    overdue: 'bg-[#f06548] text-white',
    deleted: 'bg-[#f06548] text-white'
  }

  const currentStyle = statusStyles[normalized] || 'bg-[#212529] text-white'

  const sizeStyles = {
    sm: 'pl-3 pr-2 py-0.5 text-[9.5px]',
    md: 'pl-3.5 pr-2.5 py-0.5 text-[10.5px]'
  }

  return (
    <span
      style={{
        clipPath: 'polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 50%)'
      }}
      className={`inline-flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider ${currentStyle} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
      <span>{status}</span>
    </span>
  )
}
