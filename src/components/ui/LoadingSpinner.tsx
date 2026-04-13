import { cn } from '../../utils/cn'

export function LoadingSpinner({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-[#b5d0e4] border-t-[var(--mm-primary)]"
        aria-hidden
      />
    </div>
  )
}

