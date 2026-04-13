import { type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
}

export function TextAreaField({
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
          className="text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        {...props}
      />
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
    </div>
  )
}

