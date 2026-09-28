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
import { API_ENDPOINTS } from '../config/api'
import { Button, ActionButton, StatusToggle, StatusPill, SearchInput, TabNav, TabButton } from '../components/ui'
import maleAvatar from '../assets/avatar/Male avatar.webp'
import femaleAvatar from '../assets/avatar/Female Avatar.webp'
import defaultAvatar from '../assets/avatar/Deafult Pfp.webp'

export default function DepartmentListPage({ setActiveRoute }) {
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('departments_add', 'Add') || can('departments_list', 'Add') || can('departments', 'Add')
  const canEdit = hasAny('departments_list', ['Edit']) || hasAny('departments_add', ['Edit']) || hasAny('departments', ['Edit'])
  const canDelete = hasAny('departments_list', ['Delete']) || hasAny('departments_add', ['Delete']) || hasAny('departments', ['Delete'])
  const canDownload = hasAny('departments_list', ['Download']) || hasAny('departments_add', ['Download']) || hasAny('departments', ['Download'])

  // Active Tab: If user has Add permission, defaults to 'add', otherwise 'list'
  const [activeTab, setActiveTab] = useState(canAdd ? 'add' : 'list')
  const [editingDeptId, setEditingDeptId] = useState(null)
  const [expandedDeptId, setExpandedDeptId] = useState(null)

  useEffect(() => {
    if (!canAdd && !editingDeptId && activeTab === 'add') {
      setActiveTab('list')
    }
  }, [canAdd, editingDeptId, activeTab])

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
      const res = await fetch(API_ENDPOINTS.DEPARTMENTS)
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
      const res = await fetch(API_ENDPOINTS.USERS)
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
      const res = await fetch(API_ENDPOINTS.DEPARTMENT_BY_ID(id))
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
        const res = await fetch(API_ENDPOINTS.DEPARTMENT_BY_ID(id), { method: 'DELETE' })
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
      const url = editingDeptId ? API_ENDPOINTS.DEPARTMENT_BY_ID(editingDeptId) : API_ENDPOINTS.DEPARTMENTS
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
                <Button variant="secondary" icon={Download} onClick={handleExportExcel}>
                  EXPORT EXCEL
                </Button>
              )}
              {canAdd && (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    handleClearForm()
                    setActiveTab('add')
                  }}
                >
                  CREATE NEW DEPARTMENT
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              icon={List}
              onClick={() => {
                setActiveTab('list')
              }}
            >
              VIEW DEPARTMENTS LIST
            </Button>
          )
        }
      />

      {/* 2. Top Navigation Tabs */}
      <TabNav>
        {(canAdd || editingDeptId) && (
          <TabButton
            active={activeTab === 'add'}
            icon={editingDeptId ? Edit2 : Plus}
            onClick={() => {
              if (activeTab !== 'add') {
                handleClearForm()
              }
              setActiveTab('add')
            }}
          >
            {editingDeptId ? 'Edit Department' : 'Add Department'}
          </TabButton>
        )}

        <TabButton
          active={activeTab === 'list'}
          icon={Building2}
          badge={departments.length}
          onClick={() => {
            setActiveTab('list')
            setEditingDeptId(null)
          }}
        >
          Department List
        </TabButton>
      </TabNav>

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

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#292424] dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <StatusToggle
                    value={formData.status}
                    onChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
                <Button type="submit" variant="primary" isLoading={isSaving} icon={Save}>
                  {editingDeptId ? 'UPDATE DEPARTMENT' : 'SAVE DEPARTMENT'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  icon={RotateCcw}
                  onClick={() => {
                    handleClearForm()
                    setActiveTab('list')
                  }}
                >
                  Cancel
                </Button>
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
              <SearchInput
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                className="w-full sm:w-[350px]"
              />
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
                              <StatusPill status={dept.status || 'Active'} />
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                {canEdit && (
                                  <ActionButton
                                    type="edit"
                                    onClick={() => loadDeptDetails(dept.id)}
                                    title="Edit Department"
                                  />
                                )}

                                {canDelete && (
                                  <ActionButton
                                    type="delete"
                                    onClick={() => handleDelete(dept.id, dept.name)}
                                    title="Delete Department"
                                  />
                                )}

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
