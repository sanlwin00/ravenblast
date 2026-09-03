import { useState, KeyboardEvent, useRef } from 'react'

interface Props {
  label: string
  values: string[]
  onChange: (values: string[]) => void
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function RecipientChipInput({ label, values, onChange }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addEmail(raw: string) {
    const email = raw.trim().toLowerCase()
    if (!email) return
    if (!isValidEmail(email)) return
    if (!values.includes(email)) {
      onChange([...values, email])
    }
    setInput('')
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (input.trim()) {
        e.preventDefault()
        addEmail(input)
      }
    } else if (e.key === 'Backspace' && input === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  function remove(email: string) {
    onChange(values.filter(v => v !== email))
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div
        className="min-h-[48px] border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 flex flex-wrap gap-1 items-center cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {values.map(email => (
          <span key={email} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded px-2 py-0.5 text-sm">
            {email}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(email) }}
              className="hover:text-red-600 transition-colors leading-none"
              aria-label={`Remove ${email}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addEmail(input)}
          className="flex-1 outline-none bg-transparent text-sm min-w-[140px] py-0.5"
          placeholder={values.length === 0 ? 'Type email then press Enter, Tab, or comma' : ''}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">Press Enter, Tab, or comma to add · Backspace to remove last</p>
    </div>
  )
}
