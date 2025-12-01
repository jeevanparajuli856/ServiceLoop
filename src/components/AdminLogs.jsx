import { motion } from 'framer-motion'
import { FiActivity, FiUser, FiHome, FiFileText, FiCheck, FiX } from 'react-icons/fi'
import './AdminLogs.css'

export default function AdminLogs({ logs, loading }) {
  const getActionIcon = (actionType) => {
    if (actionType.includes('APPROVED')) return <FiCheck className="icon-success" />
    if (actionType.includes('REJECTED') || actionType.includes('DELETED') || actionType.includes('REMOVED')) return <FiX className="icon-danger" />
    if (actionType.includes('ORG')) return <FiHome />
    if (actionType.includes('USER')) return <FiUser />
    if (actionType.includes('POST')) return <FiFileText />
    return <FiActivity />
  }

  const getActionColor = (actionType) => {
    if (actionType.includes('APPROVED')) return 'success'
    if (actionType.includes('REJECTED') || actionType.includes('DELETED') || actionType.includes('REMOVED')) return 'danger'
    return 'primary'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="admin-logs-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="empty-logs">
        <FiActivity />
        <p>No admin actions logged yet</p>
      </div>
    )
  }

  return (
    <div className="admin-logs">
      <h2 className="section-title">System Logs</h2>
      <div className="logs-list">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            className={`log-item ${getActionColor(log.action_type)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="log-icon">
              {getActionIcon(log.action_type)}
            </div>
            <div className="log-content">
              <div className="log-header">
                <h4>{log.action_type.replace(/_/g, ' ')}</h4>
                <span className="log-date">{formatDate(log.created_at)}</span>
              </div>
              <div className="log-details">
                <p>
                  <strong>Performed by:</strong> {log.performed_by_email || 'System'}
                </p>
                {log.details && (
                  <div className="log-json">
                    <details>
                      <summary>View Details</summary>
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

