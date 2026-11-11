import { useEffect, useRef, useState, type FormEvent } from 'react'
import './LaylaChat.css'

type Message = {
  id: number
  from: 'layla' | 'visitor'
  text: string
}

type ApiError = {
  error?: {
    code?: string
    message?: string
  }
}

const SUGGESTED_QUESTIONS = [
  'What services do you offer?',
  'What tools and skills do you use?',
  'Can you tell me about your projects?',
  'How can I hire Aljon?',
]

function getDemoReply(message: string) {
  const question = message.toLowerCase()

  if (/service|offer|help with|what do you do/.test(question)) {
    return 'Aljon offers Ecommerce VA support, Shopify store management, web development, graphics design, social media management, and Medical VA support.'
  }
  if (/skill|tool|technology|platform/.test(question)) {
    return 'His tools include Shopify, Salesforce, GoHighLevel, Canva, Excel, Google Sheets, React, JavaScript, HTML5, CSS3, GitHub, Vercel, ChatGPT, Claude, Zapier, and n8n.'
  }
  if (/project|portfolio|built|build|work sample/.test(question)) {
    return 'Featured work includes Shopify Ecommerce Operations, the Pearl White hospitality website and booking experience, and GoHighLevel CRM and automation workflows.'
  }
  if (/hire|contact|start|work together|email/.test(question)) {
    return 'You can reach Aljon through the contact form on this portfolio. Share a little about your project and the service you need to get started.'
  }

  return 'I’m Layla, a demo portfolio assistant. I can answer questions about Aljon’s services, skills, projects, and how to get in touch.'
}

export default function LaylaChat() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [serviceNotice, setServiceNotice] = useState('Demo replies are used when AI is not configured.')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'layla',
      text: 'Hi, I’m Layla, Aljon’s AI Portfolio Assistant. Ask me about his services, skills, projects, or how to work together.',
    },
  ])
  const toggleRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const conversationRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, typing])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || typing) return

    const addDemoReply = () => {
      setMessages((current) => [
        ...current,
        { id: nextId.current++, from: 'layla', text: getDemoReply(trimmed) },
      ])
    }
    const visitorMessage: Message = { id: nextId.current++, from: 'visitor', text: trimmed }
    const conversation = [
      ...messages.filter((message) => message.id !== 0),
      visitorMessage,
    ].slice(-12)
    if (conversation[0]?.from === 'layla') conversation.shift()
    setMessages((current) => [...current, visitorMessage])
    setDraft('')
    setTyping(true)

    try {
      const response = await fetch('/api/layla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.map(({ from, text: content }) => ({
            role: from === 'visitor' ? 'user' : 'assistant',
            content,
          })),
        }),
      })
      const payload: unknown = await response.json()

      if (!response.ok) {
        const error = payload as ApiError
        const noticeByCode: Record<string, string> = {
          not_configured: 'AI is not configured · using demo replies',
          billing_not_configured: 'OpenAI billing is unavailable · using demo replies',
          invalid_api_key: 'The server API key needs attention · using demo replies',
          rate_limited: 'AI is busy · using a demo reply',
          rate_limit_misconfigured: 'Rate limiting needs configuration · using demo replies',
          rate_limit_not_configured: 'Rate limiting is not configured · using demo replies',
          rate_limit_unavailable: 'Rate limiting is unavailable · using demo replies',
          upstream_unavailable: 'AI is temporarily unavailable · using a demo reply',
          upstream_timeout: 'AI took too long to respond · using a demo reply',
          invalid_upstream_response: 'AI returned no answer · using a demo reply',
        }
        setServiceNotice(
          (error.error?.code && noticeByCode[error.error.code]) ||
            error.error?.message ||
            'AI is unavailable · using a demo reply',
        )
        addDemoReply()
        return
      }

      const reply = (payload as { reply?: unknown }).reply
      if (typeof reply !== 'string' || !reply.trim()) {
        setServiceNotice('AI returned no answer · using a demo reply')
        addDemoReply()
        return
      }
      setServiceNotice('AI assistant · connected')
      setMessages((current) => [...current, { id: nextId.current++, from: 'layla', text: reply }])
    } catch {
      setServiceNotice('AI endpoint unavailable · using demo replies')
      addDemoReply()
    } finally {
      setTyping(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendMessage(draft)
  }

  return (
    <aside className="layla-chat" aria-label="Layla AI Portfolio Assistant">
      {open && (
        <section
          className="layla-chat__panel"
          id="layla-chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="layla-chat-title"
        >
          <header className="layla-chat__header">
            <span className="layla-chat__avatar" aria-hidden="true">L</span>
            <span className="layla-chat__heading">
              <strong id="layla-chat-title">Layla – AI Portfolio Assistant</strong>
              <span><i aria-hidden="true" /> Here to help</span>
            </span>
            <button
              className="layla-chat__close"
              type="button"
              aria-label="Close Layla chat"
              onClick={() => {
                setOpen(false)
                toggleRef.current?.focus()
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div className="layla-chat__conversation" ref={conversationRef} role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((message) => (
              <div
                className={`layla-chat__message layla-chat__message--${message.from}`}
                key={message.id}
              >
                {message.text}
              </div>
            ))}
            {messages.length === 1 && !typing && (
              <div className="layla-chat__suggestions" aria-label="Suggested questions">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    className="layla-chat__suggestion"
                    key={question}
                    type="button"
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
            {typing && (
              <div className="layla-chat__typing" role="status" aria-label="Layla is typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          <form className="layla-chat__form" onSubmit={onSubmit}>
            <label className="layla-chat__sr-only" htmlFor="layla-chat-input">
              Message Layla
            </label>
            <input
              id="layla-chat-input"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Layla a question..."
              maxLength={500}
              autoComplete="off"
            />
            <button
              className="layla-chat__send"
              type="submit"
              aria-label="Send message"
              disabled={!draft.trim() || typing}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
          <p className="layla-chat__note" role="status">{serviceNotice}</p>
        </section>
      )}

      <button
        ref={toggleRef}
        className={`layla-chat__toggle${open ? ' is-open' : ''}`}
        type="button"
        aria-label={open ? 'Close Layla chat' : 'Open Layla chat'}
        aria-expanded={open}
        aria-controls="layla-chat-panel"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        ) : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.5-.8L4 20l1.3-4.1A7.4 7.4 0 0 1 5 12a7.5 7.5 0 0 1 15 0Z" />
              <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
            </svg>
            <span>Chat with Layla</span>
          </>
        )}
      </button>
    </aside>
  )
}
