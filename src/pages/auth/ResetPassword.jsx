import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import './ResetPassword.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    // Check for access_token in URL hash
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    const accessToken = params.get('access_token')
    const type = params.get('type')

    if (accessToken && type === 'recovery') {
      setTokenValid(true)
    } else {
      // No valid token, redirect to login
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            error: 'Invalid or expired reset link. Please request a new one.' 
          } 
        })
      }, 2000)
    }
  }, [navigate])

  const validateForm = () => {
    const newErrors = {}

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

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (updateError) {
        alert('Failed to reset password. Please try again.')
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Password reset successfully! Please log in with your new password.'
          }
        })
      }, 2000)
    } catch (err) {
      console.error('Error resetting password:', err)
      alert('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card card">
            <div className="reset-password-header">
              <h1>Invalid Reset Link</h1>
              <p className="text-muted">Redirecting to login page...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card card">
          <div className="reset-password-header">
            <h1>Reset Your Password</h1>
            <p className="text-muted">Enter your new password below</p>
          </div>

          {success ? (
            <div className="reset-success">
              <div className="success-icon">✓</div>
              <h2>Password Reset Successful!</h2>
              <p>Redirecting to login page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="reset-password-form">
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
                  disabled={loading}
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
                  disabled={loading}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className="reset-password-footer">
                <Link to="/login" className="back-to-login">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

