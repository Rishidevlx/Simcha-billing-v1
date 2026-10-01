import React from 'react'
import { Edit2, Trash2, Eye, Printer, Mail, Download, RefreshCw } from '../common/icons'

export default function ActionButton({
  type = 'edit', // 'edit', 'delete', 'view', 'print', 'mail', 'download', 'refresh', 'custom'
  icon: CustomIcon,
  onClick,
  title,
  disabled = false,
  className = '',
  size = 15,
  ...props
}) {
  const typeConfigs = {
    edit: {
      icon: Edit2,
      defaultTitle: 'Edit',
      styles: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800'
    },
    delete: {
      icon: Trash2,
      defaultTitle: 'Delete',
      styles: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800'
    },
    view: {
      icon: Eye,
      defaultTitle: 'View Details',
      styles: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800'
    },
    print: {
      icon: Printer,
      defaultTitle: 'Print',
      styles: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
    },
    mail: {
      icon: Mail,
      defaultTitle: 'Send Email',
      styles: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
    },
    download: {
      icon: Download,
      defaultTitle: 'Download',
      styles: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
    },
    refresh: {
      icon: RefreshCw,
      defaultTitle: 'Refresh',
      styles: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    },
    custom: {
      icon: CustomIcon || Eye,
      defaultTitle: '',
      styles: 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
    }
  }

  const config = typeConfigs[type] || typeConfigs.custom
  const IconComponent = CustomIcon || config.icon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || config.defaultTitle}
      className={`p-1.5 rounded-none transition-colors duration-150 inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${config.styles} ${className}`}
      {...props}
    >
      <IconComponent size={size} className="shrink-0" />
    </button>
  )
}
