import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiLock } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import './ChangePasswordModal.css'

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, submitting, onClose])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.oldPassword.trim()) {
      newErrors.oldPassword = 'Old password is required'
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!user) {
      alert('Please log in to change your password')
      return
    }

    setSubmitting(true)

    try {
      // Verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.oldPassword
      })

      if (signInError) {
        setErrors({ oldPassword: 'Incorrect old password' })
        setSubmitting(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (updateError) {
        alert('Failed to update password. Please try again.')
        setSubmitting(false)
        return
      }

      // Success
      alert('Password updated successfully.')
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setErrors({})
      onClose()
    } catch (err) {
      console.error('Error changing password:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setErrors({})
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
            className="change-password-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-content">
                <FiLock className="modal-icon" />
                <h2>Change Password</h2>
              </div>
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
              <div className="form-group">
                <label htmlFor="oldPassword">
                  Old Password <span className="required">*</span>
                </label>
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type="password"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  required
                  disabled={submitting}
                  autoComplete="current-password"
                />
                {errors.oldPassword && (
                  <span className="field-error">{errors.oldPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">
                  New Password <span className="required">*</span>
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password (min. 6 characters)"
                  required
                  minLength={6}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                {errors.newPassword && (
                  <span className="field-error">{errors.newPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
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
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

