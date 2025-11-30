import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import PostCard from '../components/PostCard'
import './Forum.css'

export default function Forum() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPosts()
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

          // Try to get user email from auth (admin function) or use fallback
          let authorEmail = 'User'
          if (post.user_id) {
            try {
              // For now, we'll use a truncated user_id or create a profiles table
              // In production, you'd want to create a profiles table or use a server function
              authorEmail = `User ${post.user_id.substring(0, 8)}`
            } catch (e) {
              authorEmail = 'Anonymous'
            }
          }

          return {
            ...post,
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

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please log in to create posts')
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please fill in both title and content')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: newPost.title,
          content: newPost.content,
        })
        .select()
        .single()

      if (error) throw error

      // Reload posts
      await loadPosts()
      setNewPost({ title: '', content: '' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="forum-page">
      <div className="container">
        <div className="page-header">
          <h1>Global Forum</h1>
          <p className="text-muted">Share ideas, ask questions, and connect with the community</p>
        </div>

        {user && (
          <div className="create-post-section">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                + Create a Post
              </button>
            ) : (
              <form onSubmit={handleCreatePost} className="create-post-form card">
                <h3>Create New Post</h3>
                <div className="form-group">
                  <label htmlFor="post-title">Title</label>
                  <input
                    id="post-title"
                    type="text"
                    value={newPost.title}
                    onChange={(e) =>
                      setNewPost({ ...newPost, title: e.target.value })
                    }
                    placeholder="Enter post title..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="post-content">Content</label>
                  <textarea
                    id="post-content"
                    value={newPost.content}
                    onChange={(e) =>
                      setNewPost({ ...newPost, content: e.target.value })
                    }
                    placeholder="Share your thoughts..."
                    rows={6}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewPost({ title: '', content: '' })
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {!user && (
          <div className="login-prompt card">
            <p>Please log in to create posts and participate in discussions.</p>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="posts-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} commentCount={post.commentCount} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>Be the first to start a discussion!</p>
          </div>
        )}
      </div>
    </div>
  )
}

