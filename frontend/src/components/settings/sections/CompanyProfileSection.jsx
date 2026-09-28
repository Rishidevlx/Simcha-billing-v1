import React from 'react'
import { Building2, Edit2, CheckCircle2, ImageIcon, ZoomIn, UploadCloud, Trash2, ShieldCheck } from 'lucide-react'
import { SettingSectionCard } from '../../ui'

export default function CompanyProfileSection({
  canEdit,
  isEditing,
  onToggleEdit,
  companyName,
  setCompanyName,
  gstin,
  setGstin,
  phone,
  setPhone,
  email,
  setEmail,
  address,
  setAddress,
  signatureUrl,
  setSignatureUrl,
  isUploadingSign,
  handleSignatureUpload,
  handleRemoveSignature,
  setPreviewZoomImg
}) {
  return (
    <SettingSectionCard
      icon={Building2}
      title="Company Profile & Billing Header"
      subtitle="Official business information that appears on tax invoices, delivery challans, and customer receipts."
      actions={
        canEdit && (
          !isEditing ? (
            <button
              type="button"
              onClick={() => onToggleEdit(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit2 size={13} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
              Editing Mode Active
            </span>
          )
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
            Company / Business Name *
          </label>
          <input
            type="text"
            disabled={!isEditing}
            value={companyName}
            maxLength={100}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
              isEditing
                ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
            }`}
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
            Company GSTIN Number *
          </label>
          <input
            type="text"
            disabled={!isEditing}
            value={gstin}
            maxLength={15}
            onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
            required
            className={`w-full px-3.5 py-2.5 text-sm uppercase rounded-none font-mono font-semibold transition-all ${
              isEditing
                ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
            }`}
            placeholder="Enter GSTIN number"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
            Official Phone / Mobile Number *
          </label>
          <input
            type="text"
            disabled={!isEditing}
            value={phone}
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
            className={`w-full px-3.5 py-2.5 text-sm font-medium font-mono rounded-none transition-all ${
              isEditing
                ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
            }`}
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
            Official Email Address *
          </label>
          <input
            type="email"
            disabled={!isEditing}
            value={email}
            maxLength={60}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
              isEditing
                ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
            }`}
            placeholder="Enter official email"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
            Company Full Address *
          </label>
          <textarea
            rows={2}
            disabled={!isEditing}
            value={address}
            maxLength={250}
            onChange={(e) => setAddress(e.target.value)}
            required
            className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
              isEditing
                ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
            }`}
            placeholder="Enter company address"
          />
        </div>

        {/* Authorized Company Sign Upload */}
        <div className="md:col-span-2 pt-3 border-t border-gray-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="block text-xs font-bold text-gray-800 dark:text-slate-200">
              Authorized Signatory Signature / Seal
            </label>
            {signatureUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={12} /> Signature Active
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
            {/* Signature Preview Thumbnail */}
            <div className="relative group w-36 h-18 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-2xs">
              {signatureUrl ? (
                <>
                  <img
                    src={signatureUrl}
                    alt="Authorized Signature"
                    className="max-h-full max-w-full object-contain cursor-pointer"
                    onClick={() => setPreviewZoomImg(signatureUrl)}
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewZoomImg(signatureUrl)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1"
                    title="Preview signature"
                  >
                    <ZoomIn size={14} /> View
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-center px-2">
                  <ImageIcon size={18} className="mb-1 opacity-60" />
                  <span className="text-[10px] leading-tight">No Signature</span>
                </div>
              )}
            </div>

            {/* Actions / Upload Controls */}
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow-xs ${
                    isEditing && !isUploadingSign
                      ? 'bg-[#043486] text-white hover:bg-[#0248BC] cursor-pointer'
                      : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <UploadCloud size={14} />
                  <span>{isUploadingSign ? 'Uploading...' : signatureUrl ? 'Replace Signature' : 'Upload Signature'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={!isEditing || isUploadingSign}
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </label>

                {signatureUrl && isEditing && (
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 rounded-none transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Recommended PNG / WEBP with transparent background (Max 2MB). Appears on printable invoice &amp; receipt PDFs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingSectionCard>
  )
}
