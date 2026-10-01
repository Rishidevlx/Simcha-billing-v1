import React from 'react'

/**
 * Shimmering Pulse Base Item
 */
export function SkeletonItem({ className = '', variant = 'rect' }) {
  const baseClasses = 'bg-slate-200/80 dark:bg-slate-800 animate-pulse'
  const roundedClass = variant === 'circle' ? 'rounded-full' : 'rounded-xs'
  return <div className={`${baseClasses} ${roundedClass} ${className}`} />
}

/**
 * 1. KPI Stats Cards Grid Skeleton
 */
export function SkeletonKpiGrid({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/90 p-5 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <SkeletonItem className="h-3.5 w-24" />
            <SkeletonItem className="h-8 w-8" variant="circle" />
          </div>
          <SkeletonItem className="h-7 w-32" />
          <div className="flex items-center gap-2 pt-1">
            <SkeletonItem className="h-2.5 w-16" />
            <SkeletonItem className="h-2.5 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 2. Table & Filter Skeleton (Matches DataTable layout)
 */
export function SkeletonTable({ rows = 5, columns = 6, showFilters = true, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-4 p-5 ${className}`}>
      {/* Top Filter Bar Skeleton */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-slate-800">
          <SkeletonItem className="h-9 w-full sm:w-72" />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SkeletonItem className="h-9 w-24" />
            <SkeletonItem className="h-9 w-24" />
            <SkeletonItem className="h-9 w-10" />
          </div>
        </div>
      )}

      {/* Table Head & Row Skeletons */}
      <div className="space-y-3">
        {/* Table Header */}
        <div className="h-10 bg-slate-100 dark:bg-slate-800/80 flex items-center px-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonItem key={i} className="h-3 flex-1" />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="h-12 border-b border-gray-100 dark:border-slate-800/60 flex items-center px-4 gap-4"
          >
            {Array.from({ length: columns }).map((_, cIdx) => (
              <SkeletonItem
                key={cIdx}
                className={`h-3.5 ${
                  cIdx === 0 ? 'w-12' : cIdx === columns - 1 ? 'w-16' : 'flex-1'
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Table Pagination Skeleton */}
      <div className="flex items-center justify-between pt-2">
        <SkeletonItem className="h-3 w-28" />
        <div className="flex items-center gap-1.5">
          <SkeletonItem className="h-7 w-7" />
          <SkeletonItem className="h-7 w-7" />
          <SkeletonItem className="h-7 w-7" />
        </div>
      </div>
    </div>
  )
}

/**
 * 3. Page Header Skeleton
 */
export function SkeletonPageHeader({ className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <SkeletonItem className="h-6 w-6" variant="circle" />
          <SkeletonItem className="h-6 w-48" />
        </div>
        <SkeletonItem className="h-3.5 w-72" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonItem className="h-9 w-32" />
        <SkeletonItem className="h-9 w-36" />
      </div>
    </div>
  )
}

/**
 * 4. Master Full-Page Skeleton (Page Header + KPI Cards + Table / Card View)
 */
export default function SkeletonLoader({
  type = 'page',
  rows = 5,
  columns = 6,
  cards = 4,
  className = ''
}) {
  if (type === 'table') {
    return <SkeletonTable rows={rows} columns={columns} className={className} />
  }

  if (type === 'kpi') {
    return <SkeletonKpiGrid count={cards} className={className} />
  }

  if (type === 'form') {
    return (
      <div className={`space-y-6 font-['Poppins',sans-serif] ${className}`}>
        <SkeletonPageHeader />
        <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonItem className="h-3.5 w-24" />
                <SkeletonItem className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <SkeletonItem className="h-10 w-24" />
            <SkeletonItem className="h-10 w-32" />
          </div>
        </div>
      </div>
    )
  }

  // Default: Full Page Skeleton
  return (
    <div className={`space-y-6 font-['Poppins',sans-serif] animate-in fade-in duration-150 ${className}`}>
      <SkeletonPageHeader />
      <SkeletonKpiGrid count={cards} />
      <SkeletonTable rows={rows} columns={columns} />
    </div>
  )
}
