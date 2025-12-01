import { Link } from 'react-router-dom'
import { FiMessageSquare, FiCalendar } from 'react-icons/fi'
import TagChip from './TagChip'
import './PostCard.css'

export default function PostCard({ post, commentCount = 0 }) {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 60) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getInitials = (name) => {
    if (!name || name === 'Anonymous') return 'A'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  const authorName = post.author_name || post.author_email || 'Anonymous'
  const authorInitials = getInitials(authorName)
  
  // Handle tags - can be array or comma-separated string
  const tags = Array.isArray(post.tags) 
    ? post.tags 
    : (post.tags ? post.tags.split(',').map(t => t.trim()) : [])
  
  // Determine if any tag is an organization name (not in default tags)
  const defaultTags = ['General', 'Events', 'Questions', 'Announcements']
  const orgTags = tags.filter(tag => !defaultTags.includes(tag))

  return (
    <Link to={`/posts/${post.id}`} className="post-card">
      <div className="post-card-accent"></div>
      <div className="post-card-content">
        <div className="post-card-header">
          <div className="post-author-section">
            <div className="post-author-avatar">
              {authorInitials}
            </div>
            <div className="post-author-info">
              <span className="post-author-name">{authorName}</span>
              <span className="post-date">
                <FiCalendar />
                {formatDate(post.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        <h3 className="post-title">{post.title}</h3>
        
        <p className="post-preview">
          {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
        </p>
        
        {tags.length > 0 && (
          <div className="post-tags">
            {tags.map((tag, index) => (
              <TagChip
                key={index}
                tag={tag}
                isActive={false}
                isOrgTag={orgTags.includes(tag)}
              />
            ))}
          </div>
        )}
        
        <div className="post-card-footer">
          <div className="post-meta">
            <span className="post-meta-item">
              <FiMessageSquare />
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
