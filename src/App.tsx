import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import Composer from './pages/Composer'
import Settings from './pages/Settings'
import History from './pages/History'
import Summary from './pages/Summary'
import { BlastStoreProvider } from './store/blastStore'

export default function App() {
  const [dark, setDark] = useState(false)

  function toggleDark() {
    setDark(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  return (
    <BlastStoreProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <TopNav dark={dark} onToggleDark={toggleDark} />
        <main className="pt-14">
          <Routes>
            <Route path="/" element={<Composer />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/summary" element={<Summary />} />
          </Routes>
        </main>
      </div>
    </BlastStoreProvider>
  )
}
