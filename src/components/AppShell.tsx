import { NavLink, Outlet } from 'react-router-dom'
import { Archive, Feather, Home, PenLine, Settings } from 'lucide-react'

const navItems = [
  { to: '/', label: 'home', icon: Home },
  { to: '/write', label: 'write', icon: PenLine },
  { to: '/notes', label: 'notes', icon: Feather },
  { to: '/archive', label: 'archive', icon: Archive },
  { to: '/settings', label: 'settings', icon: Settings },
]

export function AppShell() {
  return (
    <div className="min-h-screen px-5 py-5 sm:px-8 sm:py-7">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 border-b border-line pb-4">
        <NavLink to="/" className="text-lg font-semibold tracking-normal text-ink">
          think
        </NavLink>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  `inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm transition ${
                    isActive ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:bg-surface/70 hover:text-ink'
                  }`
                }
              >
                <Icon size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl py-8">
        <Outlet />
      </main>
    </div>
  )
}
