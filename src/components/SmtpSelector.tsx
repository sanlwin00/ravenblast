import { useState, useEffect } from 'react'
import { ipc } from '../lib/ipc'

interface Profile {
  id: string
  name: string
}

interface Props {
  value: string
  onChange: (id: string) => void
}

export default function SmtpSelector({ value, onChange }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    ipc.smtpList().then(list => setProfiles(list.map(p => ({ id: p.id, name: p.name }))))
  }, [])

  return (
    <div>
      <label className="block text-sm font-medium mb-1">SMTP Profile</label>
      <div className="flex gap-2 items-end">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800"
        >
          <option value="">Select SMTP profile...</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {profiles.length === 0 && (
          <a href="#/settings" className="text-sm text-[#0078D4] hover:underline whitespace-nowrap pb-2">
            Add profile
          </a>
        )}
      </div>
    </div>
  )
}
