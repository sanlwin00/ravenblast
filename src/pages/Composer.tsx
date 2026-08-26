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
import DelaySlider from '../components/DelaySlider'
import ProgressPanel from '../components/ProgressPanel'

interface Props {
  aiTemplate?: { subject: string; body: string } | null
  onAiTemplateApplied?: () => void
}

export default function Composer({ aiTemplate, onAiTemplateApplied }: Props) {
  const { contacts, setContacts, setProgress, setSummary } = useBlastStore()
  const navigate = useNavigate()

  const [smtpProfileId, setSmtpProfileId] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [cc, setCc] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [delayMin, setDelayMin] = useState(2)
  const [delayMax, setDelayMax] = useState(5)
  const [sending, setSending] = useState(false)
  const [recipientDragOver, setRecipientDragOver] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([])

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
      replyTo,
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
  }, [smtpProfileId, replyTo, contacts, cc, bcc, subject, bodyHtml, attachments, delayMin, delayMax])

  const handleTestConnection = useCallback(async () => {
    if (!smtpProfileId) {
      alert('Select an SMTP profile first.')
      return
    }
    const result = await ipc.smtpTest(smtpProfileId)
    alert(result.ok ? 'Connection successful.' : `Connection failed: ${result.error}`)
  }, [smtpProfileId])

  const canSend = Boolean(smtpProfileId && contacts.length > 0 && subject && bodyHtml)

  void savedTemplates

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {sending && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <ProgressPanel onDone={() => setSending(false)} />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
        <SmtpSelector value={smtpProfileId} onChange={setSmtpProfileId} />

        <div>
          <label className="block text-sm font-medium mb-1">Reply-To</label>
          <input
            type="email"
            value={replyTo}
            onChange={e => setReplyTo(e.target.value)}
            placeholder="reply@example.com"
            className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-transparent"
          />
        </div>

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

        <TemplatePicker onSelect={setBodyHtml} hasContent={bodyHtml.length > 0} />
        <BodyEditor value={bodyHtml} onChange={setBodyHtml} />

        <AttachmentRow attachments={attachments} onChange={setAttachments} />

        <DelaySlider min={delayMin} max={delayMax} onMinChange={setDelayMin} onMaxChange={setDelayMax} />

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleTestConnection}
            className="min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Test Connection
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="min-h-[44px] px-6 py-2 bg-[#0078D4] text-white rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed ml-auto font-medium"
          >
            Send to All ({contacts.length})
          </button>
        </div>
      </div>
    </div>
  )
}
