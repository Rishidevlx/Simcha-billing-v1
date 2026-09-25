import React, { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Users,
  Download,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  List,
  User,
  Mail,
  Phone,
  Briefcase,
  ChevronDown,
  KeyRound,
  Lock,
  Shield
} from 'lucide-react'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import ListPageHeader from '../components/common/ListPageHeader'
import ListPagePagination from '../components/common/ListPagePagination'
import ListKpiCard from '../components/common/ListKpiCard'
import { getUserPermissions } from '../utils/access'

function SearchableCombobox({
  value,
  onChange,
  options = [],
  placeholder = 'Select or type...',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = React.useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const optionList = options.map((opt) =>
    typeof opt === 'string' ? opt : opt.name || opt.label || ''
  )

  const filteredOptions = optionList.filter((opt) =>
    opt.toLowerCase().includes((value || '').toLowerCase().trim())
  )

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => {
            onChange(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-3.5 pr-9 py-2.5 text-xs sm:text-sm font-medium text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors placeholder:text-gray-400"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-400 hover:text-[#043486] dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#043486] dark:text-blue-400' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800/40 animate-in fade-in-50 duration-100">
          {filteredOptions.length === 0 ? (
            <div className="px-3.5 py-3 text-xs text-center text-gray-400 dark:text-slate-500">
              No matching options
            </div>
          ) : (
            filteredOptions.map((optVal) => {
              const isSelected = value === optVal
              return (
                <div
                  key={optVal}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(optVal)
                    setIsOpen(false)
                  }}
                  className={`px-3.5 py-2.5 text-xs sm:text-[13px] font-medium flex items-center justify-between hover:bg-blue-50/70 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 font-bold'
                      : 'text-gray-700 dark:text-slate-200'
                  }`}
                >
                  <span>{optVal}</span>
                  {isSelected && <CheckCircle2 size={14} className="text-[#043486] dark:text-blue-400" />}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default function UserListPage({ setActiveRoute }) {
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('users_add', 'Add') || can('users_list', 'Add') || can('users', 'Add')
  const canEdit = hasAny('users_list', ['Edit']) || hasAny('users_add', ['Edit']) || hasAny('users', ['Edit'])
  const canDelete = hasAny('users_list', ['Delete']) || hasAny('users_add', ['Delete']) || hasAny('users', ['Delete'])
  const canDownload = hasAny('users_list', ['Download']) || hasAny('users_add', ['Download']) || hasAny('users', ['Download'])

  // Active Tab: If user has Add permission, defaults to 'add', otherwise 'list'
  const [activeTab, setActiveTab] = useState(canAdd ? 'add' : 'list')
  const [editingUserId, setEditingUserId] = useState(null)

  useEffect(() => {
    if (!canAdd && !editingUserId && activeTab === 'add') {
      setActiveTab('list')
    }
  }, [canAdd, editingUserId, activeTab])

  // Users List State
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  // Available Roles & Departments
  const [availableRoles, setAvailableRoles] = useState([])
  const [availableDepartments, setAvailableDepartments] = useState([])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    role: '',
    status: 'Active'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.success) {
        setUsers(data.users || [])
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to fetch users',
          confirmButtonColor: '#043486'
        })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Network error while fetching users',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles')
      const data = await res.json()
      if (data.success && data.roles) {
        setAvailableRoles(data.roles.filter(r => r.status === 'Active' || !r.status))
      } else {
        setAvailableRoles([
          { id: 1, name: 'Administrator' },
          { id: 2, name: 'Cashier' },
          { id: 3, name: 'Store Keeper' }
        ])
      }
    } catch {
      setAvailableRoles([
        { id: 1, name: 'Administrator' },
        { id: 2, name: 'Cashier' },
        { id: 3, name: 'Store Keeper' }
      ])
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments')
      const data = await res.json()
      if (data.success && data.departments) {
        setAvailableDepartments(data.departments.filter(d => d.status === 'Active'))
      }
    } catch (err) {
      console.error('Error fetching departments:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchDepartments()
  }, [])

  // Load User details for editing
  const loadUserDetails = async (id) => {
    setIsFormLoading(true)
    try {
      const res = await fetch(`/api/users/${id}`)
      const data = await res.json()
      if (data.success && data.user) {
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          designation: data.user.designation || '',
          department: data.user.department || '',
          role: data.user.role || '',
          status: data.user.status || 'Active'
        })
        setEditingUserId(id)
        setActiveTab('add')
      } else {
        Swal.fire('Error', data.message || 'Failed to fetch user', 'error')
      }
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Network error fetching user details', 'error')
    } finally {
      setIsFormLoading(false)
    }
  }

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  // Filters
  const filteredUsers = users.filter(user => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      (user.name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.role || '').toLowerCase().includes(q) ||
      (user.designation || '').toLowerCase().includes(q)
    )
  })

  // Pagination Logic
  const totalItems = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handleExportExcel = () => {
    if (users.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Empty List',
        text: 'No users available to export.',
        confirmButtonColor: '#043486'
      })
      return
    }
    const exportData = users.map((u, i) => ({
      'ID': i + 1,
      'User Name': u.name,
      'Designation': u.designation,
      'Role': u.role,
      'Status': u.status
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Users')
    XLSX.writeFile(wb, 'System_Users.xlsx')
  }

  const handleDelete = async (id, userName, role) => {
    if (role === 'Administrator' || Number(id) === 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Protected System Administrator',
        text: 'The primary Administrator account is permanently protected and cannot be deleted.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const result = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete the user "${userName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#043486',
      confirmButtonText: 'Yes, delete!'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
          setUsers(prev => prev.filter(u => u.id !== id))
          setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: `User "${userName}" has been removed.`,
            timer: 2000,
            showConfirmButton: false
          })
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'Failed to delete user',
            confirmButtonColor: '#043486'
          })
        }
      } catch (err) {
        console.error(err)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Network error while deleting user',
          confirmButtonColor: '#043486'
        })
      }
    }
  }

  const handleResendInvite = async (userId, userName, userEmail) => {
    const result = await Swal.fire({
      title: 'Resend 15-Minute Setup Link?',
      html: `<p class="text-xs text-gray-600 dark:text-slate-300">Generate a fresh 15-minute password setup link and dispatch it to <b>${userEmail}</b>?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#043486',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Send Email'
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Dispatching Setup Email...',
          text: `Sending fresh 15-minute invite to ${userEmail}`,
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        })

        const res = await fetch(`/api/users/${userId}/resend-invite`, { method: 'POST' })
        const data = await res.json()

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Link Dispatched!',
            text: data.message || `A fresh 15-minute setup link has been sent to ${userEmail}.`,
            confirmButtonColor: '#043486'
          })
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Dispatch Failed',
            text: data.message || 'Could not send setup email. Please check SMTP settings.',
            confirmButtonColor: '#043486'
          })
        }
      } catch (err) {
        console.error(err)
        Swal.fire({
          icon: 'error',
          title: 'Network Error',
          text: 'Failed to communicate with server.',
          confirmButtonColor: '#043486'
        })
      }
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedUsers.map(u => u.id))
    }
  }

  const handleClearForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: '',
      department: '',
      role: '',
      status: 'Active'
    })
    setEditingUserId(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      // Allow only numbers and maximum 10 digits
      const sanitized = value.replace(/\D/g, '').slice(0, 10)
      setFormData(prev => ({ ...prev, phone: sanitized }))
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (
      !formData.name?.trim() ||
      !formData.email?.trim() ||
      !formData.phone?.trim() ||
      !formData.designation?.trim() ||
      !formData.department?.trim() ||
      !formData.role?.trim()
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Required Fields',
        text: 'All fields (Full Name, Email, Phone Number, Designation, Department, Role) are mandatory.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const cleanPhone = (formData.phone || '').trim()
    if (!/^\d{10}$/.test(cleanPhone)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Phone Number',
        text: 'Please enter a valid 10-digit phone number.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSaving(true)
    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users'
      const method = editingUserId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editingUserId ? 'User Updated!' : 'User Created!',
          text: data.message || `User details saved successfully.`,
          timer: 2000,
          showConfirmButton: false
        })
        handleClearForm()
        setActiveTab('list')
        fetchUsers()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to save user',
          confirmButtonColor: '#043486'
        })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Network error while saving user',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-['Poppins',sans-serif]">
      {/* 1. Header with Global Actions */}
      <ListPageHeader
        title="USER MANAGEMENT"
        subtitle="Manage system operators, assign roles, and control active credentials."
        actions={
          activeTab === 'list' ? (
            <div className="flex items-center gap-2 flex-wrap">
              {canDownload && (
                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs rounded-none shadow-xs transition-all cursor-pointer"
                >
                  <Download size={15} />
                  <span>EXPORT EXCEL</span>
                </button>
              )}
              {canAdd && (
                <button
                  onClick={() => {
                    handleClearForm()
                    setActiveTab('add')
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-xs rounded-none shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>CREATE NEW USER</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setActiveTab('list')
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs rounded-none shadow-xs transition-all cursor-pointer"
            >
              <List size={15} />
              <span>VIEW USERS LIST</span>
            </button>
          )
        }
      />

      {/* 2. Top Navigation Tabs: Tab 1 = Add User, Tab 2 = Users List */}
      <div className="flex items-center border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 shadow-2xs">
        {(canAdd || editingUserId) && (
          <button
            onClick={() => {
              if (activeTab !== 'add') {
                handleClearForm()
              }
              setActiveTab('add')
            }}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            {editingUserId ? <Edit2 size={16} /> : <Plus size={16} />}
            <span>{editingUserId ? 'Edit User' : 'Add User'}</span>
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab('list')
            setEditingUserId(null)
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <Users size={16} />
          <span>Users List ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: ADD / EDIT USER FORM */}
      {activeTab === 'add' && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs max-w-4xl rounded-none">
          {isFormLoading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="animate-spin text-[#043486] dark:text-blue-400 mb-2" size={32} />
              <span className="text-xs sm:text-sm font-semibold text-gray-500">Loading user details...</span>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-[#043486] dark:text-blue-400">
                  {editingUserId ? 'Edit Operator Account' : 'Create Operator Account'}
                </h2>
                <p className="text-xs sm:text-[13px] text-gray-500 dark:text-slate-400 mt-1">
                  Configure login credentials, assign department & RBAC access roles, and set account activity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Enter full name"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="Enter email address"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Designation / Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleFormChange}
                      placeholder="Enter designation"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Assigned Department */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Assigned Department <span className="text-red-500">*</span>
                  </label>
                  <SearchableCombobox
                    value={formData.department}
                    onChange={(val) => setFormData((prev) => ({ ...prev, department: val }))}
                    options={availableDepartments}
                    placeholder="-- Select / Type Department --"
                    required
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Assigned Role <span className="text-red-500">*</span>
                  </label>
                  <SearchableCombobox
                    value={formData.role}
                    onChange={(val) => setFormData((prev) => ({ ...prev, role: val }))}
                    options={availableRoles}
                    placeholder="-- Select / Type Role --"
                    required
                  />
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Account Status <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 border rounded-none text-xs sm:text-[13px] font-semibold cursor-pointer transition-colors ${
                        formData.status === 'Active'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="user_status"
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={() => setFormData((prev) => ({ ...prev, status: 'Active' }))}
                        className="sr-only"
                      />
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          formData.status === 'Active'
                            ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900'
                            : 'bg-gray-300 dark:bg-slate-600'
                        }`}
                      />
                      Active
                    </label>

                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 border rounded-none text-xs sm:text-[13px] font-semibold cursor-pointer transition-colors ${
                        formData.status === 'Inactive'
                          ? 'border-gray-500 dark:border-slate-500 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold'
                          : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="user_status"
                        value="Inactive"
                        checked={formData.status === 'Inactive'}
                        onChange={() => setFormData((prev) => ({ ...prev, status: 'Inactive' }))}
                        className="sr-only"
                      />
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          formData.status === 'Inactive'
                            ? 'bg-gray-600 dark:bg-slate-400 ring-2 ring-gray-300 dark:ring-slate-700'
                            : 'bg-gray-300 dark:bg-slate-600'
                        }`}
                      />
                      Inactive
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 py-2.5 px-6 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-xs sm:text-sm rounded-none shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{editingUserId ? 'UPDATE USER' : 'SAVE USER'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleClearForm()
                    setActiveTab('list')
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-none border border-gray-300 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: USERS LIST */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ListKpiCard
              label="Total Users"
              value={users.length}
              icon={Users}
              variant="blueValue"
            />
            <ListKpiCard
              label="Active Accounts"
              value={users.filter(u => u.status === 'Active').length}
              icon={CheckCircle2}
              variant="emerald"
            />
            <ListKpiCard
              label="Inactive Accounts"
              value={users.filter(u => u.status === 'Inactive').length}
              icon={XCircle}
              variant="red"
            />
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-xs transition-colors">
            {/* Search Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-[350px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={17} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[300px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-16 text-gray-400 dark:text-slate-500">
                  <Loader2 className="animate-spin mb-3 text-[#043486] dark:text-blue-500" size={32} />
                  <p className="text-xs sm:text-sm font-medium">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-gray-400 dark:text-slate-500 text-center">
                  <AlertCircle size={40} className="mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No users found</p>
                  <p className="text-xs sm:text-[13px] text-gray-400 mt-1">Try adjusting your search query or add a new operator.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="p-3.5 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded-none border-gray-300 text-[#043486] focus:ring-0 cursor-pointer accent-[#043486]"
                        />
                      </th>
                      <th className="p-3.5 w-14 text-center">ID</th>
                      <th className="p-3.5">User Name</th>
                      <th className="p-3.5">Designation</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs sm:text-[13px]">
                    {paginatedUsers.map((user, idx) => {
                      const isSystemAdmin = user.role === 'Administrator' || Number(user.id) === 1

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(user.id)}
                              onChange={() => handleToggleSelect(user.id)}
                              className="w-4 h-4 rounded-none border-gray-300 text-[#043486] focus:ring-0 cursor-pointer accent-[#043486]"
                            />
                          </td>
                          <td className="p-3.5 text-center font-mono text-gray-400 dark:text-slate-500 font-medium">
                            {startIndex + idx + 1}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#043486] dark:text-blue-400 text-xs sm:text-sm">
                                {user.name}
                              </span>
                              {isSystemAdmin && (
                                <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-none">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-gray-700 dark:text-slate-300 font-medium">
                            {user.designation || '-'}
                          </td>
                          <td className="p-3.5 font-semibold text-gray-800 dark:text-slate-200">
                            {user.role}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-none ${
                              user.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800'
                            }`}>
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleResendInvite(user.id, user.name, user.email)}
                                className="p-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-[#043486] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-900/60 rounded-none transition-all cursor-pointer shadow-2xs"
                                title="Resend 15-Minute Password Setup Link"
                              >
                                <KeyRound size={13} />
                              </button>
                              {canEdit && !isSystemAdmin && (
                                <button
                                  type="button"
                                  onClick={() => loadUserDetails(user.id)}
                                  className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border border-amber-200 dark:border-amber-800 rounded-none transition-all cursor-pointer shadow-2xs"
                                  title="Edit User"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {canDelete && !isSystemAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user.id, user.name, user.role)}
                                  className="p-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-800/60 rounded-none transition-all cursor-pointer shadow-2xs"
                                  title="Delete User"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <ListPagePagination
              totalItems={totalItems}
              currentPage={safeCurrentPage}
              pageSize={pageSize}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              onItemsPerPageChange={setPageSize}
            />
          </div>
        </div>
      )}
    </div>
  )
}
