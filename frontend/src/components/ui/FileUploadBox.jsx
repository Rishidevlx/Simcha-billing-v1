import React from 'react'
import { UploadCloud, Image as ImageIcon, Eye, Trash2 } from '../common/icons'

export default function FileUploadBox({
  label,
  value,
  onUpload,
  onRemove,
  onPreview,
  disabled = false,
  isUploading = false,
  accept = 'image/*',
  helpText = 'Supports JPG, PNG, WEBP (Max 2MB)',
  previewHeight = 'h-24',
  className = ''
}) {
  const fileInputRef = React.useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      onUpload(file)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <div className="border border-dashed border-gray-300 dark:border-slate-700 p-4 bg-gray-50/50 dark:bg-slate-950/50 hover:bg-gray-50 dark:hover:bg-slate-950 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
        {value ? (
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className={`relative ${previewHeight} w-32 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 flex items-center justify-center overflow-hidden shrink-0`}>
              <img
                src={value}
                alt="Uploaded preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ImageIcon size={14} />
                <span>Uploaded &amp; Attached</span>
              </span>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">
                Click preview or replace with a new file.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-400 dark:text-slate-500">
            <div className="p-2.5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 shrink-0">
              <UploadCloud size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                No file attached currently
              </p>
              <p className="text-[10.5px] text-gray-400 dark:text-slate-500">{helpText}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {value && onPreview && (
            <button
              type="button"
              onClick={() => onPreview(value)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-blue-200 dark:border-blue-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Preview Image"
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>
          )}

          {!disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <UploadCloud size={14} />
              <span>{isUploading ? 'Uploading...' : value ? 'Replace' : 'Upload'}</span>
            </button>
          )}

          {value && !disabled && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Remove Attached File"
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
