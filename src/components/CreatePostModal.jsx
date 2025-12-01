import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiTag } from 'react-icons/fi'
import './CreatePostModal.css'

const DEFAULT_TAGS = ['General', 'Events', 'Questions', 'Announcements']

export default function CreatePostModal({ isOpen, onClose, onSubmit, organizationName = null, submitting = false }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState([])

  useEffect(() => {
    // Auto-add organization name as tag if provided
    if (organizationName && !selectedTags.includes(organizationName)) {
      setSelectedTags([organizationName])
    }
  }, [organizationName])

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTitle('')
      setContent('')
      if (organizationName) {
        setSelectedTags([organizationName])
      } else {
        setSelectedTags([])
      }
    }
  }, [isOpen, organizationName])

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content')
      return
    }
    
    if (selectedTags.length === 0) {
      alert('Please select at least one tag')
      return
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags: selectedTags,
    })
  }

  const availableTags = organizationName 
    ? [...DEFAULT_TAGS, organizationName]
    : DEFAULT_TAGS

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="create-post-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Post</h2>
              <button
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="post-title">Title</label>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label htmlFor="post-content">Content</label>
                <textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={8}
                  required
                  maxLength={5000}
                />
                <span className="char-count">{content.length}/5000</span>
              </div>

              <div className="form-group">
                <label>
                  <FiTag /> Tags
                  {organizationName && (
                    <span className="org-tag-hint">({organizationName} will be automatically included)</span>
                  )}
                </label>
                <div className="tags-container">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''} ${tag === organizationName ? 'org-tag' : ''}`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                      {tag === organizationName && <span className="tag-badge">Org</span>}
                    </button>
                  ))}
                </div>
                {selectedTags.length === 0 && (
                  <p className="form-hint">Please select at least one tag</p>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || selectedTags.length === 0}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

