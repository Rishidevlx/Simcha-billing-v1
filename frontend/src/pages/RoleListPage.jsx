import React, { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Download,
  Save,
  RotateCcw,
  List,
  CheckCircle2,
  XCircle,
  Lock,
  Shield,
  ChevronDown,
  Phone
} from '../components/common/icons'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import ListPageHeader from '../components/common/ListPageHeader'
import ListPagePagination from '../components/common/ListPagePagination'
import ListKpiCard from '../components/common/ListKpiCard'
import { getUserPermissions } from '../utils/access'
import { API_ENDPOINTS } from '../config/api'
import { Button, ActionButton, StatusToggle, StatusPill, SearchInput, TabNav, TabButton, ToggleSwitch, Checkbox } from '../components/ui'
import maleAvatar from '../assets/avatar/Male avatar.webp'
import femaleAvatar from '../assets/avatar/Female Avatar.webp'
import defaultAvatar from '../assets/avatar/Deafult Pfp.webp'

const PERMISSIONS_DATA = [
  {
    category: 'Sidebar Menus',
    modules: [
      {
        id: 'menu_dashboard',
        name: 'Dashboard',
        subMenus: [{ id: 'dashboard', name: 'Dashboard', actions: ['View'] }]
      },
      {
        id: 'menu_bills',
        name: 'Bills',
        subMenus: [
          { id: 'inward', name: 'Inward', actions: ['Add', 'View', 'Edit', 'Delete'] },
          { id: 'inward_list', name: 'Inward List', actions: ['View', 'Edit', 'Delete', 'Download'] },
          { id: 'quotations', name: 'Quotations', actions: ['Add', 'View', 'Edit', 'Delete'] },
          { id: 'quotations_list', name: 'Quotations List', actions: ['View', 'Edit', 'Delete', 'Download'] },
          { id: 'outward', name: 'Outward', actions: ['Add', 'View', 'Edit', 'Delete'] },
          { id: 'outward_list', name: 'Outward List', actions: ['View', 'Edit', 'Delete', 'Download'] }
        ]
      },
      {
        id: 'menu_services',
        name: 'Services',
        subMenus: [
          { id: 'services_new', name: 'New Request', actions: ['Add', 'View', 'Edit', 'Delete'] },
          { id: 'services_list', name: 'Service List', actions: ['View', 'Edit', 'Delete', 'Download'] }
        ]
      },
      {
        id: 'menu_categories',
        name: 'Categories',
        subMenus: [{ id: 'categories_create', name: 'Create Category', actions: ['Add', 'View', 'Edit', 'Delete'] }]
      },
      {
        id: 'menu_materials',
        name: 'Materials',
        subMenus: [
          { id: 'materials_add', name: 'Add Material', actions: ['Add', 'View', 'Edit'] },
          { id: 'materials_list', name: 'All Materials', actions: ['View', 'Edit', 'Delete', 'Download'] }
        ]
      },
      {
        id: 'menu_inventory',
        name: 'Stock & Inventory',
        subMenus: [
          { id: 'inventory_main', name: 'Inventory', actions: ['View'] },
          { id: 'inventory_returns', name: 'Returns & Adjustments', actions: ['View'] }
        ]
      },
      {
        id: 'menu_roles',
        name: 'Roles & Access',
        subMenus: [
          { id: 'departments_list', name: 'Departments', actions: ['Add', 'View', 'Edit', 'Delete', 'Download'] },
          { id: 'roles_list', name: 'Roles', actions: ['Add', 'View', 'Edit', 'Delete', 'Download'] },
          { id: 'users_list', name: 'Users', actions: ['Add', 'View', 'Edit', 'Delete', 'Download'] }
        ]
      },
      {
        id: 'menu_settings',
        name: 'Settings',
        subMenus: [
          { id: 'settings_system', name: 'System Settings', actions: ['View', 'Edit'] },
          { id: 'settings_config', name: 'Configurations Settings', actions: ['View', 'Edit'] }
        ]
      }
    ]
  },
  {
    category: 'Inventory Page Tabs',
    modules: [
      {
        id: 'tabs_inventory',
        name: 'Inventory Tabs',
        subMenus: [
          { id: 'tab_overview', name: 'Stock Overview', actions: ['View', 'Edit', 'Download'] },
          { id: 'tab_reorder', name: 'Low Stock / Reorder', actions: ['View', 'Edit', 'Download'] },
          { id: 'tab_scrap', name: 'Scrap / Defective', actions: ['View', 'Download'] }
        ]
      },
      {
        id: 'tabs_returns',
        name: 'Returns & Adjustments Tabs',
        subMenus: [
          { id: 'tab_entry', name: 'Return Entry', actions: ['Add', 'View'] },
          { id: 'tab_pending', name: 'Pending QC', actions: ['View', 'Edit'] },
          { id: 'tab_completed', name: 'Completed & Resolved', actions: ['View', 'Download'] },
          { id: 'tab_defective', name: 'Defective & QC Failed', actions: ['View'] },
          { id: 'tab_credit', name: 'Credit Notes', actions: ['View'] }
        ]
      }
    ]
  }
]

const ALL_ACTIONS = ['Add', 'View', 'Edit', 'Delete', 'Download']

export default function RoleListPage({ setActiveRoute }) {
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('roles_add', 'Add') || can('roles_list', 'Add') || can('roles', 'Add')
  const canEdit = hasAny('roles_list', ['Edit']) || hasAny('roles_add', ['Edit']) || hasAny('roles', ['Edit'])
  const canDelete = hasAny('roles_list', ['Delete']) || hasAny('roles_add', ['Delete']) || hasAny('roles', ['Delete'])
  const canDownload = hasAny('roles_list', ['Download']) || hasAny('roles_add', ['Download']) || hasAny('roles', ['Download'])

  // Active Tab: If user has Add permission, defaults to 'add', otherwise 'list'
  const [activeTab, setActiveTab] = useState(canAdd ? 'add' : 'list')
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [expandedRoleId, setExpandedRoleId] = useState(null)

  useEffect(() => {
    if (!canAdd && !editingRoleId && activeTab === 'add') {
      setActiveTab('list')
    }
  }, [canAdd, editingRoleId, activeTab])

  // Roles & Users List State
  const [roles, setRoles] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Form State for Add / Edit
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [roleStatus, setRoleStatus] = useState('Active')
  const [permissions, setPermissions] = useState({})
  const [adminAccess, setAdminAccess] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)

  const isEditingAdmin = roles.find(r => r.id === editingRoleId)?.name === 'Administrator' || roleName === 'Administrator'

  const fetchRoles = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(API_ENDPOINTS.ROLES)
      const data = await res.json()
      if (data.success && data.roles) {
        setRoles(data.roles)
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to fetch roles', confirmButtonColor: '#043486' })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Error', text: 'Network error while fetching roles', confirmButtonColor: '#043486' })
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
    fetchRoles()
    fetchUsers()
  }, [])

  const getAvatarForUser = (user) => {
    if (user.avatar === 'female') return femaleAvatar
    if (user.avatar === 'male') return maleAvatar
    return defaultAvatar
  }

  // Fetch role details for editing
  const loadRoleDetails = async (id) => {
    setIsFormLoading(true)
    try {
      const res = await fetch(API_ENDPOINTS.ROLE_BY_ID(id))
      const data = await res.json()
      if (data.success && data.role) {
        setRoleName(data.role.name || '')
        setDescription(data.role.description || '')
        setRoleStatus(data.role.status || 'Active')
        setPermissions(data.role.permissions || {})
        setAdminAccess(data.role.admin_access || [])
        setEditingRoleId(id)
        setActiveTab('add')
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to load role details', confirmButtonColor: '#043486' })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Error', text: 'Network error loading role', confirmButtonColor: '#043486' })
    } finally {
      setIsFormLoading(false)
    }
  }

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  // Filters
  const filteredRoles = roles.filter(role => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      (role.name || '').toLowerCase().includes(q) ||
      (role.description || '').toLowerCase().includes(q) ||
      (role.status || '').toLowerCase().includes(q)
    )
  })

  // Pagination Logic
  const totalItems = filteredRoles.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex)

  const handleExportExcel = () => {
    if (roles.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Empty List',
        text: 'No roles available to export.',
        confirmButtonColor: '#043486'
      })
      return
    }
    const exportData = roles.map((r, i) => ({
      'ID': i + 1,
      'Role Name': r.name,
      'Description': r.description || '',
      'Assigned Users Count': allUsers.filter(u => (u.role || '').toLowerCase().trim() === (r.name || '').toLowerCase().trim()).length,
      'Status': r.status || 'Active'
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Roles')
    XLSX.writeFile(wb, 'Roles_List.xlsx')
  }

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (role) => {
    if (role.name === 'Administrator') {
      Swal.fire({
        icon: 'warning',
        title: 'Protected System Role',
        text: 'The Administrator role is permanently protected and cannot be deactivated.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const newStatus = role.status === 'Active' ? 'Inactive' : 'Active'
    const result = await Swal.fire({
      title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} Role?`,
      text: `Are you sure you want to change status of "${role.name}" to ${newStatus}? Users assigned to inactive roles will not be able to log in.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'Active' ? '#16a34a' : '#d33',
      cancelButtonColor: '#043486',
      confirmButtonText: `Yes, make ${newStatus}`
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(API_ENDPOINTS.ROLE_STATUS(role.id), { method: 'PATCH' })
        const data = await res.json()
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Status Updated!',
            text: `Role is now ${newStatus}.`,
            timer: 1500,
            showConfirmButton: false
          })
          fetchRoles()
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to update status', confirmButtonColor: '#043486' })
        }
      } catch (err) {
        console.error(err)
        Swal.fire({ icon: 'error', title: 'Error', text: 'Network error updating role status', confirmButtonColor: '#043486' })
      }
    }
  }

  const handleDelete = async (id, name) => {
    if (name === 'Administrator') {
      Swal.fire({
        icon: 'warning',
        title: 'Protected System Role',
        text: 'The Administrator role is permanently protected and cannot be deleted.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const result = await Swal.fire({
      title: 'Delete Role?',
      text: `Are you sure you want to delete the role "${name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#043486',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(API_ENDPOINTS.ROLE_BY_ID(id), { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Role deleted successfully.', timer: 1500, showConfirmButton: false })
          fetchRoles()
        } else {
          Swal.fire({ icon: 'error', title: 'Cannot Delete', text: data.message || 'Failed to delete role', confirmButtonColor: '#043486' })
        }
      } catch (err) {
        console.error(err)
        Swal.fire({ icon: 'error', title: 'Error', text: 'Network error while deleting role', confirmButtonColor: '#043486' })
      }
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedRoles.length && paginatedRoles.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedRoles.map(r => r.id))
    }
  }

  // Permission Checkbox Toggle
  const handleTogglePerm = (subId, action) => {
    if (isEditingAdmin) return // Admin perms locked
    setPermissions(prev => {
      const currentSubPerms = prev[subId] || []
      const hasAction = currentSubPerms.includes(action)
      let newSubPerms
      if (hasAction) {
        newSubPerms = currentSubPerms.filter(a => a !== action)
      } else {
        newSubPerms = [...currentSubPerms, action]
      }
      return {
        ...prev,
        [subId]: newSubPerms
      }
    })
  }

  const handleClearForm = () => {
    setRoleName('')
    setDescription('')
    setRoleStatus('Active')
    setPermissions({})
    setAdminAccess([])
    setEditingRoleId(null)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!roleName || !roleName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Role Name Required', text: 'Please enter a role name.', confirmButtonColor: '#043486' })
      return
    }

    setIsSaving(true)
    try {
      const url = editingRoleId ? API_ENDPOINTS.ROLE_BY_ID(editingRoleId) : API_ENDPOINTS.ROLES
      const method = editingRoleId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: isEditingAdmin ? 'Administrator' : roleName.trim(),
          description: description.trim(),
          status: isEditingAdmin ? 'Active' : roleStatus,
          permissions: isEditingAdmin ? {} : permissions,
          admin_access: isEditingAdmin ? ['Full Admin Access'] : adminAccess
        })
      })
      const data = await res.json()

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editingRoleId ? 'Role Updated!' : 'Role Created!',
          text: 'Role details saved successfully.',
          timer: 2000,
          showConfirmButton: false
        })
        handleClearForm()
        setActiveTab('list')
        fetchRoles()
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to save role', confirmButtonColor: '#043486' })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Error', text: 'Network error while saving role', confirmButtonColor: '#043486' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 font-['Poppins',sans-serif]">
      {/* Top Header */}
      <ListPageHeader
        icon={ShieldCheck}
        title="ROLES & PERMISSIONS"
        subtitle="Manage organizational roles, access levels, and module permissions."
        actions={
          <div className="flex items-center gap-2">
            {canDownload && activeTab === 'list' && (
              <Button
                variant="export"
                icon={Download}
                onClick={handleExportExcel}
              >
                Export Excel
              </Button>
            )}

            {(canAdd || (editingRoleId && activeTab === 'add')) && (
              <Button
                variant={activeTab === 'add' ? 'list' : 'primary'}
                icon={activeTab === 'add' ? List : Plus}
                onClick={() => {
                  if (activeTab === 'add' && editingRoleId) {
                    handleClearForm()
                  }
                  setActiveTab(activeTab === 'add' ? 'list' : 'add')
                }}
              >
                {activeTab === 'add' ? 'View Role List' : 'Add Role'}
              </Button>
            )}
          </div>
        }
      />

      {/* Navigation Tabs */}
      <TabNav>
        {(canAdd || editingRoleId) && (
          <TabButton
            active={activeTab === 'add'}
            icon={Plus}
            label={editingRoleId ? 'Edit Role' : 'Add Role'}
            onClick={() => {
              if (editingRoleId) handleClearForm()
              setActiveTab('add')
            }}
          />
        )}
        <TabButton
          active={activeTab === 'list'}
          icon={ShieldCheck}
          label={`Role List (${roles.length})`}
          onClick={() => setActiveTab('list')}
        />
      </TabNav>

      {/* TAB 1: ADD / EDIT ROLE */}
      {activeTab === 'add' && (
        <form onSubmit={handleFormSubmit}>
          {isFormLoading ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs">
              <Loader2 className="animate-spin mb-3 text-[#043486] dark:text-blue-500" size={32} />
              <p className="text-xs sm:text-sm font-medium">Loading role details...</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* Left Side: Permissions Matrix */}
              <div className="w-full lg:w-2/3 space-y-6">
                
                {/* Admin Role Special Notice */}
                {isEditingAdmin && (
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/80 rounded-none flex items-center gap-2.5 text-xs text-[#043486] dark:text-blue-300 font-semibold">
                    <Shield size={18} className="shrink-0 text-[#043486] dark:text-blue-400" />
                    <span>Administrator is the protected system root role with permanent full access across all modules.</span>
                  </div>
                )}

                {PERMISSIONS_DATA.map((catGroup, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 shadow-xs rounded-none space-y-4"
                  >
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#043486] dark:text-blue-400 border-b border-gray-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                      <span>{catGroup.category}</span>
                    </h2>

                    <div className="space-y-4">
                      {catGroup.modules.map(module => (
                        <div key={module.id} className="space-y-2">
                          <div className="overflow-x-auto border border-gray-200 dark:border-slate-800">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                              <thead>
                                <tr className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 uppercase tracking-wider">
                                  <th className="p-2.5 w-1/3 text-xs sm:text-[13px] font-semibold text-[#043486] dark:text-blue-400 uppercase tracking-wider">
                                    Type
                                  </th>
                                  {ALL_ACTIONS.map(action => (
                                    <th key={action} className="p-2.5 text-center w-20 text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                                      {action}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs">
                                {module.subMenus.map(subMenu => {
                                  const subPerms = permissions[subMenu.id] || []
                                  return (
                                    <tr key={subMenu.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/30">
                                      <td className="p-2.5 font-medium text-xs sm:text-[13px] text-gray-700 dark:text-slate-200">
                                        {subMenu.name}
                                      </td>
                                      {ALL_ACTIONS.map(action => {
                                        const isAvailable = subMenu.actions.includes(action)
                                        const isChecked = isEditingAdmin ? true : subPerms.includes(action)

                                        return (
                                          <td key={action} className="p-2 text-center">
                                            {isAvailable ? (
                                              <ToggleSwitch
                                                size="sm"
                                                checked={isChecked}
                                                disabled={isEditingAdmin}
                                                onChange={() => handleTogglePerm(subMenu.id, action)}
                                                title={isEditingAdmin ? 'Locked for Administrator (Full Access)' : `${isChecked ? 'Disable' : 'Enable'} ${action}`}
                                              />
                                            ) : (
                                              <div
                                                className="relative inline-flex h-4.5 w-8 flex-shrink-0 rounded-full bg-gray-200/70 dark:bg-slate-800/80 border-0 p-0.5 opacity-25 cursor-not-allowed select-none"
                                                title="Action not applicable for this module"
                                              >
                                                <span className="inline-block h-3.5 w-3.5 transform translate-x-0 rounded-full bg-gray-400 dark:bg-slate-600 shadow-2xs" />
                                              </div>
                                            )}
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Side: Role Details & Actions */}
              <div className="w-full lg:w-1/3 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-xs rounded-none space-y-4 sticky top-6">
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-[#043486] dark:text-blue-400 border-b border-gray-200 dark:border-slate-800 pb-2.5 flex items-center justify-between">
                    <span>Role Information</span>
                    {isEditingAdmin && (
                      <span className="text-[10px] bg-blue-100 text-[#043486] dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 font-bold uppercase tracking-wider">
                        Protected Root
                      </span>
                    )}
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      disabled={isEditingAdmin}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="Enter role name"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[#292424] dark:text-white rounded-none focus:outline-none focus:border-[#043486] font-medium placeholder:text-gray-400 ${
                        isEditingAdmin ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-80' : ''
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter role description"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[#292424] dark:text-white rounded-none focus:outline-none focus:border-[#043486] font-medium resize-none placeholder:text-gray-400"
                    />
                  </div>

                  {/* Role Status (Active / Inactive) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                      Role Status <span className="text-red-500">*</span>
                    </label>
                    <StatusToggle
                      value={roleStatus}
                      onChange={setRoleStatus}
                      disabled={isEditingAdmin}
                    />
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSaving}
                      icon={Save}
                      className="flex-1"
                    >
                      {editingRoleId ? 'UPDATE ROLE' : 'SAVE ROLE'}
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
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: ROLE LIST */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ListKpiCard
              label="Total Roles"
              value={roles.length}
              icon={ShieldCheck}
              variant="blueValue"
            />
            <ListKpiCard
              label="Active Roles"
              value={roles.filter((r) => r.status === 'Active' || !r.status).length}
              icon={CheckCircle2}
              variant="emerald"
            />
            <ListKpiCard
              label="Inactive Roles"
              value={roles.filter((r) => r.status === 'Inactive').length}
              icon={XCircle}
              variant="red"
            />
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-xs transition-colors">
            {/* Search Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="w-full sm:w-[350px]">
                <SearchInput
                  placeholder="Search roles by name or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm('')}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[300px]">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  <div className="h-9 bg-slate-100 dark:bg-slate-800 flex items-center px-4 gap-4 animate-pulse">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-3 bg-slate-200 dark:bg-slate-700 rounded-xs flex-1" />
                    ))}
                  </div>
                  {Array.from({ length: 5 }).map((_, rIdx) => (
                    <div
                      key={rIdx}
                      className="h-11 border-b border-gray-100 dark:border-slate-800/70 flex items-center px-4 gap-4 animate-pulse"
                    >
                      {Array.from({ length: 6 }).map((_, cIdx) => (
                        <div
                          key={cIdx}
                          className={`h-3 bg-slate-200/80 dark:bg-slate-800 rounded-xs ${
                            cIdx === 0 ? 'w-10' : 'flex-1'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-gray-400 dark:text-slate-500 text-center">
                  <AlertCircle size={40} className="mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No roles found</p>
                  <p className="text-xs sm:text-[13px] text-gray-400 mt-1">Try adjusting your search query or create a new role.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="p-3.5 w-12 text-center">
                        <Checkbox
                          checked={selectedIds.length === paginatedRoles.length && paginatedRoles.length > 0}
                          indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedRoles.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-3.5 w-14 text-center">ID</th>
                      <th className="p-3.5">Role Name</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5 text-center">Total Users</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs sm:text-[13px]">
                    {paginatedRoles.map((role, idx) => {
                      const isSystemAdmin = role.name === 'Administrator'
                      const isActive = role.status === 'Active' || !role.status
                      const roleUsers = allUsers.filter(
                        (u) => (u.role || '').toLowerCase().trim() === (role.name || '').toLowerCase().trim()
                      )
                      const isExpanded = expandedRoleId === role.id

                      return (
                        <React.Fragment key={role.id}>
                          <tr
                            onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                            className={`transition-colors cursor-pointer ${
                              isExpanded
                                ? 'bg-blue-50/70 dark:bg-slate-800/70 border-l-4 border-l-[#043486]'
                                : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.includes(role.id)}
                                onChange={() => handleToggleSelect(role.id)}
                              />
                            </td>
                            <td className="p-3.5 text-center font-mono text-gray-400 dark:text-slate-500 font-medium">
                              {startIndex + idx + 1}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#043486] dark:text-blue-400 text-xs sm:text-sm">
                                  {role.name}
                                </span>
                                {isSystemAdmin && (
                                  <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-none">
                                    Default
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 text-gray-600 dark:text-slate-400">
                              {role.description || '-'}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-[#043486] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-none">
                                {roleUsers.length}
                              </span>
                            </td>
                            <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                              {isSystemAdmin ? (
                                <StatusPill status="Active" size="sm" />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(role)}
                                  className="transition-transform hover:scale-105 cursor-pointer"
                                  title={`Click to ${isActive ? 'Deactivate' : 'Activate'} role`}
                                >
                                  <StatusPill status={isActive ? 'Active' : 'Inactive'} size="sm" />
                                </button>
                              )}
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                {canEdit && !isSystemAdmin && (
                                  <ActionButton
                                    type="edit"
                                    onClick={() => loadRoleDetails(role.id)}
                                    title="Edit Role & Permissions"
                                  />
                                )}
                                {canDelete && !isSystemAdmin && (
                                  <ActionButton
                                    type="delete"
                                    onClick={() => handleDelete(role.id, role.name)}
                                    title="Delete Role"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
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

                          {/* EXPANDED ROLE USERS DRAWER */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-y border-gray-200/80 dark:border-slate-800">
                              <td colSpan={7} className="p-6">
                                {roleUsers.length === 0 ? (
                                  <div className="py-6 text-center">
                                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                                      No users assigned to this role yet.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {roleUsers.map((user) => (
                                      <div
                                        key={user.id}
                                        className="p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3.5 hover:shadow-sm hover:border-[#043486] dark:hover:border-blue-500 transition-all"
                                      >
                                        <img
                                          src={getAvatarForUser(user)}
                                          alt={user.name}
                                          className="w-11 h-11 rounded-full border border-gray-200 dark:border-slate-700 object-cover bg-gray-50 flex-shrink-0"
                                        />
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
