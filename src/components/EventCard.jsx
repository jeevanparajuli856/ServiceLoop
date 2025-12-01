import { Link } from 'react-router-dom'
import { FiCalendar, FiMapPin } from 'react-icons/fi'
import './EventCard.css'

export default function EventCard({ event, nonprofit }) {
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

  const formattedDate = formatDate(event.date)
  const description = event.description ? `${event.description.slice(0, 150)}...` : 'No description available.'

  return (
    <div className="event-card">
      {nonprofit && (
        <div className="event-card-badge">{nonprofit.name.toUpperCase()}</div>
      )}

      <h3 className="event-card-title">{event.title}</h3>

      <p className="event-card-desc">
        {description}
      </p>

      <div className="event-info-box">
        <div className="info-row">
          <FiCalendar />
          <span>{formattedDate}</span>
        </div>
        {event.location && (
          <div className="info-row">
            <FiMapPin />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      <Link to={`/events/${event.id}`} className="view-details-btn">
        View Details
      </Link>
    </div>
  )
}
