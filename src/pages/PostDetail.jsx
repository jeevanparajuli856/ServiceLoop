import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import Comment from '../components/Comment'
import './PostDetail.css'

export default function PostDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPost()
    loadComments()
  }, [id])

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Get author email (fallback to user ID)
      let authorEmail = 'User'
      if (data.user_id) {
        authorEmail = `User ${data.user_id.substring(0, 8)}`
      }

      setPost({
        ...data,
        author_email: authorEmail,
      })
    } catch (error) {
      console.error('Error loading post:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error

      const commentsWithAuthors = (data || []).map((comment) => {
        let authorEmail = 'User'
        if (comment.user_id) {
          authorEmail = `User ${comment.user_id.substring(0, 8)}`
        }
        return {
          ...comment,
          author_email: authorEmail,
        }
      })

      setComments(commentsWithAuthors)
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please log in to comment')
      return
    }

    if (!newComment.trim()) {
      alert('Please enter a comment')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        post_id: id,
        text: newComment,
      })

      if (error) throw error

      setNewComment('')
      await loadComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Failed to submit comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="empty-state">
        <h3>Post not found</h3>
        <Link to="/forum" className="btn btn-primary">
          Back to Forum
        </Link>
      </div>
    )
  }

  return (
    <div className="post-detail-page">
      <div className="container">
        <Link to="/forum" className="back-link">
          ← Back to Forum
        </Link>

        <article className="post-detail card">
          <div className="post-detail-header">
            <h1>{post.title}</h1>
            <div className="post-meta">
              <span className="post-author">By {post.author_email || 'Anonymous'}</span>
              <span className="post-date">{formatDate(post.created_at)}</span>
            </div>
          </div>
          <div className="post-content">
            <p>{post.content}</p>
          </div>
        </article>

        <section className="comments-section">
          <h2>Comments ({comments.length})</h2>

          {user ? (
            <form onSubmit={handleSubmitComment} className="comment-form card">
              <div className="form-group">
                <label htmlFor="comment-text">Add a comment</label>
                <textarea
                  id="comment-text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="btn btn-primary"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div className="login-prompt card">
              <p>Please log in to add comments.</p>
              <Link to="/login" className="btn btn-primary">
                Log In
              </Link>
            </div>
          )}

          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((comment) => <Comment key={comment.id} comment={comment} />)
            ) : (
              <div className="empty-state">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

