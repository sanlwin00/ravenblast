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

const AI_MIN_WIDTH = 280
const AI_DEFAULT_WIDTH = 320

export default function App() {
  const [dark, setDark] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiWidth, setAiWidth] = useState(AI_DEFAULT_WIDTH)
  const [aiTemplate, setAiTemplate] = useState<{ subject: string; body: string } | null>(null)
  const [composerCtx, setComposerCtx] = useState<{ subject: string; bodyHtml: string; recipientCount: number }>({ subject: '', bodyHtml: '', recipientCount: 0 })

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
        <main
          className="pt-14 transition-all"
          style={{ marginRight: aiOpen ? Math.max(AI_MIN_WIDTH, aiWidth) : 0 }}
        >
          <Routes>
            <Route path="/" element={<Composer aiTemplate={aiTemplate} onAiTemplateApplied={() => setAiTemplate(null)} onContextChange={setComposerCtx} />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/summary" element={<Summary />} />
          </Routes>
        </main>
        <AIChat
          open={aiOpen}
          width={aiWidth}
          onWidthChange={setAiWidth}
          onClose={() => setAiOpen(false)}
          onApplyTemplate={handleApplyTemplate}
          onRemoveRecipient={handleRemoveRecipient}
          composerCtx={composerCtx}
        />
      </div>
    </BlastStoreProvider>
  )
}
