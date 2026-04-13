import { useEffect, useRef } from 'react'
import type { Medicine } from '../services/medicine/MedicineProvider'
import {
  BROWSER_NOTIF_PREF_KEY,
  NOTIF_SOUND_PREF_KEY,
  getGlobalSnoozeUntil,
  markFiredToday,
  wallClockNow,
  wasFiredToday,
} from '../utils/reminderSchedule'

function readBool(key: string, defaultTrue: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return defaultTrue
    return v === '1' || v === 'true'
  } catch {
    return defaultTrue
  }
}

function playSoftChime() {
  if (!readBool(NOTIF_SOUND_PREF_KEY, false)) return
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    g.gain.value = 0.08
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    setTimeout(() => {
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      o.stop(ctx.currentTime + 0.3)
      ctx.close().catch(() => undefined)
    }, 200)
  } catch {
    /* ignore */
  }
}

/**
 * Fires system notifications when the wall clock matches an enabled reminder (browser timezone).
 * Dedupes per medicine+time per day; respects global snooze and user pref flag.
 */
export function useBrowserMedicineReminders(
  medicines: Medicine[],
  options: { active: boolean; timeZone?: string },
) {
  const medicinesRef = useRef(medicines)
  medicinesRef.current = medicines

  const tz =
    options.timeZone?.trim() ||
    Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    if (!options.active) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const tick = () => {
      if (!readBool(BROWSER_NOTIF_PREF_KEY, true)) return
      if (Notification.permission !== 'granted') return

      const until = getGlobalSnoozeUntil()
      if (until > Date.now()) return

      const { time } = wallClockNow(tz)
      const list = medicinesRef.current

      for (const med of list) {
        if (!med.reminders.enabled) continue
        if (!med.reminders.times.includes(time)) continue
        if (wasFiredToday(tz, med.id, time)) continue

        markFiredToday(tz, med.id, time)
        playSoftChime()

        const body = `Time to take ${med.name} (${med.dosage}).${med.instructions ? ` ${med.instructions}` : ''}`

        try {
          new Notification('MedMind · Time to take your dose', {
            body,
            tag: `smm-${med.id}-${time}`,
            requireInteraction: false,
          })
        } catch {
          /* ignore */
        }
      }
    }

    const id = window.setInterval(tick, 30_000)
    tick()
    return () => window.clearInterval(id)
  }, [options.active, tz])
}
