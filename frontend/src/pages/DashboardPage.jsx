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
  CreditCard
} from 'lucide-react'
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
import { API_ENDPOINTS } from '../config/api'

const PIE_COLORS = ['#043486', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function DashboardPage({ setActiveRoute: setActiveRouteProp }) {
  const navigate = useNavigate()

  const setActiveRoute = (route) => {
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
  const [settings, setSettings] = useState(null)
  const [selectedBillForPreview, setSelectedBillForPreview] = useState(null)
  const [chartViewTab, setChartViewTab] = useState('sales_vs_purchase') // 'sales_vs_purchase' | 'monthly_growth'
  const [pieTab, setPieTab] = useState('customer_type') // 'customer_type' | 'payment_status'

  // Fetch all dashboard data
  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      const [billsRes, inwRes, matRes, catRes, setRes] = await Promise.all([
        fetch(API_ENDPOINTS.BILLS).then(r => r.json()).catch(() => ({ bills: [] })),
        fetch(API_ENDPOINTS.INWARDS).then(r => r.json()).catch(() => ({ inwards: [] })),
        fetch(API_ENDPOINTS.MATERIALS).then(r => r.json()).catch(() => ({ materials: [] })),
        fetch(API_ENDPOINTS.CATEGORIES).then(r => r.json()).catch(() => ({ categories: [] })),
        fetch(API_ENDPOINTS.SETTINGS).then(r => r.json()).catch(() => ({ settings: null }))
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
    } catch (err) {
      console.error('Error fetching dashboard summary:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // 1. Calculated KPI Summary Metrics
  const metrics = useMemo(() => {
    const totalOutwardRevenue = bills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const totalInwardCost = inwards.reduce((acc, i) => acc + (parseFloat(i.total_amount) || 0), 0)
    const paidBills = bills.filter(b => b.payment_status === 'Paid')
    const pendingBills = bills.filter(b => b.payment_status === 'Pending')
    const partialBills = bills.filter(b => b.payment_status === 'Partial')
    
    const paidAmount = paidBills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const pendingAmount = pendingBills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const totalTaxCollected = bills.reduce((acc, b) => acc + (parseFloat(b.total_tax) || 0), 0)

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
      totalInwardsCount: inwards.length
    }
  }, [bills, inwards, materials])

  // 2. Monthly Trend Data for Area / Bar Charts (Last 6-12 Months)
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Initialize map for 12 months
    const map = {}
    months.forEach((m, idx) => {
      map[idx] = { month: m, sales: 0, purchase: 0, billsCount: 0, inwardCount: 0 }
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

    return Object.values(map)
  }, [bills, inwards])

  // 3. Customer Type Breakdown (Individual vs Company)
  const customerTypeData = useMemo(() => {
    let individualCount = 0
    let individualRevenue = 0
    let companyCount = 0
    let companyRevenue = 0

    bills.forEach(b => {
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

    const total = bills.length || 1
    return [
      { name: 'Individual Customers', value: individualCount, revenue: individualRevenue, percentage: Math.round((individualCount / total) * 100) },
      { name: 'Company / Business', value: companyCount, revenue: companyRevenue, percentage: Math.round((companyCount / total) * 100) }
    ]
  }, [bills])

  // 4. Payment Status Breakdown
  const paymentStatusData = useMemo(() => {
    let paidCount = 0
    let pendingCount = 0
    let partialCount = 0

    bills.forEach(b => {
      const st = b.payment_status || 'Paid'
      if (st === 'Paid') paidCount++
      else if (st === 'Pending') pendingCount++
      else if (st === 'Partial') partialCount++
    })

    const total = bills.length || 1
    return [
      { name: 'Paid', value: paidCount, percentage: Math.round((paidCount / total) * 100) },
      { name: 'Pending', value: pendingCount, percentage: Math.round((pendingCount / total) * 100) },
      { name: 'Partial', value: partialCount, percentage: Math.round((partialCount / total) * 100) }
    ].filter(item => item.value > 0)
  }, [bills])

  // 5. Top Selling Materials Ranking
  const topSellingMaterials = useMemo(() => {
    const itemMap = {}

    bills.forEach(b => {
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
  }, [bills])

  const handleOpenBillModal = (bill) => {
    setSelectedBillForPreview(bill)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-['Poppins',sans-serif]">
      
      {/* 1. Executive Header & Live System Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase">
            Executive Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Real-time sales, inventory, and GST overview.
          </p>
        </div>

        {/* Action Shortcuts & Date */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
            <Calendar size={14} className="text-[#043486] dark:text-blue-400" />
            <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>

          <button
            type="button"
            onClick={fetchAllData}
            title="Refresh Dashboard Data"
            className="p-2 text-gray-600 dark:text-slate-300 hover:text-[#043486] bg-gray-50 dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setActiveRoute('inward')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>New Inward</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoute('create-bill')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Plus size={14} />
            <span>Create Outward Bill</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 High-Impact KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Outward Revenue */}
        <div 
          onClick={() => setActiveRoute('all-bills')}
          className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm hover:border-[#043486] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors">
              Outward Revenue
            </span>
            <div className="w-8 h-8 rounded-none bg-[#043486]/10 text-[#043486] dark:text-blue-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-[#292424] dark:text-white font-mono tracking-tight">
              ₹ {metrics.totalOutwardRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              <span>{bills.length} Invoices</span>
              <span className="text-emerald-600 font-semibold">{metrics.paidBillsCount} Paid</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Inward Purchases */}
        <div 
          onClick={() => setActiveRoute('inward-reports')}
          className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm hover:border-teal-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-teal-600 transition-colors">
              Inward Stock Cost
            </span>
            <div className="w-8 h-8 rounded-none bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PackageCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-[#292424] dark:text-white font-mono tracking-tight">
              ₹ {metrics.totalInwardCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              <span>{metrics.totalInwardsCount} Purchases</span>
              <span className="text-teal-600 font-semibold">Warehouse In</span>
            </div>
          </div>
        </div>

        {/* KPI 3: GST Tax Collected */}
        <div 
          onClick={() => setActiveRoute('all-bills')}
          className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm hover:border-purple-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-purple-600 transition-colors">
              GST Tax Collected
            </span>
            <div className="w-8 h-8 rounded-none bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-[#292424] dark:text-white font-mono tracking-tight">
              ₹ {metrics.totalTaxCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              <span>CGST / SGST / IGST</span>
              <span className="text-purple-600 font-semibold">Ready Filing</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Pending Receivables */}
        <div 
          onClick={() => setActiveRoute('all-bills')}
          className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-amber-600 transition-colors">
              Pending Dues
            </span>
            <div className="w-8 h-8 rounded-none bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-[#292424] dark:text-white font-mono tracking-tight">
              ₹ {metrics.pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              <span className="text-amber-600 font-semibold">{metrics.pendingBillsCount} Invoices Due</span>
              <span>Receivables</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Active Warehouse Stock */}
        <div 
          onClick={() => setActiveRoute('inventory')}
          className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-blue-600 transition-colors">
              Active Materials
            </span>
            <div className="w-8 h-8 rounded-none bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Boxes size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-[#292424] dark:text-white font-mono tracking-tight">
              {metrics.activeMaterialsCount} <span className="text-xs font-normal text-gray-400">Items</span>
            </h3>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              <span>{categories.length} Categories</span>
              {metrics.lowStockMaterials.length > 0 ? (
                <span className="text-rose-500 font-bold">{metrics.lowStockMaterials.length} Low Stock</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Stock Healthy</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Visual Charts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Chart (8 Cols): Monthly Sales vs Inward Purchase Flow */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp size={16} />
                <span>Monthly Inward vs Outward Movement</span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                Financial comparison between customer sales revenue and supplier inventory expenditure.
              </p>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 border border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setChartViewTab('sales_vs_purchase')}
                className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  chartViewTab === 'monthly_growth'
                    ? 'bg-[#043486] text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Bar Compare
              </button>
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewTab === 'sales_vs_purchase' ? (
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#043486" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#043486" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                    formatter={(val, name) => [`₹ ${Number(val).toLocaleString('en-IN')}`, name === 'sales' ? 'Outward Sales' : 'Inward Cost']}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={30} 
                    iconType="circle" 
                    iconSize={8}
                    formatter={(val) => val === 'sales' ? 'Outward Sales (₹)' : 'Inward Purchases (₹)'}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#043486" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" name="sales" />
                  <Area type="monotone" dataKey="purchase" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#purchaseGrad)" name="purchase" />
                </AreaChart>
              ) : (
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px' }}
                    formatter={(val, name) => [`₹ ${Number(val).toLocaleString('en-IN')}`, name === 'sales' ? 'Outward Sales' : 'Inward Cost']}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={30} 
                    iconType="square" 
                    iconSize={8}
                    formatter={(val) => val === 'sales' ? 'Outward Sales (₹)' : 'Inward Purchases (₹)'}
                  />
                  <Bar dataKey="sales" fill="#043486" name="sales" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="purchase" fill="#0d9488" name="purchase" radius={[0, 0, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart (4 Cols): Customer Type & Payment Breakdowns */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <Users size={16} />
                <span>Segment Ratio</span>
              </h2>

              {/* Toggle Tab */}
              <div className="flex items-center text-[10px] font-bold bg-gray-100 dark:bg-slate-800 p-0.5 border border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPieTab('customer_type')}
                  className={`px-2 py-0.5 transition-colors cursor-pointer ${
                    pieTab === 'customer_type' ? 'bg-[#043486] text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  Party Type
                </button>
                <button
                  type="button"
                  onClick={() => setPieTab('payment_status')}
                  className={`px-2 py-0.5 transition-colors cursor-pointer ${
                    pieTab === 'payment_status' ? 'bg-[#043486] text-white' : 'text-gray-600 dark:text-slate-400'
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
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px' , marginTop: '120px'}}
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
                      className="w-2.5 h-2.5 inline-block shrink-0" 
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
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
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
                        <span className="w-5 h-5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
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
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#043486] to-[#0284c7] transition-all duration-500" 
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
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <CreditCard size={16} />
                <span>Quick Operations &amp; Workflows</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                System Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => setActiveRoute('create-bill')}
                className="p-3.5 bg-gray-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 hover:border-[#043486] text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#292424] dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400">
                    Create Outward Bill
                  </span>
                  <ArrowUpRight size={14} className="text-gray-400 group-hover:text-[#043486]" />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">GST Invoice &amp; Payment Receipt generation</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveRoute('inward')}
                className="p-3.5 bg-gray-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 hover:border-teal-600 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#292424] dark:text-white group-hover:text-teal-600">
                    New Inward Stock
                  </span>
                  <ArrowUpRight size={14} className="text-gray-400 group-hover:text-teal-600" />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Supplier bill entry with serial tracking</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveRoute('add-material')}
                className="p-3.5 bg-gray-50 dark:bg-slate-950 hover:bg-purple-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 hover:border-purple-600 text-left transition-all group cursor-pointer"
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
                onClick={() => setActiveRoute('system-settings')}
                className="p-3.5 bg-gray-50 dark:bg-slate-950 hover:bg-amber-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 hover:border-amber-600 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#292424] dark:text-white group-hover:text-amber-600">
                    System Settings
                  </span>
                  <ArrowUpRight size={14} className="text-gray-400 group-hover:text-amber-600" />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Signatures, numbering prefixes &amp; taxes</p>
              </button>
            </div>
          </div>

          {/* Low Stock Alert Strip */}
          {metrics.lowStockMaterials.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
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
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] transition-colors cursor-pointer"
              >
                Manage Stock
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 5. Recent Outward Invoices Live Table */}
      <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
              <Receipt size={16} />
              <span>Recent Outward Invoices</span>
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Live customer billing activity log with instant preview and print access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveRoute('all-bills')}
            className="text-xs font-semibold text-[#043486] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Outward Invoices</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Customer / Company</th>
                <th className="py-3 px-3 text-center">Party Type</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Tax (₹)</th>
                <th className="py-3 px-3 text-right">Total Amount (₹)</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No outward invoices recorded yet. Click &quot;Create Outward Bill&quot; to generate.
                  </td>
                </tr>
              ) : (
                bills.slice(0, 6).map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#043486] dark:text-blue-400">
                      {bill.invoice_number}
                    </td>
                    <td className="py-3 px-3 text-[#292424] dark:text-white font-semibold">
                      {bill.customer_name}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[9.5px] font-bold uppercase ${
                        (bill.customer_type || '').toLowerCase().includes('company')
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                      }`}>
                        {bill.customer_type || 'Individual'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 dark:text-slate-400 font-medium">
                      {new Date(bill.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-600 dark:text-slate-400">
                      ₹ {parseFloat(bill.total_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#292424] dark:text-white">
                      ₹ {parseFloat(bill.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                        bill.payment_status === 'Paid'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : bill.payment_status === 'Partial'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                          : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                      }`}>
                        {bill.payment_status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenBillModal(bill)}
                        className="p-1.5 text-[#043486] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="View Invoice Preview & Print"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
