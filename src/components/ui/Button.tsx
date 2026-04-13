import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  leftIcon?: ReactNode
}

export function Button({
  className,
  variant = 'primary',
  leftIcon,
  type = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-[var(--mm-primary)] text-white shadow-[0_8px_18px_rgba(27,95,137,0.25)] hover:bg-[var(--mm-primary-hover)] active:bg-[var(--mm-primary-hover)]',
    secondary:
      'bg-[#e5ecf3] text-[#103e5c] hover:bg-[#d8e4ee] active:bg-[#ccd9e6]',
    ghost:
      'bg-transparent text-[var(--mm-primary)] hover:bg-[#e3f0fa] active:bg-[#d4e8f5]',
  }

  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {leftIcon}
      {props.children}
    </button>
  )
}

