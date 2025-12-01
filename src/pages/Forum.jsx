import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlusCircle, FiMessageSquare, FiTrendingUp, FiAward } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
import './Forum.css'

export default function Forum() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [topContributors, setTopContributors] = useState([])

  const categories = ['All', 'Events', 'Questions', 'General', 'Announcements']

  useEffect(() => {
    loadPosts()
    loadTopContributors()
  }, [])

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get comment counts and author info for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)

          // Try to get user name from profiles table
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
              console.error('Error loading profile:', e)
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

      setPosts(postsWithCounts)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTopContributors = async () => {
    try {
      const { data } = await supabase
        .from('posts')
        .select('user_id')
      
      if (data) {
        const userPostCounts = {}
        data.forEach(post => {
          if (post.user_id) {
            userPostCounts[post.user_id] = (userPostCounts[post.user_id] || 0) + 1
          }
        })

        const topUsers = Object.entries(userPostCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([userId, count]) => ({ userId, count }))

        const contributorsWithNames = await Promise.all(
          topUsers.map(async ({ userId, count }) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', userId)
                .single()

              let name = `User ${userId.substring(0, 8)}`
              if (profile) {
                if (profile.full_name && profile.full_name.trim()) {
                  name = profile.full_name
                } else if (profile.email) {
                  const emailName = profile.email.split('@')[0]
                  name = emailName.charAt(0).toUpperCase() + emailName.slice(1)
                }
              }

              return {
                userId,
                count,
                name,
                email: profile?.email
              }
            } catch {
              return {
                userId,
                count,
                name: `User ${userId.substring(0, 8)}`,
                email: null
              }
            }
          })
        )

        setTopContributors(contributorsWithNames)
      }
    } catch (error) {
      console.error('Error loading top contributors:', error)
    }
  }

  const handleCreatePost = async (postData) => {
    if (!user) {
      alert('Please log in to create posts')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: postData.title,
          content: postData.content,
          tags: postData.tags, // Array of tags
        })
        .select()
        .single()

      if (error) throw error

      await loadPosts()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : posts.filter(post => {
        const tags = Array.isArray(post.tags) ? post.tags : (post.tags ? post.tags.split(',').map(t => t.trim()) : [])
        return tags.includes(selectedCategory)
      })

  const trendingPosts = [...posts].sort((a, b) => b.commentCount - a.commentCount).slice(0, 5)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="forum-page">
      {/* Gradient Header Banner */}
      <div className="forum-header">
        <div className="forum-header-background"></div>
        <div className="container">
          <div className="forum-header-content">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1>Global Forum</h1>
              <p className="forum-subtitle">
                Share ideas, ask questions, and connect with the community
              </p>
            </motion.div>
            <div className="forum-header-icon">
              <FiMessageSquare />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="forum-layout">
          {/* Main Content */}
          <div className="forum-main">
            {/* Category Filters */}
            <div className="forum-categories">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`forum-category-chip ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Create Post FAB Button */}
            {user && (
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="fab-create-post"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlusCircle />
                <span>Create Post</span>
              </motion.button>
            )}

            {!user && (
              <div className="login-prompt card">
                <p>Please log in to create posts and participate in discussions.</p>
              </div>
            )}

            {/* Posts List */}
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : filteredPosts.length > 0 ? (
              <motion.div
                className="posts-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredPosts.map((post) => (
                  <motion.div key={post.id} variants={itemVariants}>
                    <PostCard post={post} commentCount={post.commentCount} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="empty-state">
                <h3>No posts found</h3>
                <p>Try selecting a different category or be the first to post!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="forum-sidebar">
            {/* Trending Posts */}
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <FiTrendingUp />
                <h3>Trending Posts</h3>
              </div>
              <div className="trending-posts">
                {trendingPosts.length > 0 ? (
                  trendingPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      to={`/posts/${post.id}`}
                      className="trending-post-item"
                    >
                      <span className="trending-number">{index + 1}</span>
                      <div className="trending-post-content">
                        <h4>{post.title}</h4>
                        <span className="trending-post-meta">
                          <FiMessageSquare /> {post.commentCount} comments
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="sidebar-empty">No trending posts yet</p>
                )}
              </div>
            </div>

            {/* Top Contributors */}
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <FiAward />
                <h3>Top Contributors</h3>
              </div>
              <div className="top-contributors">
                {topContributors.length > 0 ? (
                  topContributors.map((contributor, index) => (
                    <div key={contributor.userId} className="contributor-item">
                      <div className="contributor-avatar">
                        {contributor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="contributor-info">
                        <h4>{contributor.name}</h4>
                        <span className="contributor-posts">{contributor.count} posts</span>
                      </div>
                      {index < 3 && (
                        <div className="contributor-badge">
                          <FiAward />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="sidebar-empty">No contributors yet</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
        submitting={submitting}
      />
    </div>
  )
}
