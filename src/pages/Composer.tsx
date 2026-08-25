import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ipc } from '../lib/ipc'
import { useBlastStore } from '../store/blastStore'
import type { Attachment, BlastConfig } from '../types'
import SmtpSelector from '../components/SmtpSelector'
import RecipientChipInput from '../components/RecipientChipInput'
import BodyEditor from '../components/BodyEditor'
import TemplatePicker from '../components/TemplatePicker'
import AttachmentRow from '../components/AttachmentRow'
import ContactDropZone from '../components/ContactDropZone'
import MsgDropZone from '../components/MsgDropZone'
import DelaySlider from '../components/DelaySlider'
import ProgressPanel from '../components/ProgressPanel'

export default function Composer() {
  const { contacts, setProgress, setSummary } = useBlastStore()
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

        <div>
          <div className="block text-sm font-medium mb-1">To</div>
          <div className="min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {contacts.length > 0
              ? `${contacts.length} recipients loaded from spreadsheet`
              : 'Drop a spreadsheet below to load recipients'}
          </div>
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

        <div className="grid grid-cols-2 gap-4">
          <ContactDropZone />
          <MsgDropZone
            onLoad={({ subject: s, bodyHtml: b }) => {
              setSubject(s)
              setBodyHtml(b)
            }}
          />
        </div>

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
