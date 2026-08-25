import { createContext, useContext, useState, ReactNode } from 'react'
import type { Contact, BlastProgress, BlastSummary } from '../types'

interface BlastStore {
  contacts: Contact[]
  setContacts: (c: Contact[]) => void
  summary: BlastSummary | null
  setSummary: (s: BlastSummary | null) => void
  progress: BlastProgress | null
  setProgress: (p: BlastProgress | null) => void
}

const BlastStoreContext = createContext<BlastStore | null>(null)

export function BlastStoreProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [summary, setSummary] = useState<BlastSummary | null>(null)
  const [progress, setProgress] = useState<BlastProgress | null>(null)

  return (
    <BlastStoreContext.Provider value={{ contacts, setContacts, summary, setSummary, progress, setProgress }}>
      {children}
    </BlastStoreContext.Provider>
  )
}

export function useBlastStore(): BlastStore {
  const ctx = useContext(BlastStoreContext)
  if (!ctx) throw new Error('useBlastStore must be used within BlastStoreProvider')
  return ctx
}
