import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import UserDropdown from './UserDropdown'
import CreateOrganizationModal from './CreateOrganizationModal'
import logo from '../assets/logo.png'
import './Navbar.css'

export default function Navbar() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)

  useEffect(() => {
    const handleOpenCreateOrg = () => {
      setShowCreateOrgModal(true)
    }
    window.addEventListener('openCreateOrgModal', handleOpenCreateOrg)
    return () => {
      window.removeEventListener('openCreateOrgModal', handleOpenCreateOrg)
    }
  }, [])

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <img src={logo} alt="ServiceLoop Logo" className="brand-logo" />
          <span className="brand-name">ServiceLoop</span>
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
              <UserDropdown />
            ) : (
              <Link to="/login" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      <CreateOrganizationModal
        isOpen={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
      />
    </nav>
  )
}

