import { useState, useRef, useEffect, useCallback } from 'react'
import { ipc } from '../lib/ipc'
import type { ChatMessage } from '../types'

interface ComposerCtx {
  subject: string
  bodyHtml: string
  recipientCount: number
}

interface Props {
  open: boolean
  width: number
  onWidthChange: (w: number) => void
  onClose: () => void
  onApplyTemplate: (subject: string, body: string) => void
  onRemoveRecipient: (email: string) => void
  composerCtx: ComposerCtx
}

function markdownToHtml(md: string): string {
  return md
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre class="bg-gray-200 dark:bg-gray-800 rounded p-2 text-xs overflow-x-auto my-1"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-800 rounded px-1 text-xs font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold mt-2 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h3 class="font-bold mt-2 mb-1 text-base">$1</h3>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)+/g, s => `<ul class="my-1">${s}</ul>`)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

async function buildSystemPrompt(composerCtx: ComposerCtx): Promise<string> {
  let templateSection = ''
  try {
    const templates = await ipc.templatesList()
    if (templates.length > 0) {
      templateSection = `\n\nSAVED TEMPLATES (${templates.length} total):\n` +
        templates.map(t => `- "${t.name}"${t.subject ? ` (subject: ${t.subject})` : ''}`).join('\n')
    } else {
      templateSection = '\n\nSAVED TEMPLATES: none yet.'
    }
  } catch { /* ignore */ }

  let composerSection = ''
  if (composerCtx.subject || composerCtx.bodyHtml) {
    // Pass full HTML so AI can modify it rather than regenerating from scratch
    const bodyHtml = composerCtx.bodyHtml.slice(0, 12000)
    composerSection = `\n\nCURRENT COMPOSER STATE:\n- Subject: ${composerCtx.subject || '(empty)'}\n- Recipients loaded: ${composerCtx.recipientCount}\n- Body HTML (full content — modify this when asked to edit):\n\`\`\`html\n${bodyHtml || '(empty)'}\n\`\`\``
  } else {
    composerSection = `\n\nCURRENT COMPOSER STATE: empty (no subject or body yet). Recipients loaded: ${composerCtx.recipientCount}.`
  }

  return `You are RavenBlast AI, an assistant built into a bulk email sender desktop app.
You help the user:
- Write and improve email templates (marketing emails, newsletters, business emails)
- Suggest subject lines
- Edit or rewrite the current email body in the Composer
- Answer questions about the app

When you create or edit an email template, always wrap the HTML body in a code block with language "html" so the user can apply it. Example:
\`\`\`html
<p>Dear {{Name}},</p>
<p>Your content here.</p>
\`\`\`

Support merge tags {{Name}} and {{Company}}. Keep emails professional.${templateSection}${composerSection}`
}

async function saveAsNewTemplate(subject: string, html: string): Promise<string> {
  const existing = await ipc.templatesList()
  const existingNames = new Set(existing.map(t => t.name))
  const base = subject.trim() || 'AI Template'
  let name = base
  let n = 2
  while (existingNames.has(name)) {
    name = `${base} ${n++}`
  }
  await ipc.templatesSave({ name, subject, bodyHtml: html })
  return name
}

export default function AIChat({ open, width, onWidthChange, onClose, onApplyTemplate, onRemoveRecipient, composerCtx }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [saveStatus, setSaveStatus] = useState<Record<number, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    ipc.aiGetKey().then(k => setHasKey(!!k && k !== ''))
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const delta = dragRef.current.startX - e.clientX
    const newW = Math.min(700, Math.max(280, dragRef.current.startW + delta))
    onWidthChange(newW)
  }, [onWidthChange])

  const onMouseUp = useCallback(() => {
    dragRef.current = null
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [onMouseMove])

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startW: width }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    const systemPrompt = await buildSystemPrompt(composerCtx)
    const result = await ipc.aiChat([{ role: 'system' as const, content: systemPrompt }, ...newMessages])
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

  async function handleSaveAsTemplate(idx: number, subject: string, html: string) {
    setSaveStatus(s => ({ ...s, [idx]: 'Saving...' }))
    try {
      const name = await saveAsNewTemplate(subject, html)
      setSaveStatus(s => ({ ...s, [idx]: `Saved as "${name}"` }))
      setTimeout(() => setSaveStatus(s => { const n = { ...s }; delete n[idx]; return n }), 3000)
    } catch {
      setSaveStatus(s => ({ ...s, [idx]: 'Save failed' }))
    }
  }

  function renderMessage(msg: ChatMessage, idx: number) {
    const isUser = msg.role === 'user'
    const html = !isUser ? extractHtml(msg.content) : null
    const subject = !isUser ? extractSubject(msg.content) : ''

    return (
      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
          {isUser
            ? <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            : <div className="break-words" dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
          }
          {html && (
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                onClick={() => onApplyTemplate(subject, html)}
                className="bg-white text-blue-600 border border-blue-300 rounded px-3 py-1.5 text-xs font-semibold hover:bg-blue-50 w-full text-left">
                📋 Apply to Composer
              </button>
              <button
                onClick={() => handleSaveAsTemplate(idx, subject, html)}
                className="bg-white text-green-700 border border-green-300 rounded px-3 py-1.5 text-xs font-semibold hover:bg-green-50 w-full text-left">
                💾 Add as New Template
              </button>
              {saveStatus[idx] && (
                <p className={`text-xs px-1 ${saveStatus[idx].startsWith('Saved') ? 'text-green-600' : 'text-red-500'}`}>
                  {saveStatus[idx]}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  void onRemoveRecipient

  if (!open) return null

  return (
    <div
      className="fixed right-0 top-14 bottom-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-40"
      style={{ width }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 transition-colors"
        title="Drag to resize"
      />

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
