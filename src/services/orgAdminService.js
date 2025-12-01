import { supabase } from '../supabaseClient'
import { isSuperAdmin } from '../utils/superAdmin'

/**
 * Check if user is an organization admin
 * @param {Object} user - Current user
 * @param {string} nonprofitId - Nonprofit ID
 * @returns {Promise<boolean>}
 */
export const isOrgAdmin = async (user, nonprofitId) => {
  if (!user) return false
  
  // Super admin is always an admin
  if (isSuperAdmin(user)) return true
  
  try {
    const { data, error } = await supabase.rpc('is_org_admin', {
      user_id_param: user.id,
      nonprofit_id_param: nonprofitId
    })
    
    if (error) {
      console.error('Error checking org admin:', error)
      return false
    }
    
    return data === true
  } catch (error) {
    console.error('Error checking org admin:', error)
    return false
  }
}

/**
 * Get all admins for an organization
 * @param {string} nonprofitId - Nonprofit ID
 * @returns {Promise<Array>}
 */
export const getOrgAdmins = async (nonprofitId) => {
  try {
    const { data, error } = await supabase.rpc('get_org_admins', {
      nonprofit_id_param: nonprofitId
    })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error fetching org admins:', error)
    throw error
  }
}

/**
 * Add admin by email
 * @param {string} email - User email
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (must be org admin)
 * @returns {Promise<Object>}
 */
export const addAdminByEmail = async (email, nonprofitId, user) => {
  // Verify user is org admin
  const isAdmin = await isOrgAdmin(user, nonprofitId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Organization admin access required')
  }
  
  try {
    const { data, error } = await supabase.rpc('add_admin_by_email', {
      email_param: email,
      nonprofit_id_param: nonprofitId,
      added_by: user.id
    })
    
    if (error) throw error
    
    return { success: true, userId: data }
  } catch (error) {
    console.error('Error adding admin:', error)
    throw error
  }
}

/**
 * Remove admin
 * @param {string} userId - User ID to remove
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (must be org admin)
 * @returns {Promise<Object>}
 */
export const removeAdmin = async (userId, nonprofitId, user) => {
  // Prevent removing yourself
  if (userId === user.id) {
    throw new Error('You cannot remove yourself as an admin')
  }
  
  // Verify user is org admin
  const isAdmin = await isOrgAdmin(user, nonprofitId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Organization admin access required')
  }
  
  try {
    const { error } = await supabase.rpc('remove_admin', {
      user_id_param: userId,
      nonprofit_id_param: nonprofitId,
      removed_by: user.id
    })
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error removing admin:', error)
    throw error
  }
}

/**
 * Get organization members
 * @param {string} nonprofitId - Nonprofit ID
 * @returns {Promise<Array>}
 */
export const getOrgMembers = async (nonprofitId) => {
  try {
    const { data, error } = await supabase
      .from('nonprofit_members')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('nonprofit_id', nonprofitId)
      .order('joined_at', { ascending: false })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error fetching org members:', error)
    throw error
  }
}

/**
 * Remove member from organization
 * @param {string} userId - User ID
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (must be org admin)
 * @returns {Promise<Object>}
 */
export const removeMember = async (userId, nonprofitId, user) => {
  // Verify user is org admin
  const isAdmin = await isOrgAdmin(user, nonprofitId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Organization admin access required')
  }
  
  try {
    const { error } = await supabase
      .from('nonprofit_members')
      .delete()
      .eq('user_id', userId)
      .eq('nonprofit_id', nonprofitId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error removing member:', error)
    throw error
  }
}

/**
 * Get organization posts
 * @param {string} nonprofitId - Nonprofit ID
 * @returns {Promise<Array>}
 */
export const getOrgPosts = async (nonprofitId) => {
  try {
    // Get organization name
    const { data: org } = await supabase
      .from('nonprofits')
      .select('name')
      .eq('id', nonprofitId)
      .single()
    
    if (!org) {
      throw new Error('Organization not found')
    }
    
    // Get all posts and filter by tags
    const { data: allPosts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Filter posts that have this organization's name in tags
    const orgPosts = (allPosts || []).filter(post => {
      const tags = Array.isArray(post.tags) 
        ? post.tags 
        : (post.tags ? post.tags.split(',').map(t => t.trim()) : [])
      return tags.includes(org.name)
    })
    
    // Get comment counts
    const postsWithCounts = await Promise.all(
      orgPosts.map(async (post) => {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
        
        return {
          ...post,
          commentCount: count || 0
        }
      })
    )
    
    return postsWithCounts
  } catch (error) {
    console.error('Error fetching org posts:', error)
    throw error
  }
}

/**
 * Get organization events
 * @param {string} nonprofitId - Nonprofit ID
 * @returns {Promise<Array>}
 */
export const getOrgEvents = async (nonprofitId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('nonprofit_id', nonprofitId)
      .order('date', { ascending: false })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error fetching org events:', error)
    throw error
  }
}

/**
 * Delete organization post
 * @param {string} postId - Post ID
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (must be org admin)
 * @returns {Promise<Object>}
 */
export const deleteOrgPost = async (postId, nonprofitId, user) => {
  // Verify user is org admin
  const isAdmin = await isOrgAdmin(user, nonprofitId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Organization admin access required')
  }
  
  // Verify post belongs to this organization
  const orgPosts = await getOrgPosts(nonprofitId)
  const post = orgPosts.find(p => p.id === postId)
  
  if (!post) {
    throw new Error('Post not found or does not belong to this organization')
  }
  
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}

/**
 * Delete organization event
 * @param {string} eventId - Event ID
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (must be org admin)
 * @returns {Promise<Object>}
 */
export const deleteOrgEvent = async (eventId, nonprofitId, user) => {
  // Verify user is org admin
  const isAdmin = await isOrgAdmin(user, nonprofitId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Organization admin access required')
  }
  
  try {
    // First verify the event belongs to this organization
    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('id, nonprofit_id, title')
      .eq('id', eventId)
      .eq('nonprofit_id', nonprofitId)
      .single()
    
    if (fetchError) {
      console.error('Error fetching event:', fetchError)
      throw new Error('Event not found or does not belong to this organization')
    }
    
    if (!eventData) {
      throw new Error('Event not found')
    }
    
    console.log('Deleting event:', eventId, 'for org:', nonprofitId)
    
    // Delete the event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('nonprofit_id', nonprofitId)
    
    if (deleteError) {
      console.error('Error deleting event:', deleteError)
      console.error('Error code:', deleteError.code)
      console.error('Error message:', deleteError.message)
      
      // Check if it's an RLS error
      if (deleteError.code === '42501' || deleteError.message.includes('permission denied') || deleteError.message.includes('policy')) {
        throw new Error('Permission denied. You may not have permission to delete events. Please check RLS policies.')
      }
      
      throw deleteError
    }
    
    console.log('Event deleted successfully')
    return { success: true }
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

/**
 * Update organization details
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} updates - Updates object
 * @param {Object} user - Current user (must be org admin)
 * @returns {Promise<Object>}
 */
export const updateOrgDetails = async (nonprofitId, updates, user) => {
  // Verify user is org admin
  const isAdmin = await isOrgAdmin(user, nonprofitId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Organization admin access required')
  }
  
  try {
    // First, update the organization
    const { error: updateError } = await supabase
      .from('nonprofits')
      .update(updates)
      .eq('id', nonprofitId)
    
    if (updateError) throw updateError
    
    // Then, fetch the updated organization data separately
    const { data, error: selectError } = await supabase
      .from('nonprofits')
      .select('*')
      .eq('id', nonprofitId)
      .single()
    
    if (selectError) {
      console.error('Error fetching updated org:', selectError)
      // Still return success if update worked, even if fetch failed
      return { success: true }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Error updating org details:', error)
    throw error
  }
}

/**
 * Get organizations user is admin of
 * @param {Object} user - Current user
 * @returns {Promise<Array>}
 */
export const getMyAdminOrganizations = async (user) => {
  if (!user) return []
  
  try {
    const { data, error } = await supabase
      .from('organization_admins')
      .select(`
        *,
        nonprofits:nonprofit_id (
          id,
          name,
          category,
          mission,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map(item => ({
      ...item.nonprofits,
      adminSince: item.created_at
    }))
  } catch (error) {
    console.error('Error fetching admin organizations:', error)
    throw error
  }
}

/**
 * Get organization stats
 * @param {string} nonprofitId - Nonprofit ID
 * @returns {Promise<Object>}
 */
export const getOrgStats = async (nonprofitId) => {
  try {
    const [membersCount, adminsCount, postsCount, eventsCount] = await Promise.all([
      supabase
        .from('nonprofit_members')
        .select('*', { count: 'exact', head: true })
        .eq('nonprofit_id', nonprofitId),
      supabase
        .from('organization_admins')
        .select('*', { count: 'exact', head: true })
        .eq('nonprofit_id', nonprofitId),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('nonprofit_id', nonprofitId)
    ])
    
    // Get org posts count (filtered by tags)
    const orgPosts = await getOrgPosts(nonprofitId)
    
    // Get total engagements (posts + comments)
    const postsWithComments = await Promise.all(
      orgPosts.map(async (post) => {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
        return (count || 0) + 1 // +1 for the post itself
      })
    )
    const totalEngagements = postsWithComments.reduce((sum, count) => sum + count, 0)
    
    return {
      members: membersCount.count || 0,
      admins: adminsCount.count || 0,
      posts: orgPosts.length,
      events: eventsCount.count || 0,
      engagements: totalEngagements
    }
  } catch (error) {
    console.error('Error fetching org stats:', error)
    return {
      members: 0,
      admins: 0,
      posts: 0,
      events: 0,
      engagements: 0
    }
  }
}

