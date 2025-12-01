import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import EventCard from '../components/EventCard'
import './Events.css'

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [nonprofits, setNonprofits] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedNonprofit, setSelectedNonprofit] = useState('all')
  const [dateFilter, setDateFilter] = useState('upcoming')
  const [joinedEvents, setJoinedEvents] = useState(new Set())

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      // Load all events with nonprofit info
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          *,
          nonprofits (
            id,
            name,
            category
          )
        `)
        .order('date', { ascending: true })

      setEvents(eventsData || [])

      // Load nonprofits for filter
      const { data: nonprofitsData } = await supabase
        .from('nonprofits')
        .select('id, name')
        .order('name', { ascending: true })

      setNonprofits(nonprofitsData || [])

      // Load joined events if user is logged in
      if (user) {
        const { data: signups } = await supabase
          .from('volunteer_signups')
          .select('event_id')
          .eq('user_id', user.id)

        if (signups) {
          setJoinedEvents(new Set(signups.map((s) => s.event_id)))
        }
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    filterEvents()
  }, [events, selectedCategory, selectedNonprofit, dateFilter])

  const filterEvents = () => {
    let filtered = [...events]

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (event) => event.nonprofits?.category === selectedCategory
      )
    }

    // Filter by nonprofit
    if (selectedNonprofit !== 'all') {
      filtered = filtered.filter(
        (event) => event.nonprofit_id === selectedNonprofit
      )
    }

    // Filter by date
    const today = new Date().toISOString().split('T')[0]
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter((event) => event.date >= today)
    } else if (dateFilter === 'past') {
      filtered = filtered.filter((event) => event.date < today)
    }

    setFilteredEvents(filtered)
  }

  // Get unique categories from nonprofits
  const categories = [
    'all',
    ...new Set(events.map((e) => e.nonprofits?.category).filter(Boolean)),
  ]

  return (
    <div className="global-events-page">
      <div className="container">
        <div className="page-header">
          <h1>Global Events</h1>
          <p className="page-subtitle">Discover volunteer opportunities and community events</p>
        </div>

        <div className="filters-bar">
          <div className="filter-group">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="nonprofit-filter">Nonprofit</label>
            <select
              id="nonprofit-filter"
              value={selectedNonprofit}
              onChange={(e) => setSelectedNonprofit(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Nonprofits</option>
              {nonprofits.map((np) => (
                <option key={np.id} value={np.id}>
                  {np.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="date-filter">Date</label>
            <select
              id="date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="all">All Events</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                nonprofit={event.nonprofits}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No events found</h3>
            <p>Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
