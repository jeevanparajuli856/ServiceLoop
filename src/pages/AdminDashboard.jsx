import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FiShield, 
  FiCheckCircle, 
  FiXCircle, 
  FiUsers, 
  FiHome,
  FiSettings,
  FiActivity
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { isSuperAdmin } from '../utils/superAdmin'
import {
  getPendingOrgRequests,
  getAllOrganizations,
  getAllUsersWithStats,
  getSystemMetrics,
  getAdminLogs,
  removeUserFromOrg,
  promoteToOrgAdmin,
  demoteOrgAdmin,
  deleteOrganization,
  approveOrgRequest,
  rejectOrgRequest
} from '../services/adminService'
import ApprovalsTable from '../components/ApprovalsTable'
import SystemStats from '../components/SystemStats'
import AdminLogs from '../components/AdminLogs'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('approvals')
  const [pendingRequests, setPendingRequests] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [users, setUsers] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isSuperAdmin(user)) {
        navigate('/')
        return
      }
      loadDashboardData()
    }
  }, [user, authLoading, navigate])

  const loadDashboardData = async () => {
    if (!isSuperAdmin(user)) return

    try {
      setLoading(true)
      
      // Load data with individual error handling
      const results = await Promise.allSettled([
        getPendingOrgRequests(user).catch(err => {
          console.error('Error loading pending requests:', err)
          return []
        }),
        getAllOrganizations(user).catch(err => {
          console.error('Error loading organizations:', err)
          return []
        }),
        getAllUsersWithStats(user).catch(err => {
          console.error('Error loading users:', err)
          return []
        }),
        getSystemMetrics(user).catch(err => {
          console.error('Error loading metrics:', err)
          return {
            nonprofits: 0,
            users: 0,
            events: 0,
            posts: 0,
            comments: 0,
            pendingRequests: 0
          }
        }),
        getAdminLogs(user, 50).catch(err => {
          console.error('Error loading logs:', err)
          return []
        })
      ])

      setPendingRequests(results[0].value || [])
      setOrganizations(results[1].value || [])
      setUsers(results[2].value || [])
      setMetrics(results[3].value || {
        nonprofits: 0,
        users: 0,
        events: 0,
        posts: 0,
        comments: 0,
        pendingRequests: 0
      })
      setLogs(results[4].value || [])
    } catch (error) {
      console.error('Error loading admin data:', error)
      // Don't show alert if it's just a database setup issue
      if (error.message && error.message.includes('function') || error.message.includes('relation')) {
        console.warn('Database functions or tables may not be set up. Please run SUPER_ADMIN_DATABASE.sql')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId) => {
    try {
      await approveOrgRequest(requestId, user)
      await loadDashboardData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleReject = async (requestId) => {
    try {
      await rejectOrgRequest(requestId, user)
      await loadDashboardData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleRemoveUserFromOrg = async (userId, nonprofitId) => {
    if (!window.confirm('Are you sure you want to remove this user from the organization?')) {
      return
    }

    try {
      await removeUserFromOrg(userId, nonprofitId, user)
      alert('User removed successfully')
      await loadDashboardData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to remove user. Please try again.')
    }
  }

  const handlePromoteToAdmin = async (userId, nonprofitId) => {
    try {
      await promoteToOrgAdmin(userId, nonprofitId, user)
      alert('User promoted to admin successfully')
      await loadDashboardData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to promote user. Please try again.')
    }
  }

  const handleDemoteAdmin = async (userId, nonprofitId) => {
    if (!window.confirm('Are you sure you want to demote this admin?')) {
      return
    }

    try {
      await demoteOrgAdmin(userId, nonprofitId, user)
      alert('Admin demoted successfully')
      await loadDashboardData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to demote admin. Please try again.')
    }
  }

  const handleDeleteOrg = async (nonprofitId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return
    }

    if (!window.confirm('This will delete the organization and all related data. Continue?')) {
      return
    }

    try {
      await deleteOrganization(nonprofitId, user)
      alert('Organization deleted successfully')
      await loadDashboardData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete organization. Please try again.')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user || !isSuperAdmin(user)) {
    return null
  }

  const tabs = [
    { id: 'approvals', label: 'Pending Approvals', icon: FiCheckCircle, count: pendingRequests.length },
    { id: 'organizations', label: 'Organizations', icon: FiHome, count: organizations.length },
    { id: 'users', label: 'Users', icon: FiUsers, count: users.length },
    { id: 'metrics', label: 'System Metrics', icon: FiActivity },
    { id: 'logs', label: 'System Logs', icon: FiActivity }
  ]

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div className="container">
          <motion.div
            className="admin-header-content"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="admin-header-title">
              <FiShield className="admin-shield-icon" />
              <div>
                <h1>Super Admin Panel</h1>
                <p className="admin-subtitle">Manage organizations, users, and system settings</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        <div className="admin-dashboard-layout">
          {/* Side Navigation */}
          <aside className="admin-sidebar">
            <nav className="admin-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="nav-badge">{tab.count}</span>
                    )}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="admin-main-content">
            {/* System Metrics (always visible) */}
            {activeTab === 'metrics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SystemStats metrics={metrics} loading={loading} />
              </motion.div>
            )}

            {/* Pending Approvals */}
            {activeTab === 'approvals' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <div className="section-header">
                  <h2>Pending Organization Approvals</h2>
                  <span className="section-count">{pendingRequests.length} pending</span>
                </div>
                <ApprovalsTable
                  requests={pendingRequests}
                  onUpdate={loadDashboardData}
                  user={user}
                />
              </motion.div>
            )}

            {/* Organizations Management */}
            {activeTab === 'organizations' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <div className="section-header">
                  <h2>Organization Management</h2>
                  <span className="section-count">{organizations.length} total</span>
                </div>
                <div className="organizations-list">
                  {organizations.map((org) => (
                    <div key={org.id} className="org-management-card">
                      <div className="org-mgmt-header">
                        <div>
                          <h3>{org.name}</h3>
                          <span className="org-mgmt-category">{org.category}</span>
                        </div>
                        <button
                          className="btn-danger-small"
                          onClick={() => handleDeleteOrg(org.id)}
                        >
                          Delete
                        </button>
                      </div>
                      <p className="org-mgmt-mission">{org.mission}</p>
                      <div className="org-mgmt-actions">
                        <a
                          href={`/nonprofits/${org.id}`}
                          className="btn btn-outline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Details
                        </a>
                        <button
                          className="btn btn-outline"
                          onClick={() => setSelectedOrg(org.id)}
                        >
                          Manage Admins
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Users Management */}
            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <div className="section-header">
                  <h2>User Management</h2>
                  <span className="section-count">{users.length} total users</span>
                </div>
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Posts</th>
                        <th>Events</th>
                        <th>Organizations</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userItem) => (
                        <tr key={userItem.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar-small">
                                {(userItem.full_name || userItem.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span>{userItem.full_name || userItem.email?.split('@')[0] || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>{userItem.email}</td>
                          <td>{userItem.stats.posts}</td>
                          <td>{userItem.stats.events}</td>
                          <td>{userItem.stats.organizations}</td>
                          <td>
                            <button
                              className="btn-link"
                              onClick={() => setSelectedUser(userItem.id)}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* System Logs */}
            {activeTab === 'logs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <AdminLogs logs={logs} loading={loading} />
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

