import { useState, useEffect } from 'react'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import NonprofitCard from '../../components/NonprofitCard'
import './Nonprofits.css'

export default function Nonprofits() {
  const { user } = useAuth()
  const [nonprofits, setNonprofits] = useState([])
  const [filteredNonprofits, setFilteredNonprofits] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [joinedNonprofits, setJoinedNonprofits] = useState(new Set())
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  useEffect(() => {
    loadNonprofits()
    if (user) {
      loadJoinedNonprofits()
    }
  }, [user])

  useEffect(() => {
    filterNonprofits()
  }, [nonprofits, searchQuery, selectedCategory])

  const loadNonprofits = async () => {
    try {
      const { data, error } = await supabase
        .from('nonprofits')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setNonprofits(data || [])
    } catch (error) {
      console.error('Error loading nonprofits:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadJoinedNonprofits = async () => {
    try {
      const { data } = await supabase
        .from('nonprofit_members')
        .select('nonprofit_id')
        .eq('user_id', user.id)

      if (data) {
        setJoinedNonprofits(new Set(data.map((m) => m.nonprofit_id)))
      }
    } catch (error) {
      console.error('Error loading joined nonprofits:', error)
    }
  }

  const filterNonprofits = () => {
    let filtered = [...nonprofits]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (np) =>
          np.name.toLowerCase().includes(query) ||
          np.mission?.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((np) => np.category === selectedCategory)
    }

    setFilteredNonprofits(filtered)
  }

  const handleJoin = async (nonprofitId) => {
    if (!user) {
      alert('Please log in to join organizations')
      return
    }

    try {
      const { error } = await supabase.from('nonprofit_members').insert({
        user_id: user.id,
        nonprofit_id: nonprofitId,
      })

      if (error) throw error
      setJoinedNonprofits((prev) => new Set([...prev, nonprofitId]))
    } catch (error) {
      console.error('Error joining nonprofit:', error)
      alert('Failed to join organization. Please try again.')
    }
  }

  const handleLeave = async (nonprofitId) => {
    try {
      const { error } = await supabase
        .from('nonprofit_members')
        .delete()
        .eq('user_id', user.id)
        .eq('nonprofit_id', nonprofitId)

      if (error) throw error
      setJoinedNonprofits((prev) => {
        const newSet = new Set(prev)
        newSet.delete(nonprofitId)
        return newSet
      })
    } catch (error) {
      console.error('Error leaving nonprofit:', error)
      alert('Failed to leave organization. Please try again.')
    }
  }

  // Get unique categories
  const categories = ['all', ...new Set(nonprofits.map((np) => np.category).filter(Boolean))]

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all'

  return (
    <div className="nonprofits-page">
      <div className="container">
        <div className="page-header">
          <h1>Explore Nonprofits</h1>
          <p className="text-muted">Discover organizations making a difference in your community</p>
        </div>

        <div className="search-filter-container">
          {/* Search Bar */}
          <div className="search-wrapper">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or mission..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
            <button
              className="filter-toggle-btn"
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              aria-label="Toggle filters"
            >
              <FiFilter />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="filter-badge">1</span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {filterPanelOpen && (
            <div className="filter-panel">
              <div className="filter-panel-header">
                <h3>Filter by Category</h3>
                {hasActiveFilters && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear All
                  </button>
                )}
              </div>
              <div className="category-filters">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="active-filters">
              {searchQuery && (
                <span className="active-filter-tag">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>
                    <FiX />
                  </button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="active-filter-tag">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}>
                    <FiX />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredNonprofits.length > 0 ? (
          <div className="nonprofits-grid">
            {filteredNonprofits.map((nonprofit) => (
              <NonprofitCard
                key={nonprofit.id}
                nonprofit={nonprofit}
                showJoin={true}
                isJoined={joinedNonprofits.has(nonprofit.id)}
                onJoin={() => handleJoin(nonprofit.id)}
                onLeave={() => handleLeave(nonprofit.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No nonprofits found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

