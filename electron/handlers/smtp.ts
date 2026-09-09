import { ipcMain } from 'electron'
import Store from 'electron-store'
import { createTransport } from 'nodemailer'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'

export type AccountType = 'smtp' | 'brevo'

export interface SmtpProfile {
  id: string
  name: string
  type: AccountType
  // SMTP fields
  host?: string
  port?: number
  encryption?: 'tls' | 'starttls' | 'none'
  username?: string
  password?: string
  // Brevo API fields
  apiKey?: string
  senderEmail?: string
  // shared
  fromName: string
  defaultReplyTo: string
}

export interface MailAttachment {
  name: string
  path: string
}

export interface MailMessage {
  to: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  attachments?: MailAttachment[]
}

interface StoreSchema {
  smtpProfiles: SmtpProfile[]
}

const store = new Store<StoreSchema>({
  name: 'ravenblast-config',
  encryptionKey: 'ravenblast-key-v1',
  defaults: { smtpProfiles: [] }
})

// Legacy profiles predate the `type` field and are always SMTP.
function normalize(profile: SmtpProfile): SmtpProfile {
  return profile.type ? profile : { ...profile, type: 'smtp' }
}

export function getProfileById(id: string): SmtpProfile | undefined {
  const profile = store.get('smtpProfiles').find(p => p.id === id)
  return profile ? normalize(profile) : undefined
}

export function createTransporter(profile: SmtpProfile) {
  return createTransport({
    host: profile.host,
    port: profile.port,
    secure: profile.encryption === 'tls',
    auth: { user: profile.username, pass: profile.password },
    tls: { rejectUnauthorized: false },
    ...(profile.encryption === 'starttls' ? { requireTLS: true } : {})
  })
}

async function extractBrevoError(res: Response): Promise<string> {
  const body = await res.text().catch(() => '')
  try {
    const parsed = JSON.parse(body)
    if (parsed?.message) return parsed.message
  } catch {
    // fall through to generic message
  }
  return `Brevo API error (${res.status})`
}

async function testBrevoAccount(profile: SmtpProfile): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': profile.apiKey ?? '', accept: 'application/json' }
    })
    if (!res.ok) return { ok: false, error: await extractBrevoError(res) }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

async function sendViaBrevo(profile: SmtpProfile, message: MailMessage): Promise<void> {
  const attachment = message.attachments?.length
    ? message.attachments.map(a => ({ name: a.name, content: readFileSync(a.path).toString('base64') }))
    : undefined

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': profile.apiKey ?? '',
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { name: profile.fromName || undefined, email: profile.senderEmail },
      to: [{ email: message.to }],
      cc: message.cc?.length ? message.cc.map(email => ({ email })) : undefined,
      bcc: message.bcc?.length ? message.bcc.map(email => ({ email })) : undefined,
      replyTo: message.replyTo ? { email: message.replyTo } : undefined,
      subject: message.subject,
      htmlContent: message.html,
      attachment
    })
  })

  if (!res.ok) throw new Error(await extractBrevoError(res))
}

export async function sendAccountMail(profile: SmtpProfile, message: MailMessage): Promise<void> {
  if (profile.type === 'brevo') {
    await sendViaBrevo(profile, message)
    return
  }

  const transporter = createTransporter(profile)
  await transporter.sendMail({
    from: profile.fromName ? `"${profile.fromName}" <${profile.username}>` : profile.username,
    to: message.to,
    replyTo: message.replyTo,
    cc: message.cc?.length ? message.cc : undefined,
    bcc: message.bcc?.length ? message.bcc : undefined,
    subject: message.subject,
    html: message.html,
    attachments: message.attachments?.map(a => ({ filename: a.name, path: a.path }))
  })
}

export function registerSmtpHandlers(): void {
  ipcMain.handle('smtp:list', () => store.get('smtpProfiles').map(normalize))

  ipcMain.handle('smtp:save', (_event, profile: Partial<SmtpProfile>) => {
    const profiles = store.get('smtpProfiles')
    if (profile.id) {
      const idx = profiles.findIndex(p => p.id === profile.id)
      if (idx >= 0) {
        const existing = profiles[idx]
        profiles[idx] = {
          ...existing,
          ...profile,
          // Keep stored secrets if the renderer sent back the redacted placeholder
          password: profile.password === '***' ? existing.password : (profile.password ?? existing.password),
          apiKey: profile.apiKey === '***' ? existing.apiKey : (profile.apiKey ?? existing.apiKey)
        }
      }
    } else {
      profiles.push({ type: 'smtp', ...profile, id: randomUUID() } as SmtpProfile)
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
    if (profile.type === 'brevo') return testBrevoAccount(profile)
    try {
      const transporter = createTransporter(profile)
      await transporter.verify()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  // Test connection against raw profile values (before saving)
  ipcMain.handle('smtp:test-profile', async (_event, profile: SmtpProfile) => {
    let resolved = normalize(profile)
    if (resolved.id) {
      const stored = getProfileById(resolved.id)
      if (stored) {
        if (resolved.password === '***') resolved = { ...resolved, password: stored.password }
        if (resolved.apiKey === '***') resolved = { ...resolved, apiKey: stored.apiKey }
      }
    }
    if (resolved.type === 'brevo') return testBrevoAccount(resolved)
    try {
      const transporter = createTransporter(resolved)
      await transporter.verify()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  // Send a single test email
  ipcMain.handle('smtp:send-test', async (_event, { profileId, to, subject, bodyHtml }: { profileId: string; to: string; subject: string; bodyHtml: string }) => {
    const profile = getProfileById(profileId)
    if (!profile) return { ok: false, error: 'No account selected' }
    try {
      const resolved = (html: string) => html
        .replace(/\{\{Email\}\}/g, to)
        .replace(/\{\{Name\}\}/g, '')
        .replace(/\{\{Company\}\}/g, '')
      await sendAccountMail(profile, { to, subject: `[TEST] ${resolved(subject)}`, html: resolved(bodyHtml) })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
