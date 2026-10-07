import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Receipt,
  Boxes,
  Clock,
  Plus,
  ArrowRight,
  Eye,
  Printer,
  FileText,
  Landmark,
  Percent,
  ShoppingCart,
  PackageCheck,
  AlertTriangle,
  Users,
  Building2,
  Calendar,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Wrench,
  Layers,
  PackageOpen
} from '../components/common/icons'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts'
import InvoiceModal from '../components/invoice/InvoiceModal'
import { Button, ActionButton } from '../components/ui'
import ListKpiCard from '../components/common/ListKpiCard'
import DashboardDateRangePicker from '../components/dashboard/DashboardDateRangePicker'
import { API_ENDPOINTS } from '../config/api'

const PIE_COLORS = ['#043486', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

// Local Date Helper to eliminate timezone UTC discrepancy (e.g. 2026-10-02T18:30:00Z -> 2026-10-03 in local IST)
const getLocalDateString = (dateVal) => {
  if (!dateVal) return ''
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim()
  }
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) {
    if (typeof dateVal === 'string') {
      return dateVal.slice(0, 10)
    }
    return ''
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DashboardPage({ setActiveRoute: setActiveRouteProp }) {
  const navigate = useNavigate()

  const setActiveRoute = (route) => {
    // Check Access Rights
    const simchaUser = JSON.parse(localStorage.getItem('simcha_user') || '{}')
    const userAdminAccess = simchaUser.admin_access || []
    const userPermissions = simchaUser.permissions || {}
    const hasFullAccess = userAdminAccess.includes('Full Admin Access') || simchaUser.role === 'Administrator'

    const permIdMap = {
      'inward': 'inward',
      'inward-reports': 'inward_list',
      'inward-list': 'inward_list',
      'create-bill': 'outward',
      'outward': 'outward',
      'all-bills': 'outward_list',
      'outward-list': 'outward_list',
      'new-service': 'services_new',
      'all-services': 'services_list',
      'categories': 'categories_create',
      'add-material': 'materials_add',
      'materials': 'materials_list',
      'all-materials': 'materials_list',
      'inventory': 'inventory_main',
      'stock': 'inventory_main',
      'returns': 'inventory_returns'
    }

    const checkAccess = (targetRoute) => {
      if (hasFullAccess) return true
      if (targetRoute === 'dashboard') return true // always allow if they can see dashboard
      
      let routeKey = targetRoute
      if (targetRoute.startsWith('/inward/edit/')) routeKey = 'inward'
      else if (targetRoute.startsWith('/services/new')) routeKey = 'new-service'
      else if (targetRoute.startsWith('/services/list')) routeKey = 'all-services'
      else if (targetRoute.startsWith('/inventory/returns')) routeKey = 'returns'

      const targetPermId = permIdMap[routeKey]
      if (!targetPermId) return true // unmapped route (e.g. some settings)

      const perms = userPermissions[targetPermId] || []
      return perms.length > 0
    }

    if (!checkAccess(route)) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You do not have permission to view this module.',
          confirmButtonColor: '#043486'
        })
      })
      return
    }

    if (setActiveRouteProp) {
      setActiveRouteProp(route)
    } else {
      const ROUTE_MAP = {
        'dashboard': '/dashboard',
        'inward': '/inward',
        'inward-reports': '/inward-list',
        'inward-list': '/inward-list',
        'create-bill': '/outward',
        'outward': '/outward',
        'all-bills': '/outward-list',
        'outward-list': '/outward-list',
        'categories': '/categories',
        'materials': '/materials',
        'all-materials': '/materials',
        'add-material': '/materials/add',
        'inventory': '/inventory',
        'stock': '/inventory',
        'returns': '/inventory/returns',
        'credit-notes': '/inventory/returns?tab=credit_notes',
        'profile-settings': '/settings/profile',
        'system-settings': '/settings/system',
        'configurations-settings': '/settings/configurations'
      }
      navigate(ROUTE_MAP[route] || (route.startsWith('/') ? route : `/${route}`))
    }
  }

  const [isLoading, setIsLoading] = useState(true)
  const [bills, setBills] = useState([])
  const [inwards, setInwards] = useState([])
  const [materials, setMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [returnsList, setReturnsList] = useState([])
  const [settings, setSettings] = useState(null)
  const [selectedBillForPreview, setSelectedBillForPreview] = useState(null)
  const [chartViewTab, setChartViewTab] = useState('sales_vs_purchase') // 'sales_vs_purchase' | 'monthly_growth'
  const [pieTab, setPieTab] = useState('customer_type') // 'customer_type' | 'payment_status'
  const [dateRange, setDateRange] = useState({
    preset: 'ALL_TIME',
    startDate: '',
    endDate: '',
    label: 'All Time'
  })

  // Fetch all dashboard data
  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      const [billsRes, inwRes, matRes, catRes, setRes, servRes, retRes] = await Promise.all([
        fetch(API_ENDPOINTS.BILLS).then(r => r.json()).catch(() => ({ bills: [] })),
        fetch(API_ENDPOINTS.INWARDS).then(r => r.json()).catch(() => ({ inwards: [] })),
        fetch(API_ENDPOINTS.MATERIALS).then(r => r.json()).catch(() => ({ materials: [] })),
        fetch(API_ENDPOINTS.CATEGORIES).then(r => r.json()).catch(() => ({ categories: [] })),
        fetch(API_ENDPOINTS.SETTINGS).then(r => r.json()).catch(() => ({ settings: null })),
        fetch(API_ENDPOINTS.SERVICES).then(r => r.json()).catch(() => ({ services: [] })),
        fetch(API_ENDPOINTS.RETURNS).then(r => r.json()).catch(() => ({ returns: [] }))
      ])

      if (billsRes.success && Array.isArray(billsRes.bills)) {
        setBills(billsRes.bills)
      }
      if (inwRes.success && Array.isArray(inwRes.inwards)) {
        setInwards(inwRes.inwards)
      }
      if (matRes.success && Array.isArray(matRes.materials)) {
        setMaterials(matRes.materials)
      }
      if (catRes.success && Array.isArray(catRes.categories)) {
        setCategories(catRes.categories)
      }
      if (setRes.success && setRes.settings) {
        setSettings(setRes.settings)
      }
      if (servRes.success && Array.isArray(servRes.services)) {
        setServices(servRes.services)
      }
      if (retRes.success && Array.isArray(retRes.returns)) {
        setReturnsList(retRes.returns)
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Helper to check if a date string falls inside the chosen date range
  const isDateInRange = (dateVal) => {
    if (!dateRange.startDate && !dateRange.endDate) return true
    if (!dateVal) return false

    const itemDate = getLocalDateString(dateVal)
    if (!itemDate) return false

    if (dateRange.startDate && itemDate < dateRange.startDate) return false
    if (dateRange.endDate && itemDate > dateRange.endDate) return false
    return true
  }

  // Filtered collections based on Date Range
  const filteredBills = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return bills
    return bills.filter(b => isDateInRange(b.invoice_date || b.created_at))
  }, [bills, dateRange])

  const filteredInwards = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return inwards
    return inwards.filter(i => isDateInRange(i.inward_date || i.created_at))
  }, [inwards, dateRange])

  const filteredReturns = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return returnsList
    return returnsList.filter(r => isDateInRange(r.return_date || r.created_at))
  }, [returnsList, dateRange])

  // 1. Calculated KPI Summary Metrics
  const metrics = useMemo(() => {
    const totalOutwardRevenue = filteredBills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const totalInwardCost = filteredInwards.reduce((acc, i) => acc + (parseFloat(i.total_amount) || 0), 0)
    const paidBills = filteredBills.filter(b => b.payment_status === 'Paid')
    const pendingBills = filteredBills.filter(b => b.payment_status === 'Pending')
    const partialBills = filteredBills.filter(b => b.payment_status === 'Partial')

    const paidAmount = paidBills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const pendingAmount = pendingBills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const totalTaxCollected = filteredBills.reduce((acc, b) => acc + (parseFloat(b.total_tax) || 0), 0)

    const activeMaterialsCount = materials.filter(m => m.status === 'Active').length
    const lowStockMaterials = materials.filter(m => (parseFloat(m.stock_quantity || m.current_stock || 0) <= 5) && m.status === 'Active')

    // Today's Sales
    const todayStr = new Date().toISOString().split('T')[0]
    const todaySales = bills
      .filter(b => b.invoice_date && b.invoice_date.startsWith(todayStr))
      .reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)

    return {
      totalOutwardRevenue,
      totalInwardCost,
      paidBillsCount: paidBills.length,
      pendingBillsCount: pendingBills.length,
      partialBillsCount: partialBills.length,
      paidAmount,
      pendingAmount,
      totalTaxCollected,
      activeMaterialsCount,
      lowStockMaterials,
      todaySales,
      totalInwardsCount: filteredInwards.length
    }
  }, [filteredBills, filteredInwards, materials, bills])

  // 2. Monthly Trend Data for Area / Bar Charts (Includes Outward, Inward & Returns)
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Initialize map for 12 months
    const map = {}
    months.forEach((m, idx) => {
      map[idx] = { month: m, sales: 0, purchase: 0, returns: 0, billsCount: 0, inwardCount: 0, returnsCount: 0 }
    })

    // Populate from Outward bills
    bills.forEach(b => {
      if (b.invoice_date) {
        const d = new Date(b.invoice_date)
        if (!isNaN(d.getTime())) {
          const mIdx = d.getMonth()
          if (map[mIdx]) {
            map[mIdx].sales += (parseFloat(b.total_amount) || 0)
            map[mIdx].billsCount += 1
          }
        }
      }
    })

    // Populate from Inward entries
    inwards.forEach(inv => {
      if (inv.inward_date || inv.created_at) {
        const d = new Date(inv.inward_date || inv.created_at)
        if (!isNaN(d.getTime())) {
          const mIdx = d.getMonth()
          if (map[mIdx]) {
            map[mIdx].purchase += (parseFloat(inv.total_amount) || 0)
            map[mIdx].inwardCount += 1
          }
        }
      }
    })

    // Populate from Returns / Credit Notes
    returnsList.forEach(ret => {
      const dStr = ret.return_date || ret.created_at
      if (dStr) {
        const d = new Date(dStr)
        if (!isNaN(d.getTime())) {
          const mIdx = d.getMonth()
          if (map[mIdx]) {
            map[mIdx].returns += (parseFloat(ret.refund_amount || ret.total_amount || ret.item_amount || 0) || 0)
            map[mIdx].returnsCount += 1
          }
        }
      }
    })

    return Object.values(map)
  }, [bills, inwards, returnsList])

  // 3. Customer Type Breakdown (Individual vs Company)
  const customerTypeData = useMemo(() => {
    let individualCount = 0
    let individualRevenue = 0
    let companyCount = 0
    let companyRevenue = 0

    filteredBills.forEach(b => {
      const type = (b.customer_type || 'Individual').toLowerCase()
      const amt = parseFloat(b.total_amount) || 0
      if (type.includes('company') || type.includes('business')) {
        companyCount++
        companyRevenue += amt
      } else {
        individualCount++
        individualRevenue += amt
      }
    })

    const total = filteredBills.length || 1
    return [
      { name: 'Individual Customers', value: individualCount, revenue: individualRevenue, percentage: Math.round((individualCount / total) * 100) },
      { name: 'Company / Business', value: companyCount, revenue: companyRevenue, percentage: Math.round((companyCount / total) * 100) }
    ]
  }, [filteredBills])

  // Credit Notes filtered from returns
  const creditNotes = useMemo(() => {
    return filteredReturns.filter(
      r => r.qc_decision === 'REFUND' ||
        (r.resolution_ref && r.resolution_ref.includes('CN')) ||
        parseFloat(r.refund_amount || 0) > 0 ||
        r.credit_note_number
    )
  }, [filteredReturns])

  const totalCreditNoteAmount = useMemo(() => {
    return creditNotes.reduce((acc, cn) => acc + (parseFloat(cn.refund_amount || cn.total_amount || cn.item_amount || 0) || 0), 0)
  }, [creditNotes])

  // 4. Payment Status Breakdown
  const paymentStatusData = useMemo(() => {
    let paidCount = 0
    let pendingCount = 0
    let partialCount = 0

    filteredBills.forEach(b => {
      const st = b.payment_status || 'Paid'
      if (st === 'Paid') paidCount++
      else if (st === 'Pending') pendingCount++
      else if (st === 'Partial') partialCount++
    })

    const total = filteredBills.length || 1
    return [
      { name: 'Paid', value: paidCount, percentage: Math.round((paidCount / total) * 100) },
      { name: 'Pending', value: pendingCount, percentage: Math.round((pendingCount / total) * 100) },
      { name: 'Partial', value: partialCount, percentage: Math.round((partialCount / total) * 100) }
    ].filter(item => item.value > 0)
  }, [filteredBills])

  // 5. Top Selling Materials Ranking
  const topSellingMaterials = useMemo(() => {
    const itemMap = {}

    filteredBills.forEach(b => {
      if (Array.isArray(b.items)) {
        b.items.forEach(it => {
          const name = it.item_name || it.name || 'Unnamed Material'
          const qty = parseFloat(it.quantity) || 1
          const amt = parseFloat(it.amount) || 0
          if (!itemMap[name]) {
            itemMap[name] = { name, quantity: 0, revenue: 0, unit: it.unit || 'NOS' }
          }
          itemMap[name].quantity += qty
          itemMap[name].revenue += amt
        })
      }
    })

    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredBills])

  const handleRefreshDashboard = () => {
    setDateRange({
      preset: 'ALL_TIME',
      startDate: '',
      endDate: '',
      label: 'All Time'
    })
    fetchAllData()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-['Poppins',sans-serif]">

      {/* 1. Executive Header & Live System Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase">
            Executive Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Real-time sales, inventory, and GST overview.
          </p>
        </div>

        {/* Action Shortcuts & Date Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex-1 sm:flex-none">
              <DashboardDateRangePicker
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            </div>

            <button
              type="button"
              onClick={handleRefreshDashboard}
              title="Refresh & Reset Dashboard"
              className="px-2.5 py-2 text-gray-600 dark:text-slate-300 hover:text-[#043486] bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-none transition-colors cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center h-[37px] shrink-0"
            >
              <RotateCcw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setActiveRoute('inward')}
              className="text-xs font-semibold justify-center py-2"
            >
              CREATE NEW INWARD
            </Button>

            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setActiveRoute('create-bill')}
              className="text-xs font-semibold justify-center py-2"
            >
              CREATE OUTWARD BILL
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top 5 High-Impact KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ListKpiCard
          label="Outward Revenue"
          value={`₹ ${metrics.totalOutwardRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${filteredBills.length} Invoices`}
          icon={TrendingUp}
          variant="blue"
          onClick={() => setActiveRoute('all-bills')}
        />

        <ListKpiCard
          label="Inward Stock Cost"
          value={`₹ ${metrics.totalInwardCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${metrics.totalInwardsCount} Purchases`}
          icon={PackageCheck}
          variant="emerald"
          onClick={() => setActiveRoute('inward-reports')}
        />

        <ListKpiCard
          label="GST Tax Collected"
          value={`₹ ${metrics.totalTaxCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${filteredBills.length} Invoices`}
          icon={Percent}
          variant="purple"
          onClick={() => setActiveRoute('all-bills')}
        />

        <ListKpiCard
          label="Pending Dues"
          value={`₹ ${metrics.pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${metrics.pendingBillsCount} Invoices Due`}
          icon={Clock}
          variant="amber"
          onClick={() => setActiveRoute('all-bills')}
        />

        <ListKpiCard
          label="Credit Notes"
          value={`₹ ${totalCreditNoteAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${creditNotes.length} Credit Notes`}
          icon={RotateCcw}
          variant="rose"
          onClick={() => {
            if (setActiveRoute) setActiveRoute('returns')
            navigate('/inventory/returns?tab=credit_notes')
          }}
        />
      </div>

      {/* 3. Visual Charts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main Chart (8 Cols): Monthly Sales vs Inward Purchase Flow */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp size={16} className="shrink-0" />
                <span className="truncate">Monthly Inward vs Outward Movement</span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                Financial comparison between customer sales revenue and supplier inventory expenditure.
              </p>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 border border-gray-200 dark:border-slate-700 rounded-xl w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setChartViewTab('sales_vs_purchase')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer rounded-lg text-center ${
                  chartViewTab === 'sales_vs_purchase'
                    ? 'bg-[#043486] text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Area Trend
              </button>
              <button
                type="button"
                onClick={() => setChartViewTab('monthly_growth')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer rounded-lg text-center ${
                  chartViewTab === 'monthly_growth'
                    ? 'bg-[#043486] text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Bar Compare
              </button>
            </div>
          </div>

          {/* Chart Rendering with Bottom Legend to prevent wave overlap */}
          <div className="h-[300px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewTab === 'sales_vs_purchase' ? (
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#043486" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#043486" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="returnsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                    formatter={(val, name) => [
                      `₹ ${Number(val).toLocaleString('en-IN')}`,
                      name === 'sales' ? 'Outward Sales' : name === 'purchase' ? 'Inward Cost' : 'Returns & Refunds'
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11.5px', fontWeight: 500 }}
                    formatter={(val) =>
                      val === 'sales'
                        ? 'Outward Sales (₹)'
                        : val === 'purchase'
                          ? 'Inward Purchases (₹)'
                          : 'Returns & Refunds (₹)'
                    }
                  />
                  <Area type="monotone" dataKey="sales" stroke="#043486" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" name="sales" />
                  <Area type="monotone" dataKey="purchase" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#purchaseGrad)" name="purchase" />
                  <Area type="monotone" dataKey="returns" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#returnsGrad)" name="returns" />
                </AreaChart>
              ) : (
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val, name) => [
                      `₹ ${Number(val).toLocaleString('en-IN')}`,
                      name === 'sales' ? 'Outward Sales' : name === 'purchase' ? 'Inward Cost' : 'Returns & Refunds'
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="square"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11.5px', fontWeight: 500 }}
                    formatter={(val) =>
                      val === 'sales'
                        ? 'Outward Sales (₹)'
                        : val === 'purchase'
                          ? 'Inward Purchases (₹)'
                          : 'Returns & Refunds (₹)'
                    }
                  />
                  <Bar dataKey="sales" fill="#043486" name="sales" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchase" fill="#0d9488" name="purchase" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returns" fill="#e11d48" name="returns" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart (4 Cols): Customer Type & Payment Breakdowns */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <Users size={16} className="shrink-0" />
                <span className="truncate">Segment Ratio</span>
              </h2>

              {/* Toggle Tab */}
              <div className="flex items-center text-[10px] font-bold bg-gray-100 dark:bg-slate-800 p-0.5 border border-gray-200 dark:border-slate-700 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setPieTab('customer_type')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${pieTab === 'customer_type' ? 'bg-[#043486] text-white shadow-xs' : 'text-gray-600 dark:text-slate-400'
                    }`}
                >
                  Party Type
                </button>
                <button
                  type="button"
                  onClick={() => setPieTab('payment_status')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${pieTab === 'payment_status' ? 'bg-[#043486] text-white shadow-xs' : 'text-gray-600 dark:text-slate-400'
                    }`}
                >
                  Payment
                </button>
              </div>
            </div>

            {/* Donut Visual */}
            <div className="h-[180px] w-full mt-2 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieTab === 'customer_type' ? customerTypeData : paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(pieTab === 'customer_type' ? customerTypeData : paymentStatusData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', marginTop: '120px' }}
                    formatter={(val, name) => [`${val} Invoices`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Counter */}
              <div className="absolute text-center pointer-events-none">
                <span className="text-lg font-black text-[#292424] dark:text-white font-mono leading-none">
                  {bills.length}
                </span>
                <span className="block text-[9.5px] uppercase tracking-wider text-gray-400 font-bold">
                  Total
                </span>
              </div>
            </div>

            {/* Legend Stats */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              {(pieTab === 'customer_type' ? customerTypeData : paymentStatusData).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-gray-700 dark:text-slate-300 font-medium truncate max-w-[150px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-[#292424] dark:text-white">{item.value}</span>
                    <span className="text-[10.5px] text-gray-400">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Top Selling Materials & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Top 5 Products / Materials (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <Boxes size={16} />
                <span>Top Selling Materials by Revenue</span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                High-performance inventory items in outward billing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveRoute('materials')}
              className="text-xs font-semibold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer"
            >
              All Materials →
            </button>
          </div>

          <div className="space-y-3.5">
            {topSellingMaterials.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No material sales recorded yet.</p>
            ) : (
              topSellingMaterials.map((mat, idx) => {
                const maxRevenue = topSellingMaterials[0]?.revenue || 1
                const percent = Math.min(100, Math.round((mat.revenue / maxRevenue) * 100))
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-md flex items-center justify-center font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-[#292424] dark:text-white truncate max-w-[220px]">
                          {mat.name}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-[#043486] dark:text-blue-400">
                          ₹ {mat.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-1.5 font-sans">
                          ({mat.quantity} {mat.unit})
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#043486] to-[#0284c7] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Workflows & System Health (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <CreditCard size={16} />
                <span>Quick Operations &amp; Workflows</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 border border-emerald-200 dark:border-emerald-800 rounded-md">
                System Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => setActiveRoute('add-material')}
                className="p-3.5 bg-gray-50 dark:bg-slate-950 hover:bg-purple-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 hover:border-purple-600 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#292424] dark:text-white group-hover:text-purple-600">
                    Add Material / Good
                  </span>
                  <ArrowUpRight size={14} className="text-gray-400 group-hover:text-purple-600" />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Catalog items, pricing &amp; HSN codes</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveRoute('/services/new')}
                className="p-3.5 bg-gray-50 dark:bg-slate-950 hover:bg-cyan-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 hover:border-cyan-600 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#292424] dark:text-white group-hover:text-cyan-600">
                    New Service Request
                  </span>
                  <ArrowUpRight size={14} className="text-gray-400 group-hover:text-cyan-600" />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Device intake &amp; repair booking entry</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveRoute('categories')}
                className="p-3.5 bg-gray-50 dark:bg-slate-950 hover:bg-amber-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 hover:border-amber-600 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#292424] dark:text-white group-hover:text-amber-600">
                    Add Categories
                  </span>
                  <ArrowUpRight size={14} className="text-gray-400 group-hover:text-amber-600" />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Manage item groups &amp; service types</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveRoute('inventory')}
                className="p-3.5 bg-gray-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 hover:border-emerald-600 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#292424] dark:text-white group-hover:text-emerald-600">
                    Stock &amp; Inventory
                  </span>
                  <ArrowUpRight size={14} className="text-gray-400 group-hover:text-emerald-600" />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Live stock overview, serials &amp; scrap</p>
              </button>
            </div>
          </div>

          {/* Low Stock Alert Strip */}
          {metrics.lowStockMaterials.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    Low Stock Alert ({metrics.lowStockMaterials.length} Items)
                  </p>
                  <p className="text-[10.5px] text-rose-600 dark:text-rose-400">
                    {metrics.lowStockMaterials.map(m => m.name).slice(0, 2).join(', ')}{metrics.lowStockMaterials.length > 2 ? '...' : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRoute('inventory')}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] rounded-lg transition-colors cursor-pointer"
              >
                Manage Stock
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 5. Side-by-Side Inward & Outward Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Side: Recent Inward Purchases */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                  <PackageCheck size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Recent Inwards
                  </h2>
                  <p className="text-[10.5px] text-gray-400 dark:text-slate-500">
                    Latest supplier inward purchases
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRoute('inward-list')}
                className="text-xs font-bold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All Inwards</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Inward ID</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Total Amt</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-gray-700 dark:text-slate-300">
                  {inwards.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 text-xs">
                        No inward purchases recorded yet. Click &quot;New Inward&quot; to add.
                      </td>
                    </tr>
                  ) : (
                    inwards.slice(0, 6).map((inw) => (
                      <tr key={inw.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#043486] dark:text-blue-400 whitespace-nowrap">
                          {inw.inward_number}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 dark:text-white font-semibold truncate max-w-[130px]" title={inw.supplier_name || inw.supplier || '-'}>
                          {inw.supplier_name || inw.supplier || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400 whitespace-nowrap font-medium text-[11px]">
                          {inw.inward_date
                            ? new Date(inw.inward_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : inw.created_at
                              ? new Date(inw.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          ₹{parseFloat(inw.total_amount || inw.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <ActionButton
                            type="view"
                            onClick={() => setActiveRoute(`/inward/edit/${inw.id}`)}
                            title="View / Edit Inward"
                            className="!text-[#043486] dark:!text-blue-400 hover:!bg-blue-50 dark:hover:!bg-slate-800"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Recent Outward Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <Receipt size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Recent Outwards
                  </h2>
                  <p className="text-[10.5px] text-gray-400 dark:text-slate-500">
                    Latest sales &amp; customer billing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRoute('all-bills')}
                className="text-xs font-bold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All Outwards</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Invoice ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Total Amt</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-gray-700 dark:text-slate-300">
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 text-xs">
                        No outward invoices recorded yet. Click &quot;Create Outward Bill&quot; to generate.
                      </td>
                    </tr>
                  ) : (
                    bills.slice(0, 6).map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#043486] dark:text-blue-400 whitespace-nowrap">
                          {bill.invoice_number}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 dark:text-white font-semibold truncate max-w-[130px]">
                          {bill.customer_name}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400 whitespace-nowrap font-medium text-[11px]">
                          {bill.invoice_date
                            ? new Date(bill.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          ₹{parseFloat(bill.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <ActionButton
                            type="view"
                            onClick={() => handleOpenBillModal(bill)}
                            title="View Invoice Preview & Print"
                            className="!text-[#043486] dark:!text-blue-400 hover:!bg-blue-50 dark:hover:!bg-slate-800"
                          />
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

      {/* 5.2 Side-by-Side Recent Services & Recent Credit Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Side: Recent Services List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900 rounded-lg">
                  <Wrench size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Recent Services
                  </h2>
                  <p className="text-[10.5px] text-gray-400 dark:text-slate-500">
                    Latest device repairs &amp; customer services
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRoute('/services/list')}
                className="text-xs font-bold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All Services</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 whitespace-nowrap">Service ID</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Customer</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Total Amt</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-gray-700 dark:text-slate-300">
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 text-xs">
                        No service requests recorded yet. Click &quot;New Service Request&quot; to add.
                      </td>
                    </tr>
                  ) : (
                    services.slice(0, 6).map((serv) => (
                      <tr key={serv.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#043486] dark:text-blue-400 whitespace-nowrap">
                          {serv.service_number || `SRV-${serv.id}`}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 dark:text-white font-semibold truncate max-w-[130px]" title={serv.customer_name || '-'}>
                          {serv.customer_name || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400 whitespace-nowrap font-medium text-[11px]">
                          {serv.service_date
                            ? new Date(serv.service_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : serv.created_at
                              ? new Date(serv.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          ₹{parseFloat(serv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <ActionButton
                            type="view"
                            onClick={() => setActiveRoute('/services/list')}
                            title="View Service Details"
                            className="!text-[#043486] dark:!text-blue-400 hover:!bg-blue-50 dark:hover:!bg-slate-800"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Recent Credit Notes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900 rounded-lg">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Recent Credit Notes
                  </h2>
                  <p className="text-[10.5px] text-gray-400 dark:text-slate-500">
                    Customer refund &amp; credit note records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setActiveRoute) setActiveRoute('returns')
                  navigate('/inventory/returns?tab=credit_notes')
                }}
                className="text-xs font-bold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All Credit Notes</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 whitespace-nowrap">Return ID</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Invoice ID</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Customer</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Refund Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-gray-700 dark:text-slate-300">
                  {creditNotes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 text-xs">
                        No credit notes generated yet.
                      </td>
                    </tr>
                  ) : (
                    creditNotes.slice(0, 6).map((cn) => (
                      <tr key={cn.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700 dark:text-purple-400 whitespace-nowrap">
                          {cn.return_number}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-700 dark:text-slate-300 whitespace-nowrap font-medium">
                          {cn.bill_number || cn.invoice_number || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400 whitespace-nowrap font-medium text-[11px]">
                          {cn.return_date
                            ? new Date(cn.return_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 dark:text-white font-semibold truncate max-w-[120px]">
                          {cn.customer_name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          ₹{parseFloat(cn.refund_amount || cn.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      {/* 6. Invoice Preview & Print Modal */}
      {selectedBillForPreview && (
        <InvoiceModal
          isOpen={Boolean(selectedBillForPreview)}
          onClose={() => setSelectedBillForPreview(null)}
          bill={selectedBillForPreview}
          settings={settings}
        />
      )}

    </div>
  )
}
