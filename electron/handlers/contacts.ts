import { ipcMain } from 'electron'
import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const EMAIL_KEYS = ['email', 'e-mail', 'email address', 'emailaddress', 'email_address', 'mail']
const NAME_KEYS = ['name', 'full name', 'fullname', 'full_name', 'contact name', 'display name']
const COMPANY_KEYS = ['company', 'company name', 'companyname', 'organisation', 'organization', 'org']

function findCol(headers: string[], keys: string[]): string | null {
  return headers.find(h => keys.includes(h.toLowerCase().trim())) ?? null
}

export function registerContactHandlers(): void {
  // Returns headers + sample rows + auto-mapped contacts (null if email col not found)
  ipcMain.handle('contacts:parse-excel', (_event, filePath: string) => {
    const buf = readFileSync(filePath)
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
    if (!rows.length) return { headers: [], sample: [], emailCol: null, nameCol: null, companyCol: null, contacts: [] }

    const headers = Object.keys(rows[0])
    const emailCol = findCol(headers, EMAIL_KEYS)
    const nameCol = findCol(headers, NAME_KEYS)
    const companyCol = findCol(headers, COMPANY_KEYS)

    const sample = rows.slice(0, 5)

    if (!emailCol) {
      // Can't auto-detect — return headers + sample so UI can show mapping dialog
      return { headers, sample, emailCol: null, nameCol, companyCol, contacts: null }
    }

    const contacts = rows
      .map(row => ({
        email: String(row[emailCol] ?? '').trim().toLowerCase(),
        name: nameCol ? String(row[nameCol] ?? '').trim() : '',
        company: companyCol ? String(row[companyCol] ?? '').trim() : '',
      }))
      .filter(c => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))

    return { headers, sample, emailCol, nameCol, companyCol, contacts }
  })

  // Apply a user-chosen column mapping to a previously parsed file
  ipcMain.handle('contacts:apply-mapping', (_event, filePath: string, mapping: { email: string; name: string; company: string }) => {
    const buf = readFileSync(filePath)
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
    return rows
      .map(row => ({
        email: String(row[mapping.email] ?? '').trim().toLowerCase(),
        name: mapping.name ? String(row[mapping.name] ?? '').trim() : '',
        company: mapping.company ? String(row[mapping.company] ?? '').trim() : '',
      }))
      .filter(c => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))
  })
}
