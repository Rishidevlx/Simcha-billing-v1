import React from 'react'
import { FileText, Edit2, Save, X, Trash2, Plus, Lock, RotateCcw } from '../../common/icons'
import { SettingSectionCard } from '../../ui'

export default function TermsConditionsSection({
  canEdit,
  isEditing,
  onToggleEdit,
  onSave,
  onCancel,
  isSaving,
  terms,
  handleTermChange,
  handleRemoveTerm,
  newTermInput,
  setNewTermInput,
  handleAddTerm,
  returnDays,
  setReturnDays,
  returnClause,
  setReturnClause
}) {
  return (
    <SettingSectionCard
      icon={FileText}
      title="Terms & Conditions Clauses"
      subtitle="Standard legal and return clauses printed at the bottom of customer invoices."
      badge={`${terms.length} Clauses`}
      actions={
        canEdit && (
          !isEditing ? (
            <button
              type="button"
              onClick={() => onToggleEdit(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit2 size={13} />
              <span>Edit Terms</span>
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
                <span>{isSaving ? 'Saving...' : 'Save Terms'}</span>
              </button>
            </div>
          )
        )
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          {terms.map((term, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-none bg-gray-100 dark:bg-slate-800 text-[#043486] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                {index + 1}
              </span>
              <input
                type="text"
                disabled={!isEditing}
                value={term}
                onChange={(e) => handleTermChange(index, e.target.value)}
                className={`flex-1 px-3.5 py-2 text-sm font-medium rounded-none transition-all ${
                  isEditing
                    ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                    : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                }`}
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleRemoveTerm(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition-colors cursor-pointer"
                  title="Remove clause"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new term input */}
        {isEditing ? (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newTermInput}
              onChange={(e) => setNewTermInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTerm()
                }
              }}
              placeholder="Type new terms & condition clause and press Add..."
              className="flex-1 px-3.5 py-2.5 text-sm text-[#292424] dark:text-white font-medium bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleAddTerm}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-[#043486] dark:text-blue-300 text-xs font-semibold rounded-none border border-blue-200 dark:border-blue-900 transition-colors shrink-0 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Clause</span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500 pt-1 flex items-center gap-1.5">
            <Lock size={12} />
            <span>Click &quot;Edit Terms&quot; above to add or remove invoice clauses.</span>
          </p>
        )}

        {/* Return Policy Settings Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-[#043486] dark:text-blue-400" />
            <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wide">
              Product Return &amp; Credit Note Policy
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Return Eligibility Window (Days)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                disabled={!isEditing}
                value={returnDays}
                onChange={(e) => setReturnDays(e.target.value)}
                className={`w-full px-3.5 py-2 text-sm font-bold font-mono rounded-none transition-all ${
                  isEditing
                    ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Custom Return Policy Clause (Optional)
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={returnClause}
                onChange={(e) => setReturnClause(e.target.value)}
                placeholder="Enter return policy clause..."
                className={`w-full px-3.5 py-2 text-sm font-medium rounded-none transition-all ${
                  isEditing
                    ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486]'
                    : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </SettingSectionCard>
  )
}
