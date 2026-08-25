import { useRef } from 'react'

// Templates are imported as raw strings via Vite's ?raw query
import newsletterHtml from '../templates/newsletter.html?raw'
import promotionHtml from '../templates/promotion.html?raw'
import businessHtml from '../templates/business.html?raw'

interface Props {
  onSelect: (html: string) => void
  hasContent: boolean
}

const TEMPLATES: Record<string, { label: string; html: string }> = {
  newsletter: { label: 'Newsletter', html: newsletterHtml },
  promotion: { label: 'Promotion', html: promotionHtml },
  business: { label: 'Plain Business', html: businessHtml }
}

export default function TemplatePicker({ onSelect, hasContent }: Props) {
  const selectRef = useRef<HTMLSelectElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const key = e.target.value
    if (!key) return

    if (hasContent && !confirm('Replace current body content with this template?')) {
      e.target.value = ''
      return
    }

    const tpl = TEMPLATES[key]
    if (tpl) onSelect(tpl.html)
    e.target.value = ''
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Load Template</label>
      <select
        ref={selectRef}
        onChange={handleChange}
        defaultValue=""
        className="min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 w-56"
      >
        <option value="">Choose template...</option>
        {Object.entries(TEMPLATES).map(([key, { label }]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
  )
}
