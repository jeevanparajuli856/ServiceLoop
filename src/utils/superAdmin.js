// Super Admin Configuration
export const SUPER_ADMIN_EMAIL = 'jeevanparajuli856@gmail.com'

/**
 * Check if a user is the super admin
 * @param {Object} user - User object from useAuth
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  if (!user || !user.email) return false
  return user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

/**
 * Get admin status for a user
 * @param {Object} user - User object from useAuth
 * @returns {Object} { isSuperAdmin: boolean, isAdmin: boolean }
 */
export const getAdminStatus = (user) => {
  const superAdmin = isSuperAdmin(user)
  return {
    isSuperAdmin: superAdmin,
    isAdmin: superAdmin, // Super admin is always an admin
  }
}

/**
 * Check if user can access admin features
 * @param {Object} user - User object from useAuth
 * @param {string} nonprofitId - Optional nonprofit ID to check org admin
 * @returns {Promise<boolean>}
 */
export const canAccessAdmin = async (user, nonprofitId = null) => {
  if (!user) return false
  
  // Super admin always has access
  if (isSuperAdmin(user)) return true
  
  // Check org admin if nonprofitId provided
  if (nonprofitId) {
    const { supabase } = await import('../supabaseClient')
    const { data } = await supabase
      .from('organization_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('nonprofit_id', nonprofitId)
      .single()
    
    return !!data
  }
  
  return false
}

