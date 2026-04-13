import { NavLink } from 'react-router-dom'
import { Bell, Pill, Sparkles, Upload, UserCircle2 } from 'lucide-react'
import { useAuth } from '../../services/auth/AuthProvider'
import { useMedicine } from '../../services/medicine/MedicineProvider'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

type Item = {
  to: string
  label: string
  icon: React.ReactNode
}

const items: Item[] = [
  { to: '/dashboard', label: 'Medicines', icon: <Pill className="h-5 w-5" /> },
  { to: '/upload', label: 'Upload', icon: <Upload className="h-5 w-5" /> },
  { to: '/ai-suggestions', label: 'AI', icon: <Sparkles className="h-5 w-5" /> },
  { to: '/reminders', label: 'Reminders', icon: <Bell className="h-5 w-5" /> },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || 'ME'
}

export function TopNav({ sticky = false }: { sticky?: boolean }) {
  const { user, logout } = useAuth()
  const { medicines, hydrated } = useMedicine()
  const activeMeds = medicines.filter((m) => m.reminders.enabled).length

  return (
    <header
      className={cn(
        'px-4 pb-3 pt-4 sm:px-5 md:px-6 lg:px-8',
        sticky ? 'sticky top-0 z-40' : '',
      )}
    >
      <div
        className={cn(
          'mm-header-bar mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8',
          sticky ? 'backdrop-blur-md bg-white/95' : '',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="hidden text-[var(--mm-primary)] sm:block">
            <Pill className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="mm-gradient-title text-xl font-bold leading-tight sm:text-2xl">
              MedMind Pro
            </h1>
            <p className="text-xs text-[var(--mm-muted)] sm:text-[0.85rem]">
              Neural label understanding · adaptive reminders
            </p>
          </div>
        </div>

        {user ? (
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <div className="flex min-w-0 items-center gap-3 rounded-full bg-[#f4f9ff] py-1.5 pl-2 pr-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white sm:h-12 sm:w-12 sm:text-base"
                style={{ background: '#1d4e72' }}
                aria-hidden
              >
                {initials(user.name)}
              </div>
              <div className="min-w-0 text-sm">
                <div className="truncate font-semibold text-[#1f4662]">
                  {user.name}
                </div>
                <div className="truncate text-xs text-[#4f6f8f]">
                  {hydrated ? (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <Pill className="h-3 w-3 text-[#3080b5]" />
                        {activeMeds} active med{activeMeds !== 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    '…'
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="shrink-0 rounded-full px-3 py-2 text-[var(--mm-primary)] hover:bg-[#e3f0fa]"
              leftIcon={<UserCircle2 className="h-5 w-5" />}
              onClick={logout}
            >
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        ) : null}
      </div>

      {user ? (
        <nav className="mx-auto mt-3 hidden max-w-7xl md:block">
          <div className="mm-header-bar flex flex-wrap items-center justify-center gap-1 px-2 py-2 sm:gap-2 sm:px-4">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex min-w-[6rem] flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors sm:min-w-0 sm:text-sm',
                    isActive
                      ? 'bg-[#e1effa] text-[#0a3147]'
                      : 'text-[#4b6f8b] hover:bg-[#f0f7ff]',
                  ].join(' ')
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
