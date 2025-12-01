import { supabase } from '../supabaseClient'
import { isSuperAdmin } from '../utils/superAdmin'

/**
 * Approve an organization creation request
 * @param {string} requestId - Request ID
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
export const approveOrgRequest = async (requestId, user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    const { data: nonprofitId, error } = await supabase.rpc('approve_org_request', {
      request_id: requestId,
      reviewer_id: user.id,
      reviewer_email: user.email
    })

    if (error) {
      // If function doesn't exist, provide helpful error
      if (error.code === '42883' || error.message.includes('does not exist')) {
        throw new Error('Database function not found. Please run ORGANIZATION_ADMIN_SYSTEM.sql in Supabase SQL Editor.')
      }
      throw error
    }

    // Verify admin was created
    if (nonprofitId) {
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('organization_admins')
        .select('user_id, nonprofit_id')
        .eq('nonprofit_id', nonprofitId)
        .eq('user_id', (await supabase
          .from('org_creation_requests')
          .select('user_id')
          .eq('id', requestId)
          .single()
        ).data?.user_id)
        .single()

      if (adminCheckError && adminCheckError.code !== 'PGRST116') {
        console.error('Warning: Admin may not have been created:', adminCheckError)
      } else if (adminCheck) {
        console.log('✅ Admin successfully created for organization:', nonprofitId)
      }

      // Get requester email for notification
      const { data: requestData } = await supabase
        .from('org_creation_requests')
        .select('user_id')
        .eq('id', requestId)
        .single()

      if (requestData) {
        const { data: requesterProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', requestData.user_id)
          .single()

        // Send email notification via Supabase Auth (if configured)
        // Note: This requires Supabase email templates to be set up
        if (requesterProfile?.email) {
          try {
            // Use Supabase's email function if available, or log for manual sending
            console.log('Organization approved. Email notification should be sent to:', requesterProfile.email)
            console.log('Organization ID:', nonprofitId, '- User can now manage at /org/' + nonprofitId + '/admin')
            // In production, you might want to use Supabase Edge Function or Resend API
          } catch (emailError) {
            console.warn('Could not send email notification:', emailError)
          }
        }
      }
    }

    return { success: true, nonprofitId }
  } catch (error) {
    console.error('Error approving request:', error)
    throw error
  }
}

/**
 * Reject an organization creation request
 * @param {string} requestId - Request ID
 * @param {Object} user - Current user
 * @param {string} comment - Optional rejection comment
 * @returns {Promise<Object>}
 */
export const rejectOrgRequest = async (requestId, user, comment = null) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    const { error } = await supabase.rpc('reject_org_request', {
      request_id: requestId,
      reviewer_id: user.id,
      reviewer_email: user.email,
      comment: comment
    })

    if (error) {
      // If function doesn't exist, provide helpful error
      if (error.code === '42883' || error.message.includes('does not exist')) {
        throw new Error('Database function not found. Please run ORGANIZATION_ADMIN_SYSTEM.sql in Supabase SQL Editor.')
      }
      throw error
    }

    // Get result data for email notification
    const { data: result } = await supabase.rpc('reject_org_request', {
      request_id: requestId,
      reviewer_id: user.id,
      reviewer_email: user.email,
      comment: comment
    })

    // Send email notification if result contains requester email
    if (result && result.requester_email) {
      try {
        console.log('Organization rejected. Email notification should be sent to:', result.requester_email)
        console.log('Rejection comment:', result.comment || 'No comment provided')
        // In production, you might want to use Supabase Edge Function or Resend API
      } catch (emailError) {
        console.warn('Could not send email notification:', emailError)
      }
    }

    return { success: true, requesterEmail: result?.requester_email }
  } catch (error) {
    console.error('Error rejecting request:', error)
    throw error
  }
}

/**
 * Get all pending organization requests
 * @param {Object} user - Current user
 * @returns {Promise<Array>}
 */
export const getPendingOrgRequests = async (user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  console.log('🔍 Fetching pending requests for super admin:', user.email)

  try {
    // First, try a simple query without any filters to see if RLS is blocking
    console.log('Step 1: Fetching ALL requests (no filters)...')
    const { data: allData, error: allError, count } = await supabase
      .from('org_creation_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Error fetching all requests:', allError)
      console.error('Error code:', allError.code)
      console.error('Error message:', allError.message)
      console.error('Error details:', allError.details)
      console.error('Error hint:', allError.hint)
      
      // If table doesn't exist, return empty array
      if (allError.code === '42P01' || allError.message.includes('does not exist')) {
        console.warn('⚠️ org_creation_requests table may not exist yet')
        return []
      }
      // Check if it's an RLS error
      if (allError.code === '42501' || allError.message.includes('permission denied') || allError.message.includes('policy') || allError.message.includes('RLS')) {
        console.error('🚫 RLS Policy Error - Super admin may not have access.')
        console.error('Please run FIX_ADMIN_RLS_POLICIES.sql in Supabase SQL Editor')
        // Return empty array instead of throwing so the page still loads
        return []
      }
      throw allError
    }

    console.log('✅ All requests fetched successfully!')
    console.log('📊 Total count:', count)
    console.log('📋 All requests data:', allData)
    console.log('📋 Number of requests:', allData?.length || 0)

    if (!allData || allData.length === 0) {
      console.log('ℹ️ No requests found in database')
      return []
    }

    // Log each request's status
    console.log('📝 Request statuses:')
    allData.forEach((req, index) => {
      console.log(`  ${index + 1}. ID: ${req.id}, Org: ${req.org_name}, Status: "${req.status}" (type: ${typeof req.status})`)
    })

    // Filter for pending requests (handle null status as pending)
    const pendingRequests = (allData || []).filter(req => {
      const status = req.status
      // Check for null, undefined, empty string, or 'pending'
      const isPending = status === null || status === undefined || status === '' || status === 'pending'
      if (!isPending) {
        console.log(`  ⏭️  Skipping request ${req.id} - status is "${status}"`)
      }
      return isPending
    })

    console.log('✅ Filtered pending requests:', pendingRequests.length)
    console.log('📋 Pending requests:', pendingRequests)

    if (pendingRequests.length === 0) {
      console.log('ℹ️ No pending requests found after filtering')
      return []
    }

    // Now try to fetch with profile data
    console.log('Step 2: Fetching profile data for pending requests...')
    const requestIds = pendingRequests.map(req => req.id)
    const { data: dataWithProfiles, error: profileError } = await supabase
      .from('org_creation_requests')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .in('id', requestIds)
      .order('created_at', { ascending: false })

    if (profileError) {
      console.warn('⚠️ Error fetching profiles (non-critical):', profileError)
      // Return requests without profile data if join fails
      const requestsWithoutProfiles = pendingRequests.map(req => ({
        ...req,
        profiles: null
      }))
      console.log('✅ Returning requests without profile data:', requestsWithoutProfiles)
      return requestsWithoutProfiles
    }

    // Filter the results again in case the join changed something
    const finalResults = (dataWithProfiles || []).filter(req => {
      const status = req.status
      return status === null || status === undefined || status === '' || status === 'pending'
    })

    console.log('✅ Final pending requests with profiles:', finalResults.length)
    console.log('📋 Final results:', finalResults)
    return finalResults
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error)
    console.error('Error stack:', error.stack)
    // Return empty array instead of throwing for better UX
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      return []
    }
    // Don't throw - return empty array so page still loads
    return []
  }
}

/**
 * Get all organizations
 * @param {Object} user - Current user
 * @returns {Promise<Array>}
 */
export const getAllOrganizations = async (user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    const { data, error } = await supabase
      .from('nonprofits')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('nonprofits table may not exist yet')
        return []
      }
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching organizations:', error)
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      return []
    }
    throw error
  }
}

/**
 * Get all users with stats
 * @param {Object} user - Current user
 * @returns {Promise<Array>}
 */
export const getAllUsersWithStats = async (user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    // Get all users from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')

    if (profilesError) throw profilesError

    // Get stats for each user
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const [postsCount, eventsCount, orgsCount] = await Promise.all([
          supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id),
          supabase
            .from('volunteer_signups')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id),
          supabase
            .from('nonprofit_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
        ])

        return {
          ...profile,
          stats: {
            posts: postsCount.count || 0,
            events: eventsCount.count || 0,
            organizations: orgsCount.count || 0
          }
        }
      })
    )

    return usersWithStats
  } catch (error) {
    console.error('Error fetching users with stats:', error)
    throw error
  }
}

/**
 * Get system metrics
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
export const getSystemMetrics = async (user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    const results = await Promise.allSettled([
      supabase.from('nonprofits').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase
        .from('org_creation_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
    ])

    return {
      nonprofits: results[0].status === 'fulfilled' ? (results[0].value.count || 0) : 0,
      users: results[1].status === 'fulfilled' ? (results[1].value.count || 0) : 0,
      events: results[2].status === 'fulfilled' ? (results[2].value.count || 0) : 0,
      posts: results[3].status === 'fulfilled' ? (results[3].value.count || 0) : 0,
      comments: results[4].status === 'fulfilled' ? (results[4].value.count || 0) : 0,
      pendingRequests: results[5].status === 'fulfilled' ? (results[5].value.count || 0) : 0
    }
  } catch (error) {
    console.error('Error fetching system metrics:', error)
    // Return default values instead of throwing
    return {
      nonprofits: 0,
      users: 0,
      events: 0,
      posts: 0,
      comments: 0,
      pendingRequests: 0
    }
  }
}

/**
 * Get admin action logs
 * @param {Object} user - Current user
 * @param {number} limit - Number of logs to fetch
 * @returns {Promise<Array>}
 */
export const getAdminLogs = async (user, limit = 50) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    const { data, error } = await supabase
      .from('admin_actions_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('admin_actions_log table may not exist yet')
        return []
      }
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching admin logs:', error)
    // Return empty array instead of throwing
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      return []
    }
    throw error
  }
}

/**
 * Remove user from organization
 * @param {string} userId - User ID
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (super admin)
 * @returns {Promise<Object>}
 */
export const removeUserFromOrg = async (userId, nonprofitId, user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    const { error } = await supabase
      .from('nonprofit_members')
      .delete()
      .eq('user_id', userId)
      .eq('nonprofit_id', nonprofitId)

    if (error) throw error

    // Log action
    await supabase.from('admin_actions_log').insert({
      performed_by: user.id,
      performed_by_email: user.email,
      action_type: 'USER_REMOVED_FROM_ORG',
      target_id: userId,
      target_type: 'user',
      details: {
        nonprofit_id: nonprofitId
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error removing user from org:', error)
    throw error
  }
}

/**
 * Promote user to org admin
 * @param {string} userId - User ID
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (super admin)
 * @returns {Promise<Object>}
 */
export const promoteToOrgAdmin = async (userId, nonprofitId, user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    const { error } = await supabase
      .from('organization_admins')
      .insert({
        user_id: userId,
        nonprofit_id: nonprofitId
      })
      .select()
      .single()

    if (error) throw error

    // Log action
    await supabase.from('admin_actions_log').insert({
      performed_by: user.id,
      performed_by_email: user.email,
      action_type: 'USER_PROMOTED_TO_ADMIN',
      target_id: userId,
      target_type: 'user',
      details: {
        nonprofit_id: nonprofitId
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error promoting user:', error)
    throw error
  }
}

/**
 * Demote org admin
 * @param {string} userId - User ID
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (super admin)
 * @returns {Promise<Object>}
 */
export const demoteOrgAdmin = async (userId, nonprofitId, user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    const { error } = await supabase
      .from('organization_admins')
      .delete()
      .eq('user_id', userId)
      .eq('nonprofit_id', nonprofitId)

    if (error) throw error

    // Log action
    await supabase.from('admin_actions_log').insert({
      performed_by: user.id,
      performed_by_email: user.email,
      action_type: 'USER_DEMOTED_FROM_ADMIN',
      target_id: userId,
      target_type: 'user',
      details: {
        nonprofit_id: nonprofitId
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error demoting admin:', error)
    throw error
  }
}

/**
 * Delete organization
 * @param {string} nonprofitId - Nonprofit ID
 * @param {Object} user - Current user (super admin)
 * @returns {Promise<Object>}
 */
export const deleteOrganization = async (nonprofitId, user) => {
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required')
  }

  try {
    // Get org name for logging
    const { data: org, error: fetchError } = await supabase
      .from('nonprofits')
      .select('name')
      .eq('id', nonprofitId)
      .single()

    if (fetchError) {
      console.error('Error fetching org:', fetchError)
      throw fetchError
    }

    console.log('Deleting organization:', nonprofitId, org?.name)

    // First, delete related records manually to ensure they're removed
    // Delete organization admins
    const { error: adminsError } = await supabase
      .from('organization_admins')
      .delete()
      .eq('nonprofit_id', nonprofitId)
    
    if (adminsError) {
      console.warn('Error deleting admins (may not exist):', adminsError)
      // Don't throw, continue with deletion
    }

    // Delete members
    const { error: membersError } = await supabase
      .from('nonprofit_members')
      .delete()
      .eq('nonprofit_id', nonprofitId)
    
    if (membersError) {
      console.warn('Error deleting members (may not exist):', membersError)
      // Don't throw, continue with deletion
    }

    // Delete events (cascade should handle this, but being explicit)
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('nonprofit_id', nonprofitId)
    
    if (eventsError) {
      console.warn('Error deleting events (may not exist):', eventsError)
      // Don't throw, continue with deletion
    }

    // Delete posts tagged with this org (if any)
    // Get org name first
    const orgName = org?.name
    if (orgName) {
      // Get all posts and filter
      const { data: allPosts } = await supabase
        .from('posts')
        .select('id, tags')
      
      if (allPosts) {
        const orgPostIds = allPosts
          .filter(post => {
            const tags = Array.isArray(post.tags) 
              ? post.tags 
              : (post.tags ? post.tags.split(',').map(t => t.trim()) : [])
            return tags.includes(orgName)
          })
          .map(post => post.id)
        
        if (orgPostIds.length > 0) {
          const { error: postsError } = await supabase
            .from('posts')
            .delete()
            .in('id', orgPostIds)
          
          if (postsError) {
            console.warn('Error deleting org posts:', postsError)
          }
        }
      }
    }

    // Now delete the organization itself
    const { error: deleteError } = await supabase
      .from('nonprofits')
      .delete()
      .eq('id', nonprofitId)

    if (deleteError) {
      console.error('Error deleting organization:', deleteError)
      throw deleteError
    }

    console.log('Organization deleted successfully')

    // Log action
    const { error: logError } = await supabase.from('admin_actions_log').insert({
      performed_by: user.id,
      performed_by_email: user.email,
      action_type: 'ORG_DELETED',
      target_id: nonprofitId,
      target_type: 'organization',
      details: {
        org_name: org?.name
      }
    })

    if (logError) {
      console.warn('Error logging action (non-critical):', logError)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting organization:', error)
    throw error
  }
}

