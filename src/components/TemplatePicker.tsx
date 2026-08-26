import { useState, useEffect } from 'react'
import { ipc } from '../lib/ipc'
import type { Template } from '../types'

interface Props {
  onSelect: (html: string, subject?: string) => void
  hasContent: boolean
}

export default function TemplatePicker({ onSelect, hasContent }: Props) {
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState('')
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  useEffect(() => {
    ipc.templatesList().then(setSavedTemplates)
  }, [])

  function apply(id: string) {
    const tpl = savedTemplates.find(t => t.id === id)
    if (tpl) onSelect(tpl.bodyHtml, tpl.subject)
    setSelected('')
    setPendingKey(null)
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (!id) return
    if (hasContent) {
      setPendingKey(id)
      setSelected(id)
    } else {
      apply(id)
    }
  }

  if (savedTemplates.length === 0) return null

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Load Template</label>
      <select
        value={selected}
        onChange={handleChange}
        className="min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 w-56"
      >
        <option value="">Choose template...</option>
        {savedTemplates.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* Inline confirmation when body already has content */}
      {pendingKey && (
        <div className="mt-2 flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded px-3 py-2">
          <span className="text-amber-800 dark:text-amber-200 flex-1">Replace current body with this template?</span>
          <button
            type="button"
            onClick={() => { if (pendingKey) apply(pendingKey) }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-semibold"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => { setPendingKey(null); setSelected('') }}
            className="border border-gray-300 dark:border-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
