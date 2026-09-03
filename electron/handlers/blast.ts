import { ipcMain, BrowserWindow } from 'electron'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { randomUUID } from 'crypto'
import juice from 'juice'
import { getProfileById, createTransporter } from './smtp'

interface Contact {
  email: string
  name: string
  company: string
}

interface Attachment {
  name: string
  path: string
  size: number
}

interface BlastConfig {
  smtpProfileId: string
  replyTo: string
  to: Contact[]
  cc: string[]
  bcc: string[]
  subject: string
  bodyHtml: string
  attachments: Attachment[]
  delayMin: number
  delayMax: number
}

interface BlastProgress {
  sent: number
  total: number
  currentEmail: string
  status: 'sending' | 'paused' | 'done' | 'aborted'
}

interface BlastError {
  email: string
  message: string
}

interface BlastSummary {
  sessionId: string
  timestamp: string
  duration: number
  total: number
  sent: number
  failed: number
  skipped: number
  errors: BlastError[]
  smtpProfile: string
  subject: string
}

let paused = false
let cancelled = false
let running = false

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function resolveTags(template: string, name: string, company: string): string {
  return template
    .replace(/\{\{Name\}\}/g, name || '')
    .replace(/\{\{Company\}\}/g, company || '')
}

async function runBlast(config: BlastConfig, getWindow: () => BrowserWindow | null): Promise<void> {
  running = true
  paused = false
  cancelled = false

  const sessionId = randomUUID()
  const startTime = Date.now()
  const errors: BlastError[] = []
  let sent = 0
  let failed = 0
  const total = config.to.length

  const profile = getProfileById(config.smtpProfileId)
  if (!profile) {
    running = false
    return
  }

  const transporter = createTransporter(profile)

  for (let i = 0; i < config.to.length; i++) {
    if (cancelled) break

    while (paused && !cancelled) {
      await sleep(300)
    }
    if (cancelled) break

    const contact = config.to[i]
    const subject = resolveTags(config.subject, contact.name, contact.company)
    const html = juice(resolveTags(config.bodyHtml, contact.name, contact.company))

    const win = getWindow()
    const progress: BlastProgress = {
      sent,
      total,
      currentEmail: contact.email,
      status: paused ? 'paused' : 'sending'
    }
    win?.webContents.send('blast:progress', progress)

    try {
      await transporter.sendMail({
        from: `"${profile.fromName}" <${profile.username}>`,
        to: contact.email,
        replyTo: config.replyTo || profile.defaultReplyTo || undefined,
        cc: config.cc.length ? config.cc : undefined,
        bcc: config.bcc.length ? config.bcc : undefined,
        subject,
        html,
        attachments: config.attachments.map(a => ({ filename: a.name, path: a.path }))
      })
      sent++
    } catch (err) {
      failed++
      errors.push({ email: contact.email, message: (err as Error).message })
    }

    getWindow()?.webContents.send('blast:progress', {
      sent,
      total,
      currentEmail: contact.email,
      status: cancelled ? 'aborted' : 'sending'
    } as BlastProgress)

    if (i < config.to.length - 1 && !cancelled) {
      const delaySec = config.delayMin + Math.random() * (config.delayMax - config.delayMin)
      await sleep(delaySec * 1000)
    }
  }

  const duration = Date.now() - startTime
  const summary: BlastSummary = {
    sessionId,
    timestamp: new Date().toISOString(),
    duration,
    total,
    sent,
    failed,
    skipped: total - sent - failed,
    errors,
    smtpProfile: profile.name,
    subject: config.subject
  }

  const logDir = join(homedir(), 'Documents', 'RavenBlast', 'logs')
  try {
    mkdirSync(logDir, { recursive: true })
    writeFileSync(join(logDir, `${sessionId}.json`), JSON.stringify(summary, null, 2))
  } catch {
    // non-critical
  }

  running = false
  const win = getWindow()
  win?.webContents.send('blast:complete', summary)
}

export function registerBlastHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('blast:start', (_event, config: BlastConfig) => {
    if (running) return { ok: false, error: 'Blast already running' }
    // Fire and forget — progress pushed via webContents.send
    runBlast(config, getWindow).catch(console.error)
    return { ok: true }
  })

  ipcMain.handle('blast:pause', () => {
    paused = true
    return { ok: true }
  })

  ipcMain.handle('blast:resume', () => {
    paused = false
    return { ok: true }
  })

  ipcMain.handle('blast:cancel', () => {
    cancelled = true
    paused = false
    return { ok: true }
  })
}
