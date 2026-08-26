import type { Attachment } from '../types'

interface Props {
  attachments: Attachment[]
  onChange: (attachments: Attachment[]) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentRow({ attachments, onChange }: Props) {
  function pickFiles() {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = () => {
      const files = Array.from(input.files || [])
      const newAttachments: Attachment[] = files.map(f => ({
        name: f.name,
        // Electron exposes `path` on File objects in the renderer
        path: (f as File & { path?: string }).path ?? '',
        size: f.size
      }))
      onChange([...attachments, ...newAttachments])
    }
    input.click()
  }

  function remove(name: string) {
    onChange(attachments.filter(a => a.name !== name))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Attachments</label>
        <button
          type="button"
          onClick={pickFiles}
          className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          📎 Add Attachment
        </button>
      </div>
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map(a => (
            <div key={a.name} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400">📎</span>
                <span className="truncate">{a.name}</span>
                <span className="text-gray-400 flex-shrink-0">({formatBytes(a.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => remove(a.name)}
                className="text-gray-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0"
                aria-label={`Remove ${a.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
