import { motion } from 'framer-motion'
import './AdminCard.css'

export default function AdminCard({ title, value, icon: Icon, color = 'primary', trend = null }) {
  return (
    <motion.div
      className={`admin-card ${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="admin-card-icon">
        <Icon />
      </div>
      <div className="admin-card-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {trend && (
          <span className={`admin-card-trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  )
}

