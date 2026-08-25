import { NavLink } from 'react-router-dom'

interface Props {
  dark: boolean
  onToggleDark: () => void
}

const navLinks = [
  { to: '/', label: 'Compose', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/settings', label: 'Settings', end: false }
]

export default function TopNav({ dark, onToggleDark }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0078D4] text-white flex items-center px-4 shadow-md z-40">
      <span className="font-bold text-lg tracking-tight mr-8 select-none">RavenBlast</span>
      <nav className="flex gap-1 flex-1">
        {navLinks.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `min-h-[44px] px-4 flex items-center rounded text-sm font-medium transition-colors ${
                isActive ? 'bg-white/25' : 'hover:bg-white/15'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={onToggleDark}
        className="min-h-[44px] w-11 flex items-center justify-center rounded hover:bg-white/15 transition-colors text-lg"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Light mode' : 'Dark mode'}
      >
        {dark ? '☀' : '☽'}
      </button>
    </header>
  )
}
