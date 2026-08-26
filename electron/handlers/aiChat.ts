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

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
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
