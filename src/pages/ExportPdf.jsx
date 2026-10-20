import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import PrintDocument, { PrintPortal, getPageSpec } from '../components/PrintDocument.jsx'
import { useToast } from '../components/Toast.jsx'
import useTimeouts from '../hooks/useTimeouts.js'
import { useData } from '../store/DataProvider.jsx'
import { DOC_TYPES, DOC_STATUS, documentTotals } from '../store/documents.js'
import { loadSignature, loadTemplateSettings } from '../store/templateSettings.js'
import { formatRupiah } from '../format.js'

const PAPER_OPTIONS = [
  {
    value: 'A4',
    icon: 'description',
    iconClass: 'bg-primary-fixed text-primary',
    title: 'A4 Resmi',
    badge: '210 × 297 mm',
    badgeClass: 'bg-primary text-on-primary font-bold',
    desc: 'Standar surat resmi Indonesia, siap arsip & audit.',
  },
  {
    value: 'Letter',
    icon: 'article',
    iconClass: 'bg-surface-container-highest text-primary-container',
    title: 'Letter / US',
    badge: '216 × 279 mm',
    badgeClass: 'bg-surface-container-highest text-on-surface',
    desc: 'Untuk klien luar negeri & printer berukuran Letter.',
  },
  {
    value: 'Thermal',
    icon: 'receipt',
    iconClass: 'bg-secondary-fixed text-secondary',
    title: 'Nota Thermal 80mm',
    badge: 'Struk',
    badgeClass: 'bg-secondary-container text-on-secondary-container font-bold',
    desc: 'Ringkas untuk printer kasir / bluetooth thermal.',
  },
]

const toWhatsappNumber = (phone = '') => phone.replace(/\D/g, '').replace(/^0/, '62')

function PaperOption({ option, checked, onSelect }) {
  return (
    <label
      className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all hover:bg-surface-container-low ${
        checked ? 'bg-surface-container shadow-md' : 'bg-surface-container-lowest shadow-sm'
      }`}
    >
      <input checked={checked} className="sr-only" name="paper" onChange={onSelect} type="radio" value={option.value} />
      <div className={`w-9 h-9 rounded-lg ${option.iconClass} flex items-center justify-center shrink-0 mr-3`}>
        <Icon name={option.icon} className="text-[20px]" />
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-label-md text-label-md text-on-surface font-bold">{option.title}</span>
          <span className={`px-1.5 rounded-full ${option.badgeClass} font-label-sm text-[10px]`}>{option.badge}</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{option.desc}</p>
      </div>
      <div
        className={`w-5 h-5 rounded-full ${
          checked ? 'bg-primary text-on-primary' : 'bg-outline-variant text-transparent'
        } flex items-center justify-center shrink-0`}
      >
        <Icon name="check" className="text-[14px]" />
      </div>
    </label>
  )
}

function ActionTile({ icon, iconClass, label, onClick }) {
  return (
    <button
      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container shadow-sm active:scale-95 transition-all text-on-surface min-h-[76px]"
      onClick={onClick}
      type="button"
    >
      <div className={`w-8 h-8 rounded-full ${iconClass} flex items-center justify-center`}>
        <Icon name={icon} className="text-[18px]" />
      </div>
      <span className="font-label-sm text-label-sm text-center font-bold leading-tight">{label}</span>
    </button>
  )
}

// Lembar dokumen dengan ukuran asli (mm), diperkecil agar pas lebar layar.
function SheetPreview({ widthPx, fit, children }) {
  const wrapRef = useRef(null)
  const sheetRef = useRef(null)
  const [box, setBox] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const measure = () =>
      setBox({ width: wrapRef.current?.clientWidth || 0, height: sheetRef.current?.offsetHeight || 0 })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(wrapRef.current)
    observer.observe(sheetRef.current)
    return () => observer.disconnect()
  }, [])

  const scale = fit && box.width ? Math.min(1, box.width / widthPx) : 1

  return (
    <div ref={wrapRef} className={`w-full ${fit ? 'overflow-hidden' : 'overflow-x-auto no-scrollbar'}`}>
      <div className="mx-auto" style={{ width: widthPx * scale, height: box.height * scale }}>
        <div
          ref={sheetRef}
          className="shadow-[0_8px_30px_-6px_rgba(15,23,42,0.25)]"
          style={{ width: widthPx, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ExportPdf() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { findDocument, findClient, profile, updateDocument } = useData()
  const [toast, showToast] = useToast(3200)
  const later = useTimeouts()
  const [baseSettings] = useState(loadTemplateSettings)
  const [signature] = useState(loadSignature)
  const [paper, setPaper] = useState(baseSettings.paper)
  const [orientation, setOrientation] = useState(baseSettings.orientation)
  const [fit, setFit] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const doc = findDocument(id)
  const client = doc ? findClient(doc.clientId) : null

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menuOpen])

  if (!doc) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 px-margin text-center bg-surface">
        <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
          <Icon name="find_in_page" className="text-[28px]" />
        </div>
        <h1 className="font-headline-sm text-headline-sm text-on-surface">Dokumen tidak ditemukan</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Dokumen #{id} mungkin sudah dihapus.</p>
        <Link className="mt-2 h-11 px-5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center" to="/dokumen">
          Lihat Semua Dokumen
        </Link>
      </div>
    )
  }

  const type = DOC_TYPES[doc.type]
  const settings = { ...baseSettings, paper, orientation }
  const spec = getPageSpec(settings)
  const totals = documentTotals(doc)
  const docLabel = doc.type === 'quote' ? 'Surat Penawaran' : 'Faktur'
  const paperLabel = PAPER_OPTIONS.find((p) => p.value === paper)?.title
  const printProps = { doc, client, profile, settings, signature }

  // Nama file PDF bawaan browser mengikuti document.title saat dialog cetak dibuka.
  const openPrintDialog = (message) => {
    const previousTitle = document.title
    document.title = `${doc.id} - ${client?.name || type.label}`
    const restore = () => {
      document.title = previousTitle
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    showToast(message, 'print')
    later(() => window.print(), 350)
  }

  const sendWhatsapp = () => {
    const link = `${window.location.origin}/invoice/${doc.id}`
    const text = encodeURIComponent(
      `Halo ${client?.pic || client?.name || ''}, berikut ${type.label.toLowerCase()} #${doc.id} dari ${profile.businessName} sebesar ${formatRupiah(
        totals.total,
      )}. Dokumen PDF terlampir. Detail: ${link}\n\nTerima kasih!`,
    )
    if (doc.status === 'draft') updateDocument(doc.id, { status: 'sent' })
    showToast('Membuka WhatsApp... lampirkan PDF yang sudah disimpan.', 'send')
    later(() => window.open(`https://wa.me/${toWhatsappNumber(client?.phone)}?text=${text}`, '_blank'), 500)
  }

  const copyLink = () => {
    const url = `${window.location.origin}/invoice/${doc.id}`
    const done = (message) => {
      setLinkCopied(true)
      showToast(message, 'link')
      later(() => setLinkCopied(false), 2000)
    }
    if (!navigator.clipboard) return done(`Tautan: ${url}`)
    navigator.clipboard
      .writeText(url)
      .then(() => done('Tautan dokumen berhasil disalin!'))
      .catch(() => done(`Tautan: ${url}`))
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-full flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <button
              aria-label="Kembali"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
              onClick={() => navigate(-1)}
              type="button"
            >
              <Icon name="arrow_back" className="text-[24px]" />
            </button>
            <h1 className="text-headline-sm font-headline-sm text-on-surface tracking-tight truncate">Pratinjau Cetak</h1>
          </div>
          <div className="relative">
            <button
              aria-expanded={menuOpen}
              aria-label="Menu lainnya"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-95 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              type="button"
            >
              <Icon name="more_vert" className="text-[22px]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-surface-container-lowest rounded-xl shadow-xl p-1.5 flex flex-col">
                {[
                  { to: `/invoice/${doc.id}/edit`, icon: 'edit_note', iconClass: 'text-primary', label: `Edit ${type.label}` },
                  { to: '/pengaturan/template', icon: 'palette', iconClass: 'text-primary', label: 'Atur Template & Warna' },
                  { to: '/pengaturan/tanda-tangan', icon: 'draw', iconClass: 'text-secondary', label: 'Kop, Rekening & Tanda Tangan' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-container-low font-label-md text-label-md text-on-surface"
                    to={item.to}
                  >
                    <Icon name={item.icon} className={`text-[18px] ${item.iconClass}`} />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-16 bg-surface pb-safe flex flex-col">
        <div className="flex flex-col w-full pb-10">
          {/* Meta banner */}
          <div className="px-margin py-space-sm">
            <div className="bg-surface-container-high rounded-xl p-space-sm flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <Icon name="picture_as_pdf" className="text-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md text-primary font-bold shrink-0">#{doc.id}</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-outline shrink-0" />
                  <span className="font-body-sm text-body-sm text-on-surface truncate">{client?.name}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {docLabel} · {paperLabel}
                  {spec.thermal ? '' : ` ${orientation}`} · {formatRupiah(totals.total)}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-full text-secondary shadow-sm">
                <Icon name="check_circle" className="text-[14px]" />
                <span className="font-label-sm text-label-sm font-bold">{DOC_STATUS[doc.status]?.label}</span>
              </div>
            </div>
          </div>

          {/* Document stage */}
          <div className="px-margin pt-space-xs pb-space-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Icon name="visibility" className="text-primary text-[18px]" />
                <span className="font-label-lg text-label-lg text-on-surface">Pratinjau Lembar {docLabel}</span>
              </div>
              {!spec.thermal && (
                <button
                  className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-highest transition-all text-on-surface flex items-center gap-1"
                  onClick={() => setFit((v) => !v)}
                  type="button"
                >
                  <Icon name={fit ? 'zoom_in' : 'fit_screen'} className="text-[16px]" />
                  <span className="font-label-sm text-label-sm">{fit ? 'Ukuran Asli' : 'Pas Layar'}</span>
                </button>
              )}
            </div>
            <div className="rounded-xl bg-surface-container p-2.5">
              <SheetPreview key={`${paper}-${orientation}`} widthPx={spec.widthPx} fit={fit}>
                <PrintDocument {...printProps} />
              </SheetPreview>
            </div>
            {!fit && (
              <p className="mt-1.5 font-body-sm text-body-sm text-on-surface-variant text-center">Geser ke samping untuk melihat seluruh lembar.</p>
            )}
          </div>

          {/* Paper selector */}
          <div className="px-margin pt-space-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-label-lg text-label-lg text-on-surface">Ukuran Kertas</h3>
              <Link className="font-label-sm text-label-sm text-primary flex items-center gap-0.5" to="/pengaturan/template">
                Atur default
                <Icon name="chevron_right" className="text-[16px]" />
              </Link>
            </div>
            <div className="space-y-2">
              {PAPER_OPTIONS.map((option) => (
                <PaperOption key={option.value} option={option} checked={paper === option.value} onSelect={() => setPaper(option.value)} />
              ))}
            </div>
            {!spec.thermal && (
              <div className="mt-2.5 w-full bg-surface-container-low p-1 rounded-xl flex">
                {[
                  { value: 'Potret', icon: 'crop_portrait', label: 'Potret' },
                  { value: 'Lanskap', icon: 'crop_landscape', label: 'Lanskap' },
                ].map((o) => (
                  <button
                    key={o.value}
                    className={`flex-1 h-10 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all ${
                      orientation === o.value ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant'
                    }`}
                    onClick={() => setOrientation(o.value)}
                    type="button"
                  >
                    <Icon name={o.icon} className="text-[18px]" />
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export actions */}
          <div className="px-margin pt-space-md flex flex-col gap-3">
            <h3 className="font-label-lg text-label-lg text-on-surface">Simpan, Cetak &amp; Kirim</h3>

            <button
              className="w-full h-[52px] px-4 rounded-xl bg-primary-container active:scale-[0.98] transition-all flex items-center justify-between text-on-primary shadow-[0_8px_20px_-4px_rgba(30,64,175,0.35)]"
              onClick={() => openPrintDialog('Pilih "Simpan sebagai PDF" pada tujuan printer.')}
              type="button"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest/20 flex items-center justify-center">
                  <Icon name="download" className="text-[22px]" />
                </div>
                <div className="text-left">
                  <div className="font-headline-sm text-headline-sm font-bold leading-tight">Simpan sebagai PDF</div>
                  <div className="font-body-sm text-[11px] text-on-primary/90">
                    File: {doc.id} - {client?.name}.pdf
                  </div>
                </div>
              </div>
              <Icon name="chevron_right" className="text-[22px]" />
            </button>

            <div className="grid grid-cols-3 gap-2.5">
              <ActionTile
                icon="local_printshop"
                iconClass="bg-surface-container-high text-on-surface"
                label="Cetak Langsung"
                onClick={() => openPrintDialog('Membuka dialog cetak...')}
              />
              <ActionTile icon="chat" iconClass="bg-secondary-fixed text-secondary" label="Kirim WhatsApp" onClick={sendWhatsapp} />
              <ActionTile
                icon={linkCopied ? 'check' : 'link'}
                iconClass="bg-primary-fixed text-primary"
                label={linkCopied ? 'Tersalin' : 'Salin Tautan'}
                onClick={copyLink}
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5 mt-1">
              <Icon name="info" className="text-primary text-[18px] shrink-0 mt-0.5" />
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                PDF dibuat dari dialog cetak browser sehingga teks tetap tajam &amp; bisa dicari. Di HP: Bagikan → Cetak → simpan/bagikan
                sebagai PDF. Kop, rekening &amp; tanda tangan diambil dari menu Pengaturan.
              </p>
            </div>
          </div>
        </div>
      </main>
      <PrintPortal {...printProps} />
      {toast}
    </div>
  )
}
