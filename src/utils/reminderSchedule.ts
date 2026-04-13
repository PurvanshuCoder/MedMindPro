import type { Medicine } from '../services/medicine/MedicineProvider'

export type DaySlot = 'morning' | 'afternoon' | 'evening'

export function timeSlotFromHour(hour: number): DaySlot {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export function wallClockNow(timeZone: string): {
  time: string
  minutesTotal: number
  dateKey: string
} {
  const tz = timeZone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone
  try {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = dtf.formatToParts(new Date())
    const map: Record<string, string> = {}
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value
    }
    const h = Number(map.hour ?? 0)
    const m = Number(map.minute ?? 0)
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    const y = map.year ?? '1970'
    const mo = (map.month ?? '01').padStart(2, '0')
    const day = (map.day ?? '01').padStart(2, '0')
    return {
      time: `${hh}:${mm}`,
      minutesTotal: h * 60 + m,
      dateKey: `${y}-${mo}-${day}`,
    }
  } catch {
    const d = new Date()
    const h = d.getHours()
    const m = d.getMinutes()
    return {
      time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      minutesTotal: h * 60 + m,
      dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    }
  }
}

const MIN_PER_DAY = 24 * 60

function addDaysToDateKey(dateKey: string, delta: number): string {
  const [y, mo, d] = dateKey.split('-').map(Number)
  const day = new Date(Date.UTC(y, mo - 1, d))
  day.setUTCDate(day.getUTCDate() + delta)
  const yy = day.getUTCFullYear()
  const mm = String(day.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(day.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Same logic as server: current moment is exactly 5 minutes before scheduled dose. */
export function fiveMinutesBeforeDoseMatch(
  nowTimeHHmm: string,
  nowDateKey: string,
  scheduledHHmm: string,
): { match: boolean; doseDateKey: string } {
  const nm = parseTimeToMinutes(nowTimeHHmm)
  const tm = parseTimeToMinutes(scheduledHHmm)
  if (nm === null || tm === null) return { match: false, doseDateKey: nowDateKey }

  const total = nm + 5
  const doseMinuteOfDay = total % MIN_PER_DAY
  if (doseMinuteOfDay !== tm) return { match: false, doseDateKey: nowDateKey }

  const crossesMidnight = total >= MIN_PER_DAY
  const doseDateKey = crossesMidnight ? addDaysToDateKey(nowDateKey, 1) : nowDateKey
  return { match: true, doseDateKey }
}

export const EARLY_FIRED_KEY = 'smm_notif_fired_early'

export function wasEarlyFired(
  doseDateKey: string,
  medicineId: string,
  scheduledTime: string,
): boolean {
  const slot = `${doseDateKey}_${medicineId}_${scheduledTime}`
  try {
    const raw = localStorage.getItem(EARLY_FIRED_KEY)
    if (!raw) return false
    const data = JSON.parse(raw) as { slots: Record<string, boolean> }
    return Boolean(data.slots?.[slot])
  } catch {
    return false
  }
}

export function markEarlyFired(
  doseDateKey: string,
  medicineId: string,
  scheduledTime: string,
) {
  const slot = `${doseDateKey}_${medicineId}_${scheduledTime}`
  let slots: Record<string, boolean> = {}
  try {
    const raw = localStorage.getItem(EARLY_FIRED_KEY)
    if (raw) {
      const p = JSON.parse(raw) as { slots: Record<string, boolean> }
      if (p.slots) slots = { ...p.slots }
    }
  } catch {
    /* ignore */
  }
  slots[slot] = true
  const keys = Object.keys(slots)
  if (keys.length > 120) {
    for (const k of keys.slice(0, keys.length - 100)) delete slots[k]
  }
  localStorage.setItem(EARLY_FIRED_KEY, JSON.stringify({ slots }))
}

function parseTimeToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

export function buildTodaySchedule(medicines: Medicine[]) {
  const morning: string[] = []
  const afternoon: string[] = []
  const evening: string[] = []

  for (const med of medicines) {
    if (!med.reminders.enabled) continue
    for (const t of med.reminders.times) {
      const mins = parseTimeToMinutes(t)
      if (mins === null) continue
      const hour = Math.floor(mins / 60)
      const label = `${med.name} (${med.dosage})`
      const slot = timeSlotFromHour(hour)
      if (slot === 'morning') morning.push(`${label} · ${t}`)
      else if (slot === 'afternoon') afternoon.push(`${label} · ${t}`)
      else evening.push(`${label} · ${t}`)
    }
  }

  return { morning, afternoon, evening }
}

export function nextReminderToday(
  medicines: Medicine[],
  timeZone: string,
): { label: string; time: string; minutesUntil: number } | null {
  const { minutesTotal: nowM } = wallClockNow(timeZone)
  let best: { med: Medicine; time: string; mins: number; minutesUntil: number } | null = null

  for (const med of medicines) {
    if (!med.reminders.enabled) continue
    for (const t of med.reminders.times) {
      const mins = parseTimeToMinutes(t)
      if (mins === null) continue
      if (mins <= nowM) continue
      const until = mins - nowM
      if (!best || until < best.minutesUntil) {
        best = {
          med,
          time: t,
          mins,
          minutesUntil: until,
        }
      }
    }
  }

  if (!best) return null
  return {
    time: best.time,
    label: `${best.med.name} (${best.med.dosage})`,
    minutesUntil: best.minutesUntil,
  }
}

export const GLOBAL_SNOOZE_KEY = 'smm_global_snooze_until'
export const BROWSER_NOTIF_PREF_KEY = 'smm_browser_notif_enabled'
export const NOTIF_SOUND_PREF_KEY = 'smm_notif_sound_enabled'
export const FIRED_STORE_KEY = 'smm_notif_fired'

export function getGlobalSnoozeUntil(): number {
  try {
    const v = localStorage.getItem(GLOBAL_SNOOZE_KEY)
    if (!v) return 0
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export function setGlobalSnoozeMinutes(minutes: number) {
  const until = Date.now() + minutes * 60_000
  localStorage.setItem(GLOBAL_SNOOZE_KEY, String(until))
}

export function clearGlobalSnooze() {
  localStorage.removeItem(GLOBAL_SNOOZE_KEY)
}

type FiredStore = { date: string; slots: Record<string, boolean> }

function todayKey(timeZone: string): string {
  const tz = timeZone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone
  try {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = dtf.formatToParts(new Date())
    const map: Record<string, string> = {}
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value
    }
    return `${map.year}-${map.month}-${map.day}`
  } catch {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}

export function wasFiredToday(
  timeZone: string,
  medicineId: string,
  time: string,
): boolean {
  try {
    const raw = localStorage.getItem(FIRED_STORE_KEY)
    const date = todayKey(timeZone)
    if (!raw) return false
    const data = JSON.parse(raw) as FiredStore
    if (data.date !== date) return false
    return Boolean(data.slots?.[`${medicineId}_${time}`])
  } catch {
    return false
  }
}

export function markFiredToday(timeZone: string, medicineId: string, time: string) {
  const date = todayKey(timeZone)
  let store: FiredStore = { date, slots: {} }
  try {
    const raw = localStorage.getItem(FIRED_STORE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as FiredStore
      if (p.date === date && p.slots) store = { date, slots: { ...p.slots } }
    }
  } catch {
    /* ignore */
  }
  store.slots[`${medicineId}_${time}`] = true
  localStorage.setItem(FIRED_STORE_KEY, JSON.stringify(store))
}
