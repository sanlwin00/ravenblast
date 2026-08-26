import { ipcMain } from 'electron'
import Store from 'electron-store'

interface StoreSchema {
  openaiKey: string
}

const store = new Store<StoreSchema>({
  name: 'ravenblast-ai',
  defaults: { openaiKey: '' }
})

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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

  ipcMain.handle('ai:chat', async (_event, messages: ChatMessage[]) => {
    const apiKey = store.get('openaiKey')
    if (!apiKey) return { error: 'No OpenAI API key configured. Go to Settings to add one.' }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 2000
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
