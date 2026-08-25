import { ipcMain } from 'electron'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const logsDir = join(homedir(), 'Documents', 'RavenBlast', 'logs')

export function registerHistoryHandlers(): void {
  ipcMain.handle('history:list', () => {
    try {
      const files = readdirSync(logsDir).filter(f => f.endsWith('.json'))
      const summaries = files.map(f => {
        try {
          return JSON.parse(readFileSync(join(logsDir, f), 'utf-8'))
        } catch {
          return null
        }
      }).filter(Boolean)
      return summaries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch {
      return []
    }
  })

  ipcMain.handle('history:get', (_event, sessionId: string) => {
    try {
      return JSON.parse(readFileSync(join(logsDir, `${sessionId}.json`), 'utf-8'))
    } catch {
      return null
    }
  })
}
