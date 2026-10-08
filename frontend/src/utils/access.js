export const getUserPermissions = (customUser = null) => {
  const simchaUser = customUser || JSON.parse(localStorage.getItem('simcha_user') || sessionStorage.getItem('simcha_user') || '{}')
  const hasFullAccess = simchaUser.role === 'Administrator' || (simchaUser.admin_access || []).includes('Full Admin Access')
  
  const getPerms = (menuId) => (simchaUser.permissions || {})[menuId] || []
  
  return {
    hasFullAccess,
    can: (menuId, action) => {
      if (hasFullAccess) return true
      if (menuId === 'user-manual' || menuId === 'user_manual' || menuId === 'settings_profile' || menuId === 'profile-settings') return true
      return getPerms(menuId).includes(action)
    },
    hasAny: (menuId, actions) => {
      if (hasFullAccess) return true
      if (menuId === 'user-manual' || menuId === 'user_manual' || menuId === 'settings_profile' || menuId === 'profile-settings') return true
      const perms = getPerms(menuId)
      return actions.some(a => perms.includes(a))
    },
    hasPerm: (menuId) => {
      if (hasFullAccess) return true
      if (menuId === 'user-manual' || menuId === 'user_manual' || menuId === 'settings_profile' || menuId === 'profile-settings') return true
      const perms = getPerms(menuId)
      return Array.isArray(perms) && perms.length > 0
    }
  }
}

/**
 * Resolves the primary landing route for a given user based on their assigned permissions and role
 */
export const getDefaultLandingRoute = (customUser = null) => {
  const simchaUser = customUser || JSON.parse(localStorage.getItem('simcha_user') || sessionStorage.getItem('simcha_user') || '{}')
  const hasFullAccess = simchaUser.role === 'Administrator' || (simchaUser.admin_access || []).includes('Full Admin Access')

  if (hasFullAccess) {
    return '/dashboard'
  }

  const perms = simchaUser.permissions || {}
  const adminAccess = simchaUser.admin_access || []

  const hasAccess = (menuId) => {
    if (adminAccess.includes(menuId)) return true
    const p = perms[menuId]
    return Array.isArray(p) && p.length > 0
  }

  // Priority-based Role Landing Resolution
  if (hasAccess('dashboard') || adminAccess.includes('Dashboard')) return '/dashboard'
  if (hasAccess('services_list') || hasAccess('services')) return '/services/list'
  if (hasAccess('services_new')) return '/services/new'
  if (hasAccess('outward_list') || hasAccess('all-bills')) return '/outward-list'
  if (hasAccess('outward') || hasAccess('create-bill')) return '/outward'
  if (hasAccess('quotations_list') || hasAccess('quotations-list')) return '/quotations/list'
  if (hasAccess('quotations')) return '/quotations'
  if (hasAccess('inward_list') || hasAccess('inward-reports')) return '/inward-list'
  if (hasAccess('inward')) return '/inward'
  if (hasAccess('materials_list') || hasAccess('all-materials')) return '/materials'
  if (hasAccess('materials_add') || hasAccess('add-material')) return '/materials/add'
  if (hasAccess('inventory_main') || hasAccess('inventory-stock')) return '/inventory'
  if (hasAccess('inventory_returns') || hasAccess('returns-adjustments')) return '/inventory/returns'
  if (hasAccess('categories_create') || hasAccess('categories')) return '/categories'
  if (hasAccess('departments_list') || hasAccess('departments-menu')) return '/departments'
  if (hasAccess('roles_list') || hasAccess('roles_add') || hasAccess('roles-menu')) return '/roles'
  if (hasAccess('users_list') || hasAccess('users_add') || hasAccess('users-menu')) return '/users'
  if (hasAccess('settings_profile') || hasAccess('profile-settings')) return '/settings/profile'
  if (hasAccess('settings_system') || hasAccess('system-settings')) return '/settings/system'
  if (hasAccess('settings_theme') || hasAccess('theme-settings')) return '/settings/theme'
  if (hasAccess('settings_configs') || hasAccess('configurations-settings')) return '/settings/configurations'

  return '/user-manual'
}

