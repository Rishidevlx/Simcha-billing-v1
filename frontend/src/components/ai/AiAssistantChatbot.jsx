import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot,
  User,
  Send,
  Minus,
  RotateCcw,
  Loader2,
  Copy,
  Check
} from '../common/icons'
import { API_ENDPOINTS } from '../../config/api'
import defaultPfp from '../../assets/avatar/Deafult Pfp.webp'
import maleAvatar from '../../assets/avatar/Male avatar.webp'
import femaleAvatar from '../../assets/avatar/Female Avatar.webp'

const AVATAR_MAP = {
  default: defaultPfp,
  male: maleAvatar,
  female: femaleAvatar
}

// Helper to sanitize markdown artifacts and format clean line-by-line text
function formatMessageContent(rawText) {
  if (!rawText || typeof rawText !== 'string') return ''

  const lines = rawText.split('\n')
  const cleanedLines = []

  for (let line of lines) {
    let trimmed = line.trim()
    if (!trimmed) {
      cleanedLines.push('')
      continue
    }

    // Skip markdown table dividers like |---|---|
    if (/^\|?[-:\s|]+\|?$/.test(trimmed)) {
      continue
    }

    // Clean table rows into clean bullet points
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim())
        .filter(Boolean)
      if (cells.length === 2) {
        trimmed = `• ${cells[0]}: ${cells[1]}`
      } else if (cells.length > 2) {
        trimmed = `• ${cells.join(' — ')}`
      } else if (cells.length === 1) {
        trimmed = `• ${cells[0]}`
      }
    }

    // Strip markdown headers (###, ####, etc.)
    trimmed = trimmed.replace(/^#{1,6}\s+/, '')

    // Strip horizontal rules
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      continue
    }

    cleanedLines.push(trimmed)
  }

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n')
}

export default function AiAssistantChatbot({ user, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const messagesEndRef = useRef(null)

  // Dragging states
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, initialPosX: 0, initialPosY: 0 })
  const chatWindowRef = useRef(null)

  const initialWelcomeMessage = {
    id: 1,
    sender: 'ai',
    senderName: 'Simcha AI',
    text: "Hi! I'm Simcha AI, your virtual business assistant. How can I help you?",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    chips: [
      { label: "📊 Today's Sales", query: "Show today's sales and revenue" },
      { label: "⚠️ Low Stock Alert", query: "Check low stock items" },
      { label: "💰 Pending Bills", query: "List pending payments" },
      { label: "🔍 Search HSN Code", query: "Find HSN code for CCTV camera" },
      { label: "📖 How to Return Items?", query: "How to create a return invoice?" }
    ]
  }

  const [messages, setMessages] = useState([initialWelcomeMessage])

  // Get user profile avatar image
  const getUserProfileAvatar = () => {
    if (user?.avatar && AVATAR_MAP[user.avatar]) {
      return AVATAR_MAP[user.avatar]
    }
    if (user?.profile_image) {
      return user.profile_image
    }
    return maleAvatar
  }

  // Scroll to bottom on new messages or loading
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isLoading])

  // Handle open/close mounting for smooth animation
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
    } else {
      const timer = setTimeout(() => setIsMounted(false), 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // External trigger listener to open assistant from anywhere
  useEffect(() => {
    const handleOpenAi = () => {
      setIsOpen(true)
    }
    window.addEventListener('open_simcha_ai', handleOpenAi)
    window.addEventListener('open_ai_assistant', handleOpenAi)
    return () => {
      window.removeEventListener('open_simcha_ai', handleOpenAi)
      window.removeEventListener('open_ai_assistant', handleOpenAi)
    }
  }, [])

  // Reset chat history to initial state
  const handleRefreshChat = () => {
    setMessages([{
      ...initialWelcomeMessage,
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
  }

  // Copy message to clipboard
  const handleCopyMessage = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(id)
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  // --- DRAG LOGIC ---
  const handleMouseDown = (e) => {
    // Only drag from the header, but ignore clicks on header buttons
    if (e.target.closest('button')) return

    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: position.x,
      initialPosY: position.y
    }
    e.preventDefault()
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragRef.current.startX
    const deltaY = e.clientY - dragRef.current.startY

    let newX = dragRef.current.initialPosX + deltaX
    let newY = dragRef.current.initialPosY + deltaY

    // Boundary constraints based on window size
    const winWidth = window.innerWidth
    const winHeight = window.innerHeight
    const chatWidth = chatWindowRef.current?.offsetWidth || 390
    const chatHeight = chatWindowRef.current?.offsetHeight || 560

    // Prevent dragging off viewport boundaries
    const maxLeft = -(winWidth - chatWidth - 30)
    const maxRight = 10
    const maxTop = -(winHeight - chatHeight - 30)
    const maxBottom = 10

    newX = Math.min(Math.max(newX, maxLeft), maxRight)
    newY = Math.min(Math.max(newY, maxTop), maxBottom)

    setPosition({ x: newX, y: newY })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // --- SEND MESSAGE HANDLER (CONNECTS TO BACKEND COPILOT) ---
  const handleSend = async (e) => {
    e?.preventDefault()
    const queryText = inputText.trim()
    if (!queryText || isLoading) return

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      senderName: user?.name || 'You',
      text: queryText,
      time: timeString
    }

    const currentHistory = [...messages, userMsg]
    setMessages(currentHistory)
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch(API_ENDPOINTS.AI_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          conversationHistory: currentHistory.slice(-6)
        })
      })

      const data = await response.json()
      const aiReply = {
        id: Date.now() + 1,
        sender: 'ai',
        senderName: 'Simcha AI',
        text: data.text || 'I could not process your request at this time.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, aiReply])
    } catch (err) {
      console.error('Failed to communicate with AI assistant:', err)
      const errorReply = {
        id: Date.now() + 1,
        sender: 'ai',
        senderName: 'Simcha AI',
        text: 'Unable to connect to the assistant server. Please verify your connection or check Configurations Settings.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorReply])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChipClick = (query) => {
    setInputText(query)
  }

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON (Bottom Right - Clean Flow Icon Button) */}
      <div
        className={`fixed bottom-20 right-6 z-50 transition-all duration-300 transform ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center justify-center w-12 h-12 bg-[#0248BC] hover:bg-[#043486] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 cursor-pointer font-['Poppins',sans-serif]"
          title="Ask Simcha AI"
          aria-label="Ask Simcha AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot size={22} className="text-white transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0248BC]" />
          </div>
        </button>
      </div>

      {/* 2. DRAGGABLE CHATBOT WINDOW (Clean Royal Blue & White Theme) */}
      {isMounted && (
        <div
          ref={chatWindowRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`
          }}
          className={`fixed z-50 bottom-20 right-6 w-[92vw] sm:w-[380px] md:w-[410px] h-[580px] max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden font-['Poppins',sans-serif] ${
            isDragging ? 'select-none transition-none shadow-3xl ring-2 ring-[#0248BC]/40' : 'transition-transform duration-75'
          } ${
            isOpen ? 'opacity-100 scale-100 transition-opacity transition-transform duration-200 ease-out' : 'opacity-0 scale-95 transition-opacity transition-transform duration-200 ease-in pointer-events-none'
          }`}
        >
          {/* TOP DRAG HEADER: Royal Blue Bar with Title, Refresh & Close Control */}
          <div
            onMouseDown={handleMouseDown}
            className={`bg-[#0248BC] dark:bg-[#043486] text-white px-4 py-3.5 flex items-center justify-between shadow-sm select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title="Click and drag to move chat window"
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-2xs">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-1.5">
                  Virtual assistant
                </h3>
                <span className="text-[11px] text-blue-100 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online • Ready to help
                </span>
              </div>
            </div>

            {/* Window Actions: Refresh & Minimize */}
            <div className="flex items-center gap-1">
              {/* Refresh Chat History */}
              <button
                type="button"
                onClick={handleRefreshChat}
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Refresh / Clear Chat"
              >
                <RotateCcw size={16} />
              </button>

              {/* Close / Minimize */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <Minus size={18} />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai'
              const isCopied = copiedMessageId === msg.id

              return (
                <div key={msg.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} space-y-1 group`}>
                  
                  {/* Differentiated User Avatar & Name Tag */}
                  <div className={`flex items-center gap-2 ${isAi ? 'flex-row' : 'flex-row-reverse'} mb-1`}>
                    {isAi ? (
                      <div className="w-6 h-6 rounded-md bg-[#0248BC] text-white flex items-center justify-center text-xs shadow-2xs">
                        <Bot size={14} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-purple-300 dark:border-purple-800 shadow-2xs flex items-center justify-center bg-purple-50 dark:bg-purple-950/50">
                        <img
                          src={getUserProfileAvatar()}
                          alt={msg.senderName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = maleAvatar
                          }}
                        />
                      </div>
                    )}
                    <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
                      {msg.senderName}
                    </span>
                  </div>

                  {/* Intuitive and Clear Message Bubble with Hover Copy Button */}
                  <div className={`relative max-w-[88%] text-xs sm:text-[13px] leading-relaxed transition-colors shadow-2xs ${
                    isAi
                      ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-xs px-4 py-3 border border-slate-200/60 dark:border-slate-700/50'
                      : 'bg-[#0248BC] text-white rounded-2xl rounded-tr-xs px-4 py-3'
                  }`}>
                    <div className="space-y-1 break-words">
                      {formatMessageContent(msg.text).split('\n').map((line, lIdx) => {
                        if (!line.trim()) return <div key={lIdx} className="h-1" />
                        
                        const parts = line.split(/(\*\*.*?\*\*)/g)
                        return (
                          <div key={lIdx} className="leading-relaxed">
                            {parts.map((part, pIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>
                              }
                              return <span key={pIdx}>{part}</span>
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Timestamp & Copy Action Row */}
                  <div className={`flex items-center gap-1.5 px-1 pt-0.5 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {msg.time}
                    </span>
                    
                    {/* Copy to Clipboard Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className={`p-1 rounded-md text-[10px] transition-all cursor-pointer flex items-center gap-1 opacity-75 hover:opacity-100 ${
                        isCopied 
                          ? 'text-emerald-500 font-bold' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isCopied ? 'Copied to clipboard!' : 'Copy text'}
                    >
                      {isCopied ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span className="text-[9.5px]">Copied</span>
                        </>
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>

                  {/* Quick Suggestion Chips on initial prompt */}
                  {msg.chips && msg.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 pl-1">
                      {msg.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChipClick(chip.query)}
                          className="text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#0248BC] hover:text-[#0248BC] dark:hover:border-blue-400 dark:hover:text-blue-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer shadow-2xs"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              )
            })}

            {/* Typing Loader Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-[#0248BC] text-white flex items-center justify-center text-xs shadow-2xs">
                    <Bot size={14} />
                  </div>
                  <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
                    Simcha AI
                  </span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 rounded-2xl rounded-tl-xs px-4 py-3 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2 text-xs">
                  <Loader2 size={14} className="animate-spin text-[#0248BC] dark:text-blue-400" />
                  <span>Analyzing billing data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* AI Accuracy Disclaimer (Cleanly placed above input field) */}
          <div className="px-4 py-1.5 text-center bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 select-none">
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 tracking-tight font-medium">
              Assistant can make mistakes. Check important info.
            </p>
          </div>

          {/* BOTTOM CLEAR TEXT INPUT FIELD */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
              maxLength={500}
              className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-[#0248BC] dark:focus:border-blue-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                inputText.trim() && !isLoading
                  ? 'bg-[#0248BC] hover:bg-[#043486] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}
    </>
  )
}
