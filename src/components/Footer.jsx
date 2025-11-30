import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>ImpactBridge</h3>
            <p className="text-muted">Connecting volunteers with nonprofits to make real impact.</p>
          </div>
          <div className="footer-links">
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/nonprofits" className="footer-link">Nonprofits</Link>
            <Link to="/events" className="footer-link">Events</Link>
            <Link to="/forum" className="footer-link">Forum</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} ImpactBridge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

