import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import Composer from './pages/Composer'
import Settings from './pages/Settings'
import History from './pages/History'
import Summary from './pages/Summary'
import Templates from './pages/Templates'
import AIChat from './components/AIChat'
import { BlastStoreProvider } from './store/blastStore'

export default function App() {
  const [dark, setDark] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiTemplate, setAiTemplate] = useState<{ subject: string; body: string } | null>(null)

  function toggleDark() {
    setDark(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  function handleApplyTemplate(subject: string, body: string) {
    setAiTemplate({ subject, body })
    setAiOpen(false)
  }

  function handleRemoveRecipient(_email: string) {
    // TODO: wire up to Composer store when needed
  }

  return (
    <BlastStoreProvider>
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors`}>
        <TopNav dark={dark} onToggleDark={toggleDark} aiOpen={aiOpen} onToggleAI={() => setAiOpen(o => !o)} />
        <main className={`pt-14 transition-all ${aiOpen ? 'mr-80' : ''}`}>
          <Routes>
            <Route path="/" element={<Composer aiTemplate={aiTemplate} onAiTemplateApplied={() => setAiTemplate(null)} />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/summary" element={<Summary />} />
          </Routes>
        </main>
        <AIChat open={aiOpen} onClose={() => setAiOpen(false)} onApplyTemplate={handleApplyTemplate} onRemoveRecipient={handleRemoveRecipient} />
      </div>
    </BlastStoreProvider>
  )
}
