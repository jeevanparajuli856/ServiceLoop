import { Link } from 'react-router-dom'
import './PostCard.css'

export default function PostCard({ post, commentCount = 0 }) {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Link to={`/posts/${post.id}`} className="post-card card">
      <div className="post-card-header">
        <h3>{post.title}</h3>
        <span className="post-date">{formatDate(post.created_at)}</span>
      </div>
      <p className="post-preview">
        {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
      </p>
      <div className="post-card-footer">
        <span className="post-author">{post.author_email || 'Anonymous'}</span>
        <span className="post-comments">
          💬 {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </span>
      </div>
    </Link>
  )
}

