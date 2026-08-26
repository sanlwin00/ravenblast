import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ipc } from '../lib/ipc'
import { useBlastStore } from '../store/blastStore'
import type { Attachment, BlastConfig, Template } from '../types'
import SmtpSelector from '../components/SmtpSelector'
import RecipientChipInput from '../components/RecipientChipInput'
import BodyEditor from '../components/BodyEditor'
import TemplatePicker from '../components/TemplatePicker'
import AttachmentRow from '../components/AttachmentRow'
import ProgressPanel from '../components/ProgressPanel'

interface Props {
  aiTemplate?: { subject: string; body: string } | null
  onAiTemplateApplied?: () => void
  onContextChange?: (ctx: { subject: string; bodyHtml: string; recipientCount: number }) => void
}

export default function Composer({ aiTemplate, onAiTemplateApplied, onContextChange }: Props) {
  const { contacts, setContacts, setProgress, setSummary } = useBlastStore()
  const navigate = useNavigate()

  const [smtpProfileId, setSmtpProfileId] = useState('')
  const [cc, setCc] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [delayMin, setDelayMin] = useState(2)
  const [delayMax, setDelayMax] = useState(5)
  const [sending, setSending] = useState(false)
  const [recipientDragOver, setRecipientDragOver] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([])
  const [testSendOpen, setTestSendOpen] = useState(false)
  const [testSendEmail, setTestSendEmail] = useState('')
  const [testSendStatus, setTestSendStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testSending, setTestSending] = useState(false)

  // Load persisted draft on mount
  useEffect(() => {
    ipc.draftGet().then(draft => {
      if (draft.smtpProfileId) setSmtpProfileId(draft.smtpProfileId)
      if (draft.cc?.length) setCc(draft.cc)
      if (draft.bcc?.length) setBcc(draft.bcc)
      if (draft.subject) setSubject(draft.subject)
      if (draft.bodyHtml) setBodyHtml(draft.bodyHtml)
      setDelayMin(draft.delayMin ?? 2)
      setDelayMax(draft.delayMax ?? 5)
      setDraftLoaded(true)
    })
  }, [])

  // Save draft whenever any field changes (skip until draft loaded to avoid overwriting with defaults)
  useEffect(() => {
    if (!draftLoaded) return
    ipc.draftSave({ smtpProfileId, cc, bcc, subject, bodyHtml })
  }, [smtpProfileId, cc, bcc, subject, bodyHtml, draftLoaded])

  useEffect(() => {
    ipc.templatesList().then(setSavedTemplates)
  }, [])

  useEffect(() => {
    if (aiTemplate) {
      setSubject(aiTemplate.subject || subject)
      setBodyHtml(aiTemplate.body)
      onAiTemplateApplied?.()
    }
  }, [aiTemplate])

  useEffect(() => {
    onContextChange?.({ subject, bodyHtml, recipientCount: contacts.length })
  }, [subject, bodyHtml, contacts.length])

  useEffect(() => {
    const offProgress = ipc.onBlastProgress(p => setProgress(p))
    const offComplete = ipc.onBlastComplete(s => {
      setSummary(s)
      setProgress(null)
      setSending(false)
      navigate('/summary')
    })
    return () => { offProgress(); offComplete() }
  }, [navigate, setProgress, setSummary])

  async function handleRecipientDrop(e: React.DragEvent) {
    e.preventDefault()
    setRecipientDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.xlsx')) return
    try {
      const parsed = await ipc.contactsParseExcel((file as unknown as { path: string }).path)
      setContacts(parsed as unknown as import('../types').Contact[])
    } catch {
      alert('Failed to parse Excel file. Make sure it has Email, Name, Company columns.')
    }
  }

  const handleSend = useCallback(async () => {
    if (!smtpProfileId || contacts.length === 0) return
    const config: BlastConfig = {
      smtpProfileId,
      replyTo: '',
      to: contacts,
      cc,
      bcc,
      subject,
      bodyHtml,
      attachments,
      delayMin,
      delayMax
    }
    setSending(true)
    await ipc.blastStart(config)
  }, [smtpProfileId, contacts, cc, bcc, subject, bodyHtml, attachments, delayMin, delayMax])

  async function handleTestSend() {
    if (!smtpProfileId || !testSendEmail || !subject || !bodyHtml) return
    setTestSending(true)
    setTestSendStatus(null)
    const result = await ipc.smtpSendTest({ profileId: smtpProfileId, to: testSendEmail, subject, bodyHtml })
    setTestSendStatus(result.ok ? { ok: true, msg: `Sent to ${testSendEmail}` } : { ok: false, msg: result.error ?? 'Send failed' })
    setTestSending(false)
  }

  const canSend = Boolean(smtpProfileId && contacts.length > 0 && subject && bodyHtml)
  const canTestSend = Boolean(smtpProfileId && subject && bodyHtml)

  void savedTemplates

  return (
    <div className="w-[90%] mx-auto px-4 py-6 space-y-4">
      {sending && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <ProgressPanel onDone={() => setSending(false)} />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        {/* Recipients - drag-drop Excel or type emails */}
        <div
          onDragOver={e => { e.preventDefault(); setRecipientDragOver(true) }}
          onDragLeave={() => setRecipientDragOver(false)}
          onDrop={handleRecipientDrop}
          className={`border rounded-lg p-3 transition-colors ${recipientDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Recipients — type emails or drop Excel (.xlsx) file</label>
          <RecipientChipInput label="" values={contacts.map(c => c.email)} onChange={() => {}} />
          {contacts.length > 0 && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>✅ {contacts.length} recipients loaded</span>
              <button onClick={() => setContacts([])} className="text-red-500 hover:text-red-700 text-xs">Clear all</button>
            </div>
          )}
        </div>

        <RecipientChipInput label="CC" values={cc} onChange={setCc} />
        <RecipientChipInput label="BCC" values={bcc} onChange={setBcc} />

        <SmtpSelector value={smtpProfileId} onChange={setSmtpProfileId} />

        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject — supports {{Name}} and {{Company}} merge tags"
            className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent"
          />
        </div>

        <AttachmentRow attachments={attachments} onChange={setAttachments} />

        <TemplatePicker
          onSelect={(html, subject) => { setBodyHtml(html); if (subject) setSubject(subject) }}
          hasContent={bodyHtml.length > 0}
        />
        <BodyEditor value={bodyHtml} onChange={setBodyHtml} />

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => { setTestSendOpen(true); setTestSendStatus(null) }}
            disabled={!canTestSend}
            className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🧪 Test Send
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
          >
            📤 Send to All ({contacts.length})
          </button>
        </div>

        {/* Test Send modal */}
        {testSendOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
              <h2 className="text-lg font-semibold">Send Test Email</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sends the current subject and body to the address below, prefixed with [TEST].</p>
              <div>
                <label className="block text-sm font-medium mb-1">Send to</label>
                <input
                  type="email"
                  value={testSendEmail}
                  onChange={e => { setTestSendEmail(e.target.value); setTestSendStatus(null) }}
                  onKeyDown={e => { if (e.key === 'Enter') handleTestSend() }}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent"
                />
              </div>
              {testSendStatus && (
                <div className={`text-sm font-medium px-3 py-2 rounded ${testSendStatus.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                  {testSendStatus.ok ? '✓ ' : '✗ '}{testSendStatus.msg}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setTestSendOpen(false); setTestSendStatus(null) }}
                  className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  ✕ Close
                </button>
                <button
                  onClick={handleTestSend}
                  disabled={testSending || !testSendEmail}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                >
                  {testSending ? '⏳ Sending...' : '🧪 Send Test'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
