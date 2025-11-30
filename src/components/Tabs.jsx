import { useState } from 'react'
import './Tabs.css'

export default function Tabs({ tabs, defaultTab = 0, children }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="tabs-container">
      <div className="tabs-header" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`tab-panel-${index}`}
            id={`tab-${index}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {Array.isArray(children) ? children[activeTab] : children}
      </div>
    </div>
  )
}

