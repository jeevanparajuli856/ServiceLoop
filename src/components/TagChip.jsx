import './TagChip.css'

export default function TagChip({ tag, onClick = null, isActive = false, isOrgTag = false }) {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }
  }

  // If onClick is provided, render as button, otherwise as span (display-only)
  if (onClick) {
    return (
      <button
        className={`tag-chip clickable ${isActive ? 'active' : ''} ${isOrgTag ? 'org-tag' : ''}`}
        onClick={handleClick}
        type="button"
      >
        {tag}
        {isOrgTag && <span className="tag-badge">Org</span>}
      </button>
    )
  }

  return (
    <span
      className={`tag-chip ${isActive ? 'active' : ''} ${isOrgTag ? 'org-tag' : ''}`}
    >
      {tag}
      {isOrgTag && <span className="tag-badge">Org</span>}
    </span>
  )
}
