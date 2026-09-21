import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Boxes,
  Tag,
  DollarSign,
  Layers,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Loader2,
  ScanBarcode,
  ShieldAlert,
  Hash,
  List,
  IndianRupee,
  Package,
  ListFilter,
  PlusCircle
} from 'lucide-react'
import Swal from 'sweetalert2'
import SearchableSelect from '../components/common/SearchableSelect'
import { API_ENDPOINTS } from '../config/api'

export default function AddMaterialPage({ editMaterialId = null, onSaved, setActiveRoute: setActiveRouteProp }) {
  const location = useLocation()
  const navigate = useNavigate()

  const queryId = new URLSearchParams(location.search).get('id')
  const targetEditId = editMaterialId || location.state?.editMaterialId || queryId || null

  const setActiveRoute = (route) => {
    if (setActiveRouteProp) {
      setActiveRouteProp(route)
    } else {
      navigate('/materials')
    }
  }

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: '',
    brand: '',
    unit: 'Nos',
    description: '',
    selling_price: '',
    mrp: '',
    hsn_code: '',
    tax_inclusive: true,
    has_discount: false,
    discount_percent: '',
    opening_stock: '',
    reorder_level: '',
    barcode: '',
    warranty: 'No Warranty',
    serial_tracking: false,
    return_policy: false,
    status: 'Active'
  })

  const [categories, setCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Units list
  const unitOptions = [
    { value: 'Nos', label: 'Nos (Pieces)' },
    { value: 'Box', label: 'Box' },
    { value: 'Meter', label: 'Meter' },
    { value: 'Kg', label: 'Kg (Kilogram)' },
    { value: 'Litre', label: 'Litre' },
    { value: 'Pack', label: 'Pack' },
    { value: 'Set', label: 'Set' },
    { value: 'Roll', label: 'Roll' }
  ]

  // Warranty options
  const warrantyOptions = [
    { value: 'No Warranty', label: 'No Warranty' },
    { value: '3 Months', label: '3 Months' },
    { value: '6 Months', label: '6 Months' },
    { value: '1 Year', label: '1 Year' },
    { value: '2 Years', label: '2 Years' },
    { value: '3 Years', label: '3 Years' },
    { value: '5 Years', label: '5 Years' }
  ]

  // Fetch Categories for dropdown
  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const res = await fetch(API_ENDPOINTS.CATEGORIES)
      const data = await res.json()
      if (data.success) {
        setCategories(
          (data.categories || []).map(cat => ({
            value: cat.id,
            label: cat.name,
            subLabel: cat.status === 'Inactive' ? '(Inactive)' : undefined
          }))
        )
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // Fetch Material Details if in Edit Mode
  const fetchMaterialDetails = async (id) => {
    try {
      setIsLoadingDetails(true)
      const res = await fetch(API_ENDPOINTS.MATERIAL_BY_ID(id))
      const data = await res.json()
      if (data.success && data.material) {
        const m = data.material
        setFormData({
          name: m.name || '',
          code: m.code || '',
          category_id: m.category_id ? String(m.category_id) : '',
          brand: m.brand || '',
          unit: m.unit || 'Nos',
          description: m.description || '',
          selling_price: m.selling_price ? String(m.selling_price) : '',
          mrp: m.mrp ? String(m.mrp) : '',
          hsn_code: m.hsn_code || '',
          tax_inclusive: Boolean(m.tax_inclusive),
          has_discount: Boolean(m.has_discount),
          discount_percent: m.discount_percent ? String(m.discount_percent) : '',
          opening_stock: m.opening_stock ? String(m.opening_stock) : '',
          reorder_level: m.reorder_level ? String(m.reorder_level) : '',
          barcode: m.barcode || '',
          warranty: m.warranty || 'No Warranty',
          serial_tracking: Boolean(m.serial_tracking),
          return_policy: Boolean(m.return_policy),
          status: m.status || 'Active'
        })
      }
    } catch (err) {
      console.error('Failed to load material details:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load material details for editing.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    if (targetEditId) {
      fetchMaterialDetails(targetEditId)
    }
  }, [targetEditId])


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Prevent minus sign, plus sign, and scientific notation 'e'
  const blockNegativeKeys = (e) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault()
    }
  }

  // Sanitize numeric inputs (no negative numbers)
  const handlePositiveNumberChange = (e) => {
    const { name, value } = e.target
    const cleanVal = value.replace(/[^0-9.]/g, '')
    setFormData(prev => ({
      ...prev,
      [name]: cleanVal
    }))
  }

  const handleCategoryChange = (val) => {
    setFormData(prev => ({ ...prev, category_id: val }))
  }

  const handleClear = () => {
    setFormData({
      name: '',
      code: '',
      category_id: '',
      brand: '',
      unit: 'Nos',
      description: '',
      selling_price: '',
      mrp: '',
      hsn_code: '',
      tax_inclusive: true,
      has_discount: false,
      discount_percent: '',
      opening_stock: '',
      reorder_level: '',
      barcode: '',
      warranty: 'No Warranty',
      serial_tracking: false,
      return_policy: false,
      status: 'Active'
    })
  }

  // Auto Generate SKU Code
  const handleGenerateSKU = () => {
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'info',
        title: 'Tip',
        text: 'Please enter Material Name first to generate SKU.',
        confirmButtonColor: '#043486'
      })
      return
    }
    const clean = formData.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    setFormData(prev => ({
      ...prev,
      code: `MAT-${clean}-${rand}`
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Material Name is mandatory.',
        confirmButtonColor: '#043486'
      })
      return
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Selling Price',
        text: 'Please enter a valid selling price greater than 0.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const url = targetEditId ? API_ENDPOINTS.MATERIAL_BY_ID(targetEditId) : API_ENDPOINTS.MATERIALS
      const method = targetEditId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save material.')
      }

      Swal.fire({
        icon: 'success',
        title: targetEditId ? 'Material Updated!' : 'Material Created!',
        text: data.message || 'Material saved successfully in database.',
        timer: 2000,
        showConfirmButton: false
      })

      if (!targetEditId) {
        handleClear()
      }

      if (onSaved) {
        onSaved()
      } else if (setActiveRoute) {
        setActiveRoute('all-materials')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message || 'Failed to save material to TiDB.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Page Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2.5">
            <Boxes className="text-[#043486] dark:text-blue-400" size={22} />
            {targetEditId ? 'EDIT MATERIAL' : 'ADD MATERIAL'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Create and configure inventory billing materials &amp; pricing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 gap-1.5 font-medium">
            <span>Home</span>
            <span>›</span>
            <span>Materials</span>
            <span>›</span>
            <span className="text-[#043486] dark:text-blue-400 font-semibold">
              {targetEditId ? 'Edit' : 'Add Material'}
            </span>
          </div>

          {setActiveRoute && (
            <button
              onClick={() => setActiveRoute('all-materials')}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ListFilter size={14} />
              <span>All Materials</span>
            </button>
          )}
        </div>
      </div>

      {isLoadingDetails ? (
        <div className="py-20 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-sm border border-gray-200 dark:border-slate-800">
          <Loader2 size={24} className="animate-spin mx-auto text-[#043486] dark:text-blue-400 mb-2" />
          <p className="text-xs">Loading material details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: Material Details */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-xs transition-colors">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 flex items-center gap-2">
              <Layers size={16} className="text-[#043486] dark:text-blue-400" />
              <h2 className="text-xs sm:text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wider">
                Section 1 — Material Details
              </h2>
            </div>

            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Material Name* */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  Material Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Cotton Fabric Rolls 100m, Steel Screws"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0248BC] dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Status Radio Box */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 border rounded-sm text-xs font-semibold cursor-pointer transition-colors ${
                      formData.status === 'Active'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={() => setFormData(p => ({ ...p, status: 'Active' }))}
                      className="sr-only"
                    />
                    <span className={`w-2 h-2 rounded-full ${formData.status === 'Active' ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'bg-gray-300 dark:bg-slate-600'}`} />
                    Active
                  </label>

                  <label
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 border rounded-sm text-xs font-semibold cursor-pointer transition-colors ${
                      formData.status === 'Inactive'
                        ? 'border-gray-500 dark:border-slate-500 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={formData.status === 'Inactive'}
                      onChange={() => setFormData(p => ({ ...p, status: 'Inactive' }))}
                      className="sr-only"
                    />
                    <span className={`w-2 h-2 rounded-full ${formData.status === 'Inactive' ? 'bg-gray-600 dark:bg-slate-400 ring-2 ring-gray-300 dark:ring-slate-700' : 'bg-gray-300 dark:bg-slate-600'}`} />
                    Inactive
                  </label>
                </div>
              </div>

              {/* Category* (Direct Typeahead Dropdown) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={categories}
                  value={formData.category_id}
                  onChange={handleCategoryChange}
                  placeholder={isLoadingCategories ? 'Loading categories...' : 'Type or select category...'}
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g. Simcha, PackPro"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0248BC] dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Unit* Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0248BC] dark:focus:ring-blue-500 cursor-pointer"
                >
                  {unitOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  Description / Specification
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed material description, specifications, or internal notes..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0248BC] dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Checkboxes: Serial Number Tracking & Return Policy */}
              <div className="lg:col-span-3 pt-1 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="serial_tracking"
                    checked={Boolean(formData.serial_tracking)}
                    onChange={(e) => setFormData(p => ({ ...p, serial_tracking: e.target.checked }))}
                    className="w-4 h-4 text-[#043486] rounded-none focus:ring-0 cursor-pointer accent-[#043486]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-[#292424] dark:text-white">
                      Enable Serial Number Tracking
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block sm:inline sm:ml-1.5">
                      (Enable unique Serial / IMEI inputs)
                    </span>
                  </div>
                </label>

                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="return_policy"
                    checked={Boolean(formData.return_policy)}
                    onChange={(e) => setFormData(p => ({ ...p, return_policy: e.target.checked }))}
                    className="w-4 h-4 text-[#043486] rounded-none focus:ring-0 cursor-pointer accent-[#043486]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-[#292424] dark:text-white">
                      Enable Return Policy
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block sm:inline sm:ml-1.5">
                      (Return policy clause will show on bill)
                    </span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          {/* Section 2: Pricing & GST (Spacious 2-Column Grid Layout) */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-xs transition-colors">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 flex items-center gap-2">
              <IndianRupee size={16} className="text-[#043486] dark:text-blue-400" />
              <h2 className="text-xs sm:text-sm font-bold text-[#292424] dark:text-white uppercase tracking-wider">
                Section 2 — Pricing &amp; GST
              </h2>
            </div>

            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Selling Price* */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  Selling Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 text-sm font-bold">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    name="selling_price"
                    value={formData.selling_price}
                    onKeyDown={blockNegativeKeys}
                    onChange={handlePositiveNumberChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0248BC] dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Base unit billing rate to customer</p>
              </div>

              {/* MRP */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  Maximum Retail Price / MRP (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 text-sm font-bold">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="mrp"
                    value={formData.mrp}
                    onKeyDown={blockNegativeKeys}
                    onChange={handlePositiveNumberChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0248BC] dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Printed maximum retail price (optional)</p>
              </div>

              {/* Discount Checkbox & Percentage Input */}
              <div className="md:col-span-2 p-3.5 bg-gray-50/70 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 rounded-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="has_discount"
                      checked={Boolean(formData.has_discount)}
                      onChange={(e) => setFormData(p => ({ ...p, has_discount: e.target.checked }))}
                      className="w-4 h-4 text-[#043486] rounded-none focus:ring-0 cursor-pointer accent-[#043486]"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-[#292424] dark:text-white">
                        Enable Discount
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 block sm:inline sm:ml-1.5">
                        (Specify a discount percentage on the selling price)
                      </span>
                    </div>
                  </label>

                  {formData.has_discount && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 whitespace-nowrap">
                        Discount (%):
                      </label>
                      <div className="relative w-36">
                        <input
                          type="text"
                          inputMode="decimal"
                          name="discount_percent"
                          value={formData.discount_percent}
                          onKeyDown={blockNegativeKeys}
                          onChange={handlePositiveNumberChange}
                          placeholder="e.g. 10"
                          className="w-full px-3 py-1.5 pr-7 text-xs sm:text-sm font-bold text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0248BC]"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {formData.has_discount && formData.selling_price && formData.discount_percent && (
                  <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-slate-800 text-[11px] text-gray-600 dark:text-slate-400 flex items-center gap-4">
                    <span>
                      Original Price: <strong className="text-gray-800 dark:text-gray-200">₹{parseFloat(formData.selling_price || 0).toFixed(2)}</strong>
                    </span>
                    <span>
                      Discount: <strong className="text-amber-600 dark:text-amber-400">{formData.discount_percent}% (-₹{(parseFloat(formData.selling_price || 0) * (parseFloat(formData.discount_percent || 0) / 100)).toFixed(2)})</strong>
                    </span>
                    <span>
                      Discounted Price (Pre-Tax): <strong className="text-emerald-600 dark:text-emerald-400 font-bold">₹{(parseFloat(formData.selling_price || 0) * (1 - parseFloat(formData.discount_percent || 0) / 100)).toFixed(2)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* HSN Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  name="hsn_code"
                  value={formData.hsn_code}
                  onChange={handleInputChange}
                  placeholder="e.g. 5208, 4819, 7318"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0248BC] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0248BC] dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Standard GST Harmonized System code</p>
              </div>

              {/* Tax Setting (Sleek iOS/Velzon Toggle Switch) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  Tax Setting
                </label>
                <div className="p-3 bg-gray-50/70 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 rounded-sm flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#292424] dark:text-white">Tax Inclusive</span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      {formData.tax_inclusive ? 'Selling price includes GST' : 'GST added separately in bill'}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.tax_inclusive}
                    onClick={() => setFormData(p => ({ ...p, tax_inclusive: !p.tax_inclusive }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none ${
                      formData.tax_inclusive 
                        ? 'bg-[#0248BC] dark:bg-blue-600' 
                        : 'bg-gray-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                        formData.tax_inclusive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Form Action Footer */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm p-4 shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Form</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 border border-[#043486] dark:border-blue-600 rounded-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving to TiDB...</span>
                  </>
                ) : editMaterialId ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Update Material</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={15} />
                    <span>Save Material</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
  )
}
