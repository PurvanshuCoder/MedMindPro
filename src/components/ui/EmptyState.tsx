import { type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function EmptyState({
  icon,
  title,
  className,
}: {
  icon?: ReactNode
  title: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-blue-50',
        className,
      )}
    >
      {icon ? <div className="text-blue-700">{icon}</div> : null}
      <div className="text-sm font-semibold text-slate-700">{title}</div>
    </div>
  )
}

