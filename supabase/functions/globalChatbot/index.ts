import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.2.1'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set')
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

  try {
    const { prompt, context } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required and must be a string' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const systemContext = `You are ImpactBridge Assistant, a helpful AI assistant for the ImpactBridge platform. 
ImpactBridge is a web application that connects volunteers with nonprofits, events, and community forums.

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

    const fullPrompt = `${systemContext}${contextInfo}\n\nUser question: ${prompt}`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    return new Response(
      JSON.stringify({ text }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error in globalChatbot function:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to generate response',
        message: error.message,
      }),
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

