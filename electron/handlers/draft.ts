import { ipcMain } from 'electron'
import Store from 'electron-store'

interface DraftStore {
  smtpProfileId: string
  cc: string[]
  bcc: string[]
  subject: string
  bodyHtml: string
  delayMin: number
  delayMax: number
}

const store = new Store<DraftStore>({
  name: 'ravenblast-draft',
  defaults: {
    smtpProfileId: '',
    cc: [],
    bcc: [],
    subject: '',
    bodyHtml: '',
    delayMin: 2,
    delayMax: 5
  }
})

export function registerDraftHandlers(): void {
  ipcMain.handle('draft:get', () => store.store)
  ipcMain.handle('draft:save', (_event, data: Partial<DraftStore>) => {
    for (const [k, v] of Object.entries(data)) {
      store.set(k as keyof DraftStore, v as never)
    }
    return { ok: true }
  })
}
