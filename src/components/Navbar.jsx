import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setUserMenuOpen(false)
  }

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-icon">🌉</span>
          <span className="brand-name">ImpactBridge</span>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/nonprofits" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Explore Nonprofits
          </Link>
          <Link to="/events" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Events
          </Link>
          {user && (
            <Link to="/my-organizations" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
              My Organizations
            </Link>
          )}
          <Link to="/forum" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Forum
          </Link>

          <div className="navbar-auth">
            {user ? (
              <div className="user-menu-wrapper">
                <button
                  className="user-avatar-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-label="User menu"
                >
                  <div className="user-avatar">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-email">{user.email}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-menu">
                    <button onClick={handleSignOut} className="user-menu-item">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

