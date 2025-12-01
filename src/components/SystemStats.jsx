import { motion } from 'framer-motion'
import { FiUsers, FiHome, FiCalendar, FiFileText, FiMessageSquare, FiClock } from 'react-icons/fi'
import AdminCard from './AdminCard'
import './SystemStats.css'

export default function SystemStats({ metrics, loading }) {
  if (loading) {
    return (
      <div className="system-stats-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Nonprofits',
      value: metrics.nonprofits || 0,
      icon: FiHome,
      color: 'primary'
    },
    {
      title: 'Total Users',
      value: metrics.users || 0,
      icon: FiUsers,
      color: 'success'
    },
    {
      title: 'Total Events',
      value: metrics.events || 0,
      icon: FiCalendar,
      color: 'primary'
    },
    {
      title: 'Total Posts',
      value: metrics.posts || 0,
      icon: FiFileText,
      color: 'success'
    },
    {
      title: 'Total Comments',
      value: metrics.comments || 0,
      icon: FiMessageSquare,
      color: 'primary'
    },
    {
      title: 'Pending Requests',
      value: metrics.pendingRequests || 0,
      icon: FiClock,
      color: 'warning'
    }
  ]

  return (
    <div className="system-stats">
      <h2 className="section-title">System Metrics</h2>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <AdminCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
    </div>
  )
}

