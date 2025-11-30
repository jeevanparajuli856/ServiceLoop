import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import NonprofitCard from '../components/NonprofitCard'
import EventCard from '../components/EventCard'
import './Home.css'

export default function Home() {
  const [featuredNonprofits, setFeaturedNonprofits] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load featured nonprofits (limit 4)
      const { data: nonprofits } = await supabase
        .from('nonprofits')
        .select('*')
        .limit(4)
        .order('created_at', { ascending: false })

      // Load upcoming events (limit 6)
      const { data: events } = await supabase
        .from('events')
        .select(`
          *,
          nonprofits (
            id,
            name
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(6)

      setFeaturedNonprofits(nonprofits || [])
      setUpcomingEvents(events || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Connect with Nonprofits. Make Real Impact.</h1>
            <p className="hero-subtitle">
              Discover local organizations, join meaningful causes, and volunteer at events that matter.
              Start your journey to create positive change in your community today.
            </p>
            <div className="hero-cta">
              <Link to="/nonprofits" className="btn btn-primary btn-large">
                Explore Nonprofits
              </Link>
              <Link to="/events" className="btn btn-secondary btn-large">
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Nonprofits */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Nonprofits</h2>
            <Link to="/nonprofits" className="section-link">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : featuredNonprofits.length > 0 ? (
            <div className="nonprofits-grid">
              {featuredNonprofits.map((nonprofit) => (
                <NonprofitCard key={nonprofit.id} nonprofit={nonprofit} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No nonprofits available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="section-link">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="events-grid">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  nonprofit={event.nonprofits}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <h2 className="text-center mb-4">How It Works</h2>
          <div className="how-it-works">
            <div className="how-it-works-item">
              <div className="how-it-works-icon">🔍</div>
              <h3>Browse Nonprofits</h3>
              <p>Explore organizations making a difference in your community and beyond.</p>
            </div>
            <div className="how-it-works-item">
              <div className="how-it-works-icon">🤝</div>
              <h3>Join Organizations</h3>
              <p>Become a member to access exclusive events, forums, and volunteer opportunities.</p>
            </div>
            <div className="how-it-works-item">
              <div className="how-it-works-icon">📅</div>
              <h3>Volunteer at Events</h3>
              <p>Sign up for events that align with your interests and make a tangible impact.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

