import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlusCircle, FiEdit, FiCalendar, FiBell } from 'react-icons/fi'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { isSuperAdmin } from '../../utils/superAdmin'
import Tabs from '../../components/Tabs'
import EventCard from '../../components/EventCard'
import PostCard from '../../components/PostCard'
import CreatePostModal from '../../components/CreatePostModal'
import CreateEventModal from '../../components/CreateEventModal'
import './NonprofitDetail.css'

export default function NonprofitDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [nonprofit, setNonprofit] = useState(null)
  const [events, setEvents] = useState([])
  const [posts, setPosts] = useState([])
  const [isMember, setIsMember] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [joinedEvents, setJoinedEvents] = useState(new Set())
  const [orgPosts, setOrgPosts] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [id, user])

  const loadData = async () => {
    try {
      // Load nonprofit
      const { data: npData, error: npError } = await supabase
        .from('nonprofits')
        .select('*')
        .eq('id', id)
        .single()

      if (npError) throw npError
      setNonprofit(npData)

      // Load events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('nonprofit_id', id)
        .order('date', { ascending: true })

      setEvents(eventsData || [])

      // Load organization-specific posts (posts tagged with this organization's name)
      const { data: orgPostsData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter posts that have this organization's name in tags
      const filteredOrgPosts = (orgPostsData || []).filter(post => {
        const tags = Array.isArray(post.tags) 
          ? post.tags 
          : (post.tags ? post.tags.split(',').map(t => t.trim()) : [])
        return tags.includes(npData.name)
      })

      // Get comment counts and author info for organization posts
      const orgPostsWithCounts = await Promise.all(
        filteredOrgPosts.map(async (post) => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)

          let authorName = 'Anonymous'
          let authorEmail = null
          
          if (post.user_id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', post.user_id)
                .single()

              if (profile) {
                if (profile.full_name && profile.full_name.trim()) {
                  authorName = profile.full_name
                } else if (profile.email) {
                  authorName = profile.email.split('@')[0]
                  authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1)
                } else {
                  authorName = `User ${post.user_id.substring(0, 8)}`
                }
                authorEmail = profile.email
              } else {
                authorName = `User ${post.user_id.substring(0, 8)}`
              }
            } catch (e) {
              authorName = `User ${post.user_id.substring(0, 8)}`
            }
          }

          return {
            ...post,
            author_name: authorName,
            author_email: authorEmail,
            commentCount: count || 0,
          }
        })
      )

      setOrgPosts(orgPostsWithCounts)
      
      // Keep old posts for backward compatibility (if needed elsewhere)
      setPosts(orgPostsWithCounts)

      // Check membership and admin status
      if (user) {
        const { data: memberData } = await supabase
          .from('nonprofit_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('nonprofit_id', id)
          .single()

        setIsMember(!!memberData)

        // Check if user is admin (super admin is always admin)
        const superAdmin = isSuperAdmin(user)
        if (superAdmin) {
          setIsAdmin(true)
        } else {
          const { data: adminData } = await supabase
            .from('organization_admins')
            .select('id')
            .eq('user_id', user.id)
            .eq('nonprofit_id', id)
            .single()

          setIsAdmin(!!adminData)
        }

        // Load joined events
        const { data: signups } = await supabase
          .from('volunteer_signups')
          .select('event_id')
          .eq('user_id', user.id)

        if (signups) {
          setJoinedEvents(new Set(signups.map((s) => s.event_id)))
        }
      }

      // Load member count and members list
      const { count } = await supabase
        .from('nonprofit_members')
        .select('*', { count: 'exact', head: true })
        .eq('nonprofit_id', id)

      setMemberCount(count || 0)

      // Load actual members with profile info
      const { data: membersData } = await supabase
        .from('nonprofit_members')
        .select(`
          user_id,
          joined_at
        `)
        .eq('nonprofit_id', id)
        .order('joined_at', { ascending: false })

      if (membersData) {
        // Get profile info for each member
        const membersWithNames = await Promise.all(
          membersData.map(async (m) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', m.user_id)
                .single()

              return {
                user_id: m.user_id,
                joined_at: m.joined_at,
                name: profile?.full_name || profile?.email?.split('@')[0] || `User ${m.user_id.substring(0, 8)}`,
                email: profile?.email
              }
            } catch {
              return {
                user_id: m.user_id,
                joined_at: m.joined_at,
                name: `User ${m.user_id.substring(0, 8)}`,
                email: null
              }
            }
          })
        )
        setMembers(membersWithNames)
      }
    } catch (error) {
      console.error('Error loading nonprofit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      alert('Please log in to join organizations')
      return
    }

    try {
      const { error } = await supabase.from('nonprofit_members').insert({
        user_id: user.id,
        nonprofit_id: id,
      })

      if (error) throw error
      setIsMember(true)
      setMemberCount((prev) => prev + 1)
      
      // Reload members list
      await loadData()
    } catch (error) {
      console.error('Error joining nonprofit:', error)
      alert('Failed to join organization. Please try again.')
    }
  }

  const handleLeave = async () => {
    try {
      const { error } = await supabase
        .from('nonprofit_members')
        .delete()
        .eq('user_id', user.id)
        .eq('nonprofit_id', id)

      if (error) throw error
      setIsMember(false)
      setMemberCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error leaving nonprofit:', error)
      alert('Failed to leave organization. Please try again.')
    }
  }

  const handleJoinEvent = async (eventId) => {
    if (!user) {
      alert('Please log in to join events')
      return
    }

    try {
      const { error } = await supabase.from('volunteer_signups').insert({
        user_id: user.id,
        event_id: eventId,
      })

      if (error) throw error
      setJoinedEvents((prev) => new Set([...prev, eventId]))
    } catch (error) {
      console.error('Error joining event:', error)
      alert('Failed to join event. Please try again.')
    }
  }

  const handleCreatePost = async (postData) => {
    if (!user) {
      alert('Please log in to create posts')
      return
    }

    if (!isMember) {
      alert('Please join this organization to create posts')
      return
    }

    setSubmitting(true)
    try {
      // Ensure organization name is in tags
      const tags = postData.tags.includes(nonprofit.name) 
        ? postData.tags 
        : [...postData.tags, nonprofit.name]

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: postData.title,
          content: postData.content,
          tags: tags,
        })
        .select()
        .single()

      if (error) throw error

      await loadData()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!nonprofit) {
    return (
      <div className="empty-state">
        <h3>Nonprofit not found</h3>
        <Link to="/nonprofits" className="btn btn-primary">
          Back to Nonprofits
        </Link>
      </div>
    )
  }

  return (
    <div className="nonprofit-detail-page">
      <div className="nonprofit-header">
        <div className="container">
          <div className="nonprofit-header-content">
            <div className="nonprofit-logo">
              {nonprofit.image_url ? (
                <img src={nonprofit.image_url} alt={nonprofit.name} />
              ) : (
                <div className="nonprofit-logo-placeholder">
                  <span>🏢</span>
                </div>
              )}
            </div>
            <div className="nonprofit-header-info">
              <div className="nonprofit-header-top">
                <h1>{nonprofit.name}</h1>
                {nonprofit.category && (
                  <span className="nonprofit-category-badge">{nonprofit.category}</span>
                )}
              </div>
              <p className="nonprofit-member-count">👥 {memberCount} members</p>
              <div className="nonprofit-header-actions">
                {isMember ? (
                  <button onClick={handleLeave} className="btn btn-outline">
                    Leave Organization
                  </button>
                ) : (
                  <button onClick={handleJoin} className="btn btn-accent">
                    Join Organization
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Admin Panel */}
        {isAdmin && (
          <div className="admin-panel">
            <h3>Admin Panel</h3>
            <div className="admin-actions">
              <button className="admin-btn" onClick={() => alert('Edit organization feature coming soon!')}>
                <FiEdit />
                <span>Edit Organization</span>
              </button>
              <button className="admin-btn" onClick={() => setShowCreateEventModal(true)}>
                <FiCalendar />
                <span>Create Event</span>
              </button>
              <button 
                className="admin-btn" 
                onClick={() => {
                  setShowCreateModal(true)
                }}
              >
                <FiBell />
                <span>Post Announcement</span>
              </button>
            </div>
          </div>
        )}

        <Tabs tabs={['About', 'Events', 'Forum']}>
          {/* About Tab */}
          <div className="tab-content">
            <div className="nonprofit-about">
              <h2>Mission</h2>
              <p className="nonprofit-mission">{nonprofit.mission || 'No mission statement available.'}</p>
              {nonprofit.contact_email && (
                <div className="nonprofit-contact">
                  <h3>Contact</h3>
                  <a href={`mailto:${nonprofit.contact_email}`} className="contact-link">
                    {nonprofit.contact_email}
                  </a>
                </div>
              )}
              
              {/* Active Members Section */}
              <div className="active-members-section">
                <h3>Active Members ({memberCount})</h3>
                {members.length > 0 ? (
                  <div className="members-list">
                    {members.map((member) => (
                      <div key={member.user_id} className="member-item">
                        <div className="member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                          <span className="member-joined">
                            Joined {new Date(member.joined_at).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No members yet. Be the first to join!</p>
                )}
              </div>

              <div className="nonprofit-meta">
                <p className="text-muted">
                  Joined ServiceLoop on {new Date(nonprofit.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Events Tab */}
          <div className="tab-content">
            {!isMember ? (
              <div className="members-only-overlay">
                <div className="members-only-content">
                  <h3>Join this organization to see and sign up for events</h3>
                  <button onClick={handleJoin} className="btn btn-accent">
                    Join Organization
                  </button>
                </div>
              </div>
            ) : events.length > 0 ? (
              <div className="events-list">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    nonprofit={nonprofit}
                    showJoin={true}
                    isJoined={joinedEvents.has(event.id)}
                    onJoin={() => handleJoinEvent(event.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No events scheduled yet.</p>
              </div>
            )}
          </div>

          {/* Forum Tab */}
          <div className="tab-content">
            {!isMember ? (
              <div className="members-only-overlay">
                <div className="members-only-content">
                  <h3>Join this organization to participate in the forum</h3>
                  <button onClick={handleJoin} className="btn btn-accent">
                    Join Organization
                  </button>
                </div>
              </div>
            ) : (
              <div className="org-forum-content">
                <div className="org-forum-header">
                  <h2>{nonprofit.name} Forum</h2>
                  <motion.button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-create-post-org"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlusCircle />
                    <span>Create Post</span>
                  </motion.button>
                </div>

                {orgPosts.length > 0 ? (
                  <div className="org-posts-list">
                    {orgPosts.map((post) => (
                      <PostCard key={post.id} post={post} commentCount={post.commentCount} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-org">
                    <div className="empty-state-icon">💬</div>
                    <h3>No posts yet</h3>
                    <p>Be the first to start a discussion in {nonprofit.name}!</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-primary"
                    >
                      Create First Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Create Post Modal */}
      {isMember && nonprofit && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
          organizationName={nonprofit.name}
          submitting={submitting}
        />
      )}

      {/* Create Event Modal */}
      {isAdmin && nonprofit && (
        <CreateEventModal
          isOpen={showCreateEventModal}
          onClose={() => setShowCreateEventModal(false)}
          nonprofitId={nonprofit.id}
          onSuccess={() => {
            loadData()
          }}
        />
      )}
    </div>
  )
}

