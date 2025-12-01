import { useAuth } from './useAuth'
import { isSuperAdmin, getAdminStatus } from '../utils/superAdmin'

/**
 * Hook to check super admin status
 * @returns {Object} { isSuperAdmin: boolean, isAdmin: boolean, user: Object }
 */
export function useSuperAdmin() {
  const { user } = useAuth()
  
  const adminStatus = getAdminStatus(user)
  
  return {
    ...adminStatus,
    user,
  }
}

