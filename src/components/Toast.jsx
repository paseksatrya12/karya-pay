import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'

// Notifikasi singkat, pengganti toast yang dibuat manual lewat DOM di file desain.
// Pemakaian: const [toast, showToast] = useToast(); ... {toast} di JSX; showToast('Pesan', 'icon')
export function useToast(duration = 2200) {
  const [toast, setToast] = useState(null)
  const timer = useRef()

  const show = useCallback(
    (message, icon = 'check_circle') => {
      clearTimeout(timer.current)
      setToast({ message, icon, key: Date.now() })
      timer.current = setTimeout(() => setToast(null), duration)
    },
    [duration],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  const node = toast ? (
    <div
      key={toast.key}
      role="status"
      className="fixed top-4 left-4 right-4 z-[60] flex items-center gap-2 rounded-xl bg-inverse-surface px-4 py-3 text-inverse-on-surface shadow-xl animate-toast-in"
    >
      <Icon name={toast.icon} className="text-[20px] text-secondary-fixed" />
      <span className="font-body-sm text-body-sm">{toast.message}</span>
    </div>
  ) : null

  return [node, show]
}
