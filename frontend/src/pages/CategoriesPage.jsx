import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  PlusCircle,
  Plus,
  Loader2
} from '../components/common/icons'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'
import { getUserPermissions } from '../utils/access'
import { Button, ActionButton, StatusToggle, StatusPill, SearchInput } from '../components/ui'

export default function CategoriesPage({ setActiveRoute }) {
  const navigate = useNavigate()
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('categories_create', 'Add') || can('categories', 'Add') || can('categories', 'Add')
  const canEdit = hasAny('categories', ['Edit']) || hasAny('categories_create', ['Edit']) || hasAny('categories', ['Edit'])
  const canDelete = hasAny('categories', ['Delete']) || hasAny('categories_create', ['Delete']) || hasAny('categories', ['Delete'])
  const canDownload = hasAny('categories', ['Download']) || hasAny('categories_create', ['Download']) || hasAny('categories', ['Download'])

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

  // Toggle Category Status
  const handleToggleStatus = async (cat) => {
    const currentStatus = cat.status || 'Active'
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    const result = await Swal.fire({
      title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} Category?`,
      text: `Are you sure you want to change status of "${cat.name}" to ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'Active' ? '#16a34a' : '#d33',
      cancelButtonColor: '#043486',
      confirmButtonText: `Yes, make ${newStatus}`
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(API_ENDPOINTS.CATEGORY_STATUS(cat.id), { method: 'PATCH' })
        const data = await res.json()
        if (data.success) {
          Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          }).fire({
            icon: 'success',
            title: `Category is now ${newStatus}`
          })
          fetchCategories()
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to update category status', confirmButtonColor: '#043486' })
        }
      } catch (err) {
        console.error(err)
        Swal.fire({ icon: 'error', title: 'Error', text: 'Network error updating category status', confirmButtonColor: '#043486' })
      }
    }
  }

  // Filter Categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
            <Layers className="text-[#043486] dark:text-blue-400" size={22} />
            <span>CATEGORIES</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Organize inventory items into structured product categories and groups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              if (setActiveRoute) setActiveRoute('add-material')
              navigate('/materials/add')
            }}
            className="text-xs font-semibold"
          >
            ADD MATERIAL
          </Button>
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
              <StatusToggle
                value={status}
                onChange={setStatus}
                name="category_status"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClear}
              >
                Clear
              </Button>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={(!editingId && !canAdd) || (editingId && !canEdit)}
                icon={editingId ? CheckCircle2 : PlusCircle}
              >
                {editingId ? 'Update' : 'Create'}
              </Button>
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

            {/* Search Input */}
            <div className="max-w-xs sm:max-w-sm w-full">
              <SearchInput
                placeholder="Search category name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
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
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className="transition-transform hover:scale-105 cursor-pointer"
                          title={`Click to ${cat.status === 'Active' ? 'Deactivate' : 'Activate'} category`}
                        >
                          <StatusPill status={cat.status} size="sm" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <ActionButton
                              type="edit"
                              onClick={() => handleEdit(cat)}
                              title="Edit Category"
                            />
                          )}

                          {canDelete && (
                            <ActionButton
                              type="delete"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              title="Delete Category"
                            />
                          )}
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

