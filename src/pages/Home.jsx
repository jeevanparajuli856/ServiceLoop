import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUsers, FiStar, FiCalendar, FiSearch, FiUserPlus, FiHeart } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import NonprofitCard from '../components/NonprofitCard'
import EventCard from '../components/EventCard'
import './Home.css'

// Import hero images
import heroImage from '../assets/home/community1.jpg'

export default function Home() {
  const [featuredNonprofits, setFeaturedNonprofits] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    volunteers: 0,
    nonprofits: 0,
    events: 0,
  })

  useEffect(() => {
    loadData()
    loadStats()
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

  const loadStats = async () => {
    try {
      // Get volunteer signups count
      const { count: volunteerCount } = await supabase
        .from('volunteer_signups')
        .select('*', { count: 'exact', head: true })

      // Get nonprofits count
      const { count: nonprofitCount } = await supabase
        .from('nonprofits')
        .select('*', { count: 'exact', head: true })

      // Get events count
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      setStats({
        volunteers: volunteerCount || 0,
        nonprofits: nonprofitCount || 0,
        events: eventCount || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background"></div>
        <div className="container">
          <div className="hero-content-wrapper">
            <motion.div
              className="hero-text"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1>Connect. Volunteer. Make an Impact.</h1>
              <p className="hero-subtitle">
                Join local nonprofits, participate in meaningful events, and be part of a growing community.
              </p>
              <div className="hero-cta">
                <Link to="/nonprofits" className="btn btn-hero-primary">
                  Explore Nonprofits
                </Link>
                <Link to="/events" className="btn btn-hero-secondary">
                  Browse Events
                </Link>
              </div>
            </motion.div>
            <motion.div
              className="hero-image"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img src={heroImage} alt="Community volunteering" />
              <div className="hero-image-overlay"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section
        className="stats-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="container">
          <div className="stats-grid">
            <motion.div
              className="stat-item"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="stat-icon">
                <FiUsers />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.volunteers}+</div>
                <div className="stat-label">Active Volunteers</div>
              </div>
            </motion.div>
            <motion.div
              className="stat-item"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="stat-icon">
                <FiStar />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.nonprofits}+</div>
                <div className="stat-label">Registered Nonprofits</div>
              </div>
            </motion.div>
            <motion.div
              className="stat-item"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="stat-icon">
                <FiCalendar />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.events}+</div>
                <div className="stat-label">Successful Events</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Featured Nonprofits */}
      <section className="section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Featured Nonprofits</h2>
            <Link to="/nonprofits" className="section-link">
              View All →
            </Link>
          </motion.div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : featuredNonprofits.length > 0 ? (
            <motion.div
              className="nonprofits-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {featuredNonprofits.map((nonprofit, index) => (
                <motion.div key={nonprofit.id} variants={itemVariants}>
                  <NonprofitCard nonprofit={nonprofit} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="empty-state-icon">🏢</div>
              <h3>No nonprofits available yet</h3>
              <p>Check back soon for amazing organizations to join!</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="section section-alt">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Upcoming Events</h2>
            <Link to="/events" className="section-link">
              View All →
            </Link>
          </motion.div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <motion.div
              className="events-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {upcomingEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants}>
                  <EventCard
                    event={event}
                    nonprofit={event.nonprofits}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="empty-state-icon">📅</div>
              <h3>No upcoming events</h3>
              <p>Stay tuned for exciting volunteer opportunities!</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works-section">
        <div className="container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It Works
          </motion.h2>
          <motion.div
            className="how-it-works"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="how-it-works-item" variants={itemVariants}>
              <div className="how-it-works-icon-wrapper">
                <FiSearch className="how-it-works-icon" />
              </div>
              <h3>Browse Nonprofits</h3>
              <p>Explore organizations making a difference in your community and beyond.</p>
            </motion.div>
            <motion.div className="how-it-works-item" variants={itemVariants}>
              <div className="how-it-works-icon-wrapper">
                <FiUserPlus className="how-it-works-icon" />
              </div>
              <h3>Join Organizations</h3>
              <p>Become a member to access exclusive events, forums, and volunteer opportunities.</p>
            </motion.div>
            <motion.div className="how-it-works-item" variants={itemVariants}>
              <div className="how-it-works-icon-wrapper">
                <FiHeart className="how-it-works-icon" />
              </div>
              <h3>Volunteer at Events</h3>
              <p>Sign up for events that align with your interests and make a tangible impact.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
