import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FiSettings, 
  FiUsers, 
  FiCalendar, 
  FiFileText, 
  FiBarChart2,
  FiX,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiMail,
  FiUserPlus
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { 
  isOrgAdmin, 
  getOrgStats, 
  getOrgAdmins, 
  getOrgMembers, 
  getOrgPosts, 
  getOrgEvents,
  addAdminByEmail,
  removeAdmin,
  removeMember,
  deleteOrgPost,
  deleteOrgEvent,
  updateOrgDetails
} from '../../services/orgAdminService'
import { supabase } from '../../supabaseClient'
import CreateEventModal from '../../components/CreateEventModal'
import './OrganizationAdminPanel.css'

export default function OrganizationAdminPanel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [org, setOrg] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [admins, setAdmins] = useState([])
  const [members, setMembers] = useState([])
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  
  // Modals
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  
  // Edit org form
  const [editForm, setEditForm] = useState({
    name: '',
    mission: '',
    category: '',
    contact_email: '',
    image_url: ''
  })

  useEffect(() => {
    if (!authLoading && user) {
      loadOrganization()
    }
  }, [id, user, authLoading])

  useEffect(() => {
    // Update active tab when URL parameter changes
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    if (org && isAdmin) {
      loadTabData()
    }
  }, [activeTab, org, isAdmin])

  const loadOrganization = async () => {
    if (!user) {
      navigate('/')
      return
    }

    try {
      setLoading(true)
      
      // Load organization
      const { data: orgData, error: orgError } = await supabase
        .from('nonprofits')
        .select('*')
        .eq('id', id)
        .single()

      if (orgError) throw orgError
      if (!orgData) {
        navigate('/')
        return
      }

      setOrg(orgData)
      setEditForm({
        name: orgData.name || '',
        mission: orgData.mission || '',
        category: orgData.category || '',
        contact_email: orgData.contact_email || '',
        image_url: orgData.image_url || ''
      })

      // Check if user is admin
      const adminStatus = await isOrgAdmin(user, id)
      setIsAdmin(adminStatus)

      if (!adminStatus) {
        navigate('/')
        return
      }
    } catch (error) {
      console.error('Error loading organization:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadTabData = async () => {
    if (!org) return

    try {
      switch (activeTab) {
        case 'overview':
          const statsData = await getOrgStats(id)
          setStats(statsData)
          break
        case 'admins':
          const adminsData = await getOrgAdmins(id)
          setAdmins(adminsData)
          break
        case 'members':
          const membersData = await getOrgMembers(id)
          setMembers(membersData)
          break
        case 'events':
          const eventsData = await getOrgEvents(id)
          console.log('Loaded events:', eventsData)
          setEvents(eventsData || [])
          break
        case 'forum':
          const postsData = await getOrgPosts(id)
          setPosts(postsData)
          break
      }
    } catch (error) {
      console.error('Error loading tab data:', error)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      alert('Please enter an email address')
      return
    }

    setAddingAdmin(true)
    try {
      await addAdminByEmail(newAdminEmail.trim(), id, user)
      alert('Admin added successfully!')
      setNewAdminEmail('')
      setShowAddAdminModal(false)
      loadTabData()
    } catch (error) {
      console.error('Error adding admin:', error)
      alert(error.message || 'Failed to add admin. Please check the email address.')
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleRemoveAdmin = async (userId) => {
    if (userId === user.id) {
      alert('You cannot remove yourself as an admin')
      return
    }

    if (!window.confirm('Are you sure you want to remove this admin?')) {
      return
    }

    try {
      await removeAdmin(userId, id, user)
      alert('Admin removed successfully')
      loadTabData()
    } catch (error) {
      console.error('Error removing admin:', error)
      alert(error.message || 'Failed to remove admin')
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      await removeMember(userId, id, user)
      alert('Member removed successfully')
      loadTabData()
    } catch (error) {
      console.error('Error removing member:', error)
      alert(error.message || 'Failed to remove member')
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      await deleteOrgPost(postId, id, user)
      alert('Post deleted successfully')
      loadTabData()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert(error.message || 'Failed to delete post')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    try {
      console.log('Attempting to delete event:', eventId)
      await deleteOrgEvent(eventId, id, user)
      console.log('Event deleted, refreshing list...')
      alert('Event deleted successfully')
      // Reload events list
      await loadTabData()
      // Force a re-render by updating state
      setEvents(prev => prev.filter(e => e.id !== eventId))
    } catch (error) {
      console.error('Error deleting event:', error)
      alert(error.message || 'Failed to delete event. Please check console for details.')
    }
  }

  const handleSaveOrgDetails = async () => {
    try {
      await updateOrgDetails(id, editForm, user)
      alert('Organization details updated successfully!')
      setShowEditOrgModal(false)
      loadOrganization()
    } catch (error) {
      console.error('Error updating org:', error)
      alert(error.message || 'Failed to update organization details')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!org || !isAdmin) {
    return null
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart2 },
    { id: 'admins', label: 'Admins', icon: FiUsers },
    { id: 'members', label: 'Members', icon: FiUsers },
    { id: 'events', label: 'Events', icon: FiCalendar },
    { id: 'forum', label: 'Forum', icon: FiFileText },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ]

  return (
    <div className="org-admin-panel-page">
      <div className="org-admin-header">
        <div className="container">
          <motion.div
            className="header-content"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {org.image_url ? (
              <img src={org.image_url} alt={org.name} className="org-header-image" />
            ) : (
              <div className="org-header-image-placeholder">
                <FiSettings />
              </div>
            )}
            <div className="header-text">
              <h1>{org.name}</h1>
              <p className="org-category">{org.category}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        <div className="org-admin-layout">
          {/* Side Navigation */}
          <aside className="org-admin-sidebar">
            <nav className="org-admin-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`org-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab.id)
                      navigate(`/org/${id}/admin?tab=${tab.id}`, { replace: true })
                    }}
                  >
                    <Icon />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="org-admin-main">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <h2>Organization Overview</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <FiUsers className="stat-icon" />
                    <div>
                      <h3>{stats.members}</h3>
                      <p>Members</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <FiUsers className="stat-icon" />
                    <div>
                      <h3>{stats.admins}</h3>
                      <p>Admins</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <FiFileText className="stat-icon" />
                    <div>
                      <h3>{stats.posts}</h3>
                      <p>Posts</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <FiCalendar className="stat-icon" />
                    <div>
                      <h3>{stats.events}</h3>
                      <p>Events</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <FiBarChart2 className="stat-icon" />
                    <div>
                      <h3>{stats.engagements}</h3>
                      <p>Total Engagements</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Admins Tab */}
            {activeTab === 'admins' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <div className="section-header">
                  <h2>Organization Admins</h2>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddAdminModal(true)}
                  >
                    <FiUserPlus />
                    <span>Add Admin</span>
                  </button>
                </div>
                <div className="admins-list">
                  {admins.map((admin) => (
                    <div key={admin.user_id} className="admin-item">
                      <div className="admin-info">
                        <div className="admin-avatar">
                          {(admin.full_name || admin.email || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4>{admin.full_name || admin.email?.split('@')[0] || 'Unknown'}</h4>
                          <p>{admin.email}</p>
                        </div>
                      </div>
                      {admin.user_id !== user.id && (
                        <button
                          className="btn-danger-small"
                          onClick={() => handleRemoveAdmin(admin.user_id)}
                        >
                          <FiTrash2 />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <div className="section-header">
                  <h2>Organization Members</h2>
                  <span className="member-count">{members.length} members</span>
                </div>
                <div className="members-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.user_id}>
                          <td>
                            <div className="member-cell">
                              <div className="member-avatar">
                                {(member.profiles?.full_name || member.profiles?.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span>{member.profiles?.full_name || member.profiles?.email?.split('@')[0] || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>{member.profiles?.email || 'N/A'}</td>
                          <td>{new Date(member.joined_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn-danger-small"
                              onClick={() => handleRemoveMember(member.user_id)}
                            >
                              <FiTrash2 />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <div className="section-header">
                  <h2>Organization Events</h2>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateEventModal(true)}
                  >
                    <FiPlus />
                    <span>Create Event</span>
                  </button>
                </div>
                <div className="events-list">
                  {events.map((event) => (
                    <div key={event.id} className="event-item">
                      <div className="event-info">
                        <h4>{event.title}</h4>
                        <p>{event.description}</p>
                        <div className="event-meta">
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <button
                        className="btn-danger-small"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <FiTrash2 />
                        <span>Delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Forum Tab */}
            {activeTab === 'forum' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <div className="section-header">
                  <h2>Organization Forum Posts</h2>
                </div>
                <div className="posts-list">
                  {posts.map((post) => (
                    <div key={post.id} className="post-item">
                      <div className="post-info">
                        <h4>{post.title}</h4>
                        <p>{post.content.substring(0, 150)}...</p>
                        <div className="post-meta">
                          <span>By: {post.profiles?.full_name || post.profiles?.email || 'Unknown'}</span>
                          <span>{post.commentCount} comments</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="post-actions">
                        <button
                          className="btn btn-outline"
                          onClick={() => navigate(`/posts/${post.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn-danger-small"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <FiTrash2 />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-section"
              >
                <div className="section-header">
                  <h2>Organization Settings</h2>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowEditOrgModal(true)}
                  >
                    <FiEdit />
                    <span>Edit Details</span>
                  </button>
                </div>
                <div className="settings-content">
                  <div className="setting-item">
                    <label>Organization Name</label>
                    <p>{org.name}</p>
                  </div>
                  <div className="setting-item">
                    <label>Category</label>
                    <p>{org.category}</p>
                  </div>
                  <div className="setting-item">
                    <label>Mission</label>
                    <p>{org.mission || 'No mission set'}</p>
                  </div>
                  <div className="setting-item">
                    <label>Contact Email</label>
                    <p>{org.contact_email || 'No contact email'}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAddAdminModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Admin</h3>
              <button onClick={() => setShowAddAdminModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <label>Email Address</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <p className="form-hint">Enter the email address of the user you want to make an admin.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowAddAdminModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddAdmin}
                disabled={addingAdmin}
              >
                {addingAdmin ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditOrgModal && (
        <div className="modal-overlay" onClick={() => setShowEditOrgModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Organization</h3>
              <button onClick={() => setShowEditOrgModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Organization Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Mission</label>
                <textarea
                  value={editForm.mission}
                  onChange={(e) => setEditForm({ ...editForm, mission: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={editForm.contact_email}
                  onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowEditOrgModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveOrgDetails}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <CreateEventModal
          isOpen={showCreateEventModal}
          onClose={() => setShowCreateEventModal(false)}
          nonprofitId={id}
          onSuccess={() => {
            setShowCreateEventModal(false)
            loadTabData()
          }}
        />
      )}
    </div>
  )
}

