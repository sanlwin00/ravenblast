import { ipcMain } from 'electron'
import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

export function registerContactHandlers(): void {
  ipcMain.handle('contacts:parse-excel', (_event, filePath: string) => {
    const buf = readFileSync(filePath)
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    // Returns array of objects keyed by header row values
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
    return rows
  })
}
