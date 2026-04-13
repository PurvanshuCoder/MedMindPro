import React, { createContext, useContext, useMemo, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

type ToastType = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  type: ToastType
  title: string
  message?: string
  durationMs?: number
}

type ToastContextValue = {
  toast: (t: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function makeToastId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: (t) => {
        const id = makeToastId()
        const durationMs = t.durationMs ?? 3000

        const next: Toast = {
          id,
          durationMs,
          type: t.type,
          title: t.title,
          message: t.message,
        }

        setToasts((prev) => [next, ...prev].slice(0, 4))

        const timerId = window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== id))
          timers.current.delete(id)
        }, durationMs)

        timers.current.set(id, timerId)
      },
    }),
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 p-3 sm:top-auto sm:bottom-4 sm:left-auto sm:right-4 sm:w-auto sm:p-0">
        <div className="mx-auto flex max-w-lg flex-col gap-3 sm:mx-0 sm:max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto rounded-full bg-[#1d4e72] px-5 py-3 text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all duration-200 sm:rounded-[2.5rem]',
                t.type === 'success'
                  ? 'bg-[#155e3d]'
                  : t.type === 'error'
                    ? 'bg-[#7f1d1d]'
                    : '',
              )}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {t.title}
                  </div>
                  {t.message ? (
                    <div className="mt-0.5 text-xs text-white/85">
                      {t.message}
                    </div>
                  ) : null}
                </div>
                <div
                  className={cn(
                    'mt-1 h-2 w-2 shrink-0 rounded-full bg-white/50',
                    t.type === 'success' ? 'bg-emerald-200' : '',
                    t.type === 'error' ? 'bg-red-200' : '',
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}

