import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import './CreateEventModal.css'

export default function CreateEventModal({ isOpen, onClose, nonprofitId, onSuccess }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    image_url: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setError('Please log in to create events')
      return
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.date) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('events')
        .insert({
          nonprofit_id: nonprofitId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          date: formData.date,
          location: formData.location.trim() || null,
          image_url: formData.image_url.trim() || null
        })

      if (insertError) throw insertError

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        image_url: ''
      })
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating event:', err)
      setError(err.message || 'Failed to create event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        image_url: ''
      })
      setError('')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="create-event-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button
                className="modal-close-btn"
                onClick={handleClose}
                aria-label="Close modal"
                disabled={submitting}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="event-title">
                  Event Title <span className="required">*</span>
                </label>
                <input
                  id="event-title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter event title..."
                  required
                  maxLength={200}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-description">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="event-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the event..."
                  rows={5}
                  required
                  maxLength={1000}
                  disabled={submitting}
                />
                <span className="char-count">{formData.description.length}/1000</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="event-date">
                    Date <span className="required">*</span>
                  </label>
                  <input
                    id="event-date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event-location">Location</label>
                  <input
                    id="event-location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Event location..."
                    maxLength={200}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="event-image">Image URL</label>
                <input
                  id="event-image"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  disabled={submitting}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

