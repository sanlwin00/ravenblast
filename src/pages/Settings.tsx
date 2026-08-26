import { useState, useEffect } from 'react'
import { ipc } from '../lib/ipc'
import type { SmtpProfile } from '../types'

type ProfileDraft = Omit<SmtpProfile, 'id'> & { id?: string }

const blankProfile: ProfileDraft = {
  name: '',
  host: '',
  port: 587,
  encryption: 'starttls',
  username: '',
  password: '',
  fromName: '',
  defaultReplyTo: ''
}

export default function Settings() {
  const [profiles, setProfiles] = useState<SmtpProfile[]>([])
  const [editing, setEditing] = useState<ProfileDraft | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; error?: string } | null>(null)
  const [openaiKey, setOpenaiKey] = useState('')
  const [openaiStatus, setOpenaiStatus] = useState('')

  useEffect(() => {
    ipc.aiGetKey().then(k => { if (k) setOpenaiKey(k) })
  }, [])

  async function saveOpenaiKey() {
    await ipc.aiSetKey(openaiKey)
    setOpenaiStatus('API key saved')
    setTimeout(() => setOpenaiStatus(''), 3000)
  }

  async function loadProfiles() {
    const list = await ipc.smtpList()
    setProfiles(list as SmtpProfile[])
  }

  useEffect(() => { loadProfiles() }, [])

  async function save() {
    if (!editing) return
    await ipc.smtpSave(editing as Omit<SmtpProfile, 'id'> & { id?: string })
    setEditing(null)
    setShowPw(false)
    loadProfiles()
  }

  async function remove(id: string) {
    if (!confirm('Delete this SMTP profile?')) return
    await ipc.smtpDelete(id)
    loadProfiles()
  }

  async function test(id: string) {
    const result = await ipc.smtpTest(id)
    setTestResult({ id, ...result })
    setTimeout(() => setTestResult(null), 5000)
  }

  function field<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setEditing(prev => prev ? { ...prev, [key]: value } : prev)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">SMTP Profiles</h1>
        <button
          onClick={() => { setEditing({ ...blankProfile }); setShowPw(false) }}
          className="min-h-[44px] px-4 py-2 bg-[#0078D4] text-white rounded hover:bg-blue-600"
        >
          Add Profile
        </button>
      </div>

      <div className="space-y-3">
        {profiles.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{p.host}:{p.port} · {p.encryption.toUpperCase()} · {p.username}</div>
              {p.fromName && <div className="text-sm text-gray-500 dark:text-gray-400">From: {p.fromName}</div>}
              {testResult?.id === p.id && (
                <div className={`text-sm mt-1 font-medium ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.ok ? '✓ Connection OK' : `✗ ${testResult.error}`}
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => test(p.id)} className="min-h-[44px] px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">Test</button>
              <button onClick={() => { setEditing(p); setShowPw(false) }} className="min-h-[44px] px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">Edit</button>
              <button onClick={() => remove(p.id)} className="min-h-[44px] px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-16">
            No SMTP profiles yet. Add one to get started.
          </div>
        )}
      </div>

      {/* OpenAI API Key */}
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">AI Assistant</h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Used for the AI chat sidebar. Your key is stored locally and never shared.</p>
          <div className="flex gap-3">
            <input
              type="password"
              value={openaiKey}
              onChange={e => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-12 text-base bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
            />
            <button onClick={saveOpenaiKey} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded">Save</button>
          </div>
          {openaiStatus && <p className="mt-2 text-green-600 dark:text-green-400 text-sm font-medium">{openaiStatus}</p>}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold">{editing.id ? 'Edit' : 'Add'} SMTP Profile</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Profile Name</label>
              <input type="text" value={editing.name} onChange={e => field('name', e.target.value)}
                className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Host</label>
                <input type="text" value={editing.host} onChange={e => field('host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Port</label>
                <input type="number" value={editing.port} onChange={e => field('port', Number(e.target.value))}
                  className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Encryption</label>
              <select value={editing.encryption} onChange={e => field('encryption', e.target.value as SmtpProfile['encryption'])}
                className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800">
                <option value="tls">TLS (port 465)</option>
                <option value="starttls">STARTTLS (port 587)</option>
                <option value="none">None</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input type="text" value={editing.username} onChange={e => field('username', e.target.value)}
                className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={editing.password}
                  onChange={e => field('password', e.target.value)}
                  className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 pr-16 bg-transparent"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">From Name</label>
              <input type="text" value={editing.fromName} onChange={e => field('fromName', e.target.value)}
                placeholder="Your Name or Company"
                className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Default Reply-To</label>
              <input type="email" value={editing.defaultReplyTo} onChange={e => field('defaultReplyTo', e.target.value)}
                placeholder="reply@example.com"
                className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setEditing(null); setShowPw(false) }}
                className="min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={save}
                className="min-h-[44px] px-6 py-2 bg-[#0078D4] text-white rounded hover:bg-blue-600 ml-auto">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
