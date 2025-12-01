import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in Supabase env')
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Gemini API key not configured' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }

  try {
    const { message, context } = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Build system context
    const systemContext = `You are ServiceLoop Assistant, a helpful AI assistant for the ServiceLoop platform. 
ServiceLoop is a web application that connects volunteers with nonprofits, events, and community forums.

Your role is to help users:
- Understand how to use the platform
- Learn about nonprofits and volunteering opportunities
- Navigate the website features
- Answer questions about events, organizations, and community engagement

Keep your answers:
- Short, friendly, and practical (2-3 sentences when possible)
- Focused on helping users make a positive impact
- Encouraging and supportive
- Clear and easy to understand

Use the provided context about the user's current page or activity when relevant, but don't mention technical details unless asked.`

    const contextInfo = context
      ? `\n\nUser Context:
- Current page: ${context.page || 'unknown'}
- User ID: ${context.userId || 'not logged in'}`
      : ''

    const fullMessage = `${systemContext}${contextInfo}\n\nUser question: ${message}`

    // Call Gemini 2.0 Flash API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: fullMessage }
              ]
            }
          ]
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API Error:', response.status, errorData)
      throw new Error(`Gemini API failed with status ${response.status}`)
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I could not process that."

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Gemini Error:', error)
    return new Response(
      JSON.stringify({ error: 'Gemini API failed' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
