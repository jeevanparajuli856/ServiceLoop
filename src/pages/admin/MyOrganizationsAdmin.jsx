import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FiBriefcase, 
  FiSettings, 
  FiCalendar, 
  FiFileText, 
  FiUsers,
  FiPlusCircle,
  FiArrowRight
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { getMyAdminOrganizations } from '../../services/orgAdminService'
import './MyOrganizationsAdmin.css'

export default function MyOrganizationsAdmin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/')
        return
      }
      loadOrganizations()
    }
  }, [user, authLoading, navigate])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      setError('')
      const orgs = await getMyAdminOrganizations(user)
      setOrganizations(orgs)
    } catch (err) {
      console.error('Error loading organizations:', err)
      setError('Failed to load your organizations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your organizations...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="my-orgs-admin-page">
      <div className="container">
        <div className="page-header">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="header-content"
          >
            <FiBriefcase className="header-icon" />
            <div>
              <h1>Manage My Organizations</h1>
              <p className="header-subtitle">Manage the organizations you administer</p>
            </div>
          </motion.div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadOrganizations} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {organizations.length === 0 && !loading && (
          <div className="empty-state">
            <FiBriefcase className="empty-icon" />
            <h2>No Organizations to Manage</h2>
            <p>You're not currently an administrator of any organizations.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openCreateOrgModal'))
              }}
            >
              <FiPlusCircle />
              <span>Create New Organization</span>
            </button>
          </div>
        )}

        {organizations.length > 0 && (
          <div className="orgs-grid">
            {organizations.map((org, index) => (
              <motion.div
                key={org.id}
                className="org-admin-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="org-card-header">
                  {org.image_url ? (
                    <img 
                      src={org.image_url} 
                      alt={org.name}
                      className="org-card-image"
                    />
                  ) : (
                    <div className="org-card-image-placeholder">
                      <FiBriefcase />
                    </div>
                  )}
                  <div className="org-card-info">
                    <h3>{org.name}</h3>
                    <span className="org-category">{org.category}</span>
                  </div>
                </div>

                <p className="org-card-mission">{org.mission || 'No mission description'}</p>

                <div className="org-card-actions">
                  <button
                    className="action-btn primary"
                    onClick={() => navigate(`/org/${org.id}/admin`)}
                  >
                    <FiSettings />
                    <span>Manage Organization</span>
                    <FiArrowRight />
                  </button>
                  
                  <div className="action-buttons-row">
                    <button
                      className="action-btn secondary"
                      onClick={() => navigate(`/org/${org.id}/admin?tab=events`)}
                    >
                      <FiCalendar />
                      <span>Manage Events</span>
                    </button>
                    <button
                      className="action-btn secondary"
                      onClick={() => navigate(`/org/${org.id}/admin?tab=forum`)}
                    >
                      <FiFileText />
                      <span>Manage Posts</span>
                    </button>
                    <button
                      className="action-btn secondary"
                      onClick={() => navigate(`/org/${org.id}/admin?tab=members`)}
                    >
                      <FiUsers />
                      <span>Manage Members</span>
                    </button>
                  </div>

                  <button
                    className="action-btn add-admin"
                    onClick={() => navigate(`/org/${org.id}/admin?tab=admins`)}
                  >
                    <FiUsers />
                    <span>Add Admin</span>
                  </button>
                </div>

                <div className="org-card-footer">
                  <span className="admin-since">
                    Admin since {new Date(org.adminSince).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

