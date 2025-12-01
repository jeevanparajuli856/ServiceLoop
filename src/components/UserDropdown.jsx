import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiUser, 
  FiFileText, 
  FiUsers, 
  FiPlusCircle, 
  FiSettings, 
  FiLogOut,
  FiChevronDown,
  FiShield,
  FiBriefcase,
  FiLock
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { isSuperAdmin } from '../utils/superAdmin'
import { getMyAdminOrganizations } from '../services/orgAdminService'
import ChangePasswordModal from './ChangePasswordModal'
import './UserDropdown.css'

export default function UserDropdown() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [hasAdminOrgs, setHasAdminOrgs] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Check if user has admin organizations
  useEffect(() => {
    const checkAdminOrgs = async () => {
      if (!user) {
        setHasAdminOrgs(false)
        return
      }
      
      try {
        const orgs = await getMyAdminOrganizations(user)
        setHasAdminOrgs(orgs.length > 0)
      } catch (error) {
        console.error('Error checking admin orgs:', error)
        setHasAdminOrgs(false)
      }
    }
    
    checkAdminOrgs()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setIsOpen(false)
  }

  const getInitials = (email) => {
    if (!email) return 'U'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  const superAdmin = isSuperAdmin(user)

  const menuItems = [
    { icon: FiUser, label: 'My Dashboard', path: '/dashboard' },
    { icon: FiFileText, label: 'My Posts', path: '/dashboard?tab=posts' },
    { icon: FiUsers, label: 'My Organizations', path: '/my-organizations' },
    // Show "Manage My Organizations" only if user has admin orgs
    ...(hasAdminOrgs ? [
      { icon: FiBriefcase, label: 'Manage My Organizations', path: '/my-organizations-admin' }
    ] : []),
    { icon: FiPlusCircle, label: 'Create New Organization', path: null, action: 'create-org' },
    { icon: FiSettings, label: 'Settings', path: '/dashboard?tab=settings' },
    { icon: FiLock, label: 'Change Password', path: null, action: 'change-password' },
    // Super Admin section
    ...(superAdmin ? [
      { icon: FiShield, label: 'Admin Panel', path: '/admin', isSuperAdmin: true }
    ] : []),
    { icon: FiLogOut, label: 'Sign Out', path: null, action: 'signout' },
  ]

  if (!user) return null

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        className="user-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="user-avatar">
          {getInitials(user.email)}
        </div>
        <span className="user-email">{user.email?.split('@')[0]}</span>
        <FiChevronDown className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="user-dropdown-menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon
              
              if (item.action === 'signout') {
                return (
                  <button
                    key={index}
                    className="dropdown-item"
                    onClick={handleSignOut}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </button>
                )
              }

              if (item.action === 'create-org') {
                return (
                  <button
                    key={index}
                    className="dropdown-item create-org"
                    onClick={() => {
                      setIsOpen(false)
                      // Will be handled by parent component
                      window.dispatchEvent(new CustomEvent('openCreateOrgModal'))
                    }}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </button>
                )
              }

              if (item.action === 'change-password') {
                return (
                  <button
                    key={index}
                    className="dropdown-item"
                    onClick={() => {
                      setIsOpen(false)
                      setShowChangePasswordModal(true)
                    }}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`dropdown-item ${item.isSuperAdmin ? 'super-admin' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  )
}

