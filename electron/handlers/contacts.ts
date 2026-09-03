import { ipcMain } from 'electron'
import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

// Case-insensitive column name matching
const EMAIL_KEYS = ['email', 'e-mail', 'email address', 'emailaddress', 'email_address', 'mail']
const NAME_KEYS = ['name', 'full name', 'fullname', 'full_name', 'contact name', 'display name']
const COMPANY_KEYS = ['company', 'company name', 'companyname', 'organisation', 'organization', 'org']

function findValue(row: Record<string, string>, keys: string[]): string {
  for (const [k, v] of Object.entries(row)) {
    if (keys.includes(k.toLowerCase().trim())) return String(v ?? '')
  }
  return ''
}

export function registerContactHandlers(): void {
  ipcMain.handle('contacts:parse-excel', (_event, filePath: string) => {
    const buf = readFileSync(filePath)
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
    return rows
      .map(row => ({
        email: findValue(row, EMAIL_KEYS).trim().toLowerCase(),
        name: findValue(row, NAME_KEYS).trim(),
        company: findValue(row, COMPANY_KEYS).trim(),
      }))
      .filter(c => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))
  })
}
