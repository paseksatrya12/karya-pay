import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { useToast } from '../components/Toast.jsx'
import { useData } from '../store/DataProvider.jsx'
import { formatRupiah, initials } from '../format.js'

const LOGO_URL = '/images/logo.png'
const PROFILE_URL = '/images/photo-01.jpg'

const badgeStyles = {
  vip: 'bg-primary-fixed text-on-primary-fixed font-bold tracking-wide',
  prospek: 'bg-secondary-container text-on-secondary-fixed font-bold tracking-wide',
  neutral: 'bg-surface-container-high text-on-surface-variant font-semibold',
}

const filters = [
  { key: 'all', label: 'Semua' },
  { key: 'aktif', label: 'Klien Aktif' },
  { key: 'vip', label: '⭐ Klien VIP' },
  { key: 'prospek', label: 'Prospek' },
]

const categoryOptions = {
  'Klien Aktif': { categories: ['aktif'], badge: 'KLIEN AKTIF', badgeStyle: 'neutral' },
  'Klien VIP': { categories: ['vip', 'aktif'], badge: 'KLIEN VIP', badgeStyle: 'vip' },
  'Prospek Baru': { categories: ['prospek'], badge: 'PROSPEK BARU', badgeStyle: 'prospek' },
  'UMKM / Personal': { categories: ['aktif'], badge: 'UMKM / PERSONAL', badgeStyle: 'neutral' },
}

const emptyForm = { name: '', pic: '', picRole: '', phone: '', category: 'Klien Aktif', email: '', address: '' }

const NEW_SUMMARY = { kind: 'new', note: 'Belum ada invoice' }

const inputClass = 'w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary'
const labelClass = 'block font-label-md text-label-md text-on-surface font-semibold mb-1'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const toWaNumber = (phone) => phone.replace(/\D/g, '').replace(/^0/, '62')

// Kategori form untuk klien yang sudah ada (badge kustom dari data contoh dipetakan lewat kategorinya)
function categoryOf(client) {
  const byBadge = Object.keys(categoryOptions).find((key) => categoryOptions[key].badge === client.badge)
  if (byBadge) return byBadge
  const cats = client.categories || []
  if (cats.includes('vip')) return 'Klien VIP'
  if (cats.includes('prospek')) return 'Prospek Baru'
  return 'Klien Aktif'
}

function formFromClient(client) {
  if (!client) return emptyForm
  return {
    name: client.name || '',
    pic: client.pic || '',
    picRole: client.picRole || '',
    phone: client.phone || '',
    category: categoryOf(client),
    email: client.email || '',
    address: client.address || '',
  }
}

function ClientSummary({ summary }) {
  if (summary.kind === 'billing' || summary.kind === 'paid') {
    return (
      <div className="grid grid-cols-2 gap-space-xs mb-3.5 p-space-sm rounded-lg bg-surface-container-low">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Total Transaksi</span>
          <span className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">{formatRupiah(summary.total)}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">{summary.totalNote}</span>
        </div>
        {summary.kind === 'billing' ? (
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Tagihan Berjalan</span>
            <span className="font-label-lg text-label-lg text-primary font-bold mt-0.5">{formatRupiah(summary.running)}</span>
            <span className="font-body-sm text-body-sm text-secondary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {summary.runningNote}
            </span>
          </div>
        ) : (
          <div className="flex flex-col justify-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Status Tagihan</span>
            <div className="flex items-center gap-1 mt-1 text-secondary font-semibold font-label-md text-label-md">
              <Icon name="check_circle" fill className="text-[16px]" />
              <span>Semua Lunas</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Nol saldo tertunda</span>
          </div>
        )}
      </div>
    )
  }

  if (summary.kind === 'quote') {
    return (
      <div className="mb-3.5 p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Penawaran Menunggu Konfirmasi</span>
          <span className="font-label-lg text-label-lg text-primary font-bold mt-0.5">{formatRupiah(summary.amount)}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">{summary.note}</span>
        </div>
        <div className="h-9 w-9 rounded-full bg-secondary-fixed-dim/40 flex items-center justify-center text-secondary flex-shrink-0">
          <Icon name="hourglass_top" className="text-[20px]" />
        </div>
      </div>
    )
  }

  if (summary.kind === 'overdue') {
    return (
      <div className="mb-3.5 p-space-sm rounded-lg bg-error-container/30 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-error font-bold font-label-sm text-label-sm">
            <Icon name="warning" fill className="text-[15px]" />
            <span>TAGIHAN JATUH TEMPO</span>
          </div>
          <span className="font-currency-card text-currency-card text-error font-extrabold mt-0.5">{formatRupiah(summary.amount)}</span>
          <span className="font-body-sm text-body-sm text-on-error-container">{summary.note}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center flex-shrink-0 shadow-sm">
          <Icon name="priority_high" className="text-[20px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="mb-3.5 p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">Total Transaksi</span>
        <span className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">{formatRupiah(0)}</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{summary.note}</span>
      </div>
      <div className="h-9 w-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
        <Icon name="person_add" className="text-[20px]" />
      </div>
    </div>
  )
}

function ClientCard({ client, onOpen, onCreateDocument, onNoPhone }) {
  const summary = client.summary || NEW_SUMMARY
  const categories = client.categories || []
  const overdue = summary.kind === 'overdue'
  const isProspect = categories.includes('prospek')
  const waText = client.waText || `Halo ${client.pic} dari ${client.name}`
  const waHref = client.phone ? `https://wa.me/${toWaNumber(client.phone)}?text=${encodeURIComponent(waText)}` : undefined
  const guardPhone = (e) => {
    e.stopPropagation()
    if (!client.phone) {
      e.preventDefault()
      onNoPhone()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ubah data ${client.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen()
        }
      }}
      className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-200 relative overflow-hidden cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {client.decor === 'vip' && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-bl-full pointer-events-none" />
      )}
      {client.decor === 'overdue' && (
        <div className="absolute -right-6 -top-6 w-20 h-20 bg-error-container/40 rounded-full blur-xl pointer-events-none" />
      )}
      <div className="flex items-start justify-between gap-space-sm mb-3">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="relative w-12 h-12 rounded-xl bg-surface-container-highest overflow-hidden flex-shrink-0 flex items-center justify-center">
            {client.image ? (
              <img className="w-full h-full object-cover" alt={client.alt || client.name} src={client.image} />
            ) : (
              <span className="font-label-lg text-label-lg text-primary font-bold">{initials(client.name) || '?'}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{client.name}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              PIC: {client.pic}
              {client.picRole ? ` (${client.picRole})` : ''}
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm flex-shrink-0 ${badgeStyles[client.badgeStyle] || badgeStyles.neutral}`}>
          {client.badge}
        </span>
      </div>

      <ClientSummary summary={summary} />

      <div className="flex items-center gap-2 pt-1">
        <a
          className={`flex-1 h-11 rounded-xl font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm ${
            overdue ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'
          }`}
          href={waHref}
          target="_blank"
          rel="noreferrer"
          onClick={guardPhone}
        >
          <Icon name={overdue ? 'notifications_active' : 'chat'} className="text-[18px]" />
          <span>{overdue ? 'Kirim Pengingat WA' : 'WhatsApp'}</span>
        </a>
        <a
          aria-label={`Telepon ${client.pic}`}
          className="w-11 h-11 bg-surface-container-high text-on-surface rounded-xl flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
          href={client.phone ? `tel:${client.phone}` : undefined}
          onClick={guardPhone}
        >
          <Icon name="call" className="text-[20px]" />
        </a>
        {!overdue && (
          <button
            className="flex-1 h-11 bg-primary text-on-primary rounded-xl font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onCreateDocument(isProspect)
            }}
          >
            <Icon name={isProspect ? 'request_quote' : 'receipt_long'} className="text-[18px]" />
            <span>{isProspect ? 'Buat Penawaran' : 'Buat Invoice'}</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Lembar tambah / ubah klien
function ClientSheet({ client, onClose, onSave, onDelete }) {
  const editing = Boolean(client)
  const [form, setForm] = useState(() => formFromClient(client))
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.pic.trim()) {
      setError('Nama perusahaan dan nama PIC wajib diisi.')
      return
    }
    if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
      setError('Format email tagihan tidak valid.')
      return
    }
    onSave(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center transition-opacity"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        className="w-full sm:max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-space-lg shadow-2xl flex flex-col max-h-[90%] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-sheet-title"
        onSubmit={submit}
        noValidate
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex flex-col">
            <span id="client-sheet-title" className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {editing ? 'Ubah Data Klien' : 'Tambah Klien Baru'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {editing ? 'Perubahan dipakai pada invoice & penawaran berikutnya' : 'Lengkapi info profil pembayaran klien'}
            </span>
          </div>
          <button
            aria-label="Tutup"
            className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center"
            type="button"
            onClick={onClose}
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 mt-2">
          <div>
            <label className={labelClass} htmlFor="client-name">Nama Perusahaan / Bisnis</label>
            <input id="client-name" className={inputClass} placeholder="Contoh: PT Kreasi Solusi Bangsa" type="text" value={form.name} onChange={update('name')} autoFocus={!editing} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor="client-pic">Nama PIC</label>
              <input id="client-pic" className={inputClass} placeholder="Contoh: Rian Hidayat" type="text" value={form.pic} onChange={update('pic')} />
            </div>
            <div>
              <label className={labelClass} htmlFor="client-pic-role">Jabatan PIC</label>
              <input id="client-pic-role" className={inputClass} placeholder="Opsional" type="text" value={form.picRole} onChange={update('picRole')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor="client-phone">No. WhatsApp</label>
              <input id="client-phone" className={inputClass} placeholder="0812xxxxxxx" type="tel" inputMode="tel" value={form.phone} onChange={update('phone')} />
            </div>
            <div>
              <label className={labelClass} htmlFor="client-category">Kategori</label>
              <select
                id="client-category"
                className="w-full h-11 px-3 bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none"
                value={form.category}
                onChange={update('category')}
              >
                {Object.keys(categoryOptions).map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="client-email">Email Tagihan</label>
            <input
              id="client-email"
              className={inputClass}
              placeholder="billing@perusahaan.com"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={update('email')}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="client-address">Alamat</label>
            <textarea
              id="client-address"
              className="w-full px-3.5 py-2.5 bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Alamat penagihan, dicetak pada invoice"
              rows={3}
              value={form.address}
              onChange={update('address')}
            />
          </div>
          {error && (
            <p className="font-body-sm text-body-sm text-error flex items-center gap-1" role="alert">
              <Icon name="error" className="text-[16px]" />
              {error}
            </p>
          )}
          <button
            className="mt-3 w-full h-12 bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            type="submit"
          >
            <Icon name="check" className="text-[20px]" />
            <span>{editing ? 'Simpan Perubahan' : 'Simpan Profil Klien'}</span>
          </button>

          {/* Hapus klien */}
          {editing &&
            (confirmDelete ? (
              <div className="p-space-sm rounded-xl bg-error-container/30 flex flex-col gap-2" role="alert">
                <p className="font-body-sm text-body-sm text-on-error-container">
                  Hapus <span className="font-semibold">{client.name}</span> dari daftar klien? Dokumen yang sudah dibuat tidak ikut terhapus.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="h-10 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md active:scale-95 transition-all"
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="h-10 rounded-xl bg-error text-on-error font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    type="button"
                    onClick={onDelete}
                  >
                    <Icon name="delete" className="text-[18px]" />
                    <span>Ya, Hapus</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="w-full h-11 text-error font-label-md text-label-md rounded-xl flex items-center justify-center gap-1.5 hover:bg-error-container/20 active:scale-95 transition-all"
                type="button"
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="delete" className="text-[18px]" />
                <span>Hapus Klien</span>
              </button>
            ))}
        </div>
      </form>
    </div>
  )
}

export default function Clients() {
  const navigate = useNavigate()
  const [toast, showToast] = useToast()
  const searchRef = useRef(null)
  const { clients, saveClient, deleteClient } = useData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  // null = tertutup, 'new' = tambah, objek klien = ubah
  const [sheet, setSheet] = useState(null)

  const counts = Object.fromEntries(
    filters.map((f) => [f.key, clients.filter((c) => f.key === 'all' || (c.categories || []).includes(f.key)).length]),
  )
  const overdueClient = clients.find((c) => c.summary?.kind === 'overdue')

  const q = query.toLowerCase().trim()
  const visibleClients = clients.filter((c) => {
    const matchesCategory = filter === 'all' || (c.categories || []).includes(filter)
    const matchesQuery = q === '' || `${c.name} ${c.pic} ${c.email || ''}`.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

  const clearSearch = () => {
    setQuery('')
    searchRef.current?.focus()
  }

  const resetFilters = () => {
    setQuery('')
    setFilter('all')
  }

  const handleSave = (form) => {
    const existing = sheet === 'new' ? null : sheet
    const name = form.name.trim()
    const pic = form.pic.trim()
    const fields = {
      name,
      pic,
      picRole: form.picRole.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    }

    if (existing) {
      // Badge kustom dipertahankan selama kategori tidak diganti
      const categoryChanged = form.category !== categoryOf(existing)
      const option = categoryOptions[form.category]
      const renamed = name !== existing.name || pic !== existing.pic
      saveClient({
        ...existing,
        ...fields,
        ...(categoryChanged ? { categories: option.categories, badge: option.badge, badgeStyle: option.badgeStyle } : {}),
        ...(renamed || !existing.waText ? { waText: `Halo ${pic} dari ${name}` } : {}),
      })
      showToast('Data klien berhasil diperbarui!', 'verified')
    } else {
      const option = categoryOptions[form.category]
      saveClient({
        ...fields,
        categories: option.categories,
        badge: option.badge,
        badgeStyle: option.badgeStyle,
        waText: `Halo ${pic} dari ${name}`,
        summary: NEW_SUMMARY,
      })
      resetFilters()
      showToast('Klien baru berhasil ditambahkan!', 'verified')
    }
    setSheet(null)
  }

  const handleDelete = () => {
    if (!sheet || sheet === 'new') return
    deleteClient(sheet.id)
    showToast(`${sheet.name} dihapus dari daftar klien`, 'delete')
    setSheet(null)
  }

  const createDocument = (client, quote) => {
    const id = encodeURIComponent(client.id)
    navigate(quote ? `/invoice/baru?type=penawaran&client=${id}` : `/invoice/baru?client=${id}`)
  }

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-full">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(11,28,48,0.04)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img alt="KaryaPay Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold">KaryaPay</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none hidden">Klien</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Notifikasi"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary relative transition-colors"
              type="button"
              onClick={() =>
                showToast(
                  overdueClient ? `${overdueClient.name} memiliki tagihan jatuh tempo` : 'Tidak ada tagihan jatuh tempo',
                  'notifications',
                )
              }
            >
              <Icon name="notifications" className="text-[24px]" />
              {overdueClient && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface" />}
            </button>
            <Link to="/pengaturan/tanda-tangan" aria-label="Profil" className="w-11 h-11 flex items-center justify-center">
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={PROFILE_URL} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full">
          {/* Title */}
          <div className="px-margin pt-space-md pb-space-xs flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">Klien Saya</h1>
              <div className="flex items-center gap-space-xs mt-0.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="font-label-md text-label-md text-on-surface-variant font-semibold">{counts.aktif} Klien Aktif</span>
                <span className="font-body-sm text-body-sm text-outline-variant">•</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{counts.all} terdaftar</span>
              </div>
            </div>
            <button
              className="h-10 px-space-md bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              type="button"
              onClick={() => setSheet('new')}
            >
              <Icon name="person_add" className="text-[18px]" />
              <span>+ Klien</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="px-margin mt-space-sm flex flex-col gap-space-sm">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <Icon name="search" className="text-[20px]" />
              </div>
              <input
                ref={searchRef}
                className="w-full h-12 pl-10 pr-10 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:shadow-md transition-all placeholder:text-outline"
                placeholder="Cari nama klien, PIC, atau perusahaan..."
                type="text"
                aria-label="Cari klien"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query.length > 0 && (
                <button
                  aria-label="Hapus pencarian"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface"
                  type="button"
                  onClick={clearSearch}
                >
                  <Icon name="cancel" className="text-[18px]" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-margin px-margin no-scrollbar">
              {filters.map((f) => {
                const active = filter === f.key
                return (
                  <button
                    key={f.key}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all ${
                      active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                    }`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label} ({counts[f.key]})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Client List */}
          {visibleClients.length > 0 ? (
            <div className="px-margin mt-space-md flex flex-col gap-space-md pb-6">
              {visibleClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onOpen={() => setSheet(client)}
                  onCreateDocument={(quote) => createDocument(client, quote)}
                  onNoPhone={() => showToast(`Nomor WhatsApp ${client.pic} belum diisi`, 'info')}
                />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="px-margin py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-space-sm">
                <Icon name="group_add" className="text-[32px]" />
              </div>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Belum Ada Klien</span>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-1">
                Tambahkan klien pertama Anda agar data penagihan otomatis terisi di invoice.
              </p>
              <button
                className="mt-4 px-space-md py-2 bg-surface-container-high text-primary font-label-md text-label-md rounded-xl active:scale-95 transition-all"
                type="button"
                onClick={() => setSheet('new')}
              >
                + Tambah Klien
              </button>
            </div>
          ) : (
            <div className="px-margin py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-space-sm">
                <Icon name="person_search" className="text-[32px]" />
              </div>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Klien Tidak Ditemukan</span>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-1">
                Coba gunakan kata kunci lain atau periksa filter kategori yang Anda pilih.
              </p>
              <button
                className="mt-4 px-space-md py-2 bg-surface-container-high text-primary font-label-md text-label-md rounded-xl active:scale-95 transition-all"
                type="button"
                onClick={resetFilters}
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <div className="fixed bottom-20 right-margin z-40 pb-safe pointer-events-auto">
        <Link
          className="flex items-center gap-space-xs h-12 pl-space-md pr-space-lg rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_8px_24px_-4px_rgba(30,64,175,0.38)] active:scale-95 transition-all duration-150"
          to="/invoice/baru"
        >
          <Icon name="add" className="text-[22px]" />
          <span>Buat Dokumen</span>
        </Link>
      </div>

      <BottomNav />

      {sheet && (
        <ClientSheet
          key={sheet === 'new' ? 'new' : sheet.id}
          client={sheet === 'new' ? null : sheet}
          onClose={() => setSheet(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
      {toast}
    </div>
  )
}
