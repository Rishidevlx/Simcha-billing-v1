import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import InwardBillPage from './pages/InwardBillPage'
import InwardReportsPage from './pages/InwardReportsPage'
import CreateBillPage from './pages/CreateBillPage'
import AllBillsPage from './pages/AllBillsPage'
import CreateServiceBillPage from './pages/CreateServiceBillPage'
import AllServicesPage from './pages/AllServicesPage'
import CategoriesPage from './pages/CategoriesPage'
import AddMaterialPage from './pages/AddMaterialPage'
import AllMaterialsPage from './pages/AllMaterialsPage'
import InventoryPage from './pages/InventoryPage'
import ReturnsAdjustmentsPage from './pages/ReturnsAdjustmentsPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import SystemSettingsPage from './pages/SystemSettingsPage'
import ConfigurationsSettingsPage from './pages/ConfigurationsSettingsPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Verify stored token on app mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('simcha_token') || sessionStorage.getItem('simcha_token')
      const storedUser = localStorage.getItem('simcha_user') || sessionStorage.getItem('simcha_user')

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } catch (e) {
          console.error('Failed to parse cached user', e)
          localStorage.removeItem('simcha_token')
          localStorage.removeItem('simcha_user')
          sessionStorage.removeItem('simcha_token')
          sessionStorage.removeItem('simcha_user')
        }
      }
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [])

  const handleLogin = (userData, token, rememberMe) => {
    setUser(userData)
    setIsAuthenticated(true)

    if (rememberMe) {
      localStorage.setItem('simcha_token', token)
      localStorage.setItem('simcha_user', JSON.stringify(userData))
    } else {
      sessionStorage.setItem('simcha_token', token)
      sessionStorage.setItem('simcha_user', JSON.stringify(userData))
    }
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('simcha_token')
    localStorage.removeItem('simcha_user')
    sessionStorage.removeItem('simcha_token')
    sessionStorage.removeItem('simcha_user')
  }

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="w-10 h-10 border-3 border-[#043486] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <DashboardLayout
                user={user || { name: 'Rishi', email: 'admin@simcha.com', role: 'Administrator', avatar: 'male' }}
                onLogout={handleLogout}
                onUpdateUser={setUser}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Default Root Redirect to Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Core App Pages */}
          <Route
            path="dashboard"
            element={
              <DashboardPage
                user={user || { name: 'Rishi', email: 'admin@simcha.com', role: 'Administrator', avatar: 'male' }}
                onUpdateUser={setUser}
              />
            }
          />

          {/* Inward Routes */}
          <Route path="inward" element={<InwardBillPage />} />
          <Route path="inward/edit/:id" element={<InwardBillPage />} />
          <Route path="inward/:id" element={<InwardBillPage />} />
          <Route path="inward-list" element={<InwardReportsPage />} />
          <Route path="inward-reports" element={<Navigate to="/inward-list" replace />} />

          {/* Outward / Billing Routes */}
          <Route path="outward" element={<CreateBillPage />} />
          <Route path="create-bill" element={<Navigate to="/outward" replace />} />
          <Route path="outward-list" element={<AllBillsPage />} />
          <Route path="all-bills" element={<Navigate to="/outward-list" replace />} />
          <Route path="bills" element={<Navigate to="/outward-list" replace />} />

          {/* Service Module Routes (2 dedicated menus) */}
          <Route path="services/new" element={<CreateServiceBillPage />} />
          <Route path="services/list" element={<AllServicesPage />} />
          <Route path="services" element={<Navigate to="/services/list" replace />} />
          <Route path="service" element={<Navigate to="/services/list" replace />} />
          <Route path="new-service" element={<Navigate to="/services/new" replace />} />

          {/* Category Routes */}
          <Route path="categories" element={<CategoriesPage />} />

          {/* Material Routes */}
          <Route path="materials" element={<AllMaterialsPage />} />
          <Route path="all-materials" element={<Navigate to="/materials" replace />} />
          <Route path="materials/add" element={<AddMaterialPage />} />
          <Route path="add-material" element={<Navigate to="/materials/add" replace />} />

          {/* Stock & Inventory Routes */}
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="stock" element={<Navigate to="/inventory" replace />} />
          <Route path="inventory/returns" element={<ReturnsAdjustmentsPage />} />
          <Route path="returns" element={<Navigate to="/inventory/returns" replace />} />
          <Route path="returns-adjustments" element={<Navigate to="/inventory/returns" replace />} />

          {/* Settings Routes */}
          <Route
            path="settings/profile"
            element={<ProfileSettingsPage user={user} onUpdateUser={setUser} />}
          />
          <Route path="profile-settings" element={<Navigate to="/settings/profile" replace />} />
          <Route path="profile" element={<Navigate to="/settings/profile" replace />} />

          <Route path="settings/system" element={<SystemSettingsPage />} />
          <Route path="system-settings" element={<Navigate to="/settings/system" replace />} />

          <Route path="settings/configurations" element={<ConfigurationsSettingsPage />} />
          <Route path="configurations-settings" element={<Navigate to="/settings/configurations" replace />} />

          {/* Fallback Wildcard Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}



