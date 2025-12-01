import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import './CreateOrganizationModal.css'

const CATEGORIES = [
  'Education',
  'Environment',
  'Health & Wellness',
  'Community Development',
  'Animal Welfare',
  'Arts & Culture',
  'Technology',
  'Social Services',
  'Other'
]

export default function CreateOrganizationModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    org_name: '',
    category: '',
    mission: '',
    contact_email: '',
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
      setError('Please log in to create an organization')
      return
    }

    if (!formData.org_name.trim() || !formData.category || !formData.mission.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('org_creation_requests')
        .insert({
          user_id: user.id,
          org_name: formData.org_name.trim(),
          category: formData.category,
          mission: formData.mission.trim(),
          contact_email: formData.contact_email.trim() || null,
          image_url: formData.image_url.trim() || null,
          status: 'pending'
        })

      if (insertError) throw insertError

      // Reset form
      setFormData({
        org_name: '',
        category: '',
        mission: '',
        contact_email: '',
        image_url: ''
      })
      
      alert('Organization creation request submitted successfully! It will be reviewed and approved soon.')
      onClose()
    } catch (err) {
      console.error('Error creating organization request:', err)
      setError(err.message || 'Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        org_name: '',
        category: '',
        mission: '',
        contact_email: '',
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
            className="create-org-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Organization</h2>
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
                <label htmlFor="org_name">
                  Organization Name <span className="required">*</span>
                </label>
                <input
                  id="org_name"
                  name="org_name"
                  type="text"
                  value={formData.org_name}
                  onChange={handleChange}
                  placeholder="Enter organization name..."
                  required
                  maxLength={200}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="mission">
                  Mission <span className="required">*</span>
                </label>
                <textarea
                  id="mission"
                  name="mission"
                  value={formData.mission}
                  onChange={handleChange}
                  placeholder="Describe your organization's mission and goals..."
                  rows={5}
                  required
                  maxLength={1000}
                  disabled={submitting}
                />
                <span className="char-count">{formData.mission.length}/1000</span>
              </div>

              <div className="form-group">
                <label htmlFor="contact_email">Contact Email</label>
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="contact@organization.org"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="image_url">Image URL</label>
                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  disabled={submitting}
                />
                <p className="form-hint">You can add an image URL later after approval</p>
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
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

