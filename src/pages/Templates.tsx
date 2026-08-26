import { useState, useEffect, useRef } from 'react'
import { ipc } from '../lib/ipc'
import type { Template } from '../types'
import BodyEditor from '../components/BodyEditor'

interface PendingImport {
  subject: string
  bodyHtml: string
  defaultName: string
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [editing, setEditing] = useState<Template | null>(null)
  const [editName, setEditName] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState('')
  const [statusError, setStatusError] = useState(false)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [importName, setImportName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
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

  function startClone(t: Template) {
    const existingNames = new Set(templates.map(x => x.name))
    const base = `${t.name} (Copy)`
    let name = base
    let n = 2
    while (existingNames.has(name)) name = `${base} ${n++}`
    const clone: Template = { id: '', name, subject: t.subject, bodyHtml: t.bodyHtml, createdAt: '' }
    setEditing(clone)
    setEditName(name)
    setEditSubject(t.subject)
    setEditBody(t.bodyHtml)
  }

  function showError(msg: string) { setStatus(msg); setStatusError(true) }
  function showOk(msg: string) { setStatus(msg); setStatusError(false); setTimeout(() => setStatus(''), 3000) }

  async function save() {
    if (!editName.trim()) { showError('Template name is required'); return }
    await ipc.templatesSave({ ...editing, name: editName, subject: editSubject, bodyHtml: editBody })
    setEditing(null)
    showOk('Template saved')
    load()
  }

  async function del(id: string) {
    setPendingDelete(id)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await ipc.templatesDelete(pendingDelete)
    setPendingDelete(null)
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
    if (!file || !file.name.toLowerCase().endsWith('.msg')) {
      showError('Please drop an Outlook .msg file')
      return
    }
    const filePath = (file as unknown as { path: string }).path
    setStatus('Parsing .msg file...')
    setStatusError(false)
    try {
      const result = await ipc.msgParse(filePath)
      if (result.error) {
        showError(`Parse error: ${result.error}`)
        return
      }
      setStatus('')
      setPendingImport({
        subject: result.subject || '',
        bodyHtml: result.bodyHtml || '',
        defaultName: file.name.replace(/\.msg$/i, '')
      })
      setImportName(file.name.replace(/\.msg$/i, ''))
    } catch (err) {
      showError(`Failed: ${(err as Error).message ?? String(err)}`)
    }
  }

  async function confirmImport() {
    if (!pendingImport) return
    const name = importName.trim() || pendingImport.defaultName
    await ipc.templatesSave({ name, subject: pendingImport.subject, bodyHtml: pendingImport.bodyHtml })
    setPendingImport(null)
    setImportName('')
    showOk('Template created from .msg file')
    load()
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
          {status && <p className={`font-medium ${statusError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{status}</p>}
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

      {status && <p className={`mb-4 font-medium ${statusError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{status}</p>}

      {/* .msg drop zone */}
      <div ref={dropRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
        <div className="text-4xl mb-2">📄</div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-400">Drop an Outlook .msg file here to create a template from it</p>
        <p className="text-sm text-gray-400 mt-1">Subject, body and formatting will be imported automatically</p>
      </div>

      {/* Inline name prompt after .msg parse */}
      {pendingImport && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            .msg file parsed — give this template a name:
          </p>
          {pendingImport.subject && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">Subject: {pendingImport.subject}</p>
          )}
          <div className="flex gap-2">
            <input
              autoFocus
              value={importName}
              onChange={e => setImportName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmImport(); if (e.key === 'Escape') { setPendingImport(null); setImportName('') } }}
              className="flex-1 border border-blue-300 dark:border-blue-600 rounded px-3 py-2 text-base bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
              placeholder="Template name"
            />
            <button onClick={confirmImport} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded text-base">Save</button>
            <button onClick={() => { setPendingImport(null); setImportName('') }} className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-base hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          </div>
        </div>
      )}

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
                <button onClick={() => startClone(t)} className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Clone</button>
                {pendingDelete === t.id ? (
                  <>
                    <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium">Confirm Delete</button>
                    <button onClick={() => setPendingDelete(null)} className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => del(t.id)} className="border border-red-300 text-red-600 px-4 py-2 rounded text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
