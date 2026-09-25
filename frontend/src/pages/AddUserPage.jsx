import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Save,
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Swal from 'sweetalert2'
import ListPageHeader from '../components/common/ListPageHeader'
import { API_ENDPOINTS } from '../config/api'

export default function AddUserPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Available Roles from Backend
  const [availableRoles, setAvailableRoles] = useState([])

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    role: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchRoles()
    if (editId) {
      fetchUserData(editId)
    }
  }, [editId])

  const fetchUserData = async (id) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/users/${id}`)
      const data = await res.json()
      if (data.success && data.user) {
        setFormData({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || '',
          designation: data.user.designation || '',
          role: data.user.role,
          status: data.user.status || 'Active'
        })
      } else {
        Swal.fire('Error', data.message || 'Failed to fetch user', 'error')
      }
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Network error fetching user', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles') // Assuming this is defined
      const data = await res.json()
      if (data.success && data.roles) {
        setAvailableRoles(data.roles)
      } else {
        // Fallback mock if API fails while testing
        setAvailableRoles([
          { id: 1, name: 'Administrator' },
          { id: 2, name: 'Cashier' },
          { id: 3, name: 'Store Keeper' }
        ])
      }
    } catch (err) {
      console.error(err)
      // Fallback mock if API not ready
      setAvailableRoles([
        { id: 1, name: 'Administrator' },
        { id: 2, name: 'Cashier' },
        { id: 3, name: 'Store Keeper' }
      ])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validations
    if (!formData.name || !formData.email || !formData.role) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Name, Email, and Role are mandatory.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSaving(true)
    
    try {
      const url = editId ? `/api/users/${editId}` : '/api/users'
      const method = editId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editId ? 'User Updated!' : 'User Created!',
          text: data.message || `Login credentials have been sent to ${formData.email}.`,
          timer: 2500,
          showConfirmButton: false
        }).then(() => {
          navigate('/users/list')
        })
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

  const handleCancel = () => {
    navigate('/users/list')
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header */}
      <ListPageHeader
        title={editId ? "EDIT USER" : "CREATE NEW USER"}
        subtitle="Manage user profiles and system access credentials"
        actions={
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-none shadow-xs hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <X size={15} />
            CANCEL
          </button>
        }
      />

      {/* Main Form Box */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-none shadow-xs max-w-4xl transition-colors">
        
        {/* Form Title */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/60 flex items-center gap-2">
          <User className="text-[#043486] dark:text-blue-500" size={18} />
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
            User Information
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400 dark:text-slate-500">
            <Loader2 className="animate-spin mb-3 text-[#043486] dark:text-blue-500" size={32} />
            <p className="text-sm font-medium">Loading details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            
            {/* Grid Layout for Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* User Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <User size={13} className="text-gray-400" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Mail size={13} className="text-gray-400" />
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Phone size={13} className="text-gray-400" />
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Briefcase size={13} className="text-gray-400" />
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Enter designation"
                  className="w-full px-3 py-2 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Shield size={13} className="text-gray-400" />
                  System Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 cursor-pointer transition-colors"
                >
                  <option value="" disabled>Select a role...</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Account Status <span className="text-red-500">*</span>
                </label>
                <div className="flex bg-gray-100/50 dark:bg-slate-900/50 p-1 rounded-sm border border-gray-200 dark:border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: 'Active' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-[2px] transition-all cursor-pointer ${
                      formData.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 border border-transparent'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${formData.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    Active
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: 'Inactive' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-[2px] transition-all cursor-pointer ${
                      formData.status === 'Inactive'
                        ? 'bg-white text-gray-800 border border-gray-200/80 shadow-xs'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 border border-transparent'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${formData.status === 'Inactive' ? 'bg-gray-400' : 'bg-gray-300'}`} />
                    Inactive
                  </button>
                </div>
              </div>

            </div>

            {/* Info Alert regarding Password */}
            {!editId && (
              <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 p-4 rounded-sm flex items-start gap-3">
                <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">Auto-Generated Password</h4>
                  <p className="text-xs text-blue-800 dark:text-blue-400 mt-1 leading-relaxed">
                    A secure password will be automatically generated by the system. Once you click "Save User", an email will be sent to <strong>{formData.email || 'the provided email address'}</strong> containing their login credentials.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex items-center gap-3 border-t border-gray-200 dark:border-slate-800 pt-5">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 border border-[#043486] dark:border-blue-600 rounded-none shadow-xs transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                SAVE USER
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 text-xs font-bold text-gray-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-none transition-all"
              >
                CANCEL
              </button>
            </div>
            
          </form>
        )}
      </div>
    </div>
  )
}
