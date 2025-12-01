import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheck, FiX, FiEye, FiClock } from 'react-icons/fi'
import { approveOrgRequest, rejectOrgRequest } from '../services/adminService'
import './ApprovalsTable.css'

export default function ApprovalsTable({ requests, onUpdate, user }) {
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(new Set())
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectComment, setRejectComment] = useState('')

  const handleApprove = async (requestId) => {
    setProcessing(prev => new Set([...prev, requestId]))
    try {
      const result = await approveOrgRequest(requestId, user)
      if (result.success && result.nonprofitId) {
        // Get requester info to redirect them
        const request = requests.find(r => r.id === requestId)
        if (request && request.user_id) {
          // Note: In a real app, you'd redirect the requester, not the admin
          // For now, just show success message
          alert(`Organization approved successfully! The requester will be notified and can now manage their organization.`)
        } else {
          alert('Organization approved successfully!')
        }
        onUpdate()
      }
    } catch (error) {
      console.error('Error approving:', error)
      alert('Failed to approve organization. Please try again.')
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this organization request?')) {
      return
    }

    setProcessing(prev => new Set([...prev, requestId]))
    try {
      await rejectOrgRequest(requestId, user, rejectComment || null)
      alert('Organization request rejected.')
      setRejectComment('')
      setSelectedRequest(null)
      onUpdate()
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('Failed to reject request. Please try again.')
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
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

  if (requests.length === 0) {
    return (
      <div className="empty-approvals">
        <FiClock />
        <p>No pending approval requests</p>
      </div>
    )
  }

  return (
    <div className="approvals-table-container">
      <div className="approvals-table">
        {requests.map((request, index) => (
          <motion.div
            key={request.id}
            className="approval-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="approval-card-header">
              <div className="approval-org-info">
                <h3>{request.org_name}</h3>
                <span className="approval-category">{request.category}</span>
              </div>
              <span className="approval-status pending">Pending</span>
            </div>

            <div className="approval-card-body">
              <p className="approval-mission">{request.mission}</p>
              
              <div className="approval-meta">
                <div className="approval-meta-item">
                  <strong>Submitted by:</strong>
                  <span>{request.profiles?.full_name || request.profiles?.email || 'Unknown'}</span>
                </div>
                <div className="approval-meta-item">
                  <strong>Submitted:</strong>
                  <span>{formatDate(request.created_at)}</span>
                </div>
                {request.contact_email && (
                  <div className="approval-meta-item">
                    <strong>Contact:</strong>
                    <a href={`mailto:${request.contact_email}`}>{request.contact_email}</a>
                  </div>
                )}
              </div>
            </div>

            <div className="approval-card-actions">
              <button
                className="btn-approve"
                onClick={() => handleApprove(request.id)}
                disabled={processing.has(request.id)}
              >
                <FiCheck />
                <span>Approve</span>
              </button>
              <button
                className="btn-reject"
                onClick={() => setSelectedRequest(request.id)}
                disabled={processing.has(request.id)}
              >
                <FiX />
                <span>Reject</span>
              </button>
              <button
                className="btn-view"
                onClick={() => {
                  alert(`Organization: ${request.org_name}\nCategory: ${request.category}\nMission: ${request.mission}\nContact: ${request.contact_email || 'N/A'}`)
                }}
              >
                <FiEye />
                <span>View Details</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reject Modal */}
      {selectedRequest && (
        <div className="reject-modal-overlay" onClick={() => {
          setSelectedRequest(null)
          setRejectComment('')
        }}>
          <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Organization Request</h3>
            <p>Are you sure you want to reject this request?</p>
            <textarea
              placeholder="Optional: Add a comment explaining the rejection..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
            />
            <div className="reject-modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSelectedRequest(null)
                  setRejectComment('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleReject(selectedRequest)}
                disabled={processing.has(selectedRequest)}
              >
                {processing.has(selectedRequest) ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

