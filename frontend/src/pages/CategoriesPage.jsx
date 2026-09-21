import { useState, useEffect, useRef } from 'react'
import {
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  PlusCircle,
  Loader2
} from 'lucide-react'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Refs for smooth scroll & focus
  const formRef = useRef(null)
  const nameInputRef = useRef(null)

  // Form State
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Active')
  const [editingId, setEditingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Custom Toast helper
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })

  // Fetch Categories from Backend
  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(API_ENDPOINTS.CATEGORIES)
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories || [])
      } else {
        Toast.fire({
          icon: 'error',
          title: data.message || 'Failed to load categories.'
        })
      }
    } catch (err) {
      console.error(err)
      Toast.fire({
        icon: 'error',
        title: 'Server error while fetching categories.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Clear Form
  const handleClear = () => {
    setName('')
    setStatus('Active')
    setEditingId(null)
  }

  // Edit Action with Smooth Scroll & Auto-focus
  const handleEdit = (cat) => {
    setEditingId(cat.id)
    setName(cat.name)
    setStatus(cat.status)

    // Smoothly scroll to the form and focus input
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      nameInputRef.current?.focus()
    }, 50)
  }

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter a category name.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingId ? API_ENDPOINTS.CATEGORY_BY_ID(editingId) : API_ENDPOINTS.CATEGORIES
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), status })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Operation failed.')
      }

      // SweetAlert Success Popup
      Swal.fire({
        icon: 'success',
        title: editingId ? 'Updated!' : 'Created!',
        text: data.message || 'Category saved successfully.',
        timer: 2000,
        showConfirmButton: false
      })

      handleClear()
      fetchCategories()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to save category.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // SweetAlert Delete Confirmation & Action
  const handleDelete = async (id, catName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete category "${catName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#043486',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id), { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete category.')
      }


      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: `Category "${catName}" deleted successfully`
      })

      if (editingId === id) {
        handleClear()
      }
      fetchCategories()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Unable to delete category.',
        confirmButtonColor: '#043486'
      })
    }
  }

  // Filter Categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase">
            CATEGORIES
          </h1>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 gap-1.5 font-medium">
          <span className="hover:text-gray-700 dark:hover:text-slate-200">Home</span>
          <span>›</span>
          <span className="text-[#043486] dark:text-blue-400 font-semibold">Categories</span>
        </div>
      </div>

      {/* Main 2-Column Boxy Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Form Card (Boxy Shape) */}
        <div ref={formRef} className="lg:col-span-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs rounded-sm transition-colors">
          {/* Card Header */}
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/60 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wide">
              {editingId ? 'Edit Category' : 'Category Information'}
            </h2>
            {editingId && (
              <span className="text-[11px] px-2 py-0.5 rounded-sm bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300/40">
                Editing #{editingId}
              </span>
            )}
          </div>

          {/* Card Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Category Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#043486] dark:focus:ring-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Status Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center gap-2 p-2.5 border rounded-sm text-xs font-semibold cursor-pointer transition-colors ${
                    status === 'Active'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="category_status"
                    value="Active"
                    checked={status === 'Active'}
                    onChange={() => setStatus('Active')}
                    className="sr-only"
                  />
                  <span className={`w-2.5 h-2.5 rounded-full ${status === 'Active' ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'bg-gray-300 dark:bg-slate-600'}`} />
                  Active
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-2.5 border rounded-sm text-xs font-semibold cursor-pointer transition-colors ${
                    status === 'Inactive'
                      ? 'border-gray-500 dark:border-slate-500 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="category_status"
                    value="Inactive"
                    checked={status === 'Inactive'}
                    onChange={() => setStatus('Inactive')}
                    className="sr-only"
                  />
                  <span className={`w-2.5 h-2.5 rounded-full ${status === 'Inactive' ? 'bg-gray-600 dark:bg-slate-400 ring-2 ring-gray-300 dark:ring-slate-700' : 'bg-gray-300 dark:bg-slate-600'}`} />
                  Inactive
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-sm hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 border border-[#043486] dark:border-blue-600 rounded-sm shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : editingId ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Update</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={14} />
                    <span>Create</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Category List (Boxy Shape) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs rounded-sm transition-colors">
          
          {/* Card Header & Increased Search Bar */}
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wide">
                Category List
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-950 text-[#043486] dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/50">
                {categories.length}
              </span>
            </div>

            {/* Increased Size & Padded Search Input */}
            <div className="relative max-w-xs sm:max-w-sm w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search category name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#043486] dark:focus:ring-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100/70 dark:bg-slate-800/90 border-b border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4 w-16">S.No</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4 text-center w-28">Status</th>
                  <th className="py-3 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {/* Skeleton Loading State (Boxy Shimmer Rows) */}
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="w-5 h-3 bg-gray-200 dark:bg-slate-700/80 rounded-xs" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-48" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-5 bg-gray-200 dark:bg-slate-700/80 rounded-xs w-16 mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700/80 rounded-xs" />
                        <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700/80 rounded-xs" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400 dark:text-slate-500">
                    <Layers size={26} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-gray-500 dark:text-slate-400">No categories found.</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">Add a category from the left form.</p>
                  </td>
                </tr>
              ) : (
                  filteredCategories.map((cat, idx) => (
                    <tr
                      key={cat.id}
                      className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                        editingId === cat.id ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-gray-500 dark:text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#292424] dark:text-white">
                        {cat.name}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                            cat.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-700'
                          }`}
                        >
                          {cat.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(cat)}
                            title="Edit Category"
                            className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border border-amber-200 dark:border-amber-800 rounded-none transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            title="Delete Category"
                            className="p-1.5 rounded-sm text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-800/60 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  )
}

