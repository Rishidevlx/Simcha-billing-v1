import React from 'react'
import { Percent, Edit2 } from 'lucide-react'
import { SettingSectionCard } from '../../ui'

export default function TaxRatesSection({
  canEdit,
  isEditing,
  onToggleEdit,
  cgstRate,
  setCgstRate,
  sgstRate,
  setSgstRate,
  igstRate,
  setIgstRate
}) {
  return (
    <SettingSectionCard
      icon={Percent}
      title="Tax & GST Rate Percentages"
      subtitle="Default tax percentages applied during Inward purchases and Outward billing invoices."
      actions={
        canEdit && (
          !isEditing ? (
            <button
              type="button"
              onClick={() => onToggleEdit(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit2 size={13} />
              <span>Edit Tax Rates</span>
            </button>
          ) : (
            <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
              Editing Mode Active
            </span>
          )
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">CGST (Central Tax)</span>
            <span className="text-[10px] text-gray-500 dark:text-slate-400">Intra-State</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              disabled={!isEditing}
              value={cgstRate}
              onChange={(e) => setCgstRate(e.target.value)}
              className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                isEditing
                  ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                  : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
              }`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied when customer place of supply is within Tamil Nadu (33).</p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">SGST (State Tax)</span>
            <span className="text-[10px] text-gray-500 dark:text-slate-400">Intra-State</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              disabled={!isEditing}
              value={sgstRate}
              onChange={(e) => setSgstRate(e.target.value)}
              className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                isEditing
                  ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                  : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
              }`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied alongside CGST for within-state sales (Total {Number(cgstRate || 0) + Number(sgstRate || 0)}%).</p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">IGST (Integrated Tax)</span>
            <span className="text-[10px] text-gray-500 dark:text-slate-400">Inter-State</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              disabled={!isEditing}
              value={igstRate}
              onChange={(e) => setIgstRate(e.target.value)}
              className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                isEditing
                  ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                  : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
              }`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied automatically when customer is from outside Tamil Nadu (e.g. Kerala, Karnataka).</p>
        </div>
      </div>
    </SettingSectionCard>
  )
}
