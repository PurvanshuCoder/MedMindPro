import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextAreaField } from '../../components/ui/TextAreaField'
import { TextField } from '../../components/ui/TextField'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useMedicine } from '../../services/medicine/MedicineProvider'
import { useToast } from '../../components/toast/ToastProvider'
import { apiFetch } from '../../services/api'

export function ExtractedDataPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { draft, updateDraft, clearDraft, saveDraftAsMedicine } = useMedicine()
  const [saving, setSaving] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const [chatLoading, setChatLoading] = useState(false)

  async function onSave() {
    if (!draft) {
      toast({ type: 'error', title: 'Nothing to save', message: 'Upload first.' })
      navigate('/upload')
      return
    }
    if (saving) return

    setSaving(true)
    try {
      await saveDraftAsMedicine()
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  if (!draft) {
    return (
      <EmptyState
        title="No extracted data found"
        className="mt-4"
        icon={<ImageIcon className="h-10 w-10" />}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            clearDraft()
            navigate('/upload')
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-100 transition-all duration-200 hover:bg-blue-50 active:scale-[0.99]"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <div className="text-xs text-slate-500">
          Review and fine-tune the fields.
        </div>
      </div>

      {draft.imageDataUrl ? (
        <Card className="overflow-hidden p-0">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
              <ImageIcon className="h-6 w-6 text-blue-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900">
                Medicine image
              </div>
              <div className="mt-1 text-xs text-slate-600">
                This helps the AI extract details (demo).
              </div>
            </div>
          </div>
          <div className="overflow-hidden ring-1 ring-blue-50">
            <img
              src={draft.imageDataUrl}
              alt="Medicine preview"
              className="h-52 w-full object-cover"
            />
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label="Medicine name"
            name="name"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            placeholder="e.g., Amoxicillin"
          />
          <TextField
            label="Dosage"
            name="dosage"
            value={draft.dosage}
            onChange={(e) => updateDraft({ dosage: e.target.value })}
            placeholder="e.g., 500 mg"
          />
        </div>

        <TextField
          label="Frequency"
          name="frequency"
          value={draft.frequency}
          onChange={(e) => updateDraft({ frequency: e.target.value })}
          placeholder="e.g., 2 times daily"
        />

        <TextAreaField
          label="Instructions"
          hint="Add any notes you want (mealtime, course, etc.)."
          name="instructions"
          value={draft.instructions}
          onChange={(e) => updateDraft({ instructions: e.target.value })}
          placeholder="e.g., Take after food with a full glass of water."
          rows={5}
        />

        <TextAreaField
          label="Description"
          name="description"
          value={draft.description}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Brief description of medicine usage and context."
          rows={4}
        />

        <TextAreaField
          label="Side effects"
          name="sideEffects"
          value={draft.sideEffects}
          onChange={(e) => updateDraft({ sideEffects: e.target.value })}
          placeholder="Common side effects, e.g. nausea, dizziness..."
          rows={4}
        />

        <TextAreaField
          label="Precautions"
          name="precautions"
          value={draft.precautions}
          onChange={(e) => updateDraft({ precautions: e.target.value })}
          placeholder="Safety precautions, contraindications, interactions..."
          rows={4}
        />
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">AI Medical Profile</div>
          {draft.profileMarkdown ? (
            <div className="text-xs font-semibold text-blue-700">Generated</div>
          ) : (
            <div className="text-xs font-semibold text-slate-400">—</div>
          )}
        </div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-blue-50/60 p-3 text-xs text-slate-800 ring-1 ring-blue-100">
          {draft.profileMarkdown || 'Ask the AI to refine this profile.'}
        </pre>
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-800">
            Ask follow-up (Chat with AI)
          </div>

          <div className="rounded-xl bg-white p-3 ring-1 ring-blue-50">
            {chatMessages.length === 0 ? (
              <div className="text-xs text-slate-600">
                Example: “Write precautions for pregnant patients and common drug interactions.”
              </div>
            ) : (
              <div className="space-y-2">
                {chatMessages.slice(-6).map((m, idx) => (
                  <div
                    key={`${m.role}_${idx}`}
                    className={
                      m.role === 'user'
                        ? 'rounded-xl bg-blue-50/80 p-2 text-xs text-slate-800 ring-1 ring-blue-100'
                        : 'rounded-xl bg-slate-50 p-2 text-xs text-slate-700 ring-1 ring-blue-50'
                    }
                  >
                    {m.content}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-end gap-3">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              rows={2}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Type your question..."
            />

            <button
              type="button"
              onClick={async () => {
                const ocrText = draft.ocrText ?? ''
                if (!ocrText) {
                  toast({
                    type: 'error',
                    title: 'Missing OCR text',
                    message: 'Upload a medicine image again.',
                  })
                  return
                }
                if (!chatInput.trim()) return
                if (chatLoading) return

                const userMsg = chatInput.trim()
                setChatInput('')

                const nextMessages = [
                  ...chatMessages,
                  { role: 'user' as const, content: userMsg },
                ]

                setChatLoading(true)
                try {
                  const res = await apiFetch<{
                    updatedDraft: any
                    profileMarkdown: string
                    provider: string
                  }>('/api/ai/chat', {
                    method: 'POST',
                    body: {
                      ocrText,
                      currentDraft: {
                        name: draft.name,
                        dosage: draft.dosage,
                        frequency: draft.frequency,
                        instructions: draft.instructions,
                        description: draft.description,
                        sideEffects: draft.sideEffects,
                        precautions: draft.precautions,
                      },
                      messages: nextMessages,
                    },
                  })

                  setChatMessages([
                    ...nextMessages,
                    {
                      role: 'assistant',
                      content: res.profileMarkdown || 'AI response received.',
                    },
                  ])

                  updateDraft({
                    ...res.updatedDraft,
                    profileMarkdown: res.profileMarkdown,
                  })

                  toast({
                    type: 'success',
                    title: 'AI updated profile',
                    message: `Provider: ${res.provider}`,
                  })
                } catch (e) {
                  toast({
                    type: 'error',
                    title: 'AI chat failed',
                    message: e instanceof Error ? e.message : 'Try again.',
                  })
                } finally {
                  setChatLoading(false)
                }
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
              disabled={chatLoading || !chatInput.trim()}
              aria-label="Send question to AI"
            >
              {chatLoading ? (
                <LoadingSpinner className="text-white" />
              ) : (
                <span className="text-sm font-semibold">Send</span>
              )}
            </button>
          </div>
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-blue-50 bg-white/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto w-full max-w-2xl md:pb-0">
          <Button
            className="w-full"
            onClick={onSave}
            disabled={saving}
            leftIcon={
              saving ? <LoadingSpinner className="text-white" /> : undefined
            }
          >
            {saving ? 'Saving…' : 'Save Medicine'}
          </Button>
        </div>
      </div>
    </div>
  )
}

