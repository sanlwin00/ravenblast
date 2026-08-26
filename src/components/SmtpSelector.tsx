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
      <label className="block text-sm font-medium mb-1">Send From</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800"
      >
        <option value="">Select email account...</option>
        {profiles.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  )
}
