import { useState, useEffect } from 'react'
import { ipc } from '../lib/ipc'
import type { SmtpProfile } from '../types'
import DelaySlider from '../components/DelaySlider'

type ProfileDraft = Omit<SmtpProfile, 'id'> & { id?: string }

const blankProfile: ProfileDraft = {
  name: '',
  type: 'smtp',
  host: '',
  port: 587,
  encryption: 'starttls',
  username: '',
  password: '',
  apiKey: '',
  senderEmail: '',
  fromName: '',
  defaultReplyTo: ''
}

export default function Settings() {
  const [profiles, setProfiles] = useState<SmtpProfile[]>([])
  const [editing, setEditing] = useState<ProfileDraft | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [modalTestResult, setModalTestResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const [modalTesting, setModalTesting] = useState(false)
  const [openaiKey, setOpenaiKey] = useState('')
  const [openaiStatus, setOpenaiStatus] = useState('')
  const [aiModel, setAiModel] = useState('gpt-4o')
  const [delayMin, setDelayMin] = useState(2)
  const [delayMax, setDelayMax] = useState(5)

  useEffect(() => {
    ipc.aiGetKey().then(k => { if (k) setOpenaiKey(k) })
    ipc.aiGetModel().then(m => { if (m) setAiModel(m) })
    ipc.draftGet().then(d => {
      setDelayMin(d.delayMin ?? 2)
      setDelayMax(d.delayMax ?? 5)
    })
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
    setModalTestResult(null)
    loadProfiles()
  }

  async function testModalConnection() {
    if (!editing) return
    setModalTesting(true)
    setModalTestResult(null)
    const result = await ipc.smtpTestProfile(editing as SmtpProfile)
    setModalTestResult(result)
    setModalTesting(false)
  }

  async function remove(id: string) {
    await ipc.smtpDelete(id)
    setDeleteConfirmId(null)
    loadProfiles()
  }

  function field<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setEditing(prev => prev ? { ...prev, [key]: value } : prev)
  }

  function handleDelayMinChange(v: number) {
    setDelayMin(v)
    ipc.draftSave({ delayMin: v })
  }

  function handleDelayMaxChange(v: number) {
    setDelayMax(v)
    ipc.draftSave({ delayMax: v })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <button
          onClick={() => { setEditing({ ...blankProfile }); setShowPw(false) }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
        >
          ➕ Add Account
        </button>
      </div>

      <div className="space-y-3">
        {profiles.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {p.type === 'brevo'
                  ? `Brevo API · ${p.senderEmail}`
                  : `${p.host}:${p.port} · ${p.encryption?.toUpperCase()} · ${p.username}`}
              </div>
              {p.fromName && <div className="text-sm text-gray-500 dark:text-gray-400">From: {p.fromName}</div>}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                  p.type === 'brevo'
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                }`}>
                  {p.type === 'brevo' ? 'Brevo API' : 'SMTP'}
                </span>
              </div>
              {deleteConfirmId === p.id && (
                <div className="mt-2 flex items-center gap-2 text-sm bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded px-3 py-2">
                  <span className="text-red-800 dark:text-red-200 flex-1">Delete this account?</span>
                  <button
                    onClick={() => remove(p.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="border border-gray-300 dark:border-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setEditing(p); setShowPw(false) }} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">✏️ Edit</button>
              <button onClick={() => setDeleteConfirmId(p.id)} className="flex items-center gap-1.5 border border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-2 rounded-lg text-sm font-medium transition-colors">🗑️ Delete</button>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-16">
            No accounts yet. Add one to get started.
          </div>
        )}
      </div>

      {/* Send Delay */}
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">Send Delay</h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Random delay between each email to avoid spam filters. Settings are saved automatically.</p>
          <DelaySlider min={delayMin} max={delayMax} onMinChange={handleDelayMinChange} onMaxChange={handleDelayMaxChange} />
        </div>
      </section>

      {/* OpenAI API Key */}
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">AI Assistant</h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Model</label>
            <select
              value={aiModel}
              onChange={e => { setAiModel(e.target.value); ipc.aiSetModel(e.target.value) }}
              className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800"
            >
              <option value="gpt-4o">GPT-4o (best quality)</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-4o-mini">GPT-4o mini (faster, cheaper)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
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
            <button onClick={saveOpenaiKey} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm">💾 Save</button>
          </div>
          {openaiStatus && <p className="mt-2 text-green-600 dark:text-green-400 text-sm font-medium">{openaiStatus}</p>}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold">{editing.id ? 'Edit' : 'Add'} Account</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Profile Name</label>
              <input type="text" value={editing.name} onChange={e => field('name', e.target.value)}
                className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <div className="flex gap-2">
                {(['smtp', 'brevo'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { if (!editing.id) { field('type', t); setModalTestResult(null) } }}
                    disabled={!!editing.id}
                    className={`flex-1 min-h-[48px] rounded-lg text-sm font-medium border transition-colors ${
                      editing.type === t
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    } ${editing.id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    {t === 'smtp' ? 'SMTP' : 'Brevo API'}
                  </button>
                ))}
              </div>
            </div>

            {editing.type === 'brevo' ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Brevo API Key</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={editing.apiKey ?? ''}
                      onChange={e => field('apiKey', e.target.value)}
                      placeholder="xkeysib-..."
                      className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 pr-16 bg-transparent"
                    />
                    {!editing.id && (
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700">
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sender Email</label>
                  <input type="email" value={editing.senderEmail ?? ''} onChange={e => field('senderEmail', e.target.value)}
                    placeholder="sender@yourdomain.com"
                    className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be a verified sender in your Brevo account.</p>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Host</label>
                    <input type="text" value={editing.host ?? ''} onChange={e => field('host', e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Port</label>
                    <input type="number" value={editing.port ?? 587} onChange={e => field('port', Number(e.target.value))}
                      className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Encryption</label>
                  <select value={editing.encryption ?? 'starttls'} onChange={e => field('encryption', e.target.value as SmtpProfile['encryption'])}
                    className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800">
                    <option value="tls">TLS (port 465)</option>
                    <option value="starttls">STARTTLS (port 587)</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input type="text" value={editing.username ?? ''} onChange={e => field('username', e.target.value)}
                    className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={editing.password ?? ''}
                      onChange={e => field('password', e.target.value)}
                      className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 pr-16 bg-transparent"
                    />
                    {!editing.id && (
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700">
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

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

            {modalTestResult && (
              <div className={`text-sm font-medium px-3 py-2 rounded ${modalTestResult.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {modalTestResult.ok ? '✓ Connection successful' : `✗ ${modalTestResult.error}`}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setEditing(null); setShowPw(false); setModalTestResult(null) }}
                className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                ✕ Cancel
              </button>
              <button onClick={testModalConnection} disabled={modalTesting}
                className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
                {modalTesting ? '⏳ Testing...' : '🔌 Test Connection'}
              </button>
              <button onClick={save}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm ml-auto">
                💾 Save Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
