import { useState, useEffect } from 'react'
import { ipc } from '../lib/ipc'
import type { Template } from '../types'

import newsletterHtml from '../templates/newsletter.html?raw'
import promotionHtml from '../templates/promotion.html?raw'
import businessHtml from '../templates/business.html?raw'

interface Props {
  onSelect: (html: string, subject?: string) => void
  hasContent: boolean
}

const STOCK: { label: string; html: string; subject?: string }[] = [
  { label: 'Newsletter', html: newsletterHtml },
  { label: 'Promotion', html: promotionHtml },
  { label: 'Plain Business', html: businessHtml }
]

export default function TemplatePicker({ onSelect, hasContent }: Props) {
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState('')
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  useEffect(() => {
    ipc.templatesList().then(setSavedTemplates)
  }, [])

  function apply(key: string) {
    if (key.startsWith('stock:')) {
      const idx = parseInt(key.replace('stock:', ''), 10)
      const tpl = STOCK[idx]
      if (tpl) onSelect(tpl.html, tpl.subject)
    } else if (key.startsWith('saved:')) {
      const id = key.replace('saved:', '')
      const tpl = savedTemplates.find(t => t.id === id)
      if (tpl) onSelect(tpl.bodyHtml, tpl.subject)
    }
    setSelected('')
    setPendingKey(null)
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const key = e.target.value
    if (!key) return
    if (hasContent) {
      setPendingKey(key)
      setSelected(key)
    } else {
      apply(key)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Load Template</label>
      <select
        value={selected}
        onChange={handleChange}
        className="min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 w-56"
      >
        <option value="">Choose template...</option>
        {STOCK.map((tpl, i) => (
          <option key={`stock:${i}`} value={`stock:${i}`}>{tpl.label}</option>
        ))}
        {savedTemplates.length > 0 && (
          <optgroup label="My Templates">
            {savedTemplates.map(t => (
              <option key={`saved:${t.id}`} value={`saved:${t.id}`}>{t.name}</option>
            ))}
          </optgroup>
        )}
      </select>

      {/* Inline confirmation when body already has content */}
      {pendingKey && (
        <div className="mt-2 flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded px-3 py-2">
          <span className="text-amber-800 dark:text-amber-200 flex-1">Replace current body with this template?</span>
          <button
            type="button"
            onClick={() => apply(pendingKey)}
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
