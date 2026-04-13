import { NavLink } from 'react-router-dom'
import { Bell, Pill, Sparkles, Upload } from 'lucide-react'

type Item = {
  to: string
  label: string
  icon: React.ReactNode
}

const items: Item[] = [
  { to: '/dashboard', label: 'Meds', icon: <Pill className="h-5 w-5" /> },
  { to: '/upload', label: 'Upload', icon: <Upload className="h-5 w-5" /> },
  {
    to: '/ai-suggestions',
    label: 'AI',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    to: '/reminders',
    label: 'Alerts',
    icon: <Bell className="h-5 w-5" />,
  },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dbeafe] bg-white/95 backdrop-blur-md md:hidden">
      <div
        className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-1 py-2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 transition-all duration-200 active:scale-[0.98]',
                'text-[0.65rem] font-semibold leading-tight sm:text-xs',
                isActive
                  ? 'text-[var(--mm-primary)]'
                  : 'text-[#4b6f8b] hover:bg-[#f0f7ff]',
              ].join(' ')
            }
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
