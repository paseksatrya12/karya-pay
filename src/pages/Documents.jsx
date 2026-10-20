import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import BottomNav from '../components/BottomNav.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import DocumentCard, { byNewest, reminderText, waLink } from '../components/DocumentCard.jsx'
import { useToast } from '../components/Toast.jsx'
import { useData } from '../store/DataProvider.jsx'
import { DOC_STATUS, documentTotals } from '../store/documents.js'
import { formatRupiah } from '../format.js'

const LOGO_URL = '/images/logo.png'
const PROFILE_URL = '/images/photo-01.jpg'

const typeTabs = [
  { key: 'all', label: 'Semua' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'quote', label: 'Penawaran' },
]

const statusOrder = ['draft', 'sent', 'paid', 'overdue', 'accepted', 'rejected']

const createOptions = [
  {
    to: '/invoice/baru',
    icon: 'receipt_long',
    title: 'Invoice Tagihan',
    note: 'Tagih klien atas pekerjaan & sparepart',
    iconClass: 'bg-primary-container text-on-primary',
  },
  {
    to: '/invoice/baru?type=penawaran',
    icon: 'request_quote',
    title: 'Surat Penawaran',
    note: 'Kirim estimasi harga sebelum proyek dimulai',
    iconClass: 'bg-secondary-container text-on-secondary-fixed-variant',
  },
]

export default function Documents() {
  const navigate = useNavigate()
  const [toast, showToast] = useToast()
  const searchRef = useRef(null)
  const { documents, findClient } = useData()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const q = query.toLowerCase().trim()

  // Filter tipe & pencarian dulu, status dihitung dari hasil itu
  const baseDocs = useMemo(
    () =>
      documents.filter((d) => {
        if (type !== 'all' && d.type !== type) return false
        if (!q) return true
        const client = findClient(d.clientId)
        return `${d.id} ${client?.name || ''} ${d.subject || ''}`.toLowerCase().includes(q)
      }),
    [documents, type, q, findClient],
  )

  const statusChips = useMemo(() => {
    const counts = baseDocs.reduce((acc, d) => ({ ...acc, [d.status]: (acc[d.status] || 0) + 1 }), {})
    return [
      { key: 'all', label: 'Semua', count: baseDocs.length },
      ...statusOrder.filter((s) => counts[s]).map((s) => ({ key: s, label: DOC_STATUS[s].label, count: counts[s] })),
    ]
  }, [baseDocs])

  const activeStatus = statusChips.some((c) => c.key === status) ? status : 'all'
  const visibleDocs = useMemo(
    () => baseDocs.filter((d) => activeStatus === 'all' || d.status === activeStatus).sort(byNewest),
    [baseDocs, activeStatus],
  )

  const totalValue = visibleDocs.reduce((sum, d) => sum + documentTotals(d).total, 0)
  const unpaidCount = visibleDocs.filter((d) => d.type === 'invoice' && ['sent', 'overdue'].includes(d.status)).length
  const overdueCount = documents.filter((d) => d.status === 'overdue').length
  const filtered = q !== '' || type !== 'all' || activeStatus !== 'all'

  const resetFilters = () => {
    setQuery('')
    setType('all')
    setStatus('all')
  }

  const clearSearch = () => {
    setQuery('')
    searchRef.current?.focus()
  }

  const remind = (doc) => {
    const client = findClient(doc.clientId)
    if (!client?.phone) {
      showToast('Nomor WhatsApp klien belum diisi', 'info')
      return
    }
    window.open(waLink(client.phone, reminderText(doc, client)), '_blank', 'noopener')
    showToast(`Membuka WhatsApp untuk ${client.name}`, 'chat')
  }

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-full">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(11,28,48,0.04)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img alt="KaryaPay Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold">KaryaPay</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Notifikasi"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary relative transition-colors"
              type="button"
              onClick={() =>
                showToast(overdueCount ? `${overdueCount} invoice jatuh tempo perlu ditagih` : 'Tidak ada notifikasi baru', 'notifications')
              }
            >
              <Icon name="notifications" className="text-[24px]" />
              {overdueCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface" />}
            </button>
            <Link to="/pengaturan/template" aria-label="Profil" className="w-11 h-11 flex items-center justify-center">
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={PROFILE_URL} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        {/* Title */}
        <div className="px-margin pt-space-md pb-space-xs flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">Dokumen</h1>
            <div className="flex items-center gap-space-xs mt-0.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">{documents.length} Dokumen</span>
              <span className="font-body-sm text-body-sm text-outline-variant">•</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Invoice &amp; Penawaran</span>
            </div>
          </div>
          <button
            className="h-10 px-space-md bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <Icon name="add" className="text-[18px]" />
            <span>Buat</span>
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
              placeholder="Cari nomor, klien, atau perihal..."
              type="text"
              aria-label="Cari dokumen"
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

          <div className="flex gap-1.5 p-1 rounded-xl bg-surface-container-low self-start">
            {typeTabs.map((tab) => {
              const active = type === tab.key
              return (
                <button
                  key={tab.key}
                  className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                    active ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant font-medium'
                  }`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(tab.key)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-margin px-margin no-scrollbar">
            {statusChips.map((chip) => {
              const active = activeStatus === chip.key
              return (
                <button
                  key={chip.key}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all ${
                    active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                  }`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(chip.key)}
                >
                  {chip.label} ({chip.count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Summary strip */}
        <div className="px-margin mt-space-sm">
          <div className="grid grid-cols-2 gap-space-sm p-space-sm rounded-xl bg-surface-container-low">
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Total Nilai</span>
              <span className="font-label-lg text-label-lg text-primary font-bold mt-0.5 truncate">{formatRupiah(totalValue)}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{visibleDocs.length} dokumen</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Belum Lunas</span>
              <span className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">{unpaidCount} Invoice</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${unpaidCount ? 'bg-tertiary' : 'bg-secondary'}`} />
                {unpaidCount ? 'Perlu ditindaklanjuti' : 'Semua beres'}
              </span>
            </div>
          </div>
        </div>

        {/* Document list */}
        {visibleDocs.length > 0 ? (
          <div className="px-margin mt-space-md flex flex-col gap-space-sm pb-6">
            {visibleDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                client={findClient(doc.clientId)}
                onOpen={() => navigate(`/invoice/${doc.id}`)}
                onRemind={() => remind(doc)}
              />
            ))}
          </div>
        ) : (
          <div className="px-margin py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-space-sm">
              <Icon name={filtered ? 'search_off' : 'receipt_long'} className="text-[32px]" />
            </div>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {filtered ? 'Dokumen Tidak Ditemukan' : 'Belum Ada Dokumen'}
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-1">
              {filtered
                ? 'Coba kata kunci lain atau ubah filter jenis & status dokumen.'
                : 'Buat invoice atau surat penawaran pertama Anda untuk klien.'}
            </p>
            <div className="flex items-center gap-2 mt-4">
              {filtered && (
                <button
                  className="px-space-md py-2 bg-surface-container-high text-primary font-label-md text-label-md rounded-xl active:scale-95 transition-all"
                  type="button"
                  onClick={resetFilters}
                >
                  Reset Filter
                </button>
              )}
              <button
                className="px-space-md py-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-xl flex items-center gap-1 active:scale-95 transition-all"
                type="button"
                onClick={() => setCreateOpen(true)}
              >
                <Icon name="add" className="text-[18px]" />
                Buat Dokumen
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Pilih jenis dokumen baru */}
      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Dokumen Baru" subtitle="Pilih jenis dokumen yang ingin dibuat">
        <div className="flex flex-col gap-space-sm pt-1">
          {createOptions.map((opt) => (
            <button
              key={opt.to}
              className="w-full flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-low text-left active:scale-[0.99] active:bg-surface-container transition-all"
              type="button"
              onClick={() => navigate(opt.to)}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.iconClass}`}>
                <Icon name={opt.icon} className="text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-label-lg text-label-lg text-on-surface font-bold">{opt.title}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{opt.note}</span>
              </div>
              <Icon name="chevron_right" className="text-[22px] text-outline flex-shrink-0" />
            </button>
          ))}
        </div>
      </BottomSheet>
      {toast}
    </div>
  )
}
