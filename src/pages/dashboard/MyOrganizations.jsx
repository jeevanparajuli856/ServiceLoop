import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import ProtectedRoute from '../../components/ProtectedRoute'
import NonprofitCard from '../../components/NonprofitCard'
import './MyOrganizations.css'

export default function MyOrganizations() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOrganizations()
    }
  }, [user])

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('nonprofit_members')
        .select(`
          nonprofit_id,
          nonprofits (
            id,
            name,
            mission,
            category,
            image_url
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const orgs = (data || [])
        .map((member) => member.nonprofits)
        .filter(Boolean)

      setOrganizations(orgs)
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="my-organizations-page">
        <div className="container">
          <div className="page-header">
            <h1>My Organizations</h1>
            <p className="text-muted">Manage your memberships and access organization resources</p>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : organizations.length > 0 ? (
            <div className="organizations-grid">
              {organizations.map((org) => (
                <div key={org.id} className="organization-card-wrapper">
                  <NonprofitCard nonprofit={org} />
                  <div className="organization-actions">
                    <Link
                      to={`/nonprofits/${org.id}`}
                      className="btn btn-outline"
                    >
                      View Events
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>You haven't joined any organizations yet</h3>
              <p>Start exploring nonprofits and join organizations that align with your interests</p>
              <Link to="/nonprofits" className="btn btn-primary">
                Explore Nonprofits
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

