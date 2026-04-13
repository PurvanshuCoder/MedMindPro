import { useAuth } from '../../services/auth/AuthProvider'
import { useMedicine } from '../../services/medicine/MedicineProvider'
import { useBrowserMedicineReminders } from '../../hooks/useBrowserMedicineReminders'

/** Keeps browser reminders in sync when signed in and medicines are loaded. */
export function AuthenticatedReminderRunner() {
  const { user, ready } = useAuth()
  const { medicines, hydrated } = useMedicine()

  // Wall-clock match uses the device timezone so scheduled times align with `<input type="time">`.
  useBrowserMedicineReminders(medicines, {
    active: Boolean(ready && user && hydrated),
  })

  return null
}
