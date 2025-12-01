import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email, password, fullName = null) => {
    // Sign up with full_name in user_metadata so the trigger can use it
    // Supabase will automatically prevent duplicate emails
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName || null,
        },
      },
    })

    // Handle duplicate email error
    if (error) {
      if (error.message.includes('already registered') || 
          error.message.includes('already exists') ||
          error.message.includes('User already registered')) {
        return {
          data: null,
          error: {
            message: 'An account with this email already exists. Please sign in instead.'
          }
        }
      }
      return { data, error }
    }

    // If signup successful, ensure profile is created
    // The trigger should create it, but we'll also try manually as backup
    if (!error && data?.user) {
      try {
        // Wait a bit for trigger to fire
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // If profile doesn't exist, create it manually
        if (!existingProfile) {
          console.log('Profile not created by trigger, creating manually...')
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: fullName || null,
            })

          if (profileError) {
            console.error('Error creating profile manually:', profileError)
            // Try one more time after another delay
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const { error: retryError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: email,
                full_name: fullName || null,
              }, {
                onConflict: 'id'
              })
            
            if (retryError) {
              console.error('Error creating profile on retry:', retryError)
            } else {
              console.log('Profile created successfully on retry')
            }
          } else {
            console.log('Profile created successfully manually')
          }
        } else {
          // Profile exists, update it with name if provided
          if (fullName) {
            await supabase
              .from('profiles')
              .update({ full_name: fullName })
              .eq('id', data.user.id)
          }
        }
      } catch (err) {
        console.error('Error ensuring profile exists:', err)
        // Don't fail signup, but log the error
      }
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}

