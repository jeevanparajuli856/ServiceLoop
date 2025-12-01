import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isSuperAdmin } from '../utils/superAdmin'

export default function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user || !isSuperAdmin(user)) {
    return <Navigate to="/" replace />
  }

  return children
}

