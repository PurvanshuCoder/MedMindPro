import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { apiFetch } from '../../services/api'
import { useToast } from '../../components/toast/ToastProvider'

export function AISuggestionsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [status, setStatus] = useState<{
    configured: boolean
    provider: string | null
  } | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await apiFetch<{ configured: boolean; provider: string | null }>(
          '/api/ai/status',
          { method: 'GET' },
        )
        if (!cancelled) setStatus(s)
      } catch {
        if (!cancelled) setStatus({ configured: false, provider: null })
      } finally {
        if (!cancelled) setLoadingStatus(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function loadInsights() {
    if (loadingInsights) return
    setLoadingInsights(true)
    try {
      const res = await apiFetch<{ markdown: string; provider: string }>(
        '/api/ai/insights',
        { method: 'POST', body: {} },
      )
      setMarkdown(res.markdown || '')
      toast({
        type: 'success',
        title: 'Insights ready',
        message: `Generated with ${res.provider}.`,
      })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Could not generate insights',
        message: e instanceof Error ? e.message : 'Check API keys and try again.',
      })
    } finally {
      setLoadingInsights(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--mm-navy)] md:text-xl">
          AI adherence coach
        </h1>
        <p className="text-sm text-[var(--mm-muted)]">
          Production insights from your saved medications and reminder times — not
          a substitute for medical advice.
        </p>
      </div>

      <Card className="mm-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#e8f2fa] p-2.5 text-[var(--mm-primary)] ring-1 ring-[#bad2e9]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0f3a55]">
                Model status
              </div>
              <div className="mt-1 text-xs text-[#517e9f]">
                {loadingStatus ? (
                  'Checking configuration…'
                ) : status?.configured ? (
                  <>
                    Connected · provider:{' '}
                    <span className="font-semibold text-[#0a3147]">
                      {status.provider}
                    </span>
                  </>
                ) : (
                  'AI keys not configured on the server. Set GEMINI_API_KEY or OPENAI_API_KEY and AI_PROVIDER.'
                )}
              </div>
            </div>
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            onClick={loadInsights}
            disabled={loadingInsights || loadingStatus || !status?.configured}
            leftIcon={
              loadingInsights ? (
                <LoadingSpinner className="text-white" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )
            }
          >
            {loadingInsights ? 'Generating…' : 'Generate insights'}
          </Button>
        </div>
      </Card>

      <Card className="mm-panel p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0f3a55]">
          <AlertCircle className="h-4 w-4 text-[#2670a3]" />
          Disclaimer
        </div>
        <p className="text-xs leading-relaxed text-[#2a4b68]">
          AI output is for education and organization only. Always follow your
          clinician&apos;s instructions and confirm medication changes with a
          licensed professional.
        </p>
      </Card>

      <Card className="mm-panel overflow-hidden p-0">
        <div className="border-b border-[#e0edf5] bg-[#f6fafd] px-4 py-3 text-sm font-semibold text-[#0f3a55]">
          Personalized plan
        </div>
        <div className="max-h-[min(70vh,32rem)] overflow-auto p-4 sm:p-5">
          {markdown ? (
            <div className="prose prose-sm max-w-none text-[#2a4b68] prose-headings:text-[#0f3a55] prose-li:marker:text-[#2670a3]">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {markdown}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-[#517e9f]">
              Add medications on the dashboard, then tap &quot;Generate insights&quot;
              to analyze schedules and adherence tips.
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button className="w-full" onClick={() => navigate('/dashboard')}>
          Back to medicines
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => navigate('/reminders')}
        >
          Reminder settings
        </Button>
      </div>
    </div>
  )
}
