import { useEffect } from 'react'
import Icon from './Icon.jsx'

// Lembar bawah (bottom sheet) bergaya desain KaryaPay. `footer` menempel di bawah isi yang bisa di-scroll.
export default function BottomSheet({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-end bg-on-background/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-h-[90%] flex flex-col bg-surface-container-lowest rounded-t-3xl shadow-2xl animate-toast-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-margin pt-3 pb-2 flex-shrink-0">
          <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-3" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
              {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>}
            </div>
            <button
              aria-label="Tutup"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0 active:scale-95"
              onClick={onClose}
              type="button"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-margin pb-4">{children}</div>
        {footer && <div className="flex-shrink-0 px-margin pt-3 pb-4 pb-safe border-t border-surface-container">{footer}</div>}
      </div>
    </div>
  )
}
