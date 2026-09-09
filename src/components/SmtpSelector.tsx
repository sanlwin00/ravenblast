import { useState, useEffect } from 'react'
import { ipc } from '../lib/ipc'
import type { AccountType } from '../types'

interface Profile {
  id: string
  name: string
  type: AccountType
  username?: string
  senderEmail?: string
}

interface Props {
  value: string
  onChange: (id: string) => void
}

export default function SmtpSelector({ value, onChange }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    ipc.smtpList().then(list => setProfiles(list.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      username: p.username,
      senderEmail: p.senderEmail
    }))))
  }, [])

  function label(p: Profile): string {
    const email = p.type === 'brevo' ? p.senderEmail : p.username
    const tag = p.type === 'brevo' ? ' (Brevo API)' : ' (SMTP)'
    // Only prefix name if it's different from the email address
    if (p.name && p.name !== email) return `${p.name} — ${email ?? ''}${tag}`
    return `${email ?? ''}${tag}`
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-0.5">Send From</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800"
      >
        <option value="">Select email account...</option>
        {profiles.map(p => (
          <option key={p.id} value={p.id}>{label(p)}</option>
        ))}
      </select>
    </div>
  )
}
