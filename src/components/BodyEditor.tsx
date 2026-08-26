import { useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'

interface Props {
  value: string
  onChange: (value: string) => void
}

type EditMode = 'visual' | 'html'

export default function BodyEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<EditMode>('visual')
  const [split, setSplit] = useState(false)

  function toolbarBtn(active: boolean, onClick: () => void, label: string) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1 border rounded text-sm transition-colors ${
          active
            ? 'bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500'
            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {label}
      </button>
    )
  }

  const isFullDoc = /^\s*(<!DOCTYPE|<html)/i.test(value.trim())
  const previewHtml = isFullDoc
    ? value
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333}</style></head><body>${value}</body></html>`

  const htmlPane = (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent font-mono text-sm resize-none"
      placeholder="<p>Your HTML email content here...</p>"
      spellCheck={false}
      style={{ minHeight: '24rem', height: '100%' }}
    />
  )

  const previewPane = (
    <iframe
      srcDoc={previewHtml}
      sandbox="allow-same-origin"
      className="w-full border border-gray-300 dark:border-gray-600 rounded bg-white"
      style={{ minHeight: '24rem', height: '100%' }}
      title="Email preview"
    />
  )

  return (
    <div>
      <div className="flex gap-1.5 mb-2 flex-wrap items-center">
        <div className="ml-auto flex gap-1.5">
          {toolbarBtn(mode === 'visual', () => setMode('visual'), '✏️ Visual')}
          {toolbarBtn(mode === 'html', () => setMode('html'), '</> HTML')}
          {mode === 'html' && (
            <button
              type="button"
              onClick={() => setSplit(v => !v)}
              className={`px-3 py-1 border rounded text-sm transition-colors ${
                split
                  ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              ⬛ Split
            </button>
          )}
        </div>
      </div>

      {mode === 'visual' && (
        <Editor
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          value={value}
          onEditorChange={(content) => onChange(content)}
          init={{
            height: 500,
            menubar: false,
            plugins: 'link lists table image code',
            toolbar:
              'undo redo | bold italic underline | forecolor backcolor | fontfamily fontsize | alignleft aligncenter alignright alignjustify | bullist numlist | link image table | code',
            verify_html: false,
            cleanup: false,
            cleanup_on_startup: false,
            convert_urls: false,
            valid_elements: '*[*]',
            extended_valid_elements: '*[*]',
            valid_children: '+body[style],+*[*]',
            skin: 'oxide',
            content_css: 'default',
            promotion: false,
            branding: false,
          }}
        />
      )}

      {mode === 'html' && !split && htmlPane}

      {mode === 'html' && split && (
        <div className="grid grid-cols-2 gap-3" style={{ minHeight: '24rem' }}>
          <div className="flex flex-col">{htmlPane}</div>
          <div className="flex flex-col">{previewPane}</div>
        </div>
      )}
    </div>
  )
}
