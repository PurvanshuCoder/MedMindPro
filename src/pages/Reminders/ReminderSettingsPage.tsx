import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CalendarDays,
  Clock,
  CloudSun,
  Moon,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextField } from '../../components/ui/TextField'
import { ToggleSwitch } from '../../components/ui/ToggleSwitch'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useMedicine } from '../../services/medicine/MedicineProvider'
import { useAuth } from '../../services/auth/AuthProvider'
import { useToast } from '../../components/toast/ToastProvider'
import {
  BROWSER_NOTIF_PREF_KEY,
  NOTIF_SOUND_PREF_KEY,
  buildTodaySchedule,
  clearGlobalSnooze,
  getGlobalSnoozeUntil,
  nextReminderToday,
  setGlobalSnoozeMinutes,
} from '../../utils/reminderSchedule'

function readBool(key: string, defaultVal: boolean) {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return defaultVal
    return v === '1' || v === 'true'
  } catch {
    return defaultVal
  }
}

function writeBool(key: string, val: boolean) {
  localStorage.setItem(key, val ? '1' : '0')
}

export function ReminderSettingsPage() {
  const toast = useToast()
  const { user } = useAuth()
  const { medicines, updateMedicineReminders, hydrated } = useMedicine()

  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  const [tab, setTab] = useState<'today' | 'medicines'>('today')
  const [perm, setPerm] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )
  const [browserEnabled, setBrowserEnabled] = useState(() =>
    readBool(BROWSER_NOTIF_PREF_KEY, true),
  )
  const [soundEnabled, setSoundEnabled] = useState(() =>
    readBool(NOTIF_SOUND_PREF_KEY, false),
  )
  const [snoozeUntil, setSnoozeUntil] = useState(() => getGlobalSnoozeUntil())
  const [, bump] = useState(0)

  const refreshSnooze = useCallback(() => {
    setSnoozeUntil(getGlobalSnoozeUntil())
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      bump((n) => n + 1)
      refreshSnooze()
    }, 10_000)
    return () => window.clearInterval(id)
  }, [refreshSnooze])

  const schedule = useMemo(() => buildTodaySchedule(medicines), [medicines])
  const next = useMemo(
    () => nextReminderToday(medicines, tz),
    [medicines, tz],
  )

  const [selectedId, setSelectedId] = useState<string>('')
  const selected = useMemo(
    () => medicines.find((m) => m.id === selectedId) ?? null,
    [medicines, selectedId],
  )

  const [enabled, setEnabled] = useState(false)
  const [times, setTimes] = useState<string[]>(['08:00'])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!selected) return
    setEnabled(selected.reminders.enabled)
    setTimes(
      selected.reminders.times.length ? selected.reminders.times : ['08:00'],
    )
  }, [selected])

  useEffect(() => {
    if (!selectedId && medicines.length) setSelectedId(medicines[0].id)
  }, [medicines, selectedId])

  function updateTimeAt(index: number, next: string) {
    setTimes((prev) => prev.map((t, i) => (i === index ? next : t)))
  }

  function removeTimeAt(index: number) {
    setTimes((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSave() {
    if (!selected) return
    if (saving) return
    setSaving(true)
    try {
      await updateMedicineReminders(selected.id, {
        enabled,
        times: times.filter(Boolean),
      })
    } finally {
      setSaving(false)
    }
  }

  async function requestPermission() {
    if (!('Notification' in window)) {
      toast({
        type: 'error',
        title: 'Not supported',
        message: 'This browser cannot show medication alerts.',
      })
      return
    }
    try {
      const r = await Notification.requestPermission()
      setPerm(r)
      if (r === 'granted') {
        toast({
          type: 'success',
          title: 'Notifications on',
          message: 'You will get alerts when a dose is due.',
        })
      } else if (r === 'denied') {
        toast({
          type: 'error',
          title: 'Blocked',
          message: 'Enable notifications in your browser settings for this site.',
        })
      }
    } catch {
      toast({
        type: 'error',
        title: 'Permission error',
        message: 'Could not request notification permission.',
      })
    }
  }

  function testNotification() {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') {
      toast({
        type: 'info',
        title: 'Permission needed',
        message: 'Allow notifications first, then try again.',
      })
      return
    }
    try {
      new Notification('MedMind · Test reminder', {
        body: 'Time to take your medication (demo).',
        tag: 'smm-test',
      })
      toast({ type: 'success', title: 'Sent', message: 'Check your system notification tray.' })
    } catch {
      toast({
        type: 'error',
        title: 'Failed',
        message: 'Could not display a test notification.',
      })
    }
  }

  const activeCount = medicines.filter((m) => m.reminders.enabled).length

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (medicines.length === 0) {
    return (
      <EmptyState
        title="No medications yet"
        icon={<Bell className="h-10 w-10 text-[var(--mm-primary)]" />}
      />
    )
  }

  const snoozeLeftMin =
    snoozeUntil > Date.now()
      ? Math.max(1, Math.ceil((snoozeUntil - Date.now()) / 60_000))
      : 0

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--mm-navy)] md:text-xl">
          Reminders & schedule
        </h1>
        <p className="text-sm text-[var(--mm-muted)]">
          Browser alerts for due doses, today&apos;s plan, and per-medication
          times. Email/WhatsApp still run from the server when configured.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#e3eef7] pb-1">
        <button
          type="button"
          onClick={() => setTab('today')}
          className={[
            'inline-flex items-center gap-2 rounded-t-3xl px-4 py-2.5 text-sm font-semibold transition-colors',
            tab === 'today'
              ? 'bg-[#e1effa] text-[#0a3147]'
              : 'text-[#4b6f8b] hover:bg-[#f0f7ff]',
          ].join(' ')}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          Today & alerts
        </button>
        <button
          type="button"
          onClick={() => setTab('medicines')}
          className={[
            'inline-flex items-center gap-2 rounded-t-3xl px-4 py-2.5 text-sm font-semibold transition-colors',
            tab === 'medicines'
              ? 'bg-[#e1effa] text-[#0a3147]'
              : 'text-[#4b6f8b] hover:bg-[#f0f7ff]',
          ].join(' ')}
        >
          <Bell className="h-4 w-4 shrink-0" />
          Per medication
        </button>
      </div>

      {tab === 'today' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="mm-panel p-5">
            <div className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--mm-navy)]">
              <Bell className="h-5 w-5 text-[var(--mm-primary)]" />
              Device notifications
            </div>
            <p className="mb-4 text-sm text-[var(--mm-muted)]">
              Shown when this app is open or in the background (OS settings
              apply). Matches times you set — same clock as your phone or
              computer.
            </p>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#d4e2f0] px-3 py-1 text-xs font-semibold text-[#103e5c]">
                Permission: {perm}
              </span>
              {activeCount > 0 ? (
                <span className="rounded-full bg-[#e8f2fa] px-3 py-1 text-xs font-semibold text-[#2670a3]">
                  {activeCount} med{activeCount !== 1 ? 's' : ''} with reminders
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {perm !== 'granted' ? (
                <Button className="w-full sm:w-auto" onClick={requestPermission}>
                  Allow notifications
                </Button>
              ) : null}
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={testNotification}
              >
                Test notification
              </Button>
            </div>
            <div className="mt-5 space-y-4 border-t border-[#e0edf5] pt-4">
              <ToggleSwitch
                label="Enable browser dose alerts"
                checked={browserEnabled}
                onCheckedChange={(v) => {
                  setBrowserEnabled(v)
                  writeBool(BROWSER_NOTIF_PREF_KEY, v)
                }}
              />
              <ToggleSwitch
                label="Soft chime when a dose is due"
                checked={soundEnabled}
                onCheckedChange={(v) => {
                  setSoundEnabled(v)
                  writeBool(NOTIF_SOUND_PREF_KEY, v)
                }}
              />
              <div className="flex items-start gap-2 rounded-2xl bg-[#f6fafd] p-3 text-xs text-[#2a4b68]">
                <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3080b5]" />
                Chime is short and respects the toggle above; mute is always
                available from your system volume.
              </div>
            </div>
          </Card>

          <Card className="mm-panel p-5">
            <div className="mb-4 text-base font-semibold text-[var(--mm-navy)]">
              Snooze (bonus)
            </div>
            <p className="mb-4 text-sm text-[var(--mm-muted)]">
              Pause all browser reminders briefly — useful in meetings or after
              you have already taken a dose.
            </p>
            {snoozeLeftMin > 0 ? (
              <div className="mb-4 rounded-2xl bg-[#e8f2fa] px-4 py-3 text-sm font-medium text-[#0f3a55]">
                Snoozed for about {snoozeLeftMin} more minute
                {snoozeLeftMin !== 1 ? 's' : ''}.
              </div>
            ) : (
              <div className="mb-4 rounded-2xl bg-[#f0f7ff] px-4 py-3 text-sm text-[#2a4b68]">
                No active snooze.
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                variant="secondary"
                className="w-full sm:flex-1"
                onClick={() => {
                  setGlobalSnoozeMinutes(10)
                  refreshSnooze()
                  toast({
                    type: 'success',
                    title: 'Snoozed',
                    message: 'Browser reminders paused for 10 minutes.',
                  })
                }}
              >
                Snooze 10 min
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:flex-1"
                onClick={() => {
                  setGlobalSnoozeMinutes(30)
                  refreshSnooze()
                  toast({
                    type: 'success',
                    title: 'Snoozed',
                    message: 'Browser reminders paused for 30 minutes.',
                  })
                }}
              >
                Snooze 30 min
              </Button>
              <Button
                variant="ghost"
                className="w-full sm:flex-1"
                onClick={() => {
                  clearGlobalSnooze()
                  refreshSnooze()
                  toast({ type: 'info', title: 'Cleared', message: 'Snooze removed.' })
                }}
              >
                Clear snooze
              </Button>
            </div>
          </Card>

          <Card className="mm-panel p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--mm-navy)]">
              <CalendarDays className="h-5 w-5 text-[var(--mm-primary)]" />
              Today&apos;s schedule
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] bg-[#f2f8ff] p-4 text-center text-sm text-[#2a4b68]">
                <Sun className="mx-auto mb-2 h-6 w-6 text-[#2670a3]" />
                <div className="font-semibold text-[#0f3a55]">Morning</div>
                <div className="mt-2 text-left text-xs leading-relaxed">
                  {schedule.morning.length
                    ? schedule.morning.map((line) => (
                        <div key={line} className="border-b border-[#dbeafe] py-1 last:border-0">
                          {line}
                        </div>
                      ))
                    : '— None —'}
                </div>
              </div>
              <div className="rounded-[1.25rem] bg-[#f2f8ff] p-4 text-center text-sm text-[#2a4b68]">
                <CloudSun className="mx-auto mb-2 h-6 w-6 text-[#2670a3]" />
                <div className="font-semibold text-[#0f3a55]">Afternoon</div>
                <div className="mt-2 text-left text-xs leading-relaxed">
                  {schedule.afternoon.length
                    ? schedule.afternoon.map((line) => (
                        <div key={line} className="border-b border-[#dbeafe] py-1 last:border-0">
                          {line}
                        </div>
                      ))
                    : '— None —'}
                </div>
              </div>
              <div className="rounded-[1.25rem] bg-[#f2f8ff] p-4 text-center text-sm text-[#2a4b68]">
                <Moon className="mx-auto mb-2 h-6 w-6 text-[#2670a3]" />
                <div className="font-semibold text-[#0f3a55]">Evening</div>
                <div className="mt-2 text-left text-xs leading-relaxed">
                  {schedule.evening.length
                    ? schedule.evening.map((line) => (
                        <div key={line} className="border-b border-[#dbeafe] py-1 last:border-0">
                          {line}
                        </div>
                      ))
                    : '— None —'}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[1.25rem] bg-[#e8f2fa] p-4 md:p-5">
              <div className="text-sm font-semibold text-[#0f3a55]">
                Next reminder today
              </div>
              <div className="mt-2 text-sm text-[#2a4b68]">
                {next ? (
                  <>
                    <span className="font-semibold text-[#0a3147]">
                      {next.label}
                    </span>{' '}
                    at {next.time} ({next.minutesUntil} min from now)
                  </>
                ) : (
                  'No more reminders scheduled for the rest of today.'
                )}
              </div>
              <div className="mt-2 text-xs text-[#517e9f]">
                Signed in as {user?.name ?? 'you'} · {tz}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="mm-panel p-4 md:p-5">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#1e4d6f]">
              Choose medication
            </label>
            <select
              className="mm-input w-full"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <TextField
              label="Name"
              name="medicine"
              value={selected?.name ?? ''}
              disabled
            />

            <ToggleSwitch
              label="Reminders enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e4d6f]">
                <Clock className="h-4 w-4 text-[var(--mm-primary)]" />
                Times (24h)
              </div>
              <div className="space-y-3">
                {times.map((t, idx) => (
                  <div
                    key={`${t}_${idx}`}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <div className="flex-1">
                      <input
                        type="time"
                        value={t}
                        onChange={(e) => updateTimeAt(idx, e.target.value)}
                        className="mm-input w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTimeAt(idx)}
                      className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#bad2e9] text-[#b22222] transition-colors hover:bg-red-50 sm:w-11"
                      aria-label="Remove time"
                      disabled={times.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                className="w-full sm:flex-1"
                variant="secondary"
                onClick={() =>
                  setTimes((prev) =>
                    prev.length >= 4 ? prev : [...prev, '12:00'],
                  )
                }
                disabled={times.length >= 4}
              >
                Add time
              </Button>
              <Button
                className="w-full sm:flex-1"
                onClick={onSave}
                disabled={saving || !selected}
                leftIcon={
                  saving ? <LoadingSpinner className="text-white" /> : undefined
                }
              >
                {saving ? 'Saving…' : 'Save to server'}
              </Button>
            </div>

          </div>
        </Card>
      )}
    </div>
  )
}
