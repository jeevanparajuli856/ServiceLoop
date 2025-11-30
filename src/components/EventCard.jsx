import { Link } from 'react-router-dom'
import './EventCard.css'

export default function EventCard({ event, nonprofit, showJoin = false, isJoined = false, onJoin }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="event-card card">
      <div className="event-card-header">
        <h3>{event.title}</h3>
        {nonprofit && (
          <Link to={`/nonprofits/${nonprofit.id}`} className="event-nonprofit-link">
            {nonprofit.name}
          </Link>
        )}
      </div>
      <p className="event-description">{event.description || 'No description available.'}</p>
      <div className="event-details">
        <div className="event-detail-item">
          <span className="event-icon">📅</span>
          <span>{formatDate(event.date)}</span>
        </div>
        {event.location && (
          <div className="event-detail-item">
            <span className="event-icon">📍</span>
            <span>{event.location}</span>
          </div>
        )}
      </div>
      <div className="event-card-actions">
        <Link to={`/events?event=${event.id}`} className="btn btn-outline">
          View Details
        </Link>
        {showJoin && !isJoined && (
          <button onClick={onJoin} className="btn btn-accent">
            Join Event
          </button>
        )}
        {isJoined && (
          <span className="event-joined-badge">✓ Joined</span>
        )}
      </div>
    </div>
  )
}

