import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FiCalendar, FiMapPin, FiArrowLeft, FiUsers, FiCheck } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import './EventDetail.css'

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [nonprofit, setNonprofit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [volunteerCount, setVolunteerCount] = useState(0)

  useEffect(() => {
    loadEvent()
  }, [id, user])

  const refreshVolunteerCount = async () => {
    try {
      const { data: signupsData } = await supabase
        .from('volunteer_signups')
        .select('user_id')
        .eq('event_id', id)

      const uniqueVolunteers = new Set(signupsData?.map(s => s.user_id) || []).size
      setVolunteerCount(uniqueVolunteers)
    } catch (error) {
      console.error('Error refreshing volunteer count:', error)
    }
  }

  const loadEvent = async () => {
    try {
      // Load event with nonprofit info
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          nonprofits (
            id,
            name,
            category,
            image_url
          )
        `)
        .eq('id', id)
        .single()

      if (eventError) throw eventError

      setEvent(eventData)
      setNonprofit(eventData.nonprofits)

      // Load volunteer count (count distinct users to avoid duplicates)
      await refreshVolunteerCount()

      // Check if user has joined
      if (user) {
        const { data: signup } = await supabase
          .from('volunteer_signups')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', id)
          .single()

        setIsJoined(!!signup)
      }
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinEvent = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } })
      return
    }

    if (isJoined) {
      // Leave event
      try {
        const { error } = await supabase
          .from('volunteer_signups')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', id)

        if (error) throw error
        setIsJoined(false)
        await refreshVolunteerCount()
      } catch (error) {
        console.error('Error leaving event:', error)
        alert('Failed to leave event. Please try again.')
      }
      return
    }

    setJoining(true)
    try {
      const { error } = await supabase.from('volunteer_signups').insert({
        user_id: user.id,
        event_id: id,
      })

      if (error) {
        // Check if it's a duplicate error
        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
          alert('You have already joined this event.')
          setIsJoined(true)
          await refreshVolunteerCount()
          return
        }
        throw error
      }
      setIsJoined(true)
      await refreshVolunteerCount()
    } catch (error) {
      console.error('Error joining event:', error)
      alert('Failed to join event. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="empty-state">
        <h3>Event not found</h3>
        <Link to="/events" className="btn btn-primary">
          Back to Events
        </Link>
      </div>
    )
  }

  return (
    <div className="event-detail-page">
      <Link to="/events" className="back-link">
        <FiArrowLeft />
        <span>Back to Events</span>
      </Link>

      {/* Event Header with Image */}
      <div className="event-header">
        {event.image_url ? (
          <div className="event-image-container">
            <img src={event.image_url} alt={event.title} className="event-image" />
            <div className="event-image-overlay"></div>
          </div>
        ) : (
          <div className="event-image-placeholder">
            <div className="event-image-gradient"></div>
          </div>
        )}
        <div className="event-header-content">
          <div className="container">
            <div className="event-header-info">
              <div className="event-header-text">
                <h1>{event.title}</h1>
                {nonprofit && (
                  <Link to={`/nonprofits/${nonprofit.id}`} className="event-nonprofit-link">
                    {nonprofit.name}
                  </Link>
                )}
              </div>
              <div className="event-header-actions">
                <button
                  onClick={handleJoinEvent}
                  disabled={joining}
                  className={`btn ${isJoined ? 'btn-joined' : 'btn-join-event'}`}
                >
                  {joining ? (
                    'Processing...'
                  ) : isJoined ? (
                    <>
                      <FiCheck /> Joined
                    </>
                  ) : (
                    <>
                      <FiUsers /> Join Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="container">
        <div className="event-detail-content">
          <div className="event-main">
            {/* Event Info Cards */}
            <div className="event-info-cards">
              <div className="event-info-card">
                <div className="event-info-icon">
                  <FiCalendar />
                </div>
                <div className="event-info-content">
                  <h3>Date & Time</h3>
                  <p className="event-info-value">{formatDate(event.date)}</p>
                  {formatTime(event.date) && (
                    <p className="event-info-subvalue">{formatTime(event.date)}</p>
                  )}
                </div>
              </div>

              {event.location && (
                <div className="event-info-card">
                  <div className="event-info-icon">
                    <FiMapPin />
                  </div>
                  <div className="event-info-content">
                    <h3>Location</h3>
                    <p className="event-info-value">{event.location}</p>
                  </div>
                </div>
              )}

              <div className="event-info-card">
                <div className="event-info-icon">
                  <FiUsers />
                </div>
                <div className="event-info-content">
                  <h3>Volunteers</h3>
                  <p className="event-info-value">{volunteerCount} {volunteerCount === 1 ? 'volunteer' : 'volunteers'}</p>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="event-description-section">
              <h2>About This Event</h2>
              <p className="event-description-text">{event.description || 'No description available.'}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="event-sidebar">
            <div className="event-sidebar-card">
              <h3>Event Details</h3>
              <div className="event-sidebar-details">
                <div className="event-sidebar-item">
                  <span className="event-sidebar-label">Date</span>
                  <span className="event-sidebar-value">{formatDate(event.date)}</span>
                </div>
                {event.location && (
                  <div className="event-sidebar-item">
                    <span className="event-sidebar-label">Location</span>
                    <span className="event-sidebar-value">{event.location}</span>
                  </div>
                )}
                <div className="event-sidebar-item">
                  <span className="event-sidebar-label">Volunteers</span>
                  <span className="event-sidebar-value">{volunteerCount} joined</span>
                </div>
              </div>
              <button
                onClick={handleJoinEvent}
                disabled={joining}
                className={`btn btn-sidebar ${isJoined ? 'btn-joined' : 'btn-join-event'}`}
              >
                {joining ? (
                  'Processing...'
                ) : isJoined ? (
                  <>
                    <FiCheck /> You're Joined
                  </>
                ) : (
                  <>
                    <FiUsers /> Join This Event
                  </>
                )}
              </button>
            </div>

            {nonprofit && (
              <div className="event-sidebar-card">
                <h3>Organized By</h3>
                <Link to={`/nonprofits/${nonprofit.id}`} className="event-nonprofit-card">
                  {nonprofit.image_url && (
                    <img src={nonprofit.image_url} alt={nonprofit.name} className="nonprofit-sidebar-image" />
                  )}
                  <div className="nonprofit-sidebar-info">
                    <h4>{nonprofit.name}</h4>
                    {nonprofit.category && (
                      <span className="nonprofit-sidebar-category">{nonprofit.category}</span>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

