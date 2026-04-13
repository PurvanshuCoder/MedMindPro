import { type ChangeEvent } from 'react'
import { cn } from '../../utils/cn'

export function ToggleSwitch({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label?: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
  disabled?: boolean
}) {
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    onCheckedChange(e.target.checked)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {label ? (
        <div className="text-sm font-semibold text-[#1e4d6f]">{label}</div>
      ) : (
        <div />
      )}
      <label className="relative inline-flex h-7 w-12 cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span
          className={cn(
            'h-7 w-12 rounded-full bg-[#e2eaf2] shadow-sm transition-all duration-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[rgba(27,95,137,0.25)]',
            checked ? 'bg-[var(--mm-primary)]' : '',
            disabled ? 'opacity-60 cursor-not-allowed' : '',
          )}
        />
        <span
          className={cn(
            'absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </label>
    </div>
  )
}

