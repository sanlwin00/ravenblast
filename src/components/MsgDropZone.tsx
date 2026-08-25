import { useState, DragEvent } from 'react'
import { ipc } from '../lib/ipc'

interface Props {
  onLoad: (data: { subject: string; bodyHtml: string }) => void
}

export default function MsgDropZone({ onLoad }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loaded, setLoaded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(path: string) {
    setError(null)
    try {
      const data = await ipc.msgParse(path)
      onLoad({ subject: data.subject, bodyHtml: data.bodyHtml })
      setLoaded(data.subject || 'Message loaded')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file?.name.endsWith('.msg')) {
      setError('Only .msg files are supported')
      return
    }
    const path = (file as File & { path?: string }).path ?? ''
    if (path) handleFile(path)
  }

  return (
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
      <div className="text-3xl mb-2">📧</div>
      <div className="text-sm font-medium">Drop Outlook (.msg)</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loads subject &amp; body</div>
      {loaded && (
        <div className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400">✓ {loaded}</div>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  )
}
