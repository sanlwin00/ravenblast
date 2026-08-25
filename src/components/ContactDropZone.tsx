import { useState, DragEvent } from 'react'
import { ipc } from '../lib/ipc'
import { useBlastStore } from '../store/blastStore'
import type { Contact } from '../types'

interface ColumnMapping {
  headers: string[]
  rows: Record<string, string>[]
}

export default function ContactDropZone() {
  const { contacts, setContacts } = useBlastStore()
  const [dragging, setDragging] = useState(false)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [colEmail, setColEmail] = useState('')
  const [colName, setColName] = useState('')
  const [colCompany, setColCompany] = useState('')

  async function handleFile(path: string) {
    const rows = await ipc.contactsParseExcel(path)
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    setColEmail(headers.find(h => /email/i.test(h)) ?? headers[0] ?? '')
    setColName(headers.find(h => /name/i.test(h)) ?? headers[1] ?? '')
    setColCompany(headers.find(h => /company|org/i.test(h)) ?? headers[2] ?? '')
    setMapping({ headers, rows })
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file?.name.endsWith('.xlsx')) return
    const path = (file as File & { path?: string }).path ?? ''
    if (path) handleFile(path)
  }

  function confirmMapping() {
    if (!mapping) return
    const mapped: Contact[] = mapping.rows
      .map(row => ({
        email: (row[colEmail] ?? '').trim(),
        name: (row[colName] ?? '').trim(),
        company: (row[colCompany] ?? '').trim()
      }))
      .filter(c => c.email && c.email.includes('@'))
    setContacts(mapped)
    setMapping(null)
  }

  return (
    <>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragging
            ? 'border-[#0078D4] bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="text-3xl mb-2">📊</div>
        <div className="text-sm font-medium">Drop Excel (.xlsx)</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact list spreadsheet</div>
        {contacts.length > 0 && (
          <div className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400">
            {contacts.length} contacts loaded
          </div>
        )}
      </div>

      {mapping && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold">Map Spreadsheet Columns</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{mapping.rows.length} rows found</p>

            {([
              { label: 'Email Column', value: colEmail, setter: setColEmail },
              { label: 'Name Column', value: colName, setter: setColName },
              { label: 'Company Column', value: colCompany, setter: setColCompany }
            ] as const).map(({ label, value, setter }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <select
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800"
                >
                  <option value="">(none)</option>
                  {mapping.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}

            <div className="flex gap-3">
              <button onClick={() => setMapping(null)}
                className="min-h-[44px] flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={confirmMapping}
                disabled={!colEmail}
                className="min-h-[44px] flex-1 px-4 py-2 bg-[#0078D4] text-white rounded hover:bg-blue-600 disabled:opacity-40">
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
