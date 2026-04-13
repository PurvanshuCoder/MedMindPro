import { type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-[2rem] bg-white shadow-[var(--mm-panel-shadow)] ring-1 ring-[#e3eef7]/80',
        className,
      )}
    >
      {children}
    </div>
  )
}

