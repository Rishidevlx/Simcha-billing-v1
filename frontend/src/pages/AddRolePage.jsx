import React, { useState, useEffect } from 'react'
import { Save, RefreshCw } from '../components/common/icons'
import Swal from 'sweetalert2'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'

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
          { id: 'roles_add', name: 'Add Role', actions: ['Add', 'View', 'Edit'] },
          { id: 'roles_list', name: 'Role List', actions: ['View', 'Edit', 'Delete'] },
          { id: 'users_add', name: 'Add User', actions: ['Add', 'View', 'Edit'] },
          { id: 'users_list', name: 'Users List', actions: ['View', 'Edit', 'Delete'] }
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

// All possible action types for table headers
const ALL_ACTIONS = ['Add', 'View', 'Edit', 'Delete', 'Download']

export default function AddRolePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState({})
  const [adminAccess, setAdminAccess] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (editId) {
      fetchRoleDetails(editId)
    }
  }, [editId])

  const fetchRoleDetails = async (id) => {
    setIsLoading(true)
    try {
      const res = await fetch(API_ENDPOINTS.ROLE_BY_ID(id))
      const data = await res.json()
      if (data.success && data.role) {
        setRoleName(data.role.name)
        setDescription(data.role.description || '')
        setPermissions(data.role.permissions || {})
        setAdminAccess(data.role.admin_access || [])
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to fetch role details', confirmButtonColor: '#043486' })
      }
    } catch (err) {
      console.error('Fetch role error:', err)
      Swal.fire({ icon: 'error', title: 'Error', text: 'Network error fetching role', confirmButtonColor: '#043486' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle checkbox toggle
  const handleToggle = (subId, action) => {
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

  const handleToggleAdminAccess = (menu) => {
    setAdminAccess(prev => {
      if (prev.includes(menu)) {
        return prev.filter(m => m !== menu)
      } else {
        return [...prev, menu]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roleName) {
      Swal.fire({ icon: 'warning', title: 'Role Name Required', text: 'Please enter a role name.', confirmButtonColor: '#043486' })
      return
    }

    setIsSaving(true)
    try {
      const url = editId ? API_ENDPOINTS.ROLE_BY_ID(editId) : API_ENDPOINTS.ROLES
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          description,
          permissions,
          admin_access: adminAccess
        })
      })
      const data = await res.json()

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editId ? 'Role Updated!' : 'Role Created!',
          text: 'Role and permissions saved successfully.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          navigate('/roles/list')
        })
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

  const handleClear = () => {
    setRoleName('')
    setDescription('')
    setPermissions({})
    setAdminAccess([])
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-[#090d16] min-h-screen text-slate-800 dark:text-slate-200">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase">
          {editId ? 'Edit Role' : 'Create Role'}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Permissions (Approx 65-70%) */}
        <div className="w-full lg:w-2/3 space-y-6">
          {PERMISSIONS_DATA.map((categoryGroup, idx) => (
            <div key={idx} className="bg-white dark:bg-[#0f172a] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-6">{categoryGroup.category}</h2>
              
              <div className="flex flex-col gap-6">
                {categoryGroup.modules.map((module) => (
                  <div key={module.id} className="border border-slate-200 dark:border-slate-700/70 rounded-lg p-5 bg-slate-50/70 dark:bg-[#151f32]">
                    <h3 className="text-base font-bold mb-5 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                      {module.name}
                    </h3>
                    
                    <div className="w-full">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="pb-3 pr-4 font-bold text-slate-600 dark:text-slate-300 min-w-[120px]">Type</th>
                            {ALL_ACTIONS.map(action => (
                              <th key={action} className="pb-3 px-2 font-bold text-slate-600 dark:text-slate-300 text-center min-w-[60px]">
                                {action}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {module.subMenus.map((sub) => (
                            <tr key={sub.id} className="border-b border-slate-200/60 dark:border-slate-800/80 last:border-0 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 font-semibold text-slate-700 dark:text-slate-300 pr-4 whitespace-nowrap">
                                {sub.name}
                              </td>
                              {ALL_ACTIONS.map(action => {
                                const isApplicable = sub.actions.includes(action)
                                const isChecked = (permissions[sub.id] || []).includes(action)
                                return (
                                  <td key={action} className="py-3.5 px-2 text-center">
                                    {isApplicable ? (
                                      <div className="flex justify-center">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleToggle(sub.id, action)}
                                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer dark:border-slate-600 dark:bg-slate-700 transition-all"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex justify-center">
                                        <input
                                          type="checkbox"
                                          disabled
                                          className="w-5 h-5 rounded border-slate-200 bg-slate-100 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/50"
                                        />
                                      </div>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Role Details (Approx 30-35%) */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white dark:bg-[#0f172a] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-bold mb-6">Role Details</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter role name (e.g. Cashier)"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-[#151f32] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Short role description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-[#151f32] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
              </div>

              {/* Admin Access Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Admin Access</h3>
                <div className="space-y-3">
                  {[
                    'Full Admin Access',
                    'Dashboard',
                    'Bills',
                    'Services',
                    'Categories',
                    'Materials',
                    'Stock & Inventory',
                    'Settings',
                    'Roles & Access'
                  ].map((menu) => (
                    <label key={menu} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={adminAccess.includes(menu)}
                        onChange={() => handleToggleAdminAccess(menu)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer dark:border-slate-600 dark:bg-slate-700 transition-all"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {menu}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-2 px-4 border border-blue-500 text-blue-600 dark:text-blue-400 font-semibold rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Clear
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

      </div>
      )}
    </div>
  )
}

