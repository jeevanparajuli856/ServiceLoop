import { Link } from 'react-router-dom'
import './NonprofitCard.css'

export default function NonprofitCard({ nonprofit, showJoin = false, isJoined = false, onJoin, onLeave }) {
  return (
    <div className="nonprofit-card card">
      <div className="nonprofit-card-image">
        {nonprofit.image_url ? (
          <img src={nonprofit.image_url} alt={nonprofit.name} />
        ) : (
          <div className="nonprofit-card-placeholder">
            <span>🏢</span>
          </div>
        )}
      </div>
      <div className="nonprofit-card-content">
        <div className="nonprofit-card-header">
          <h3>{nonprofit.name}</h3>
          {nonprofit.category && (
            <span className="nonprofit-category">{nonprofit.category}</span>
          )}
        </div>
        <p className="nonprofit-mission">{nonprofit.mission || 'No mission statement available.'}</p>
        <div className="nonprofit-card-actions">
          <Link to={`/nonprofits/${nonprofit.id}`} className="btn btn-primary">
            View Profile
          </Link>
          {showJoin && (
            <>
              {isJoined ? (
                <button onClick={onLeave} className="btn btn-outline">
                  Leave
                </button>
              ) : (
                <button onClick={onJoin} className="btn btn-accent">
                  Join
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

