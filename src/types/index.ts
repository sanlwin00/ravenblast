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

export interface Contact {
  email: string
  name: string
  company: string
}

export interface Attachment {
  name: string
  path: string
  size: number
}

export interface BlastConfig {
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

export interface BlastProgress {
  sent: number
  total: number
  currentEmail: string
  status: 'sending' | 'paused' | 'done' | 'aborted'
}

export interface BlastError {
  email: string
  message: string
}

export interface BlastSummary {
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

export interface Template {
  id: string
  name: string
  subject: string
  bodyHtml: string
  createdAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
