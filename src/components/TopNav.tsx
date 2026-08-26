import { Link, useLocation } from 'react-router-dom'

interface Props {
  dark: boolean
  onToggleDark: () => void
  aiOpen: boolean
  onToggleAI: () => void
}

export default function TopNav({ dark, onToggleDark, aiOpen, onToggleAI }: Props) {
  const loc = useLocation()
  const active = (path: string) =>
    loc.pathname === path
      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors'

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-1 z-50">
      <span className="font-bold text-lg text-blue-600 mr-4">RavenBlast</span>

      <Link to="/" className={`h-14 flex items-center gap-1.5 px-3 text-sm ${active('/')}`}>📝 Compose</Link>
      <Link to="/templates" className={`h-14 flex items-center gap-1.5 px-3 text-sm ${active('/templates')}`}>📄 Templates</Link>
      <Link to="/history" className={`h-14 flex items-center gap-1.5 px-3 text-sm ${active('/history')}`}>📋 History</Link>
      <Link to="/settings" className={`h-14 flex items-center gap-1.5 px-3 text-sm ${active('/settings')}`}>⚙️ Settings</Link>

      <div className="ml-auto flex items-center gap-2">
        <button onClick={onToggleAI}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${aiOpen ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          🤖 AI Assistant
        </button>
        <button onClick={onToggleDark}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-lg transition-colors"
          title="Toggle dark mode">
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}
