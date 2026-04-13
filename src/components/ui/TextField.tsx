import { type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
}

export function TextField({
  label,
  hint,
  className,
  id,
  ...props
}: Props) {
  const inputId = id ?? props.name
  return (
    <div className={cn('space-y-1', className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[#1e4d6f]"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className="mm-input w-full placeholder:text-[#94a3b8]"
        {...props}
      />
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
    </div>
  )
}

