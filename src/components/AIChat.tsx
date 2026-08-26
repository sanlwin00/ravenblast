import { useState, useRef, useEffect } from 'react'
import { ipc } from '../lib/ipc'
import type { ChatMessage } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onApplyTemplate: (subject: string, body: string) => void
  onRemoveRecipient: (email: string) => void
}

function markdownToHtml(md: string): string {
  return md
    // Fenced code blocks (extract before inline code)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre class="bg-gray-200 dark:bg-gray-800 rounded p-2 text-xs overflow-x-auto my-1"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-800 rounded px-1 text-xs font-mono">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold mt-2 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h3 class="font-bold mt-2 mb-1 text-base">$1</h3>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)+/g, s => `<ul class="my-1">${s}</ul>`)
    // Double newline → paragraph break
    .replace(/\n\n/g, '<br/><br/>')
    // Single newline
    .replace(/\n/g, '<br/>')
}

const SYSTEM_PROMPT = `You are RavenBlast AI, an assistant built into a bulk email sender desktop app.
You help the user:
- Write and improve email templates (marketing emails, newsletters, business emails)
- Suggest subject lines
- Remove or filter recipients by name/email/company
- Answer questions about the app

When you create or edit an email template, always wrap the HTML body in a code block with language "html" so the user can apply it. Example:
\`\`\`html
<p>Dear {{Name}},</p>
<p>Your content here.</p>
\`\`\`

Keep emails professional. Support merge tags {{Name}} and {{Company}}.`

export default function AIChat({ open, onClose, onApplyTemplate, onRemoveRecipient }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ipc.aiGetKey().then(k => setHasKey(!!k && k !== ''))
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...newMessages
    ]

    const result = await ipc.aiChat(apiMessages)
    setLoading(false)

    if (result.error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${result.error}` }])
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: result.content || '' }])
    }
  }

  function extractHtml(content: string): string | null {
    const match = content.match(/```html\n?([\s\S]*?)```/)
    return match ? match[1].trim() : null
  }

  function extractSubject(content: string): string {
    const match = content.match(/subject[:\s]+["']?(.+?)["']?\n/i)
    return match ? match[1].trim() : ''
  }

  function renderMessage(msg: ChatMessage, idx: number) {
    const isUser = msg.role === 'user'
    const html = !isUser ? extractHtml(msg.content) : null

    return (
      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
          {isUser
            ? <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            : <div className="break-words" dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
          }
          {html && (
            <button
              onClick={() => onApplyTemplate(extractSubject(msg.content), html)}
              className="mt-2 bg-white text-blue-600 border border-blue-300 rounded px-3 py-1 text-xs font-semibold hover:bg-blue-50 w-full">
              📋 Apply Template to Composer
            </button>
          )}
        </div>
      </div>
    )
  }

  // suppress unused warning — onRemoveRecipient is part of the public API for future wiring
  void onRemoveRecipient

  if (!open) return null

  return (
    <div className="fixed right-0 top-14 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div className="font-semibold text-base">AI Assistant</div>
          <div className="text-xs text-gray-400">Powered by OpenAI</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
      </div>

      {!hasKey ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-4xl mb-3">🔑</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Add your OpenAI API key in <strong>Settings</strong> to use the AI assistant.</p>
            <button onClick={onClose} className="text-blue-600 text-sm font-medium">Go to Settings →</button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm">Ask me to write a template, suggest a subject line, or help remove recipients.</p>
              </div>
            )}
            {messages.map((m, i) => renderMessage(m, i))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500">Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask AI to write a template..."
                rows={2}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 resize-none focus:outline-none focus:border-blue-500"
              />
              <button onClick={send} disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 rounded text-sm font-semibold self-stretch">
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Enter to send · Shift+Enter for new line</p>
          </div>
        </>
      )}
    </div>
  )
}
