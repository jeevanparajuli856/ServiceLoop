import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FiCalendar, 
  FiFileText, 
  FiMessageSquare, 
  FiUsers,
  FiTrendingUp,
  FiArrowRight
} from 'react-icons/fi'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import PostCard from '../../components/PostCard'
import './Dashboard.css'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const [stats, setStats] = useState({
    eventsAttended: 0,
    postsCreated: 0,
    commentsMade: 0,
    organizationsJoined: 0
  })
  const [profile, setProfile] = useState(null)
  const [recentPosts, setRecentPosts] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
    if (user) {
      loadDashboardData()
    }
  }, [user, authLoading, navigate])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Load stats
      const [eventsData, postsData, commentsData, orgsData] = await Promise.all([
        supabase
          .from('volunteer_signups')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('nonprofit_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ])

      setStats({
        eventsAttended: eventsData.count || 0,
        postsCreated: postsData.count || 0,
        commentsMade: commentsData.count || 0,
        organizationsJoined: orgsData.count || 0
      })

      // Load recent posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (posts) {
        const postsWithCounts = await Promise.all(
          posts.map(async (post) => {
            const { count } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)

            return {
              ...post,
              author_name: profileData?.full_name || user.email?.split('@')[0] || 'You',
              commentCount: count || 0
            }
          })
        )
        setRecentPosts(postsWithCounts)
      }

      // Load recent activity
      const activities = []
      
      // Recent event joins
      const { data: recentEvents } = await supabase
        .from('volunteer_signups')
        .select('*, events(title)')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(3)

      if (recentEvents) {
        recentEvents.forEach(event => {
          activities.push({
            type: 'event',
            text: `Joined event: ${event.events?.title || 'Unknown Event'}`,
            date: event.timestamp
          })
        })
      }

      // Recent org joins
      const { data: recentOrgs } = await supabase
        .from('nonprofit_members')
        .select('*, nonprofits(name)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(3)

      if (recentOrgs) {
        recentOrgs.forEach(org => {
          activities.push({
            type: 'organization',
            text: `Joined organization: ${org.nonprofits?.name || 'Unknown'}`,
            date: org.joined_at
          })
        })
      }

      // Sort by date
      activities.sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentActivity(activities.slice(0, 10))

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return name.charAt(0).toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  if (authLoading || loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
  const initials = getInitials(profile?.full_name, user.email)

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Hero Section */}
        <motion.div
          className="dashboard-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hero-content">
            <div className="hero-avatar">
              {initials}
            </div>
            <div className="hero-text">
              <h1>Welcome back, {displayName}!</h1>
              <p className="hero-subtitle">Here's your activity overview</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="dashboard-stats">
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-icon events">
              <FiCalendar />
            </div>
            <div className="stat-content">
              <h3>{stats.eventsAttended}</h3>
              <p>Events Attended</p>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-icon posts">
              <FiFileText />
            </div>
            <div className="stat-content">
              <h3>{stats.postsCreated}</h3>
              <p>Posts Created</p>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stat-icon comments">
              <FiMessageSquare />
            </div>
            <div className="stat-content">
              <h3>{stats.commentsMade}</h3>
              <p>Comments Made</p>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="stat-icon orgs">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{stats.organizationsJoined}</h3>
              <p>Organizations Joined</p>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Recent Posts */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>My Recent Posts</h2>
              <Link to="/forum" className="section-link">
                View All <FiArrowRight />
              </Link>
            </div>
            {recentPosts.length > 0 ? (
              <div className="posts-grid">
                {recentPosts.map((post) => (
                  <PostCard key={post.id} post={post} commentCount={post.commentCount} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>You haven't created any posts yet.</p>
                <Link to="/forum" className="btn btn-primary">
                  Create Your First Post
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
            </div>
            {recentActivity.length > 0 ? (
              <div className="activity-feed">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    className="activity-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="activity-icon">
                      {activity.type === 'event' ? <FiCalendar /> : <FiUsers />}
                    </div>
                    <div className="activity-content">
                      <p>{activity.text}</p>
                      <span className="activity-date">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent activity to display.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

