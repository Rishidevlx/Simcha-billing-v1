import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  PackagePlus,
  Receipt,
  Wrench,
  RotateCcw,
  ExternalLink,
  User,
  Building2,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Users,
  BookOpen
} from '../components/common/icons'
import ListPageHeader from '../components/common/ListPageHeader'
import ArrowNavTabs from '../components/common/ArrowNavTabs'

// Sleek, vector-sharp professional flowchart arrow with comfortable vertical breathing room
function FlowArrow({ className = "h-8" }) {
  return (
    <div className={`flex items-center justify-center ${className} my-1 shrink-0`}>
      <svg width="10" height="28" viewBox="0 0 10 28" fill="none" className="text-slate-400 dark:text-slate-500 overflow-visible">
        <line x1="5" y1="0" x2="5" y2="21" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M2 17.5L5 21.5L8 17.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// Pixel-perfect dual branch splitter (25% left, 75% right) with spacious vertical stems
function BranchSplit() {
  return (
    <div className="w-full flex flex-col items-center my-1">
      {/* Top stem from diamond */}
      <div className="w-[1.25px] h-3 bg-slate-400 dark:bg-slate-500" />
      {/* Horizontal connector bar from 25% (left col center) to 75% (right col center) */}
      <div className="w-1/2 h-[1.25px] bg-slate-400 dark:bg-slate-500 relative">
        {/* Left drop arrow at exactly 25% */}
        <div className="absolute left-0 top-0 flex flex-col items-center -translate-x-1/2">
          <div className="w-[1.25px] h-3.5 bg-slate-400 dark:bg-slate-500" />
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="text-slate-400 dark:text-slate-500 -mt-0.5">
            <path d="M1 1.5L4 4.5L7 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Right drop arrow at exactly 75% */}
        <div className="absolute right-0 top-0 flex flex-col items-center translate-x-1/2">
          <div className="w-[1.25px] h-3.5 bg-slate-400 dark:bg-slate-500" />
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="text-slate-400 dark:text-slate-500 -mt-0.5">
            <path d="M1 1.5L4 4.5L7 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {/* Vertical spacing for drop arrows */}
      <div className="h-4" />
    </div>
  )
}

// Pixel-perfect dual branch merger (from 25% & 75% down to center) with spacious vertical stems
function BranchMerge() {
  return (
    <div className="w-full flex flex-col items-center my-1">
      {/* Top vertical stems coming down from 25% and 75% */}
      <div className="w-1/2 relative h-3.5">
        <div className="absolute left-0 top-0 w-[1.25px] h-3.5 bg-slate-400 dark:bg-slate-500 -translate-x-1/2" />
        <div className="absolute right-0 top-0 w-[1.25px] h-3.5 bg-slate-400 dark:bg-slate-500 translate-x-1/2" />
      </div>
      {/* Horizontal merge bar */}
      <div className="w-1/2 h-[1.25px] bg-slate-400 dark:bg-slate-500" />
      {/* Center bottom arrow going into next step / oval */}
      <div className="flex flex-col items-center">
        <div className="w-[1.25px] h-3 bg-slate-400 dark:bg-slate-500" />
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="text-slate-400 dark:text-slate-500 -mt-0.5">
          <path d="M1 1.5L4 4.5L7 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default function UserManualPage() {
  const navigate = useNavigate()

  // 6 Main Tabs
  const [activeTab, setActiveTab] = useState('setup')

  const TABS = [
    { id: 'setup', label: '1. How to Set Up?' },
    { id: 'product', label: '2. How to Add a Product?' },
    { id: 'quotation', label: '3. How to Create a Quotation?' },
    { id: 'billing', label: '4. How to Create a Bill?' },
    { id: 'service', label: '5. How to Bill a Service?' },
    { id: 'returns', label: '6. How to Return a Product?' },
    { id: 'roles_users', label: '7. How to Manage Roles & Users?' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 transition-colors font-['Poppins',sans-serif]">

      {/* 1. Header with Icon, Heading and Subtitle */}
      <ListPageHeader
        title="USER GUIDANCE MANUAL"
        subtitle="Simple step-by-step guidance, module workflows, and operational flowcharts."
        icon={BookOpen}
      />

      {/* 2. Velzon Arrow Nav Steps Tabs */}
      <ArrowNavTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ================= TAB 1: HOW TO SET UP? ================= */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">

          {/* LEFT SIDE: Simple, Clean Headings & Spacious Crisp Points */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-9">

            {/* Section 1: Profile Settings */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/settings/profile')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">1</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Profile Settings
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Admin Identity:</b> Set your display name and choose your preferred profile Avatar (Male / Female / Default).</li>
                <li><b>Email Address:</b> Used for system identification and transactional email notifications.</li>
                <li><b>Password Change:</b> Easily update your login password by entering current password and setting a new one.</li>
              </ul>
            </div>

            {/* Section 2: System Settings */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/settings/system')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">2</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    System Settings
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Company Details:</b> Enter Company Name, 15-digit GSTIN, Address, Phone, and Canara Bank Details.</li>
                <li><b>Seal &amp; Signature:</b> Upload Authorized Signatory round seal and signature image for automated invoice printing.</li>
                <li><b>Dynamic Numbering:</b> Set custom Prefix, Financial Year (e.g. 2026-27), and Starting Number for Invoices, Receipts, Services, Returns &amp; Credit Notes.</li>
                <li><b>Tax Percentages:</b> Set standard CGST (9%), SGST (9%), IGST (18%), and default Invoice Due Date period (15 days).</li>
                <li><b>Terms &amp; Conditions &amp; Return Policy:</b> Add or remove invoice terms clauses and configure the return window duration (e.g. 7 or 10 days) with an editable dynamic bill clause.</li>
              </ul>
            </div>

            {/* Section 3: Configurations Settings */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/settings/configurations')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">3</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Configurations Settings
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Gmail SMTP Setup:</b> Enter Gmail address and 16-digit Google App Password for instant 1-click invoice emailing.</li>
                <li><b>Cloudinary Storage:</b> Connect Cloudinary API to securely store bank QR codes, seal images &amp; supplier purchase scans.</li>
              </ul>
            </div>

          </div>

          {/* RIGHT SIDE: Spacious Clear Flowchart Diagram with Full-Height Center Divider */}
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-start">

            <div className="w-full max-w-sm flex flex-col items-center space-y-2 sticky top-6">

              {/* START OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-[#043486] bg-blue-50 dark:bg-slate-800 text-center font-bold text-xs sm:text-[13px] text-[#043486] dark:text-blue-300 shadow-2xs">
                Start System Setup
              </div>

              <FlowArrow />

              {/* STEP 1 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                1. Update Profile &amp; Password
              </div>

              <FlowArrow />

              {/* STEP 2 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                2. Enter Company GSTIN &amp; Bank Details
              </div>

              <FlowArrow />

              {/* DECISION DIAMOND */}
              <div className="relative flex items-center justify-center w-38 h-22 my-1">
                <svg className="w-full h-full" viewBox="0 0 144 80" fill="none">
                  <polygon
                    points="72,2 141,40 72,78 3,40"
                    className="fill-amber-50/70 dark:fill-slate-800/80 stroke-slate-700 dark:stroke-slate-300"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-center text-slate-800 dark:text-slate-100 px-4 leading-tight">
                  Upload Seal &amp; Signature?
                </span>
              </div>

              {/* ARROW WITH LABEL */}
              <div className="relative flex flex-col items-center">
                <FlowArrow className="h-9" />
                <span className="absolute left-1/2 ml-2.5 top-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-xs whitespace-nowrap shadow-2xs">
                  Yes / Configured
                </span>
              </div>

              {/* STEP 3 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                3. Set Dynamic Bill &amp; Credit Note Numbering
              </div>

              <FlowArrow />

              {/* STEP 4 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                4. Configure Email SMTP &amp; Cloudinary
              </div>

              <FlowArrow />

              {/* END OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-center font-bold text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-300 shadow-2xs">
                System Ready for Billing (End)
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 2: HOW TO ADD A PRODUCT? ================= */}
      {activeTab === 'product' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">

          {/* LEFT SIDE: Simple, Clean Headings & Spacious Crisp Points */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-9">

            {/* Step 1: Create Category */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/categories')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">1</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Create Category
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Department Classification:</b> Create organized groups for products (e.g., <em>Hardware, Accessories, Toners, Spare Parts</em>).</li>
                <li><b>Visual Hierarchy:</b> Allows fast filtering when generating customer invoices and viewing inventory.</li>
              </ul>
            </div>

            {/* Step 2: Add Material */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/materials/add')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">2</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Add Material (To Category)
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Catalog Definition:</b> Select parent Category, enter Material Name, Brand, Unit (Pcs, Box, Set), and HSN/SAC Code.</li>
                <li><b>Pricing &amp; Tax:</b> Define standard selling rate and applicable GST percentage.</li>
                <li><b>Returnable Flag:</b> Enable &quot;Return Policy Enabled&quot; toggle if the item is eligible for customer returns.</li>
              </ul>
            </div>

            {/* Step 3: Inward Purchase Entry */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/inward')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">3</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Inward (Stock Inward Entry)
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Stock Inward:</b> Record supplier purchase invoice number, date, and incoming quantity.</li>
                <li><b>Batch &amp; Unit Cost:</b> Record purchase unit price and batch identifiers for accounting.</li>
                <li><b>Automatic Stock Increase:</b> Submitting Inward automatically increments warehouse inventory stock count.</li>
              </ul>
            </div>

            {/* Step 4: All Materials */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/materials')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">4</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    All Materials (Product Catalog)
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Master List:</b> View, search, and edit all created items, HSN codes, categories, and selling prices.</li>
                <li><b>Status Toggle:</b> Enable or disable active status for seasonal or discontinued products.</li>
              </ul>
            </div>

            {/* Step 5: Stock & Inventory */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/inventory')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">5</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Stock &amp; Inventory (Real-Time Balance)
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Live Stock Levels:</b> View total inward received, total outward billed, returned items, and real-time available stock balance.</li>
                <li><b>Low Stock Alerts:</b> Instant visual indicators alert you when an item reaches low stock thresholds.</li>
              </ul>
            </div>

          </div>

          {/* RIGHT SIDE: Spacious Clear Flowchart Diagram with Full-Height Center Divider */}
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-start">

            <div className="w-full max-w-sm flex flex-col items-center space-y-2 sticky top-6">

              {/* START OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-[#043486] bg-blue-50 dark:bg-slate-800 text-center font-bold text-xs sm:text-[13px] text-[#043486] dark:text-blue-300 shadow-2xs">
                Start Product Creation
              </div>

              <FlowArrow />

              {/* STEP 1 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                1. Create Category
              </div>

              <FlowArrow />

              {/* STEP 2 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                2. Add Material to Category
              </div>

              <FlowArrow />

              {/* STEP 3 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                3. Inward Purchase Entry (Add Stock)
              </div>

              <FlowArrow />

              {/* STEP 4 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                4. Check Products in All Materials
              </div>

              <FlowArrow />

              {/* STEP 5 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                5. Check Available Stock in Inventory
              </div>

              <FlowArrow />

              {/* END OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-center font-bold text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-300 shadow-2xs">
                Ready for Billing (End)
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 3: HOW TO CREATE A QUOTATION? ================= */}
      {activeTab === 'quotation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">

          {/* LEFT SIDE: Simple, Clean Headings & Spacious Crisp Points */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-9">

            {/* Step 1: Create Quotation */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/quotations')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">1</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Create Outward Quotation
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Estimate Generation:</b> Enter Customer Details, Quotation Date, and Validity Period (e.g., 15 Days).</li>
                <li><b>Line Items &amp; Serials:</b> Select products, rates, discounts, taxes, and optional serial numbers.</li>
                <li><b>Zero Stock Deduction:</b> Quotations generate formal estimates <i>without</i> locking or deducting warehouse inventory stock.</li>
                <li><b>Custom Quotation Terms:</b> Auto-loads specific Quotation Terms &amp; Conditions from System Settings.</li>
              </ul>
            </div>

            {/* Step 2: Quotations List & Management */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/quotations/list')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">2</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Quotations Registry &amp; Sharing
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Lifecycle Tracking:</b> Filter and manage quotations across Draft, Sent, Approved, Converted, and Cancelled stages.</li>
                <li><b>PDF &amp; Email:</b> Instantly print, download thermal/A4 quotation slip, or email PDF directly to customer.</li>
              </ul>
            </div>

            {/* Step 3: Convert to Invoice */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/quotations/list')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">3</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    Customer Approval &amp; Auto Convert to Invoice
                  </h2>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>One-Click Conversion:</b> Once customer approves, click <b>"Convert to Invoice"</b> in Quotations List.</li>
                <li><b>Automatic Sales Invoice Creation:</b> System instantly generates official Sales Invoice number (e.g., <code>SIS/10/2026-27/0015</code>).</li>
                <li><b>Outward List Addition:</b> The generated invoice is automatically registered in <b>Outward List</b> with full billing records.</li>
                <li><b>Automatic Stock &amp; Serial Update:</b> Warehouse stock is deducted, movement is recorded in Stock Ledger, and serial numbers are marked as <b>Sold</b>!</li>
              </ul>
            </div>

          </div>

          {/* RIGHT SIDE: Flowchart Diagram */}
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-start">

            <div className="w-full max-w-sm flex flex-col items-center space-y-2 sticky top-6">

              {/* START OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-[#043486] bg-blue-50 dark:bg-slate-800 text-center font-bold text-xs sm:text-[13px] text-[#043486] dark:text-blue-300 shadow-2xs">
                Start Quotation
              </div>

              <FlowArrow />

              {/* STEP 1 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                1. Create Quotation (Price Estimate)
              </div>

              <FlowArrow />

              {/* STEP 2 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                2. Send Quotation PDF to Customer
              </div>

              <FlowArrow />

              {/* DECISION DIAMOND */}
              <div className="w-48 py-2.5 px-3 border border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-center text-xs font-bold text-amber-800 dark:text-amber-300 rotate-0 shadow-2xs">
                Customer Approves Price?
              </div>

              <BranchSplit />

              {/* DUAL BRANCH RECTANGLES */}
              <div className="w-full grid grid-cols-2 gap-3 px-1">
                {/* Left Branch (Rejected/Cancelled) */}
                <div className="p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span className="text-red-500 font-bold block mb-0.5">NO</span>
                  Quotation Marked as Cancelled / Expired
                </div>

                {/* Right Branch (Approved & Convert) */}
                <div className="p-2.5 border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-center text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  <span className="text-emerald-600 font-bold block mb-0.5">YES</span>
                  Click "Convert to Invoice"
                </div>
              </div>

              <BranchMerge />

              {/* AUTO CONVERSION RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-center text-xs sm:text-[12px] font-bold text-emerald-800 dark:text-emerald-200 shadow-2xs">
                Auto-Generates Sales Invoice &amp; Deducts Stock
              </div>

              <FlowArrow />

              {/* END OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-center font-bold text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-300 shadow-2xs">
                Official Bill in Outward List (End)
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 4: HOW TO CREATE A BILL? ================= */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">

          {/* LEFT SIDE: Simple, Clean Headings & Spacious Crisp Points */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-9">

            {/* Step 1: Outward (Create Tax Invoice) */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/outward')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">1</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Outward (Create Tax Invoice)
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Customer &amp; GST Details:</b> Enter Customer Name, Phone, Email, and 15-digit GSTIN. Entering GSTIN auto-detects State and sets Intra-State (CGST+SGST 9%+9%) or Inter-State (IGST 18%).</li>
                <li><b>Add Items &amp; Stock Validation:</b> Search and select materials from catalog. Real-time validation ensures you cannot bill more than the current available inventory quantity.</li>
                <li><b>Discounts &amp; Tax Calculation:</b> System calculates subtotal, applied discounts, GST breakdown, and automatic round-off to produce final payable amount.</li>
                <li><b>Payment Status &amp; Due Date:</b> Select <b>PAID</b> (with payment mode: Cash, UPI, Card, Net Banking) or <b>PENDING</b> (with automatic Due Date period tracking).</li>
                <li><b>Instant Invoice Generation:</b> Generates next sequential Invoice Number (e.g., <em>SIS/2026-27/0001</em>) and opens print/download modal.</li>
              </ul>
            </div>

            {/* Step 2: Outward List (Lifecycle & Payment Receipts) */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/outward-list')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">2</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Outward List (Status &amp; Receipt Lifecycle)
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Status Tracking:</b> Monitor real-time payment states with clear color badges — <span className="font-semibold text-emerald-600 dark:text-emerald-400">PAID</span> vs <span className="font-semibold text-amber-600 dark:text-amber-400">PENDING</span>.</li>
                <li><b>Pending to Paid Conversion:</b> When customer completes payment for a pending bill, click the status badge directly to mark it as <b>PAID</b> and enter payment mode.</li>
                <li><b>Send Receipt Button:</b> As soon as a bill is marked as <b>PAID</b>, the dedicated <b>&quot;Send Receipt&quot;</b> button activates instantly.</li>
                <li><b>1-Click Email Dispatch:</b> Clicking &quot;Send Receipt&quot; opens the automated emailer to dispatch the official PDF Payment Receipt directly to the customer&apos;s email address.</li>
                <li><b>Print &amp; Return Actions:</b> One-click print/download Tax Invoice, share payment details, or initiate return vouchers for returnable items.</li>
              </ul>
            </div>

          </div>

          {/* RIGHT SIDE: Spacious Clear Flowchart Diagram with Full-Height Center Divider */}
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-start">

            <div className="w-full max-w-sm flex flex-col items-center space-y-2 sticky top-6">

              {/* START OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-[#043486] bg-blue-50 dark:bg-slate-800 text-center font-bold text-xs sm:text-[13px] text-[#043486] dark:text-blue-300 shadow-2xs">
                Start Billing Process
              </div>

              <FlowArrow />

              {/* STEP 1 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                1. Outward: Enter Customer Info &amp; GSTIN
              </div>

              <FlowArrow />

              {/* STEP 2 RECTANGLE */}
              <div className="w-64 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                2. Add Items &amp; Auto Calculate Taxes
              </div>

              <FlowArrow />

              {/* DECISION DIAMOND */}
              <div className="relative flex items-center justify-center w-38 h-22 my-1">
                <svg className="w-full h-full" viewBox="0 0 144 80" fill="none">
                  <polygon
                    points="72,2 141,40 72,78 3,40"
                    className="fill-amber-50/70 dark:fill-slate-800/80 stroke-slate-700 dark:stroke-slate-300"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-center text-slate-800 dark:text-slate-100 px-4 leading-tight">
                  Payment Status?
                </span>
              </div>

              {/* SLEEK SPLIT CONNECTOR */}
              <BranchSplit />

              {/* SPLIT FLOW: PENDING VS PAID */}
              <div className="w-full grid grid-cols-2 gap-3.5 my-0.5">
                {/* Branch Left: PENDING */}
                <div className="flex flex-col items-center space-y-2 pr-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 border border-amber-200 dark:border-amber-900/60 rounded-full">
                    If Pending
                  </span>
                  <div className="w-full py-2.5 px-2.5 border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 text-center text-[11px] font-medium text-amber-900 dark:text-amber-200 leading-tight shadow-2xs">
                    Saved as PENDING in Outward List
                  </div>
                  <FlowArrow className="h-6" />
                  <div className="w-full py-2 px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center text-[10px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                    When Customer Pays &rarr; Click &quot;Mark as Paid&quot;
                  </div>
                </div>

                {/* Branch Right: PAID */}
                <div className="flex flex-col items-center space-y-2 pl-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 border border-emerald-200 dark:border-emerald-900/60 rounded-full">
                    If Paid
                  </span>
                  <div className="w-full py-2.5 px-2.5 border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-center text-[11px] font-medium text-emerald-900 dark:text-emerald-200 leading-tight shadow-2xs">
                    &quot;Send Receipt&quot; Button Activates
                  </div>
                  <FlowArrow className="h-6" />
                  <div className="w-full py-2 px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center text-[10px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                    1-Click Email PDF Receipt to Customer
                  </div>
                </div>
              </div>

              {/* SLEEK MERGE CONNECTOR */}
              <BranchMerge />

              {/* END OVAL */}
              <div className="w-56 py-2 px-4 rounded-full border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-center font-bold text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-300 shadow-2xs">
                Tax Invoice &amp; Receipt Completed (End)
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 4: HOW TO BILL A SERVICE? ================= */}
      {activeTab === 'service' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">

          {/* LEFT SIDE: Simple, Clean Headings & Spacious Crisp Points */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-9">

            {/* Step 1: New Service Request & Quotation */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/services/new')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">1</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Service Intake &amp; Quotation Approval
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Customer &amp; Device Details:</b> Record Customer Name, Mobile, Email, Device Type (Laptop, Printer, CCTV, etc.), Serial Number, and accessories received (Adapter, Cable, Bag).</li>
                <li><b>Complaint Diagnosis &amp; Estimate:</b> Note reported issues and inspection findings. Add labor charges, link spare parts from inventory, and apply GST (CGST+SGST or IGST).</li>
                <li><b>Quotation &amp; Approval:</b> Set stage to <em>Received</em> or <em>Quotation</em>. Share estimate with customer. Once approved, update stage to <em>Customer Approval</em>.</li>
                <li><b>Advance Payment:</b> Record advance received (if any) to automatically deduct from the final balance.</li>
              </ul>
            </div>

            {/* Step 2: Repair & Service Invoice Dispatch */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/services/list')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">2</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Ready Status &amp; Invoice Dispatch (SIS-SR)
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Repair In-Progress &rarr; Ready:</b> Technician completes service and marks status as <span className="font-semibold text-blue-600 dark:text-blue-400">Ready</span>.</li>
                <li><b>Service Tax Invoice Generation:</b> Assigns dynamic Service Invoice Number (e.g., <em>SIS-SR/2026-27/0001</em>) with complete spare parts, labor, GST breakdown, and bank details.</li>
                <li><b>Strict 1-Time Invoice Email:</b> Invoice email can be sent <b>ONLY when status is &quot;Ready&quot;</b> and can be dispatched <b>strictly ONE TIME</b> to prevent duplicate bill emails.</li>
              </ul>
            </div>

            {/* Step 3: Payment Receipt & Delivery */}
            <div className="space-y-4">
              <div
                onClick={() => navigate('/services/list')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">3</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    Payment Received &amp; Receipt Dispatch (SIS-REC)
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Payment Received Status:</b> When customer settles the remaining bill balance, set status to <span className="font-semibold text-emerald-600 dark:text-emerald-400">Payment Received</span>.</li>
                <li><b>Dynamic Receipt Number:</b> Generates official Service Receipt with month notation (e.g., <em>SIS-REC/10/2026-27/0001</em>).</li>
                <li><b>Strict 1-Time Receipt Email:</b> Receipt email activates <b>ONLY when status is &quot;Payment Received&quot;</b> and can be dispatched <b>strictly ONE TIME</b>.</li>
                <li><b>Delivery:</b> Hand over the serviced device with accessories and mark status as <em>Delivered</em>.</li>
              </ul>
            </div>

          </div>

          {/* RIGHT SIDE: Spacious Clear Flowchart Diagram with Full-Height Center Divider */}
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-start">

            <div className="w-full max-w-sm flex flex-col items-center space-y-1.5 sticky top-6">

              {/* START OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-[#043486] bg-blue-50 dark:bg-slate-800 text-center font-bold text-xs sm:text-[13px] text-[#043486] dark:text-blue-300 shadow-2xs">
                Start Service Request
              </div>

              <FlowArrow className="h-6" />

              {/* STEP 1 RECTANGLE */}
              <div className="w-68 py-2 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                1. Intake: Device, Complaint &amp; Diagnosis
              </div>

              <FlowArrow className="h-6" />

              {/* STEP 2 RECTANGLE */}
              <div className="w-68 py-2 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                2. Quotation Stage &amp; Estimate Sharing
              </div>

              <FlowArrow className="h-6" />

              {/* DECISION DIAMOND */}
              <div className="relative flex items-center justify-center w-36 h-20 my-0.5">
                <svg className="w-full h-full" viewBox="0 0 144 80" fill="none">
                  <polygon
                    points="72,2 141,40 72,78 3,40"
                    className="fill-amber-50/70 dark:fill-slate-800/80 stroke-slate-700 dark:stroke-slate-300"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-bold text-center text-slate-800 dark:text-slate-100 px-3 leading-tight">
                  Customer Approved?
                </span>
              </div>

              {/* SLEEK SPLIT CONNECTOR */}
              <BranchSplit />

              {/* SPLIT FLOW: REJECTED VS APPROVED */}
              <div className="w-full grid grid-cols-2 gap-3.5 my-0.5">
                {/* Branch Left: REJECTED / ON-HOLD */}
                <div className="flex flex-col items-center space-y-1.5 pr-1">
                  <span className="text-[9.5px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 border border-rose-200 dark:border-rose-900/60 rounded-full">
                    Rejected / On-Hold
                  </span>
                  <div className="w-full py-2 px-2 border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 text-center text-[10.5px] font-medium text-rose-900 dark:text-rose-200 leading-tight shadow-2xs">
                    Revise Estimate or Return Device
                  </div>
                </div>

                {/* Branch Right: APPROVED */}
                <div className="flex flex-col items-center space-y-1.5 pl-1">
                  <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-200 dark:border-emerald-900/60 rounded-full">
                    Approved
                  </span>
                  <div className="w-full py-2 px-2 border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-center text-[10.5px] font-medium text-emerald-900 dark:text-emerald-200 leading-tight shadow-2xs">
                    Repair In-Progress &rarr; Set &quot;Ready&quot;
                  </div>
                </div>
              </div>

              {/* SLEEK MERGE CONNECTOR */}
              <BranchMerge />

              {/* STEP 3 RECTANGLE */}
              <div className="w-68 py-2 px-3 border border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-center text-xs sm:text-[11.5px] font-semibold text-blue-900 dark:text-blue-200 shadow-2xs">
                <span className="block font-bold text-[#043486] dark:text-blue-300">3. Status: &quot;Ready&quot;</span>
                Send Invoice (SIS-SR) &bull; <span className="text-amber-700 dark:text-amber-400 font-bold">1-Time Email</span>
              </div>

              <FlowArrow className="h-6" />

              {/* STEP 4 RECTANGLE */}
              <div className="w-68 py-2 px-3 border border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-center text-xs sm:text-[11.5px] font-semibold text-emerald-900 dark:text-emerald-200 shadow-2xs">
                <span className="block font-bold text-emerald-700 dark:text-emerald-400">4. Status: &quot;Payment Received&quot;</span>
                Send Receipt (SIS-REC) &bull; <span className="text-emerald-800 dark:text-emerald-300 font-bold">1-Time Email</span>
              </div>

              <FlowArrow className="h-6" />

              {/* END OVAL */}
              <div className="w-56 py-2 px-4 rounded-full border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-center font-bold text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-300 shadow-2xs">
                Service Delivered &amp; Closed (End)
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 5: HOW TO RETURN A PRODUCT? ================= */}
      {activeTab === 'returns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">

          {/* LEFT SIDE: Crisp Headings, Sub-headings & Minimal Clear Logic */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-8">

            {/* Step 1: Search, Policy Check & Return Intake */}
            <div className="space-y-3.5">
              <div
                onClick={() => navigate('/inventory/returns')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">1</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Search &amp; Return Policy Validation
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Returns Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li><b>Search Bill:</b> Enter <b>Invoice Number</b> (e.g., <em>SIS-INV/10/...</em>) or <b>Receipt Number</b> (<em>SIS-REC/10/...</em>) to auto-load customer details and purchased items.</li>
                <li><b>Policy Window Check:</b> System checks return policy window (e.g., 7 Days). If expired, manager override approval is required before proceeding.</li>
                <li><b>Select Item &amp; Serial:</b> Pick the returned product, select serialized unit (if applicable), choose return reason, and submit to create dynamic Return ID (e.g., <em>SIS-RET/10/2026-27/0001</em>).</li>
              </ul>
            </div>

            {/* Step 2: Quality Check (QC: PASS vs FAIL) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">2</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Quality Inspection (QC Pass vs Fail)
                </h2>
              </div>

              <div className="space-y-3 pl-9 text-sm text-slate-600 dark:text-slate-400">
                <p className="leading-relaxed">
                  Technician inspects the returned product condition in <b>Pending QC</b>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xs space-y-1">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                      QC PASS (Good)
                    </h4>
                    <p className="text-[11.5px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                      Product is in good condition. Stock is restored back to <b>Active Inventory (+1)</b> with serial status <em>Available</em>.
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xs space-y-1">
                    <h4 className="font-bold text-rose-800 dark:text-rose-300 text-xs flex items-center gap-1.5">
                      QC FAIL (Damaged)
                    </h4>
                    <p className="text-[11.5px] text-rose-900/80 dark:text-rose-300/80 leading-relaxed">
                      Product is damaged/defective. Stock is isolated in <b>Defective Registry</b> for warranty claims / scrap.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Resolution & Document Vouchers */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">3</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Resolution: Replacement vs Credit Note Slip
                </h2>
              </div>

              <div className="space-y-3 pl-9 text-sm text-slate-600 dark:text-slate-400">
                <div className="p-3 border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1">
                  <h4 className="font-bold text-[#043486] dark:text-blue-300 text-xs uppercase">
                    Option A: Replacement Voucher (Fresh Unit Dispatch)
                  </h4>
                  <p className="text-xs leading-relaxed">
                    Selects fresh serial from stock (Shelf Stock -1) and generates official <b>Replacement Invoice</b> in Outward Bills with printable <b>Replacement Slip</b>.
                  </p>
                </div>

                <div className="p-3 border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-1">
                  <h4 className="font-bold text-purple-800 dark:text-purple-300 text-xs uppercase">
                    Option B: Credit Note Slip (Refund &amp; Ledger Balance)
                  </h4>
                  <p className="text-xs leading-relaxed">
                    Generates sequential <b>Credit Note (e.g., <em>SIS-CN/10/2026-27/0001</em>)</b>. Customers receive refund credit with official <b>Credit Note Slip</b> print and PDF download.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: Policy Check & Multi-Decision Flowchart */}
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-start">

            <div className="w-full max-w-sm flex flex-col items-center space-y-1.5 sticky top-6">

              {/* START OVAL */}
              <div className="w-48 py-2 px-4 rounded-full border-2 border-[#043486] bg-blue-50 dark:bg-slate-800 text-center font-bold text-xs sm:text-[13px] text-[#043486] dark:text-blue-300 shadow-2xs">
                Start Product Return
              </div>

              <FlowArrow className="h-6" />

              {/* STEP 1 RECTANGLE */}
              <div className="w-68 py-2 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                1. Search Invoice or Receipt Number
              </div>

              <FlowArrow className="h-6" />

              {/* POLICY DECISION DIAMOND */}
              <div className="relative flex items-center justify-center w-36 h-20 my-0.5">
                <svg className="w-full h-full" viewBox="0 0 144 80" fill="none">
                  <polygon
                    points="72,2 141,40 72,78 3,40"
                    className="fill-amber-50/70 dark:fill-slate-800/80 stroke-slate-700 dark:stroke-slate-300"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-bold text-center text-slate-800 dark:text-slate-100 px-3 leading-tight">
                  Within Valid Return Days?
                </span>
              </div>

              {/* SLEEK SPLIT CONNECTOR */}
              <BranchSplit />

              {/* SPLIT FLOW: EXPIRED VS VALID */}
              <div className="w-full grid grid-cols-2 gap-3.5 my-0.5">
                {/* Branch Left: EXPIRED */}
                <div className="flex flex-col items-center space-y-1.5 pr-1">
                  <span className="text-[9.5px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 border border-rose-200 dark:border-rose-900/60 rounded-full">
                    Expired Window
                  </span>
                  <div className="w-full py-2 px-2 border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 text-center text-[10.5px] font-medium text-rose-900 dark:text-rose-200 leading-tight shadow-2xs">
                    Manager Override Approval
                  </div>
                </div>

                {/* Branch Right: VALID */}
                <div className="flex flex-col items-center space-y-1.5 pl-1">
                  <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-200 dark:border-emerald-900/60 rounded-full">
                    Valid Window
                  </span>
                  <div className="w-full py-2 px-2 border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-center text-[10.5px] font-medium text-emerald-900 dark:text-emerald-200 leading-tight shadow-2xs">
                    Select Items &amp; Return Reason
                  </div>
                </div>
              </div>

              {/* SLEEK MERGE CONNECTOR */}
              <BranchMerge />

              {/* STEP 2 RECTANGLE */}
              <div className="w-68 py-2 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                2. Queue in &quot;Pending QC&quot; (SIS-RET/Month)
              </div>

              <FlowArrow className="h-6" />

              {/* QC RESOLUTION DECISION DIAMOND */}
              <div className="relative flex items-center justify-center w-36 h-20 my-0.5">
                <svg className="w-full h-full" viewBox="0 0 144 80" fill="none">
                  <polygon
                    points="72,2 141,40 72,78 3,40"
                    className="fill-blue-50/70 dark:fill-slate-800/80 stroke-slate-700 dark:stroke-slate-300"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-bold text-center text-slate-800 dark:text-slate-100 px-3 leading-tight">
                  QC Outcome Decision?
                </span>
              </div>

              {/* SLEEK SPLIT CONNECTOR */}
              <BranchSplit />

              {/* SPLIT FLOW: REPLACEMENT VS CREDIT NOTE */}
              <div className="w-full grid grid-cols-2 gap-3.5 my-0.5">
                {/* Branch Left: REPLACEMENT */}
                <div className="flex flex-col items-center space-y-1.5 pr-1">
                  <span className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 border border-blue-200 dark:border-blue-900/60 rounded-full">
                    Exchange / Replace
                  </span>
                  <div className="w-full py-2 px-2 border border-blue-300 dark:border-blue-700/60 bg-blue-50/50 dark:bg-blue-950/30 text-center text-[10.5px] font-medium text-blue-900 dark:text-blue-200 leading-tight shadow-2xs">
                    Dispatch Unit &bull; Return Voucher
                  </div>
                </div>

                {/* Branch Right: CREDIT NOTE */}
                <div className="flex flex-col items-center space-y-1.5 pl-1">
                  <span className="text-[9.5px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 border border-purple-200 dark:border-purple-900/60 rounded-full">
                    Refund / Credit
                  </span>
                  <div className="w-full py-2 px-2 border border-purple-300 dark:border-purple-700/60 bg-purple-50/50 dark:bg-purple-950/30 text-center text-[10.5px] font-medium text-purple-900 dark:text-purple-200 leading-tight shadow-2xs">
                    Issue SIS-CN &bull; Credit Note Slip
                  </div>
                </div>
              </div>

              {/* SLEEK MERGE CONNECTOR */}
              <BranchMerge />

              {/* END OVAL */}
              <div className="w-56 py-2 px-4 rounded-full border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-center font-bold text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-300 shadow-2xs">
                Return &amp; Ledger Settled (End)
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 6: HOW TO MANAGE ROLES & USERS? ================= */}
      {activeTab === 'roles_users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">

          {/* LEFT SIDE: Step-by-Step Guidance & Crisp Points */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-8">

            {/* Step 1: Create Department */}
            <div className="space-y-3">
              <div
                onClick={() => navigate('/departments')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">1</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Step 1: Create Department
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li>Navigate to <b>Roles &amp; Access &gt; Departments</b>.</li>
                <li>Enter the <b>Department Name</b> (e.g., <i>Warehouse, Billing, Accounts, Technical Services</i>) and an optional description.</li>
                <li>Set status to <b>Active</b> and click <b>SAVE DEPARTMENT</b>.</li>
              </ul>
            </div>

            {/* Step 2: Create Role */}
            <div className="space-y-3">
              <div
                onClick={() => navigate('/roles')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">2</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Step 2: Create Role &amp; Set Permissions
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li>Navigate to <b>Roles &amp; Access &gt; Roles</b>.</li>
                <li>Enter the <b>Role Name</b> (e.g., <i>Cashier, Store Keeper, Branch Manager</i>) and description.</li>
                <li>In the <b>Permissions Matrix</b>, toggle individual module actions (<code>Add</code>, <code>View</code>, <code>Edit</code>, <code>Delete</code>, <code>Download</code>) across Bills, Services, Categories, Materials, Inventory, and Settings.</li>
                <li>Set Role Status to <b>Active</b> and click <b>SAVE ROLE</b>.</li>
                <li><i>Note: The default <b>Administrator</b> role is protected with permanent 100% full system access.</i></li>
              </ul>
            </div>

            {/* Step 3: Create User Account & Auto Dispatch Email */}
            <div className="space-y-3">
              <div
                onClick={() => navigate('/users')}
                className="group flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3 hover:border-[#043486] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#043486] text-white flex items-center justify-center text-xs font-bold shadow-2xs">3</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Step 3: Create User Account &amp; Auto Dispatch Credentials
                  </h2>
                </div>
                <span className="text-xs text-[#043486] dark:text-blue-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Page <ExternalLink size={13} />
                </span>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-9 list-disc list-outside leading-relaxed">
                <li>Navigate to <b>Roles &amp; Access &gt; Users</b> and fill in the <b>Create Operator Account</b> form.</li>
                <li>Enter <b>Full Name</b>, <b>Email Address</b>, and valid <b>10-digit Phone Number</b>.</li>
                <li>Select the <b>Assigned Department</b> and <b>Assigned Role</b> created in Steps 1 &amp; 2.</li>
                <li>Click <b>SAVE USER</b>.</li>
                <li><b>🚀 Automatic Email Delivery:</b> The system instantly generates a temporary password and dispatches a welcome email containing credentials and a <b>15-Minute Direct Password Setup Link</b> directly to the operator&apos;s inbox.</li>
              </ul>
            </div>

          </div>

          {/* RIGHT SIDE: Visual Step-by-Step Flowchart Diagram */}
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-start">
            <div className="w-full max-w-sm flex flex-col items-center space-y-2 sticky top-6">

              {/* START OVAL */}
              <div className="w-52 py-2 px-4 rounded-full border-2 border-[#043486] bg-blue-50 dark:bg-slate-800 text-center font-bold text-xs sm:text-[13px] text-[#043486] dark:text-blue-300 shadow-2xs">
                Start User &amp; Access Setup
              </div>

              <FlowArrow />

              {/* STEP 1: CREATE DEPT */}
              <div className="w-68 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                1. Create Department (e.g. Warehouse, Billing)
              </div>

              <FlowArrow />

              {/* STEP 2: CREATE ROLE */}
              <div className="w-68 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                2. Create Role &amp; Configure Permissions Matrix
              </div>

              <FlowArrow />

              {/* STEP 3: CREATE USER */}
              <div className="w-68 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                3. Create User (Select Dept &amp; Role + 10-Digit Phone)
              </div>

              <FlowArrow />

              {/* STEP 4: AUTO CREDENTIALS */}
              <div className="w-68 py-2.5 px-4 border border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-950 text-center text-xs sm:text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
                4. System Auto-Generates Temporary Credentials
              </div>

              <FlowArrow />

              {/* STEP 5: DISPATCH EMAIL */}
              <div className="w-68 py-2.5 px-4 border border-blue-400 dark:border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-center text-xs sm:text-[12.5px] font-semibold text-[#043486] dark:text-blue-300 shadow-2xs">
                5. Auto-Dispatch Email + 15-Min Setup Link
              </div>

              <FlowArrow />

              {/* END OVAL */}
              <div className="w-56 py-2 px-4 rounded-full border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-center font-bold text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-300 shadow-2xs">
                User Ready &amp; Access Protected (End)
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  )
}
