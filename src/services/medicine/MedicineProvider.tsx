import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useToast } from '../../components/toast/ToastProvider'
import { apiFetch } from '../api'

export type ReminderSettings = {
  enabled: boolean
  times: string[]
}

export type ExtractedMedicineDraft = {
  name: string
  dosage: string
  frequency: string
  instructions: string
  description: string
  sideEffects: string
  precautions: string
  ocrText?: string
  profileMarkdown?: string
  imageDataUrl?: string
  imageUrl?: string
}

export type Medicine = {
  id: string
  name: string
  dosage: string
  frequency: string
  instructions: string
  description: string
  sideEffects: string
  precautions: string
  imageUrl?: string
  reminders: ReminderSettings
}

type MedicineContextValue = {
  medicines: Medicine[]
  draft: ExtractedMedicineDraft | null
  hydrated: boolean
  createDraft: (next: ExtractedMedicineDraft) => void
  updateDraft: (patch: Partial<ExtractedMedicineDraft>) => void
  clearDraft: () => void
  saveDraftAsMedicine: () => Promise<void>
  deleteMedicine: (id: string) => Promise<void>
  updateMedicineReminders: (id: string, reminders: ReminderSettings) => Promise<void>
}

const MedicineContext = createContext<MedicineContextValue | null>(null)

export function MedicineProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [draft, setDraft] = useState<ExtractedMedicineDraft | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiFetch<{ medicines: Array<any> }>('/api/medicines', {
          method: 'GET',
        })
        const mapped: Medicine[] = (res.medicines ?? []).map((m) => ({
          id: m._id ?? m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          instructions: m.instructions,
          description: m.description ?? '',
          sideEffects: m.sideEffects ?? '',
          precautions: m.precautions ?? '',
          imageUrl: m.imageUrl,
          reminders: m.reminders,
        }))
        setMedicines(mapped)
      } catch {
        setMedicines([])
      } finally {
        setHydrated(true)
      }
    })()
  }, [])

  async function refreshMedicines() {
    const res = await apiFetch<{ medicines: Array<any> }>('/api/medicines', {
      method: 'GET',
    })
    const mapped: Medicine[] = (res.medicines ?? []).map((m) => ({
      id: m._id ?? m.id,
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      instructions: m.instructions,
      description: m.description ?? '',
      sideEffects: m.sideEffects ?? '',
      precautions: m.precautions ?? '',
      imageUrl: m.imageUrl,
      reminders: m.reminders,
    }))
    setMedicines(mapped)
  }

  const value = useMemo<MedicineContextValue>(
    () => ({
      medicines,
      draft,
      hydrated,
      createDraft: (next) => {
        setDraft(next)
      },
      updateDraft: (patch) => {
        setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
      },
      clearDraft: () => setDraft(null),
      saveDraftAsMedicine: async () => {
        if (!draft) return
        await apiFetch('/api/medicines', {
          method: 'POST',
          body: {
            name: draft.name.trim() || 'Medicine',
            dosage: draft.dosage.trim() || '—',
            frequency: draft.frequency.trim() || 'Once daily',
            instructions: draft.instructions.trim() || '',
            description: draft.description.trim() || '',
            sideEffects: draft.sideEffects.trim() || '',
            precautions: draft.precautions.trim() || '',
            imageUrl: draft.imageUrl ?? '',
            reminders: { enabled: true, times: ['08:00'] },
          },
        }).then(async () => {
          toast({
            type: 'success',
            title: 'Medicine added',
            message: 'You can update reminders anytime.',
          })
          setDraft(null)
          await refreshMedicines()
        })
      },
      deleteMedicine: async (id) => {
        await apiFetch(`/api/medicines/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        }).then(async () => {
          toast({ type: 'info', title: 'Removed', message: 'Medicine deleted.' })
          await refreshMedicines()
        })
      },
      updateMedicineReminders: async (id, reminders) => {
        await apiFetch(`/api/medicines/${encodeURIComponent(id)}/reminders`, {
          method: 'PATCH',
          body: reminders,
        }).then(async () => {
          toast({ type: 'success', title: 'Saved', message: 'Reminders updated.' })
          await refreshMedicines()
        })
      },
    }),
    [draft, medicines, hydrated, toast],
  )

  return <MedicineContext.Provider value={value}>{children}</MedicineContext.Provider>
}

export function useMedicine() {
  const ctx = useContext(MedicineContext)
  if (!ctx) throw new Error('useMedicine must be used within MedicineProvider')
  return ctx
}

