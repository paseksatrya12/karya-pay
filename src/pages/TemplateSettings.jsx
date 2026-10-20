import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useToast } from '../components/Toast.jsx'
import { useData } from '../store/DataProvider.jsx'
import { DEFAULT_TERMS, loadTemplateSettings, saveTemplateSettings } from '../store/templateSettings.js'

const MAX_TERMS = 300

function ModernThumb() {
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <Icon name="token" className="text-[14px] text-on-primary" />
        </div>
        <div className="h-2 w-12 bg-outline-variant/60 rounded-full" />
      </div>
      <div className="w-full h-px bg-outline-variant/40" />
      <div className="space-y-1.5">
        <div className="h-2 w-20 bg-primary/30 rounded-full" />
        <div className="h-1.5 w-full bg-outline-variant/30 rounded-full" />
        <div className="h-1.5 w-4/5 bg-outline-variant/30 rounded-full" />
      </div>
      <div className="mt-auto flex justify-between items-end pt-1">
        <div className="h-3 w-10 bg-primary/20 rounded" />
        <div className="h-3.5 w-14 bg-primary rounded text-[7px] text-white font-bold flex items-center justify-center">Rp Total</div>
      </div>
    </>
  )
}

function CorporateThumb() {
  return (
    <>
      <div className="w-full pb-1 text-center">
        <div className="h-2 w-16 bg-on-surface/50 rounded mx-auto mb-1" />
        <div className="h-1 w-24 bg-outline-variant/60 rounded mx-auto" />
      </div>
      <div className="w-full grid grid-cols-3 gap-1 pt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 bg-on-surface/20 rounded" />
        ))}
      </div>
      <div className="w-full space-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 bg-outline-variant/30 rounded w-full" />
        ))}
      </div>
      <div className="mt-auto flex justify-between items-center text-[7px] text-on-surface-variant font-medium pt-1">
        <div className="h-2.5 w-8 bg-on-surface/20 rounded" />
        <div className="h-2.5 w-12 bg-on-surface/40 rounded" />
      </div>
    </>
  )
}

function CreativeThumb() {
  return (
    <>
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-secondary" />
      <div className="pl-2 space-y-2">
        <div className="flex justify-between items-start">
          <div className="h-4 w-12 bg-secondary/30 rounded" />
          <div className="h-3 w-8 bg-secondary-fixed text-[6px] font-extrabold text-on-secondary-fixed flex items-center justify-center rounded-full">#STUDIO</div>
        </div>
        <div className="h-1.5 w-24 bg-outline-variant/40 rounded" />
        <div className="flex gap-1">
          <span className="h-3 w-10 bg-surface-container-highest rounded-full text-[6px] text-center font-bold text-on-surface-variant flex items-center justify-center">UI/UX</span>
          <span className="h-3 w-8 bg-surface-container-highest rounded-full text-[6px] text-center font-bold text-on-surface-variant flex items-center justify-center">Design</span>
        </div>
      </div>
      <div className="mt-auto pl-2 flex justify-between items-center">
        <div className="h-4 w-4 rounded-full bg-secondary/40" />
        <div className="h-3 w-14 bg-secondary rounded text-[7px] text-on-secondary font-bold flex items-center justify-center">Invoice ID</div>
      </div>
    </>
  )
}

function CompactThumb() {
  return (
    <>
      <div className="flex justify-between items-center text-[7px] font-mono text-on-surface">
        <span>INV-001</span>
        <span>12/10/24</span>
      </div>
      <div className="w-full h-0.5 bg-outline-variant/30" />
      <div className="space-y-1">
        {['w-14', 'w-16', 'w-10'].map((w) => (
          <div key={w} className="flex justify-between">
            <div className={`h-1.5 ${w} bg-outline-variant/40 rounded`} />
            <div className="h-1.5 w-6 bg-outline-variant/40 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-auto pt-1 bg-surface-container-highest/60 rounded px-1.5 py-1 flex justify-between items-center">
        <span className="text-[7px] font-bold text-on-surface">TOTAL</span>
        <span className="text-[7px] font-bold text-primary">Rp 4.500K</span>
      </div>
    </>
  )
}

const templates = [
  {
    id: 'Modern Minimalist',
    desc: 'Karakter bersih, legibilitas tinggi & tipografi modern.',
    thumbClass: 'bg-surface-container-low flex flex-col gap-2',
    Thumb: ModernThumb,
    footerClass: 'text-secondary',
    tag: 'Sangat Populer',
    tagClass: 'font-semibold flex items-center gap-1',
    tagIcon: 'thumb_up',
  },
  {
    id: 'Corporate Formal',
    desc: 'Struktur tabel klasik, audit-ready untuk klien institusi.',
    thumbClass: 'bg-surface-container-high/60 flex flex-col gap-1.5',
    Thumb: CorporateThumb,
    footerClass: 'text-on-surface-variant',
    tag: 'B2B & Korporat',
    tagClass: '',
  },
  {
    id: 'Kreatif & Studio',
    desc: 'Aksen tegas dengan tag modern untuk freelancer & agensi.',
    thumbClass: 'bg-surface-container-low flex flex-col',
    Thumb: CreativeThumb,
    footerClass: 'text-on-surface-variant',
    tag: 'Desainer & Kreator',
    tagClass: 'text-secondary font-semibold',
  },
  {
    id: 'Ringkas / Compact',
    desc: 'Hemat ruang, ringkas 1 halaman, optimal dicetak cepat.',
    thumbClass: 'bg-surface-container-low flex flex-col gap-1',
    Thumb: CompactThumb,
    footerClass: 'text-on-surface-variant',
    tag: 'Ekonomis Cetak',
    tagClass: '',
  },
]

const swatches = [
  { hex: '#1E40AF', name: 'KaryaPay Royal Blue', label: 'Royal', circle: 'bg-primary text-on-primary shadow-primary/25' },
  { hex: '#059669', name: 'Emerald Slate', label: 'Emerald', circle: 'bg-[#059669] text-white' },
  { hex: '#7C3AED', name: 'Amethyst Purple', label: 'Amethyst', circle: 'bg-[#7C3AED] text-white' },
  { hex: '#1E293B', name: 'Charcoal Midnight', label: 'Charcoal', circle: 'bg-[#1E293B] text-white' },
  { hex: '#EA580C', name: 'Coral Sunset', label: 'Coral', circle: 'bg-[#EA580C] text-white' },
]

// Kunci harus sama dengan TEMPLATE_FIELD_KEYS di store/templateSettings.js
const fieldToggles = [
  { key: 'logo', icon: 'storefront', title: 'Tampilkan Logo Usaha / Studio', desc: 'Format SVG/PNG di pojok kiri atas faktur.' },
  { key: 'signature', icon: 'draw', title: 'Tanda Tangan Digital Resmi', desc: 'Cantumkan goresan e-signature Anda.', link: '/pengaturan/tanda-tangan', linkLabel: 'Atur tanda tangan' },
  { key: 'qris', icon: 'qr_code_scanner', title: 'Sertakan QRIS pada Faktur', desc: 'Scan instan via GoPay, OVO, BCA, Livin.' },
  { key: 'tax', icon: 'receipt_long', title: 'Cantumkan NPWP & PPN 11% / 12%', desc: 'Rincian pajak & nomor pokok wajib pajak.' },
  { key: 'terms', icon: 'gavel', title: 'Catatan & Syarat Ketentuan', desc: 'Informasi jatuh tempo & rekening transfer.' },
  { key: 'watermark', icon: 'verified', title: 'Watermark Lunas Otomatis', desc: 'Stempel diagonal hijau saat terbayar.' },
]

const paperSizes = [
  { id: 'A4', label: 'A4 (Standar ID)' },
  { id: 'Letter', label: 'Letter / US' },
  { id: 'Thermal', label: 'Nota 80mm' },
]

const orientations = [
  { id: 'Potret', label: 'Potret (Tegak)', icon: 'crop_portrait' },
  { id: 'Lanskap', label: 'Lanskap', icon: 'crop_landscape' },
]

function TemplateCard({ template, active, onSelect }) {
  const { Thumb } = template
  return (
    <div
      role="radio"
      aria-checked={active}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`snap-start shrink-0 w-[220px] rounded-xl bg-surface-container-lowest p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none ${
        active ? 'shadow-md scale-[1.02] shadow-primary/10 opacity-100' : 'shadow-sm hover:shadow-md opacity-85'
      }`}
    >
      <div>
        <div className={`w-full h-32 rounded-lg p-2.5 relative overflow-hidden ${template.thumbClass}`}>
          <Thumb />
          {active && (
            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <Icon name="check_circle" className="text-[12px]" />
              Aktif
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-label-lg font-label-lg text-on-surface font-bold">{template.id}</p>
          <p className="text-body-sm font-body-sm text-on-surface-variant">{template.desc}</p>
        </div>
      </div>
      <div className={`mt-3 pt-2 flex items-center justify-between ${template.footerClass}`}>
        <span className={`text-label-sm font-label-sm ${template.tagClass}`}>
          {template.tagIcon && <Icon name={template.tagIcon} className="text-[14px]" />}
          {template.tagIcon ? ` ${template.tag}` : template.tag}
        </span>
        <Icon
          name={active ? 'radio_button_checked' : 'radio_button_unchecked'}
          fill={active}
          className={`text-[20px] ${active ? 'text-primary' : 'text-outline'}`}
        />
      </div>
    </div>
  )
}

function ColorSwatch({ swatch, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-label={swatch.name}
      aria-pressed={selected}
      onClick={onSelect}
      className="flex flex-col items-center gap-1.5 group focus:outline-none"
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform transform active:scale-95 ${swatch.circle} ${
          selected ? 'shadow-md ring-2 ring-primary ring-offset-2' : 'shadow-sm'
        }`}
      >
        {selected && <Icon name="check" className="text-[20px] font-bold" />}
      </div>
      <span
        className={`text-label-sm font-label-sm text-center line-clamp-1 ${
          selected ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
        }`}
      >
        {swatch.label}
      </span>
    </button>
  )
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none active:scale-95 ${
        checked ? 'bg-secondary' : 'bg-outline-variant'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full bg-surface-container-lowest shadow-sm transform transition-transform flex items-center justify-center ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      >
        {checked && <Icon name="check" className="text-[14px] text-secondary" />}
      </span>
    </button>
  )
}

function ToggleRow({ item, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low transition-colors">
      <div className="flex items-center gap-3 pr-2">
        <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
          <Icon name={item.icon} className="text-[20px]" />
        </div>
        <div>
          <p className="text-label-lg font-label-lg text-on-surface font-semibold">{item.title}</p>
          <p className="text-body-sm font-body-sm text-on-surface-variant">{item.desc}</p>
          {item.link && (
            <Link to={item.link} className="mt-0.5 inline-flex items-center gap-0.5 text-label-sm font-label-sm text-primary hover:underline">
              {item.linkLabel}
              <Icon name="chevron_right" className="text-[14px]" />
            </Link>
          )}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} label={item.title} />
    </div>
  )
}

function SectionCard({ children }) {
  return (
    <section className="mt-space-lg px-margin">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">{children}</div>
    </section>
  )
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-space-xs">
      <Icon name={icon} className="text-primary text-[20px]" />
      <h3 className="text-headline-sm font-headline-sm text-on-surface">{title}</h3>
    </div>
  )
}

export default function TemplateSettings() {
  const navigate = useNavigate()
  const [toast, showToast] = useToast(2400)
  const { documents } = useData()
  const [initial] = useState(loadTemplateSettings)
  const [template, setTemplate] = useState(initial.template)
  const [color, setColor] = useState(initial.color)
  const [fields, setFields] = useState(initial.fields)
  const [paper, setPaper] = useState(initial.paper)
  const [orientation, setOrientation] = useState(initial.orientation)
  const [terms, setTerms] = useState(initial.terms)
  const [hexOpen, setHexOpen] = useState(false)
  const [hexInput, setHexInput] = useState('')
  const [saveState, setSaveState] = useState('idle')
  const hexRef = useRef(null)
  const timers = useRef([])
  const savedSnapshot = useRef(JSON.stringify(initial))

  const currentSettings = { template, color, fields, paper, orientation, terms }

  useEffect(() => {
    if (hexOpen) hexRef.current?.focus()
  }, [hexOpen])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const activeCount = Object.values(fields).filter(Boolean).length

  const applyCustomHex = () => {
    let val = hexInput.trim().toUpperCase()
    if (val.startsWith('#')) val = val.substring(1)
    if (/^[0-9A-F]{6}$/.test(val)) {
      setColor(`#${val}`)
      setHexOpen(false)
    } else {
      showToast('Kode hex tidak valid. Gunakan 6 digit, mis. 1E40AF', 'error')
    }
  }

  const persist = () => {
    const ok = saveTemplateSettings(currentSettings)
    if (ok) savedSnapshot.current = JSON.stringify(currentSettings)
    return ok
  }

  // Pratinjau memakai dokumen terbaru; simpan dulu agar pilihan ikut tampil
  const openPreview = () => {
    if (JSON.stringify(currentSettings) !== savedSnapshot.current) persist()
    const latest = [...documents].sort(
      (a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || '')) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
    )[0]
    navigate(latest ? `/invoice/${encodeURIComponent(latest.id)}/pdf` : '/dokumen')
  }

  const savePreferences = () => {
    if (saveState === 'saving') return
    setSaveState('saving')
    timers.current.push(
      setTimeout(() => {
        persist()
        setSaveState('saved')
        showToast('Preferensi template berhasil disimpan!', 'verified')
        timers.current.push(setTimeout(() => setSaveState('idle'), 1800))
      }, 900),
    )
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-full flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Kembali"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
              onClick={() => navigate(-1)}
              type="button"
            >
              <Icon name="arrow_back" className="text-[24px]" />
            </button>
            <h1 className="text-headline-sm font-headline-sm text-on-surface tracking-tight truncate max-w-[200px]">Invoice Customization</h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Action"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-95 transition-all"
              type="button"
            >
              <Icon name="more_vert" className="text-[22px]" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Icon name="person" className="text-on-primary text-[18px]" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-16 bg-surface pb-safe flex flex-col">
        <div className="flex flex-col w-full pb-32">
          {/* Intro */}
          <div className="px-margin pt-space-md pb-space-sm flex items-center justify-between">
            <div>
              <span className="text-label-sm font-label-sm text-secondary uppercase tracking-wider font-bold">Personalisasi Faktur</span>
              <h2 className="text-headline-md font-headline-md text-on-surface tracking-tight">Kustomisasi Dokumen</h2>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container/40 text-on-secondary-container">
              <Icon name="auto_awesome" fill className="text-[16px]" />
              <span className="text-label-sm font-label-sm font-semibold">Tersinkron Pro</span>
            </div>
          </div>

          {/* Pilihan Template */}
          <section className="mt-space-sm flex flex-col">
            <div className="px-margin flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <Icon name="dashboard_customize" className="text-primary text-[20px]" />
                <h3 className="text-headline-sm font-headline-sm text-on-surface">Pilihan Template Layout</h3>
              </div>
              <span className="text-label-md font-label-md text-on-surface-variant font-medium">{templates.length} Varian</span>
            </div>
            <div role="radiogroup" aria-label="Pilihan Template Layout" className="flex gap-space-md overflow-x-auto px-margin pb-space-sm pt-1 snap-x scroll-smooth no-scrollbar">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t} active={template === t.id} onSelect={() => setTemplate(t.id)} />
              ))}
            </div>
          </section>

          {/* Warna Aksen */}
          <SectionCard>
            <div className="flex items-center justify-between mb-space-sm">
              <SectionTitle icon="palette" title="Warna Aksen Brand" />
              <span className="text-label-md font-label-md px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold">{color}</span>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-space-md">Diterapkan pada kop surat, total nominal, badge status, dan divider invoice Anda.</p>
            <div className="grid grid-cols-5 gap-space-sm mb-space-md">
              {swatches.map((s) => (
                <ColorSwatch key={s.hex} swatch={s} selected={color === s.hex} onSelect={() => setColor(s.hex)} />
              ))}
            </div>
            <div className="pt-space-xs flex items-center justify-between">
              <button
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-high/70 hover:bg-surface-container-high text-on-surface flex items-center justify-center gap-space-xs text-label-lg font-label-lg transition-all active:scale-[0.99]"
                onClick={() => setHexOpen((o) => !o)}
                aria-expanded={hexOpen}
                type="button"
              >
                <Icon name="colorize" className="text-primary text-[20px]" />
                <span>+ Kustom Hex Color</span>
              </button>
            </div>
            {hexOpen && (
              <div className="mt-3 p-3 rounded-lg bg-surface-container-low flex items-center gap-3">
                <span className="text-label-lg font-label-lg text-on-surface-variant font-mono font-bold">#</span>
                <input
                  ref={hexRef}
                  className="flex-1 min-w-0 bg-surface-container-lowest px-3 py-2 rounded text-body-md font-body-md text-on-surface font-mono uppercase focus:outline-none"
                  maxLength={7}
                  placeholder="1E40AF"
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyCustomHex()}
                />
                <button
                  className="px-4 py-2 rounded bg-primary text-on-primary text-label-md font-label-md font-semibold active:scale-95 transition-transform"
                  onClick={applyCustomHex}
                  type="button"
                >
                  Terapkan
                </button>
              </div>
            )}
          </SectionCard>

          {/* Elemen & Informasi */}
          <SectionCard>
            <div className="flex items-center justify-between mb-space-sm">
              <SectionTitle icon="toggle_on" title="Elemen & Informasi" />
              <span className="text-label-sm font-label-sm text-secondary font-bold">{activeCount} Aktif</span>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-space-md">Atur visibilitas bagian penting pada lembar dokumen final.</p>
            <div className="space-y-space-sm">
              {fieldToggles.map((item) => (
                <ToggleRow
                  key={item.key}
                  item={item}
                  checked={fields[item.key]}
                  onChange={(value) => setFields((f) => ({ ...f, [item.key]: value }))}
                />
              ))}
            </div>
          </SectionCard>

          {/* Ukuran Kertas */}
          <SectionCard>
            <div className="mb-space-sm">
              <SectionTitle icon="print" title="Ukuran Kertas & Tata Letak" />
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-space-md">Sesuaikan dimensi ekspor dokumen PDF untuk kompatibilitas cetak.</p>
            <div className="space-y-space-sm">
              <span className="text-label-md font-label-md text-on-surface font-semibold">Format Dimensi Kertas</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-container-high/60">
                {paperSizes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={paper === p.id}
                    onClick={() => setPaper(p.id)}
                    className={`h-11 rounded-lg text-label-md font-label-md flex items-center justify-center transition-all ${
                      paper === p.id ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-space-sm mt-space-md">
              <span className="text-label-md font-label-md text-on-surface font-semibold">Orientasi Halaman</span>
              <div className="grid grid-cols-2 gap-2">
                {orientations.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={orientation === o.id}
                    onClick={() => setOrientation(o.id)}
                    className={`h-12 px-3 rounded-lg flex items-center justify-center gap-2 text-label-lg transition-all ${
                      orientation === o.id
                        ? 'bg-surface-container-low text-primary font-semibold shadow-sm'
                        : 'bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <Icon name={o.icon} className="text-[20px]" />
                    <span>{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Catatan Kaki */}
          <SectionCard>
            <div className="flex items-center justify-between mb-space-sm">
              <SectionTitle icon="edit_note" title="Catatan Kaki Faktur Default" />
              <button
                className="text-label-sm font-label-sm text-secondary hover:underline font-semibold flex items-center gap-0.5"
                onClick={() => setTerms(DEFAULT_TERMS)}
                type="button"
              >
                <Icon name="restart_alt" className="text-[14px]" /> Reset
              </button>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-space-sm">Teks ini akan disisipkan secara otomatis pada setiap faktur baru.</p>
            <div className="relative rounded-lg bg-surface-container-low p-3 focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest transition-all">
              <textarea
                className="w-full bg-transparent text-body-md font-body-md text-on-surface focus:outline-none resize-none leading-relaxed"
                placeholder="Tulis syarat pembayaran atau pesan terima kasih..."
                rows={4}
                maxLength={MAX_TERMS}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
              <div className="flex justify-between items-center pt-2 text-body-sm font-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Icon name="verified_user" className="text-[14px] text-secondary" /> Termasuk instruksi bank &amp; QRIS
                </span>
                <span className="text-label-sm font-label-sm font-mono">
                  {terms.length} / {MAX_TERMS}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Pratinjau Otomatis */}
          <div className="mt-space-lg mx-margin p-space-md rounded-xl bg-gradient-to-r from-surface-container-high to-surface-container flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="visibility" className="text-[22px]" />
              </div>
              <div>
                <p className="text-label-lg font-label-lg text-on-surface font-bold">Pratinjau Otomatis Aktif</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">Setiap penyesuaian langsung di-render ke PDF.</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
          </div>

          {/* Sticky Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md px-margin py-3 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] flex flex-col gap-2">
            <div className="max-w-md mx-auto w-full flex gap-space-sm">
              <button
                className="flex-1 h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-label-lg font-label-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                onClick={openPreview}
                type="button"
              >
                <Icon name="preview" className="text-[20px] text-primary" />
                <span>Lihat Pratinjau</span>
              </button>
              <button
                className="flex-[1.5] h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-label-lg font-label-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all disabled:opacity-80"
                onClick={savePreferences}
                disabled={saveState === 'saving'}
                type="button"
              >
                <Icon
                  name={saveState === 'saving' ? 'progress_activity' : saveState === 'saved' ? 'task_alt' : 'check_circle'}
                  className={`text-[20px] ${saveState === 'saving' ? 'animate-spin' : ''}`}
                />
                <span>{saveState === 'saving' ? 'Menyimpan…' : saveState === 'saved' ? 'Tersimpan' : 'Simpan Preferensi'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      {toast}
    </div>
  )
}
