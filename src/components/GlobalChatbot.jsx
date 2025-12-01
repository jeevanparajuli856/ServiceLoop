import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import './GlobalChatbot.css'

export default function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'ai',
          text: "Hello! I'm ServiceLoop Assistant. I can help you learn about nonprofits, events, volunteering opportunities, and navigating the website. What would you like to know?",
        },
      ])
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setLoading(true)

    // Add user message to UI
    const newUserMessage = { sender: 'user', text: userMessage }
    setMessages((prev) => [...prev, newUserMessage])

    try {
      // Save user message to database if logged in
      if (user) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          context_type: 'global',
          context_id: null,
          sender: 'user',
          message: userMessage,
        })
      }

      // Call Supabase Edge Function for AI response
      const { data, error } = await supabase.functions.invoke('globalChatbot', {
        body: {
          message: userMessage,
          context: {
            page: window.location.pathname,
            userId: user?.id || null,
          },
        },
      })

      if (error) throw error

      const aiResponse = data?.reply || "I'm sorry, I couldn't process your request."

      // Add AI message to UI
      setMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }])

      // Save AI message to database if logged in
      if (user) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          context_type: 'global',
          context_id: null,
          sender: 'ai',
          message: aiResponse,
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "I'm sorry, there was an error processing your request. Please try again later.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open chatbot"
          aria-expanded={false}
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-label="ServiceLoop Assistant">
          <div className="chatbot-header">
            <h3>ServiceLoop Assistant</h3>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message ai">
                <div className="message-content">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={loading}
              aria-label="Chat input"
            />
            {inputValue && (
              <button
                onClick={() => setInputValue('')}
                className="chatbot-clear"
                aria-label="Clear input"
                type="button"
              >
                ✕
              </button>
            )}
            <button
              onClick={sendMessage}
              disabled={loading || !inputValue.trim()}
              className="chatbot-send"
              aria-label="Send message"
              type="button"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}

