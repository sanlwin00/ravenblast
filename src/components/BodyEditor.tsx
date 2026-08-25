import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function BodyEditor({ value, onChange }: Props) {
  const [rawMode, setRawMode] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Underline
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      if (!rawMode) onChange(e.getHTML())
    }
  })

  // Sync external value into editor when not in raw mode
  useEffect(() => {
    if (!editor || rawMode) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value, false)
    }
  }, [value, rawMode, editor])

  function toggleRaw() {
    if (!rawMode && editor) {
      // entering raw — value already up to date
    } else if (rawMode && editor) {
      editor.commands.setContent(value, false)
    }
    setRawMode(m => !m)
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

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Body</label>
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {editor && (
          <>
            {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B')}
            {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I')}
            {toolbarBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U')}
            {toolbarBtn(editor.isActive('link'), () => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run()
              } else {
                const url = prompt('Enter URL:')
                if (url) editor.chain().focus().setLink({ href: url }).run()
              }
            }, 'Link')}
            {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• List')}
          </>
        )}
        <button
          type="button"
          onClick={toggleRaw}
          className={`px-3 py-1 border rounded text-sm ml-auto transition-colors ${
            rawMode
              ? 'bg-gray-200 dark:bg-gray-600 border-gray-400'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          HTML
        </button>
      </div>

      {rawMode ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-64 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent font-mono text-sm resize-y"
          placeholder="<p>Your HTML email content here...</p>"
          spellCheck={false}
        />
      ) : (
        <div className="border border-gray-300 dark:border-gray-600 rounded p-3 min-h-[16rem] cursor-text">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}
