import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { useToast } from '../components/Toast.jsx'
import DocumentCard, { byNewest, reminderText, waLink } from '../components/DocumentCard.jsx'
import { useData } from '../store/DataProvider.jsx'
import { formatRupiah } from '../format.js'

const LOGO_URL = '/images/logo.png'
const PROFILE_URL = '/images/photo-01.jpg'
const BANNER_URL = '/images/photo-06.jpg'
const TESTIMONIAL_URL = '/images/photo-07.jpg'

const periods = [
  { label: 'Okt 2024', income: 28450000, trend: '+14% bln lalu', unpaid: 8700000, unpaidCount: 3, overdue: 2500000, overdueCount: 1 },
  { label: 'Sep 2024', income: 24950000, trend: '+6% bln lalu', unpaid: 6200000, unpaidCount: 2, overdue: 1500000, overdueCount: 1 },
  { label: 'Agu 2024', income: 23500000, trend: '+9% bln lalu', unpaid: 4800000, unpaidCount: 2, overdue: 0, overdueCount: 0 },
  { label: 'Jul 2024', income: 21560000, trend: '+3% bln lalu', unpaid: 3500000, unpaidCount: 1, overdue: 0, overdueCount: 0 },
  { label: 'Jun 2024', income: 20930000, trend: '+11% bln lalu', unpaid: 5100000, unpaidCount: 2, overdue: 750000, overdueCount: 1 },
  { label: 'Mei 2024', income: 18850000, trend: '+4% bln lalu', unpaid: 2900000, unpaidCount: 1, overdue: 0, overdueCount: 0 },
]

const tabs = [
  { key: 'all', label: 'Semua' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'quote', label: 'Penawaran' },
]

function QuickAction({ icon, label, iconClass, onClick }) {
  return (
    <button
      className="flex flex-col items-center justify-center min-w-[84px] h-[92px] p-2.5 rounded-xl bg-surface-container-lowest shadow-sm active:scale-95 transition-all flex-shrink-0 group"
      type="button"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform ${iconClass}`}>
        <Icon name={icon} className="text-[20px]" />
      </div>
      <span className="font-label-sm text-label-sm text-on-surface mt-2 text-center font-semibold leading-tight">{label}</span>
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [toast, showToast] = useToast()
  const [filter, setFilter] = useState('all')
  const [period, setPeriod] = useState(periods[0])
  const [pickerOpen, setPickerOpen] = useState(false)

  const { documents, findClient } = useData()

  const visibleDocs = useMemo(
    () => documents.filter((d) => filter === 'all' || d.type === filter).sort(byNewest).slice(0, 5),
    [documents, filter],
  )

  const remind = (doc) => {
    const client = findClient(doc.clientId)
    if (!client?.phone) {
      showToast('Nomor WhatsApp klien belum diisi', 'info')
      return
    }
    window.open(waLink(client.phone, reminderText(doc, client)), '_blank', 'noopener')
    showToast(`Membuka WhatsApp untuk ${client.name}`, 'chat')
  }

  const selectPeriod = (p) => {
    setPeriod(p)
    setPickerOpen(false)
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
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none hidden">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Notifikasi"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary relative transition-colors"
              type="button"
              onClick={() => showToast('1 invoice jatuh tempo perlu ditagih', 'notifications')}
            >
              <Icon name="notifications" className="text-[24px]" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface" />
            </button>
            <Link to="/pengaturan/template" aria-label="Profil" className="w-11 h-11 flex items-center justify-center">
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={PROFILE_URL} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full px-margin gap-space-lg">
          {/* Salutation & Period Selector */}
          <section className="flex flex-col gap-space-sm pt-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Halo, Sarah Putri 👋</h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">Freelance UI/UX &amp; Web Developer</p>
              </div>
              <div className="relative">
                <button
                  aria-label="Pilih Periode"
                  aria-expanded={pickerOpen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-label-md text-label-md shadow-sm active:scale-95 transition-transform"
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                >
                  <Icon name="calendar_month" className="text-[16px] text-primary" />
                  <span>{period.label}</span>
                  <Icon name={pickerOpen ? 'expand_less' : 'expand_more'} className="text-[16px] text-on-surface-variant" />
                </button>
                {pickerOpen && (
                  <>
                    <button
                      aria-label="Tutup pilihan periode"
                      className="fixed inset-0 z-30 cursor-default"
                      type="button"
                      onClick={() => setPickerOpen(false)}
                    />
                    <ul className="absolute right-0 top-full mt-2 z-40 w-40 py-1 rounded-xl bg-surface-container-lowest shadow-lg" role="listbox">
                      {periods.map((p) => {
                        const active = p.label === period.label
                        return (
                          <li key={p.label}>
                            <button
                              role="option"
                              aria-selected={active}
                              className={`w-full flex items-center justify-between px-3.5 py-2 font-label-md text-label-md transition-colors hover:bg-surface-container-low ${
                                active ? 'text-primary font-bold' : 'text-on-surface'
                              }`}
                              type="button"
                              onClick={() => selectPeriod(p)}
                            >
                              <span>{p.label}</span>
                              {active && <Icon name="check" className="text-[16px]" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Summary Finance Stack */}
          <section className="flex flex-col gap-space-sm">
            <div className="w-full p-5 rounded-xl bg-primary text-on-primary shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-8 -bottom-10 w-36 h-36 rounded-full bg-primary-container/40 blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="font-label-md text-label-md text-primary-fixed uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
                  Total Pemasukan
                </span>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed/20 text-secondary-fixed font-label-sm text-label-sm font-semibold">
                  <Icon name="trending_up" className="text-[14px]" />
                  {period.trend}
                </span>
              </div>
              <div className="mt-3 z-10">
                <p className="font-currency-display text-currency-display font-extrabold tracking-tight">{formatRupiah(period.income)}</p>
                <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-0.5">Berhasil dicairkan ke Rekening BCA</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Belum Dibayar</span>
                  <span className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="hourglass_top" className="text-[16px]" />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="font-currency-card text-currency-card text-on-surface">{formatRupiah(period.unpaid)}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-label-sm text-primary mt-1 font-semibold">
                    {period.unpaidCount} Invoice aktif
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-tertiary-container uppercase font-semibold">Jatuh Tempo</span>
                  <span className="w-7 h-7 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <Icon name="warning" className="text-[16px]" />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="font-currency-card text-currency-card text-tertiary">{formatRupiah(period.overdue)}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-label-sm text-tertiary-container mt-1 font-semibold">
                    {period.overdueCount} Perlu tindakan
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions Carousel */}
          <section className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-label-lg text-label-lg text-on-surface font-bold tracking-tight">Aksi Cepat</h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant">6 Pintasan</span>
            </div>
            <div className="flex gap-space-sm overflow-x-auto pb-1 pt-1 -mx-margin px-margin no-scrollbar">
              <QuickAction
                icon="post_add"
                label="Buat Invoice"
                iconClass="bg-primary-container text-on-primary shadow-sm"
                onClick={() => navigate('/invoice/baru')}
              />
              <QuickAction
                icon="request_quote"
                label="Penawaran"
                iconClass="bg-surface-container text-primary"
                onClick={() => navigate('/invoice/baru?type=penawaran')}
              />
              <QuickAction
                icon="person_add"
                label="Klien Baru"
                iconClass="bg-surface-container text-secondary"
                onClick={() => navigate('/klien')}
              />
              <QuickAction
                icon="handyman"
                label="Master Jasa"
                iconClass="bg-primary-fixed text-primary"
                onClick={() => navigate('/master/jasa')}
              />
              <QuickAction
                icon="inventory_2"
                label="Item & Sparepart"
                iconClass="bg-tertiary-fixed text-tertiary"
                onClick={() => navigate('/master/item')}
              />
              <QuickAction
                icon="qr_code_scanner"
                label="Scan QRIS"
                iconClass="bg-secondary-container text-on-secondary-fixed-variant"
                onClick={() => showToast('Kamera QRIS belum tersedia di versi web', 'qr_code_scanner')}
              />
            </div>
          </section>

          {/* Client Showcase Banner */}
          <section
            className="p-4 rounded-xl bg-surface-container-low shadow-sm flex items-center justify-between gap-space-sm relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
            role="button"
            tabIndex={0}
            onClick={() => showToast('Pengingat otomatis WhatsApp diaktifkan', 'verified')}
            onKeyDown={(e) => e.key === 'Enter' && showToast('Pengingat otomatis WhatsApp diaktifkan', 'verified')}
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                alt="Modern creative office workspace with laptop displaying financial invoice metrics, warm natural lighting, minimalist aesthetic with indoor plants"
                src={BANNER_URL}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">KaryaPay Proteksi</span>
                <p className="font-headline-sm text-headline-sm text-on-surface truncate">Koleksi Pembayaran Otomatis</p>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Kirim pengingat ramah via WhatsApp</span>
              </div>
            </div>
            <Icon name="arrow_forward" className="text-primary text-[24px] flex-shrink-0" />
          </section>

          {/* Recent Document Activity */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Aktivitas Dokumen</h2>
              <Link className="font-label-md text-label-md text-primary font-bold" to="/dokumen">Lihat Semua</Link>
            </div>
            <div className="flex gap-1.5 p-1 rounded-xl bg-surface-container-low self-start">
              {tabs.map((tab) => {
                const active = filter === tab.key
                return (
                  <button
                    key={tab.key}
                    className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                      active ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant font-medium'
                    }`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(tab.key)}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col gap-space-sm mt-1">
              {visibleDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  client={findClient(doc.clientId)}
                  onOpen={() => navigate(`/invoice/${doc.id}`)}
                  onRemind={() => remind(doc)}
                />
              ))}
              {visibleDocs.length === 0 && (
                <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-1">
                  <Icon name="receipt_long" className="text-[32px] text-outline" />
                  <p className="font-label-lg text-label-lg text-on-surface font-bold">Belum ada dokumen</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Buat invoice atau penawaran pertama Anda.</p>
                </div>
              )}
            </div>
          </section>

          {/* Client Testimonial / Trust Badge */}
          <section className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center gap-3">
            <img
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              alt="Portrait of an Indonesian professional corporate client in casual modern attire, smiling warmly against clean studio background"
              src={TESTIMONIAL_URL}
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Icon key={i} name="star" fill className="text-[14px] text-secondary" />
                ))}
                <span className="font-label-sm text-label-sm text-on-surface font-bold ml-1">5.0 (28 Review)</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">100% Faktur diselesaikan tepat waktu bulan ini</p>
            </div>
          </section>
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
      {toast}
    </div>
  )
}
