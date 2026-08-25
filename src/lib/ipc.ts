import type { SmtpProfile, BlastConfig, BlastProgress, BlastSummary } from '../types'

declare global {
  interface Window {
    api: {
      smtpList(): Promise<Array<Omit<SmtpProfile, 'password'> & { password: string }>>
      smtpSave(profile: Omit<SmtpProfile, 'id'> & { id?: string }): Promise<{ ok: boolean }>
      smtpDelete(id: string): Promise<{ ok: boolean }>
      smtpTest(id: string): Promise<{ ok: boolean; error?: string }>

      contactsParseExcel(filePath: string): Promise<Record<string, string>[]>
      msgParse(filePath: string): Promise<{
        subject: string
        bodyHtml: string
        attachments: Array<{ name: string }>
      }>

      blastStart(config: BlastConfig): Promise<{ ok: boolean; error?: string }>
      blastPause(): Promise<{ ok: boolean }>
      blastResume(): Promise<{ ok: boolean }>
      blastCancel(): Promise<{ ok: boolean }>

      historyList(): Promise<BlastSummary[]>
      historyGet(sessionId: string): Promise<BlastSummary | null>

      onBlastProgress(cb: (progress: BlastProgress) => void): () => void
      onBlastComplete(cb: (summary: BlastSummary) => void): () => void
    }
  }
}

export const ipc = window.api
