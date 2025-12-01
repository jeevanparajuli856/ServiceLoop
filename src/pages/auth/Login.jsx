import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import ResetPasswordRequestModal from '../../components/ResetPasswordRequestModal'
import './Login.css'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  // Check for error/message from location state (e.g., from reset password page)
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error)
    }
    if (location.state?.message) {
      alert(location.state.message)
    }
  }, [location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await signIn(email, password)
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name')
          setLoading(false)
          return
        }
        result = await signUp(email, password, fullName)
      }

      if (result.error) {
        setError(result.error.message || 'An error occurred')
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card card">
          <div className="login-header">
            <h1>ServiceLoop</h1>
            <p className="text-muted">Welcome back! Please sign in to continue.</p>
          </div>

          <div className="login-tabs">
            <button
              className={`tab-button ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true)
                setError('')
                setFullName('')
              }}
            >
              Login
            </button>
            <button
              className={`tab-button ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false)
                setError('')
              }}
            >
              Register
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required={!isLogin}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={6}
              />
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(true)}
                  className="forgot-password-link"
                >
                  Forgot Password?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <ResetPasswordRequestModal
            isOpen={showResetPasswordModal}
            onClose={() => setShowResetPasswordModal(false)}
          />

          {!isLogin && (
            <p className="login-footer text-muted">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

