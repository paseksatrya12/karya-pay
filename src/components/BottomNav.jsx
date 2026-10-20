import { NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'

const items = [
  { to: '/', icon: 'dashboard', label: 'Beranda', match: (p) => p === '/' },
  { to: '/dokumen', icon: 'receipt_long', label: 'Dokumen', match: (p) => p.startsWith('/dokumen') || p.startsWith('/invoice') },
  { to: '/klien', icon: 'group', label: 'Klien', match: (p) => p.startsWith('/klien') },
  { to: '/pengaturan/tanda-tangan', icon: 'settings', label: 'Pengaturan', match: (p) => p.startsWith('/pengaturan') || p.startsWith('/master') },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(11,28,48,0.06)]">
      <div className="flex justify-around items-center h-16 px-space-xs">
        {items.map((item) => {
          const active = item.match(pathname)
          return (
            <NavLink
              key={item.label}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 transition-colors ${
                active ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              <Icon name={item.icon} fill={active} className="text-[24px]" />
              <span className="font-label-sm text-label-sm">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
