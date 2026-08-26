import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'

interface Props {
  value: string
  onChange: (value: string) => void
}

type EditMode = 'rich' | 'raw' | 'preview'

export default function BodyEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<EditMode>('rich')
  const [split, setSplit] = useState(true)
  const [linkInput, setLinkInput] = useState('')
  const [showLinkBox, setShowLinkBox] = useState(false)
  const linkRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Underline
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      if (mode === 'rich') onChange(e.getHTML())
    }
  })

  useEffect(() => {
    if (!editor || mode !== 'rich') return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value, false)
    }
  }, [value, mode, editor])

  useEffect(() => {
    if (showLinkBox) linkRef.current?.focus()
  }, [showLinkBox])

  function switchMode(next: EditMode) {
    if (next === 'rich' && editor) {
      editor.commands.setContent(value, false)
    }
    setMode(next)
    setShowLinkBox(false)
  }

  function applyLink() {
    const url = linkInput.trim()
    if (!url || !editor) { setShowLinkBox(false); return }
    editor.chain().focus().setLink({ href: url }).run()
    setLinkInput('')
    setShowLinkBox(false)
  }

  function toggleLink() {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      setShowLinkBox(false)
    } else {
      setShowLinkBox(v => !v)
    }
  }

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

  const previewHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6}</style></head><body>${value}</body></html>`

  // In split mode, "preview" tab makes no sense — treat it as rich
  const effectiveMode = split && mode === 'preview' ? 'rich' : mode

  const editorPane = (
    <>
      {effectiveMode === 'rich' && (
        <div className="border border-gray-300 dark:border-gray-600 rounded p-3 min-h-[16rem] cursor-text h-full">
          <EditorContent editor={editor} />
        </div>
      )}
      {effectiveMode === 'raw' && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-64 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent font-mono text-sm resize-none"
          placeholder="<p>Your HTML email content here...</p>"
          spellCheck={false}
          style={{ minHeight: '16rem' }}
        />
      )}
    </>
  )

  const previewPane = (
    <iframe
      srcDoc={previewHtml}
      sandbox="allow-same-origin"
      className="w-full border border-gray-300 dark:border-gray-600 rounded bg-white"
      style={{ minHeight: '16rem', height: '100%' }}
      title="Email preview"
    />
  )

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-1.5 mb-2 flex-wrap items-center">
        {effectiveMode === 'rich' && editor && (
          <>
            {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B')}
            {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I')}
            {toolbarBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U')}
            {toolbarBtn(editor.isActive('link'), toggleLink, 'Link')}
            {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• List')}
          </>
        )}
        <div className="ml-auto flex gap-1.5">
          {!split && toolbarBtn(effectiveMode === 'rich', () => switchMode('rich'), 'Edit')}
          {!split && toolbarBtn(effectiveMode === 'raw', () => switchMode('raw'), 'HTML')}
          {!split && toolbarBtn(effectiveMode === 'preview', () => switchMode('preview'), 'Preview')}
          {split && toolbarBtn(effectiveMode === 'rich', () => switchMode('rich'), 'Rich')}
          {split && toolbarBtn(effectiveMode === 'raw', () => switchMode('raw'), 'HTML')}
          <button
            type="button"
            onClick={() => setSplit(v => !v)}
            title={split ? 'Single view' : 'Split view'}
            className={`px-3 py-1 border rounded text-sm transition-colors ${
              split
                ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            ⬛ Split
          </button>
        </div>
      </div>

      {/* Inline link input */}
      {showLinkBox && (
        <div className="flex gap-2 mb-2">
          <input
            ref={linkRef}
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') { setShowLinkBox(false); setLinkInput('') } }}
            placeholder="https://example.com"
            className="flex-1 border border-blue-400 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 focus:outline-none"
          />
          <button type="button" onClick={applyLink} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium">Apply</button>
          <button type="button" onClick={() => { setShowLinkBox(false); setLinkInput('') }} className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
        </div>
      )}

      {/* Split layout */}
      {split ? (
        <div className="grid grid-cols-2 gap-3" style={{ minHeight: '16rem' }}>
          <div className="flex flex-col">{editorPane}</div>
          <div className="flex flex-col">{previewPane}</div>
        </div>
      ) : (
        <>
          {effectiveMode !== 'preview' && editorPane}
          {effectiveMode === 'preview' && previewPane}
        </>
      )}
    </div>
  )
}
