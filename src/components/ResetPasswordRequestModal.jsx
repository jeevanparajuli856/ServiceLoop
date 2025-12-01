import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiMail } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import './ResetPasswordRequestModal.css'

export default function ResetPasswordRequestModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmail('')
      setError('')
      setSuccess(false)
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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setSubmitting(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message || 'Failed to send reset link. Please try again.')
        setSubmitting(false)
        return
      }

      // Success
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setEmail('')
        setError('')
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Error sending reset email:', err)
      setError('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setEmail('')
      setError('')
      setSuccess(false)
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
            className="reset-password-request-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-content">
                <FiMail className="modal-icon" />
                <h2>Reset Password</h2>
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
              {success ? (
                <div className="form-success">
                  <p>Password reset link sent to your email.</p>
                </div>
              ) : (
                <>
                  <p className="form-description">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  {error && (
                    <div className="form-error">
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="reset-email">
                      Email Address <span className="required">*</span>
                    </label>
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError('')
                      }}
                      placeholder="Enter your email address"
                      required
                      disabled={submitting}
                      autoComplete="email"
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
                      {submitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

