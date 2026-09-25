export const getUserPermissions = () => {
  const simchaUser = JSON.parse(localStorage.getItem('simcha_user') || '{}')
  const hasFullAccess = simchaUser.role === 'Administrator' || (simchaUser.admin_access || []).includes('Full Admin Access')
  
  const getPerms = (menuId) => (simchaUser.permissions || {})[menuId] || []
  
  return {
    hasFullAccess,
    can: (menuId, action) => {
      if (hasFullAccess) return true
      return getPerms(menuId).includes(action)
    },
    hasAny: (menuId, actions) => {
      if (hasFullAccess) return true
      const perms = getPerms(menuId)
      return actions.some(a => perms.includes(a))
    }
  }
}
