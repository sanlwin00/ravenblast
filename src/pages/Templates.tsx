import { useState, useEffect, useRef } from 'react'
import { ipc } from '../lib/ipc'
import type { Template } from '../types'
import BodyEditor from '../components/BodyEditor'

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [editing, setEditing] = useState<Template | null>(null)
  const [editName, setEditName] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const list = await ipc.templatesList()
    setTemplates(list)
  }

  function startNew() {
    const t: Template = { id: '', name: '', subject: '', bodyHtml: '', createdAt: '' }
    setEditing(t)
    setEditName('')
    setEditSubject('')
    setEditBody('')
  }

  function startEdit(t: Template) {
    setEditing(t)
    setEditName(t.name)
    setEditSubject(t.subject)
    setEditBody(t.bodyHtml)
  }

  async function save() {
    if (!editName.trim()) { setStatus('Template name is required'); return }
    await ipc.templatesSave({ ...editing, name: editName, subject: editSubject, bodyHtml: editBody })
    setEditing(null)
    setStatus('Template saved')
    load()
    setTimeout(() => setStatus(''), 3000)
  }

  async function del(id: string) {
    if (!confirm('Delete this template?')) return
    await ipc.templatesDelete(id)
    load()
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() { setDragOver(false) }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.msg')) {
      setStatus('Please drop an Outlook .msg file')
      return
    }
    const filePath = (file as unknown as { path: string }).path
    const result = await ipc.msgParse(filePath)
    if (result.error) {
      setStatus(`Error: ${result.error}`)
      return
    }
    const name = prompt('Template name:', file.name.replace('.msg', '')) || file.name.replace('.msg', '')
    await ipc.templatesSave({ name, subject: result.subject || '', bodyHtml: result.bodyHtml || '' })
    setStatus('Template created from .msg file')
    load()
    setTimeout(() => setStatus(''), 3000)
  }

  if (editing !== null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-lg">← Back</button>
          <h1 className="text-2xl font-bold">{editing.id ? 'Edit Template' : 'New Template'}</h1>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template Name</label>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-12 text-base bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Monthly Newsletter" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Subject</label>
            <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-12 text-base bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Hello {{Name}}, here's your update" />
          </div>
          <div>
            <BodyEditor value={editBody} onChange={setEditBody} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded text-base">Save Template</button>
            <button onClick={() => setEditing(null)} className="border border-gray-300 dark:border-gray-600 px-6 py-3 rounded text-base hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          </div>
          {status && <p className="text-green-600 dark:text-green-400 font-medium">{status}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <button onClick={startNew} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded text-base">+ New Template</button>
      </div>

      {status && <p className="mb-4 text-green-600 dark:text-green-400 font-medium">{status}</p>}

      {/* .msg drop zone */}
      <div ref={dropRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
        <div className="text-4xl mb-2">📄</div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-400">Drop an Outlook .msg file here to create a template from it</p>
        <p className="text-sm text-gray-400 mt-1">Subject, body and formatting will be imported automatically</p>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg">No templates yet. Create one or drop a .msg file above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-base">{t.name}</div>
                {t.subject && <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Subject: {t.subject}</div>}
                <div className="text-xs text-gray-400 mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(t)} className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Edit</button>
                <button onClick={() => del(t.id)} className="border border-red-300 text-red-600 px-4 py-2 rounded text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
