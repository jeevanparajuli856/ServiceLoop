import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import Tabs from '../components/Tabs'
import EventCard from '../components/EventCard'
import PostCard from '../components/PostCard'
import './NonprofitDetail.css'

export default function NonprofitDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [nonprofit, setNonprofit] = useState(null)
  const [events, setEvents] = useState([])
  const [posts, setPosts] = useState([])
  const [isMember, setIsMember] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [joinedEvents, setJoinedEvents] = useState(new Set())

  useEffect(() => {
    loadData()
  }, [id, user])

  const loadData = async () => {
    try {
      // Load nonprofit
      const { data: npData, error: npError } = await supabase
        .from('nonprofits')
        .select('*')
        .eq('id', id)
        .single()

      if (npError) throw npError
      setNonprofit(npData)

      // Load events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('nonprofit_id', id)
        .order('date', { ascending: true })

      setEvents(eventsData || [])

      // Load posts (for now, using global posts - you can extend schema to add nonprofit_id)
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles:user_id(email)')
        .order('created_at', { ascending: false })
        .limit(10)

      // Map posts with author email
      const postsWithAuthors = (postsData || []).map((post) => ({
        ...post,
        author_email: post.profiles?.email || post.user_id,
      }))
      setPosts(postsWithAuthors)

      // Check membership
      if (user) {
        const { data: memberData } = await supabase
          .from('nonprofit_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('nonprofit_id', id)
          .single()

        setIsMember(!!memberData)

        // Load joined events
        const { data: signups } = await supabase
          .from('volunteer_signups')
          .select('event_id')
          .eq('user_id', user.id)

        if (signups) {
          setJoinedEvents(new Set(signups.map((s) => s.event_id)))
        }
      }

      // Load member count
      const { count } = await supabase
        .from('nonprofit_members')
        .select('*', { count: 'exact', head: true })
        .eq('nonprofit_id', id)

      setMemberCount(count || 0)
    } catch (error) {
      console.error('Error loading nonprofit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      alert('Please log in to join organizations')
      return
    }

    try {
      const { error } = await supabase.from('nonprofit_members').insert({
        user_id: user.id,
        nonprofit_id: id,
      })

      if (error) throw error
      setIsMember(true)
      setMemberCount((prev) => prev + 1)
    } catch (error) {
      console.error('Error joining nonprofit:', error)
      alert('Failed to join organization. Please try again.')
    }
  }

  const handleLeave = async () => {
    try {
      const { error } = await supabase
        .from('nonprofit_members')
        .delete()
        .eq('user_id', user.id)
        .eq('nonprofit_id', id)

      if (error) throw error
      setIsMember(false)
      setMemberCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error leaving nonprofit:', error)
      alert('Failed to leave organization. Please try again.')
    }
  }

  const handleJoinEvent = async (eventId) => {
    if (!user) {
      alert('Please log in to join events')
      return
    }

    try {
      const { error } = await supabase.from('volunteer_signups').insert({
        user_id: user.id,
        event_id: eventId,
      })

      if (error) throw error
      setJoinedEvents((prev) => new Set([...prev, eventId]))
    } catch (error) {
      console.error('Error joining event:', error)
      alert('Failed to join event. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!nonprofit) {
    return (
      <div className="empty-state">
        <h3>Nonprofit not found</h3>
        <Link to="/nonprofits" className="btn btn-primary">
          Back to Nonprofits
        </Link>
      </div>
    )
  }

  return (
    <div className="nonprofit-detail-page">
      <div className="nonprofit-header">
        <div className="container">
          <div className="nonprofit-header-content">
            <div className="nonprofit-logo">
              {nonprofit.image_url ? (
                <img src={nonprofit.image_url} alt={nonprofit.name} />
              ) : (
                <div className="nonprofit-logo-placeholder">
                  <span>🏢</span>
                </div>
              )}
            </div>
            <div className="nonprofit-header-info">
              <div className="nonprofit-header-top">
                <h1>{nonprofit.name}</h1>
                {nonprofit.category && (
                  <span className="nonprofit-category-badge">{nonprofit.category}</span>
                )}
              </div>
              <p className="nonprofit-member-count">👥 {memberCount} members</p>
              <div className="nonprofit-header-actions">
                {isMember ? (
                  <button onClick={handleLeave} className="btn btn-outline">
                    Leave Organization
                  </button>
                ) : (
                  <button onClick={handleJoin} className="btn btn-accent">
                    Join Organization
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <Tabs tabs={['About', 'Events', 'Forum']}>
          {/* About Tab */}
          <div className="tab-content">
            <div className="nonprofit-about">
              <h2>Mission</h2>
              <p className="nonprofit-mission">{nonprofit.mission || 'No mission statement available.'}</p>
              {nonprofit.contact_email && (
                <div className="nonprofit-contact">
                  <h3>Contact</h3>
                  <a href={`mailto:${nonprofit.contact_email}`} className="contact-link">
                    {nonprofit.contact_email}
                  </a>
                </div>
              )}
              <div className="nonprofit-meta">
                <p className="text-muted">
                  Joined ImpactBridge on {new Date(nonprofit.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Events Tab */}
          <div className="tab-content">
            {!isMember ? (
              <div className="members-only-overlay">
                <div className="members-only-content">
                  <h3>Join this organization to see and sign up for events</h3>
                  <button onClick={handleJoin} className="btn btn-accent">
                    Join Organization
                  </button>
                </div>
              </div>
            ) : events.length > 0 ? (
              <div className="events-list">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    nonprofit={nonprofit}
                    showJoin={true}
                    isJoined={joinedEvents.has(event.id)}
                    onJoin={() => handleJoinEvent(event.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No events scheduled yet.</p>
              </div>
            )}
          </div>

          {/* Forum Tab */}
          <div className="tab-content">
            {!isMember ? (
              <div className="members-only-overlay">
                <div className="members-only-content">
                  <h3>Join this organization to participate in the forum</h3>
                  <button onClick={handleJoin} className="btn btn-accent">
                    Join Organization
                  </button>
                </div>
              </div>
            ) : (
              <div className="forum-content">
                <Link to="/forum" className="btn btn-primary">
                  Go to Global Forum
                </Link>
                <p className="text-muted mt-2">
                  Organization-specific forum coming soon. For now, visit the global forum to discuss
                  and share ideas.
                </p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}

