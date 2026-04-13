import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'

export function AppLayout({
  children,
  stickyTopNav = false,
}: {
  children: ReactNode
  stickyTopNav?: boolean
}) {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--mm-bg)' }}>
      <TopNav sticky={stickyTopNav} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 sm:px-5 md:px-6 md:pb-8 lg:px-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

