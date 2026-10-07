import React from 'react'
import { Landmark, Edit2, Save, X, UploadCloud, ImageIcon, ZoomIn, Trash2, Info, CheckCircle2, Lock } from '../../common/icons'
import { SettingSectionCard } from '../../ui'

export default function BankAccountSection({
  canEdit,
  isEditing,
  onToggleEdit,
  onSave,
  onCancel,
  isSaving,
  bankName,
  setBankName,
  accountName,
  setAccountName,
  accountNo,
  setAccountNo,
  ifscCode,
  setIfscCode,
  branch,
  setBranch,
  bankImageUrl,
  setBankImageUrl,
  isUploadingBankImg,
  handleUploadBankImage,
  setPreviewZoomImg
}) {
  return (
    <SettingSectionCard
      icon={Landmark}
      title="Bank Account Information"
      subtitle="Bank details and UPI QR code printed at the bottom invoices."
      actions={
        canEdit && (
          !isEditing ? (
            <button
              type="button"
              onClick={() => onToggleEdit(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit2 size={13} />
              <span>Edit Bank Details</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-none cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] disabled:opacity-50 rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save size={13} />
                <span>{isSaving ? 'Saving...' : 'Save Bank Details'}</span>
              </button>
            </div>
          )
        )
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Bank Name</label>
            <input
              type="text"
              disabled={!isEditing}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                isEditing
                  ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                  : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
              }`}
              placeholder="Enter bank name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Beneficiary / Account Name</label>
            <input
              type="text"
              disabled={!isEditing}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                isEditing
                  ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                  : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
              }`}
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Account Number</label>
            <input
              type="text"
              disabled={!isEditing}
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm font-semibold font-mono rounded-none transition-all ${
                isEditing
                  ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                  : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
              }`}
              placeholder="Enter account number"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">IFSC Code</label>
            <input
              type="text"
              disabled={!isEditing}
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              className={`w-full px-3.5 py-2.5 text-sm font-semibold uppercase font-mono rounded-none transition-all ${
                isEditing
                  ? 'text-[#043486] dark:text-blue-400 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                  : 'text-[#043486]/70 dark:text-blue-400/70 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
              }`}
              placeholder="Enter IFSC code"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Branch Location</label>
            <input
              type="text"
              disabled={!isEditing}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                isEditing
                  ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                  : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
              }`}
              placeholder="Enter branch name"
            />
          </div>
        </div>

        {/* Bank UPI QR / Cheque Image Upload Option */}
        <div className="p-5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-[#043486] dark:text-blue-400" />
              <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wide">
                Bank UPI QR Code / Passbook Image
              </h3>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wider">
              Cloud Media Upload
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-7">
              {isEditing ? (
                <label className={`border-2 border-dashed p-4 text-center block transition-all cursor-pointer ${
                  isUploadingBankImg
                    ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 cursor-wait'
                    : 'border-gray-300 dark:border-slate-700 hover:border-[#043486] dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-900'
                }`}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={isUploadingBankImg}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadBankImage(e.target.files[0])
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    {isUploadingBankImg ? (
                      <>
                        <div className="w-7 h-7 border-2 border-[#043486] border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-[#043486] dark:text-blue-400">Uploading to Cloudinary...</p>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-400">
                          <UploadCloud size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                            {bankImageUrl ? 'Click to Replace Bank Image / QR' : 'Click to Upload Bank QR / Passbook'}
                          </p>
                          <p className="text-[10.5px] text-gray-400 mt-0.5">Supports PNG, JPG, JPEG, WebP (Max 10MB)</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              ) : (
                <div className="p-4 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2.5">
                  <Lock size={15} className="text-gray-400" />
                  <span>Click &quot;Edit Bank Details&quot; above to upload or change Bank QR code image.</span>
                </div>
              )}
            </div>

            {/* Image Preview Box */}
            <div className="md:col-span-5 flex items-center justify-center">
              {bankImageUrl ? (
                <div className="relative group bg-white dark:bg-slate-900 p-2 border border-gray-200 dark:border-slate-700 shadow-xs flex items-center gap-3 w-full">
                  <img
                    src={bankImageUrl}
                    alt="Bank QR"
                    className="w-16 h-16 object-contain border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 cursor-pointer"
                    onClick={() => setPreviewZoomImg(bankImageUrl)}
                  />
                  <div className="flex-1 min-w-0 text-left text-xs space-y-1">
                    <p className="font-bold text-gray-800 dark:text-slate-200 truncate">Bank QR Attached</p>
                    <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">Ready for Invoices</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewZoomImg(bankImageUrl)}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <ZoomIn size={11} /> View
                      </button>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setBankImageUrl('')}
                          className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-dashed border-gray-200 dark:border-slate-800 w-full text-center text-xs text-gray-400">
                  No Bank QR image uploaded yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Invoice Preview Box */}
        <div className="p-4 bg-blue-50/60 dark:bg-slate-950 border border-blue-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#043486] dark:text-blue-300 uppercase">
              <Info size={14} />
              <span>Invoice Print Preview</span>
            </div>
            {bankImageUrl && (
              <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> QR Included
              </span>
            )}
          </div>
          <div className="text-xs text-gray-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 border border-blue-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p><strong>Bank:</strong> {bankName || 'Bank Name'} ({branch || 'Branch'})</p>
              <p><strong>Beneficiary:</strong> {accountName || 'Beneficiary Name'}</p>
              <p><strong>A/C:</strong> {accountNo || 'XXXXXXXXXXXX'} | <strong>IFSC:</strong> {ifscCode || 'IFSCXXXXXX'}</p>
            </div>
            {bankImageUrl && (
              <div className="text-center shrink-0">
                <img src={bankImageUrl} alt="QR Preview" className="w-14 h-14 object-contain border border-gray-200 dark:border-slate-700 mx-auto" />
                <span className="text-[9.5px] font-sans font-bold text-gray-500 uppercase">Scan to Pay</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </SettingSectionCard>
  )
}
