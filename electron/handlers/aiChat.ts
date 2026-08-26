import { ipcMain } from 'electron'
import Store from 'electron-store'

interface StoreSchema {
  openaiKey: string
  model: string
}

const store = new Store<StoreSchema>({
  name: 'ravenblast-ai',
  defaults: { openaiKey: '', model: 'gpt-4o' }
})

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const KNOWN_TLDS = /(?:com|net|org|io|sg|co|app|dev|ai|edu|gov|info|biz|ca|uk|au|nz|my|ph|id|th|vn|hk|tw|me|us|jp|kr|de|fr|in)/

function extractUrls(text: string): string[] {
  const withProtocol = text.match(/https?:\/\/[^\s)>\]"']+/g) || []
  // Match bare domains: optional www., then domain parts ending in a known TLD
  const bareDomain = new RegExp(
    `(?<![.@/\\w])(?:www\\.)?[a-zA-Z0-9][a-zA-Z0-9-]*(?:\\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\\.${KNOWN_TLDS.source}(?:/[^\\s)>\\]"']*)?`,
    'g'
  )
  const bareMatches = text.match(bareDomain) || []
  // Exclude anything already captured with a protocol
  const protocolSet = new Set(withProtocol.map(u => u.replace(/^https?:\/\//, '')))
  const normalized = bareMatches
    .filter(u => !protocolSet.has(u))
    .map(u => `https://${u}`)
  return [...new Set([...withProtocol, ...normalized])]
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(15000)
    })
    const text = await res.text()
    return text.trim().slice(0, 6000)
  } catch {
    return ''
  }
}

export function registerAiChatHandlers(): void {
  ipcMain.handle('ai:get-key', () => {
    const key = store.get('openaiKey')
    return key ? '***configured***' : ''
  })

  ipcMain.handle('ai:set-key', (_event, key: string) => {
    store.set('openaiKey', key)
    return { ok: true }
  })

  ipcMain.handle('ai:get-model', () => store.get('model'))
  ipcMain.handle('ai:set-model', (_event, model: string) => {
    store.set('model', model)
    return { ok: true }
  })

  ipcMain.handle('ai:chat', async (_event, messages: ChatMessage[]) => {
    const apiKey = store.get('openaiKey')
    if (!apiKey) return { error: 'No OpenAI API key configured. Go to Settings to add one.' }

    const model = store.get('model') || 'gpt-4o'

    // Auto-fetch any URLs mentioned in the latest user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    let webContext = ''
    if (lastUserMsg) {
      const urls = extractUrls(lastUserMsg.content)
      if (urls.length > 0) {
        const fetched = await Promise.all(urls.slice(0, 2).map(async url => {
          const text = await fetchPageText(url)
          return text ? `\n\n[Web content from ${url}]:\n${text}` : ''
        }))
        webContext = fetched.filter(Boolean).join('')
      }
    }

    // Inject web content into the system message
    const enrichedMessages = webContext
      ? messages.map((m, i) =>
          m.role === 'system' && i === 0
            ? { ...m, content: m.content + `\n\nWEB CONTENT FETCHED FOR THIS REQUEST:${webContext}` }
            : m
        )
      : messages

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: enrichedMessages,
          temperature: 0.7,
          max_tokens: 4000
        })
      })
      if (!res.ok) {
        const err = await res.text()
        return { error: `OpenAI error: ${res.status} ${err}` }
      }
      const data = await res.json() as { choices: Array<{ message: { content: string } }> }
      return { content: data.choices[0].message.content }
    } catch (err) {
      return { error: (err as Error).message }
    }
  })
}
