import { ipcMain } from 'electron'
import Store from 'electron-store'
import { randomUUID } from 'crypto'

export interface Template {
  id: string
  name: string
  bodyHtml: string
  subject: string
  createdAt: string
}

interface StoreSchema {
  templates: Template[]
}

const store = new Store<StoreSchema>({
  name: 'ravenblast-templates',
  defaults: { templates: [] }
})

export function registerTemplateHandlers(): void {
  ipcMain.handle('templates:list', () => store.get('templates'))

  ipcMain.handle('templates:save', (_event, template: Partial<Template>) => {
    const templates = store.get('templates')
    if (template.id) {
      const idx = templates.findIndex(t => t.id === template.id)
      if (idx >= 0) templates[idx] = { ...templates[idx], ...template }
      else templates.push({ ...template, id: template.id, createdAt: new Date().toISOString() } as Template)
    } else {
      templates.push({ ...template, id: randomUUID(), createdAt: new Date().toISOString() } as Template)
    }
    store.set('templates', templates)
    return { ok: true }
  })

  ipcMain.handle('templates:delete', (_event, id: string) => {
    store.set('templates', store.get('templates').filter(t => t.id !== id))
    return { ok: true }
  })
}
