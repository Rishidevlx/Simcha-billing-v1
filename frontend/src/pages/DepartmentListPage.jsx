import React, { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Building2,
  Download,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  List,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Phone,
  Mail,
  Shield,
  Briefcase,
  Users
} from 'lucide-react'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import ListPageHeader from '../components/common/ListPageHeader'
import ListPagePagination from '../components/common/ListPagePagination'
import ListKpiCard from '../components/common/ListKpiCard'
import { getUserPermissions } from '../utils/access'
import maleAvatar from '../assets/avatar/Male avatar.webp'
import femaleAvatar from '../assets/avatar/Female Avatar.webp'
import defaultAvatar from '../assets/avatar/Deafult Pfp.webp'

export default function DepartmentListPage({ setActiveRoute }) {
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('departments_add', 'Add') || can('departments_list', 'Add') || can('departments', 'Add') || true
  const canEdit = hasAny('departments_list', ['Edit']) || hasAny('departments', ['Edit']) || true
  const canDelete = hasAny('departments_list', ['Delete']) || hasAny('departments', ['Delete']) || true
  const canDownload = hasAny('departments_list', ['Download']) || hasAny('departments', ['Download']) || true

  // Active Tab: Tab 1 = 'add' (+ ADD DEPARTMENT), Tab 2 = 'list' (DEPARTMENT LIST)
  const [activeTab, setActiveTab] = useState('add')
  const [editingDeptId, setEditingDeptId] = useState(null)
  const [expandedDeptId, setExpandedDeptId] = useState(null)

  // Departments & Users List State
  const [departments, setDepartments] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)

  const fetchDepartments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/departments')
      const data = await res.json()
      if (data.success) {
        setDepartments(data.departments || [])
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to fetch departments',
          confirmButtonColor: '#043486'
        })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Network error while fetching departments',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.success) {
        setAllUsers(data.users || [])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
  }, [])

  // Load Department details for editing
  const loadDeptDetails = async (id) => {
    setIsFormLoading(true)
    try {
      const res = await fetch(`/api/departments/${id}`)
      const data = await res.json()
      if (data.success && data.department) {
        setFormData({
          name: data.department.name || '',
          description: data.department.description || '',
          status: data.department.status || 'Active'
        })
        setEditingDeptId(id)
        setActiveTab('add')
      } else {
        Swal.fire('Error', data.message || 'Failed to fetch department', 'error')
      }
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Network error fetching department details', 'error')
    } finally {
      setIsFormLoading(false)
    }
  }

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  // Filter departments
  const filteredDepartments = departments.filter((dept) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      (dept.name || '').toLowerCase().includes(q) ||
      (dept.description || '').toLowerCase().includes(q) ||
      (dept.status || '').toLowerCase().includes(q)
    )
  })

  // Pagination Logic
  const totalItems = filteredDepartments.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedDepts = filteredDepartments.slice(startIndex, endIndex)

  const handleExportExcel = () => {
    if (departments.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Empty List',
        text: 'No departments available to export.',
        confirmButtonColor: '#043486'
      })
      return
    }
    const exportData = departments.map((d, i) => ({
      'ID': i + 1,
      'Department Name': d.name,
      'Description': d.description,
      'Assigned Users Count': allUsers.filter(u => (u.department || '').toLowerCase() === (d.name || '').toLowerCase()).length,
      'Status': d.status
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Departments')
    XLSX.writeFile(wb, 'Company_Departments.xlsx')
  }

  const handleDelete = async (id, deptName) => {
    const result = await Swal.fire({
      title: 'Delete Department?',
      text: `Are you sure you want to delete department "${deptName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#043486',
      confirmButtonText: 'Yes, delete!'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
          setDepartments((prev) => prev.filter((d) => d.id !== id))
          setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
          if (expandedDeptId === id) setExpandedDeptId(null)
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: `Department "${deptName}" has been removed.`,
            timer: 2000,
            showConfirmButton: false
          })
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'Failed to delete department',
            confirmButtonColor: '#043486'
          })
        }
      } catch (err) {
        console.error(err)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Network error while deleting department',
          confirmButtonColor: '#043486'
        })
      }
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedDepts.length && paginatedDepts.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedDepts.map((d) => d.id))
    }
  }

  const handleClearForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'Active'
    })
    setEditingDeptId(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Field',
        text: 'Department Name is mandatory.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSaving(true)
    try {
      const url = editingDeptId ? `/api/departments/${editingDeptId}` : '/api/departments'
      const method = editingDeptId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editingDeptId ? 'Department Updated!' : 'Department Created!',
          text: data.message || 'Department details saved successfully.',
          timer: 2000,
          showConfirmButton: false
        })
        handleClearForm()
        setActiveTab('list')
        fetchDepartments()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to save department',
          confirmButtonColor: '#043486'
        })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Network error while saving department',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getAvatarForUser = (user) => {
    if (user.avatar === 'female') return femaleAvatar
    if (user.avatar === 'male') return maleAvatar
    return defaultAvatar
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-['Poppins',sans-serif]">
      {/* 1. Page Header with Global Actions */}
      <ListPageHeader
        title="DEPARTMENT MANAGEMENT"
        subtitle="Organize company divisions, assign user access boundaries, and manage departmental structures."
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
                  <span>CREATE NEW DEPARTMENT</span>
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
              <span>VIEW DEPARTMENTS LIST</span>
            </button>
          )
        }
      />

      {/* 2. Top Navigation Tabs: Tab 1 = Add Department, Tab 2 = Department List */}
      <div className="flex items-center border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 shadow-2xs">
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
          {editingDeptId ? <Edit2 size={16} /> : <Plus size={16} />}
          <span>{editingDeptId ? 'Edit Department' : 'Add Department'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('list')
            setEditingDeptId(null)
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'border-[#043486] dark:border-blue-500 text-[#043486] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 size={16} />
          <span>Department List ({departments.length})</span>
        </button>
      </div>

      {/* TAB 1: ADD / EDIT DEPARTMENT FORM */}
      {activeTab === 'add' && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs max-w-3xl rounded-none">
          {isFormLoading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="animate-spin text-[#043486] dark:text-blue-400 mb-2" size={32} />
              <span className="text-xs sm:text-sm font-semibold text-gray-500">Loading department details...</span>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-[#043486] dark:text-blue-400">
                  {editingDeptId ? 'Edit Department Details' : 'Create New Department'}
                </h2>
                <p className="text-xs sm:text-[13px] text-gray-500 dark:text-slate-400 mt-1">
                  Enter department title, scope description, and current operating status.
                </p>
              </div>

              <div className="space-y-5">
                {/* Department Name */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Enter department name"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Description / Scope
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter department description"
                    className="w-full p-3.5 text-xs sm:text-sm font-medium text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] transition-colors resize-none placeholder:text-gray-400"
                  />
                </div>

                {/* Status - Category Theme Style */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 border rounded-none text-xs sm:text-[13px] font-semibold cursor-pointer transition-colors ${
                        formData.status === 'Active'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="department_status"
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
                        name="department_status"
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
                  <span>{editingDeptId ? 'UPDATE DEPARTMENT' : 'SAVE DEPARTMENT'}</span>
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

      {/* TAB 2: DEPARTMENTS LIST */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ListKpiCard
              label="Total Departments"
              value={departments.length}
              icon={Building2}
              variant="blueValue"
            />
            <ListKpiCard
              label="Active Departments"
              value={departments.filter((d) => d.status === 'Active').length}
              icon={CheckCircle2}
              variant="emerald"
            />
            <ListKpiCard
              label="Inactive Departments"
              value={departments.filter((d) => d.status === 'Inactive').length}
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
                  placeholder="Search departments..."
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
                  <p className="text-xs sm:text-sm font-medium">Loading departments...</p>
                </div>
              ) : filteredDepartments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-gray-400 dark:text-slate-500 text-center">
                  <AlertCircle size={40} className="mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No departments found</p>
                  <p className="text-xs sm:text-[13px] text-gray-400 mt-1">Try adjusting your search query or create a new department.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="p-3.5 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === paginatedDepts.length && paginatedDepts.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded-none border-gray-300 text-[#043486] focus:ring-0 cursor-pointer accent-[#043486]"
                        />
                      </th>
                      <th className="p-3.5 w-14 text-center">ID</th>
                      <th className="p-3.5">Department Name</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5 text-center">Total Users</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs sm:text-[13px]">
                    {paginatedDepts.map((dept, idx) => {
                      const deptUsers = allUsers.filter(
                        (u) => (u.department || '').toLowerCase().trim() === (dept.name || '').toLowerCase().trim()
                      )
                      const isExpanded = expandedDeptId === dept.id

                      return (
                        <React.Fragment key={dept.id}>
                          <tr
                            onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                            className={`transition-colors cursor-pointer ${
                              isExpanded
                                ? 'bg-blue-50/70 dark:bg-slate-800/70 border-l-4 border-l-[#043486]'
                                : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(dept.id)}
                                onChange={() => handleToggleSelect(dept.id)}
                                className="w-4 h-4 rounded-none border-gray-300 text-[#043486] focus:ring-0 cursor-pointer accent-[#043486]"
                              />
                            </td>
                            <td className="p-3.5 text-center font-mono text-gray-400 dark:text-slate-500 font-medium">
                              {startIndex + idx + 1}
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-[#043486] dark:text-blue-400 text-xs sm:text-sm">
                                {dept.name}
                              </span>
                            </td>
                            <td className="p-3.5 text-gray-600 dark:text-slate-400">
                              {dept.description || '-'}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-[#043486] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-none">
                                {deptUsers.length}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-none ${
                                  dept.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800'
                                }`}
                              >
                                {dept.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                {/* Category Style Edit Button */}
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => loadDeptDetails(dept.id)}
                                    className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border border-amber-200 dark:border-amber-800 rounded-none transition-all cursor-pointer shadow-2xs"
                                    title="Edit Department"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}

                                {/* Category Style Delete Button */}
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(dept.id, dept.name)}
                                    className="p-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-800/60 rounded-none transition-all cursor-pointer shadow-2xs"
                                    title="Delete Department"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}

                                {/* Arrow Button at the LAST without box/button style */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                                  className="p-1 text-gray-400 hover:text-[#043486] dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                  title={isExpanded ? 'Collapse' : 'Expand Users'}
                                >
                                  <ChevronDown
                                    size={16}
                                    className={`transform transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180 text-[#043486] dark:text-blue-400' : ''
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDED DEPARTMENT USERS DRAWER */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-y border-gray-200/80 dark:border-slate-800">
                              <td colSpan={7} className="p-6">
                                {deptUsers.length === 0 ? (
                                  <div className="py-6 text-center">
                                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                                      No users assigned to this department yet.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {deptUsers.map((user) => (
                                      <div
                                        key={user.id}
                                        className="p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3.5 hover:shadow-sm hover:border-[#043486] dark:hover:border-blue-500 transition-all"
                                      >
                                        {/* Avatar */}
                                        <img
                                          src={getAvatarForUser(user)}
                                          alt={user.name}
                                          className="w-11 h-11 rounded-full border border-gray-200 dark:border-slate-700 object-cover bg-gray-50 flex-shrink-0"
                                        />

                                        {/* User Name & Phone */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <p className="text-xs font-bold text-[#043486] dark:text-blue-400 truncate">
                                              {user.name}
                                            </p>
                                            <span
                                              className={`text-[9px] px-2 py-0.5 font-bold rounded-full ${
                                                user.status === 'Active'
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                  : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-400'
                                              }`}
                                            >
                                              {user.status || 'Active'}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-slate-300">
                                            <Phone size={11} className="text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{user.phone || 'No phone'}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
