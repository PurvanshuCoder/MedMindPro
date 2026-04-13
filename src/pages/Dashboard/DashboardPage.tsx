import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, Trash2, Upload } from 'lucide-react'
import { useMedicine } from '../../services/medicine/MedicineProvider'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { Medicine } from '../../services/medicine/MedicineProvider'

function formatMedicineSubtitle(m: Medicine) {
  const reminder =
    m.reminders.enabled && m.reminders.times.length
      ? `Reminders: ${m.reminders.times.join(', ')}`
      : 'Reminders off'
  return `${m.dosage} · ${m.frequency} · ${reminder}`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { medicines, deleteMedicine, hydrated } = useMedicine()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sorted = useMemo(
    () => medicines.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [medicines],
  )

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--mm-navy)] md:text-xl">
          Your medications
        </h1>
        <p className="text-sm text-[var(--mm-muted)]">
          Scan labels, enrich with AI, and keep doses on schedule.
        </p>
      </div>

      <Button
        className="w-full sm:w-auto"
        leftIcon={<Upload className="h-5 w-5" />}
        onClick={() => navigate('/upload')}
      >
        Add medicine
      </Button>

      {sorted.length === 0 ? (
        <EmptyState
          title="No medications yet"
          icon={<Pill className="h-10 w-10 text-[var(--mm-primary)]" />}
          className="mm-panel ring-0"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {sorted.map((m) => (
            <div key={m.id} className="mm-med-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill className="h-5 w-5 shrink-0 text-[var(--mm-primary)]" />
                    <div className="min-w-0">
                      <div className="text-base font-bold text-[#0f172a]">
                        {m.name}
                      </div>
                      <span className="mt-1 inline-block rounded-full bg-[#d3e5f5] px-3 py-0.5 text-xs font-semibold text-[#103e5c]">
                        {m.dosage}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#2a4b68] sm:text-sm">
                    <span>{m.frequency}</span>
                  </div>
                  <div className="mt-2 text-xs text-[#517e9f] sm:text-sm">
                    {formatMedicineSubtitle(m)}
                  </div>

                  {m.instructions ? (
                    <div className="mt-3 rounded-2xl bg-white/80 p-3 text-xs text-[#2a4b68] ring-1 ring-[#bad2e9]/60 sm:text-sm">
                      {m.instructions}
                    </div>
                  ) : null}

                  {m.sideEffects ? (
                    <div className="mt-2 rounded-2xl bg-amber-50/90 p-3 text-xs text-amber-900 ring-1 ring-amber-100">
                      <span className="font-semibold">Side effects:</span>{' '}
                      {m.sideEffects}
                    </div>
                  ) : null}

                  {m.precautions ? (
                    <div className="mt-2 rounded-2xl bg-red-50/90 p-3 text-xs text-red-900 ring-1 ring-red-100">
                      <span className="font-semibold">Precautions:</span>{' '}
                      {m.precautions}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingId(m.id)
                      void deleteMedicine(m.id).finally(() => {
                        setDeletingId((prev) => (prev === m.id ? null : prev))
                      })
                    }}
                    className="inline-flex items-center justify-center rounded-full p-2 text-[#b22222] transition-colors hover:bg-red-50 disabled:opacity-60"
                    disabled={deletingId === m.id}
                    aria-label="Delete medicine"
                  >
                    {deletingId === m.id ? (
                      <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>

                  {m.imageUrl ? (
                    <img
                      src={m.imageUrl}
                      alt={`${m.name} thumbnail`}
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[#b5d0e4]"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
