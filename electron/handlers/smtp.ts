import { ipcMain } from 'electron'
import Store from 'electron-store'
import { createTransport } from 'nodemailer'
import { randomUUID } from 'crypto'

export interface SmtpProfile {
  id: string
  name: string
  host: string
  port: number
  encryption: 'tls' | 'starttls' | 'none'
  username: string
  password: string
  fromName: string
  defaultReplyTo: string
}

interface StoreSchema {
  smtpProfiles: SmtpProfile[]
}

const store = new Store<StoreSchema>({
  name: 'ravenblast-config',
  encryptionKey: 'ravenblast-key-v1',
  defaults: { smtpProfiles: [] }
})

export function getProfileById(id: string): SmtpProfile | undefined {
  return store.get('smtpProfiles').find(p => p.id === id)
}

export function createTransporter(profile: SmtpProfile) {
  return createTransport({
    host: profile.host,
    port: profile.port,
    secure: profile.encryption === 'tls',
    auth: { user: profile.username, pass: profile.password },
    ...(profile.encryption === 'starttls' ? { requireTLS: true } : {})
  })
}

export function registerSmtpHandlers(): void {
  ipcMain.handle('smtp:list', () => {
    return store.get('smtpProfiles').map(p => ({ ...p, password: '***' }))
  })

  ipcMain.handle('smtp:save', (_event, profile: Partial<SmtpProfile>) => {
    const profiles = store.get('smtpProfiles')
    if (profile.id) {
      const idx = profiles.findIndex(p => p.id === profile.id)
      if (idx >= 0) {
        const existing = profiles[idx]
        profiles[idx] = {
          ...existing,
          ...profile,
          // Keep stored password if the renderer sent back the redacted placeholder
          password: profile.password === '***' ? existing.password : (profile.password ?? existing.password)
        }
      }
    } else {
      profiles.push({ ...profile, id: randomUUID() } as SmtpProfile)
    }
    store.set('smtpProfiles', profiles)
    return { ok: true }
  })

  ipcMain.handle('smtp:delete', (_event, id: string) => {
    const profiles = store.get('smtpProfiles').filter(p => p.id !== id)
    store.set('smtpProfiles', profiles)
    return { ok: true }
  })

  ipcMain.handle('smtp:test', async (_event, id: string) => {
    const profile = getProfileById(id)
    if (!profile) return { ok: false, error: 'Profile not found' }
    try {
      const transporter = createTransporter(profile)
      await transporter.verify()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
