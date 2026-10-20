import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet.jsx'
import CurrencyInput from '../components/CurrencyInput.jsx'
import Icon from '../components/Icon.jsx'
import { useToast } from '../components/Toast.jsx'
import { useData } from '../store/DataProvider.jsx'
import { DOC_TYPES, LINE_KINDS, blankLine, documentTotals, lineFromMaster, lineTotal } from '../store/documents.js'
import { addDays, daysBetween, formatNumber, formatRupiah, initials, todayISO } from '../format.js'

const LOGO_URL = '/images/logo.png'
const PROFILE_URL = '/images/photo-01.jpg'

const segmentActive =
  'flex-1 py-2.5 rounded-xl font-label-lg text-label-lg transition-all flex items-center justify-center gap-2 bg-surface-container-lowest text-primary shadow-sm font-semibold'
const segmentIdle =
  'flex-1 py-2.5 rounded-xl font-label-lg text-label-lg transition-all flex items-center justify-center gap-2 text-on-surface-variant hover:text-on-surface'

const fieldBox = 'bg-surface-container-low rounded-xl focus-within:bg-surface-container-lowest focus-within:shadow-[0_0_0_2px_#1e40af] transition-all'

const kindBadge = {
  service: 'bg-primary-fixed text-on-primary-fixed-variant',
  item: 'bg-secondary-container text-on-secondary-container',
}

const TERM_PRESETS = [7, 14, 30]

function SectionIcon({ name }) {
  return (
    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
      <Icon name={name} className="text-[20px]" />
    </div>
  )
}

function QtyStepper({ value, onChange }) {
  const set = (v) => onChange(Math.max(0, Math.round(v * 100) / 100))
  return (
    <div className="h-10 flex items-center bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
      <button aria-label="Kurangi" className="w-9 h-full flex items-center justify-center text-primary active:bg-surface-container" onClick={() => set(value - 1)} type="button">
        <Icon name="remove" className="text-[18px]" />
      </button>
      <input
        aria-label="Kuantitas"
        className="w-12 h-full text-center bg-transparent font-label-lg text-label-lg font-bold text-on-surface tabular-nums focus:outline-none"
        inputMode="decimal"
        onChange={(e) => set(Number(e.target.value.replace(',', '.').replace(/[^\d.]/g, '')) || 0)}
        onFocus={(e) => e.target.select()}
        value={value}
      />
      <button aria-label="Tambah" className="w-9 h-full flex items-center justify-center text-primary active:bg-surface-container" onClick={() => set(value + 1)} type="button">
        <Icon name="add" className="text-[18px]" />
      </button>
    </div>
  )
}

function LineItemCard({ line, index, master, error, onChange, onDelete }) {
  const priceChanged = master && master.price !== line.price

  return (
    <div className={`w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-sm ${error ? 'ring-2 ring-error/60' : ''}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-md bg-primary-container text-on-primary flex items-center justify-center text-[10px] font-bold shrink-0">
            {index + 1}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm uppercase ${kindBadge[line.kind]}`}>
            <Icon name={LINE_KINDS[line.kind].icon} className="text-[13px]" />
            {LINE_KINDS[line.kind].label}
          </span>
          {line.code && <span className="font-label-sm text-label-sm text-outline truncate">{line.code}</span>}
        </div>
        <button
          aria-label="Hapus baris"
          className="w-9 h-9 rounded-lg bg-surface-container-low text-error hover:bg-error-container flex items-center justify-center transition-transform active:scale-95 shrink-0"
          onClick={onDelete}
          type="button"
        >
          <Icon name="delete" className="text-[18px]" />
        </button>
      </div>

      <input
        aria-label="Nama jasa / item"
        className="w-full bg-transparent font-label-lg text-label-lg text-on-surface font-bold leading-snug rounded-lg px-1 -mx-1 py-1 focus:outline-none focus:bg-surface-container-low"
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder={line.kind === 'service' ? 'Nama jasa / pekerjaan' : 'Nama item / sparepart'}
        value={line.name}
      />
      <input
        aria-label="Keterangan"
        className="w-full bg-transparent font-body-sm text-body-sm text-on-surface-variant rounded-lg px-1 -mx-1 py-0.5 focus:outline-none focus:bg-surface-container-low"
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Keterangan singkat (opsional)"
        value={line.description}
      />
      {error && <p className="font-body-sm text-body-sm text-error mt-1">{error}</p>}

      <div className="mt-3 bg-surface-container-low/70 rounded-xl p-3 space-y-3">
        <div className="flex items-end gap-2">
          <div>
            <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">Kuantitas</span>
            <QtyStepper value={line.qty} onChange={(qty) => onChange({ qty })} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">Satuan</span>
            <input
              aria-label="Satuan"
              className="w-full h-10 px-3 bg-surface-container-lowest rounded-xl shadow-sm font-label-md text-label-md text-on-surface focus:outline-none focus:shadow-[0_0_0_2px_#1e40af]"
              onChange={(e) => onChange({ unit: e.target.value })}
              value={line.unit}
            />
          </div>
        </div>
        <div>
          <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-between mb-1">
            <span>Harga Satuan / Nominal</span>
            {priceChanged && (
              <button className="font-label-sm text-label-sm text-primary flex items-center gap-0.5" onClick={() => onChange({ price: master.price })} type="button">
                <Icon name="restart_alt" className="text-[14px]" />
                Master {formatRupiah(master.price)}
              </button>
            )}
          </span>
          <CurrencyInput
            aria-label="Harga satuan"
            className="!bg-surface-container-lowest shadow-sm"
            compact
            onChange={(price) => onChange({ price })}
            value={line.price}
          />
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {formatNumber(line.qty)} {line.unit} × {formatRupiah(line.price)}
          </span>
          <span className="font-label-lg text-label-lg text-primary font-bold tabular-nums">{formatRupiah(lineTotal(line))}</span>
        </div>
      </div>
    </div>
  )
}

function MasterPicker({ open, kind, onKindChange, onClose, onPick, onManual, lines }) {
  const { services, items } = useData()
  const [query, setQuery] = useState('')
  const source = kind === 'service' ? services.filter((s) => s.active !== false) : items
  const q = query.trim().toLowerCase()
  const results = q
    ? source.filter((r) => [r.name, r.code, r.category, r.brand, r.description].some((v) => v?.toLowerCase().includes(q)))
    : source
  const addedCount = (id) => lines.filter((l) => l.refId === id).length

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Tambah ke Dokumen"
      subtitle="Pilih dari master, harga tetap bisa diubah setelah ditambahkan."
      footer={
        <div className="flex gap-2">
          <button
            className="flex-1 h-12 rounded-xl bg-surface-container text-primary font-label-lg text-label-lg flex items-center justify-center gap-1.5 active:scale-[0.98]"
            onClick={onManual}
            type="button"
          >
            <Icon name="edit_note" className="text-[20px]" />
            Isi Manual
          </button>
          <button
            className="flex-1 h-12 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-1.5 active:scale-[0.98]"
            onClick={onClose}
            type="button"
          >
            <Icon name="check" className="text-[20px]" />
            Selesai
          </button>
        </div>
      }
    >
      <div className="w-full bg-surface-container-high p-1 rounded-xl flex mb-3">
        {Object.entries(LINE_KINDS).map(([key, meta]) => (
          <button
            key={key}
            className={`flex-1 h-10 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all ${
              kind === key ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant'
            }`}
            onClick={() => onKindChange(key)}
            type="button"
          >
            <Icon name={meta.icon} className="text-[18px]" />
            {key === 'service' ? `Jasa (${services.filter((s) => s.active !== false).length})` : `Item & Sparepart (${items.length})`}
          </button>
        ))}
      </div>

      <div className="relative mb-3">
        <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none" />
        <input
          className="w-full h-11 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1e40af]"
          onChange={(e) => setQuery(e.target.value)}
          placeholder={kind === 'service' ? 'Cari jasa, kode, kategori...' : 'Cari item, SKU, merek...'}
          value={query}
        />
      </div>

      <div className="space-y-2">
        {results.map((record) => {
          const count = addedCount(record.id)
          const out = kind === 'item' && record.stock === 0
          return (
            <button
              key={record.id}
              className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors active:scale-[0.99] ${
                count ? 'bg-primary-fixed/50' : 'bg-surface-container-low hover:bg-surface-container'
              }`}
              onClick={() => onPick(record)}
              type="button"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
                <Icon name={LINE_KINDS[kind].icon} className="text-[20px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm text-outline shrink-0">{record.code}</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">{record.name}</span>
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {[record.brand, record.category].filter(Boolean).join(' · ')}
                  {kind === 'item' && record.stock !== null && record.stock !== undefined && (
                    <span className={out ? 'text-error font-semibold' : record.stock <= 3 ? 'text-[#B45309] font-semibold' : ''}>
                      {' · '}
                      {out ? 'Stok habis' : `Stok ${record.stock}`}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-label-md text-label-md text-primary font-bold tabular-nums">{formatRupiah(record.price)}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">/ {record.unit}</div>
              </div>
              {count > 0 && (
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0">{count}</span>
              )}
            </button>
          )
        })}
        {results.length === 0 && (
          <div className="py-8 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">Tidak ada {kind === 'service' ? 'jasa' : 'item'} yang cocok.</p>
            <Link className="font-label-md text-label-md text-primary mt-1 inline-block" to={kind === 'service' ? '/master/jasa' : '/master/item'}>
              Kelola master {kind === 'service' ? 'jasa' : 'item'} →
            </Link>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

function ClientPicker({ open, selectedId, onClose, onSelect }) {
  const { clients, saveClient } = useData()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', pic: '', phone: '', email: '', address: '' })
  const [error, setError] = useState('')

  const submit = () => {
    if (!form.name.trim()) return setError('Nama klien / perusahaan wajib diisi')
    const saved = saveClient({
      ...form,
      name: form.name.trim(),
      categories: ['aktif'],
      badge: 'KLIEN BARU',
      badgeStyle: 'neutral',
      summary: { kind: 'new' },
    })
    setForm({ name: '', pic: '', phone: '', email: '', address: '' })
    setAdding(false)
    setError('')
    onSelect(saved.id)
  }

  const input = (key, label, props = {}) => (
    <label className="block">
      <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>
      <input
        className="mt-1 w-full h-11 px-3.5 bg-surface-container-low rounded-xl font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1e40af]"
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        value={form[key]}
        {...props}
      />
    </label>
  )

  return (
    <BottomSheet open={open} onClose={onClose} title={adding ? 'Klien Baru' : 'Pilih Klien'}>
      {adding ? (
        <div className="space-y-3">
          {input('name', 'Nama Klien / Perusahaan *', { autoFocus: true })}
          {error && <p className="font-body-sm text-body-sm text-error -mt-2">{error}</p>}
          {input('pic', 'Nama PIC')}
          {input('phone', 'No. WhatsApp', { inputMode: 'tel' })}
          {input('email', 'Email', { type: 'email' })}
          <label className="block">
            <span className="font-label-md text-label-md text-on-surface-variant">Alamat (dicetak di dokumen)</span>
            <textarea
              className="mt-1 w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl font-body-md text-body-md resize-none focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1e40af]"
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              rows={2}
              value={form.address}
            />
          </label>
          <div className="flex gap-2 pt-1">
            <button className="flex-1 h-12 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg" onClick={() => setAdding(false)} type="button">
              Kembali
            </button>
            <button className="flex-1 h-12 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg" onClick={submit} type="button">
              Simpan &amp; Pilih
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            className="w-full h-12 rounded-xl bg-surface-container-low text-primary hover:bg-surface-container font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            onClick={() => setAdding(true)}
            type="button"
          >
            <Icon name="person_add" className="text-[20px]" />+ Tambah Klien Baru
          </button>
          {clients.map((c) => {
            const selected = c.id === selectedId
            return (
              <button
                key={c.id}
                className={`w-full p-3 rounded-xl ${selected ? 'bg-surface-container-low' : 'bg-surface-bright'} hover:bg-surface-variant flex items-center justify-between text-left transition-colors`}
                onClick={() => onSelect(c.id)}
                type="button"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary font-bold flex items-center justify-center text-sm shrink-0">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold block truncate">{c.name}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">
                      {[c.pic, c.email || c.phone].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </div>
                <Icon
                  name={selected ? 'check_circle' : 'radio_button_unchecked'}
                  fill={selected}
                  className={`text-[22px] shrink-0 ${selected ? 'text-primary' : 'text-outline-variant'}`}
                />
              </button>
            )
          })}
        </div>
      )}
    </BottomSheet>
  )
}

function newDocument(type, clientId, number) {
  const issueDate = todayISO()
  return {
    id: number,
    type,
    status: 'draft',
    clientId,
    subject: '',
    issueDate,
    dueDate: addDays(issueDate, DOC_TYPES[type].defaultTermDays),
    lines: [],
    discount: 0,
    taxActive: true,
    taxRate: 11,
    notes: '',
  }
}

export default function CreateInvoice() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const [searchParams] = useSearchParams()
  const [toast, showToast] = useToast()
  const { findDocument, findClient, findService, findItem, nextDocumentNumber, saveDocument, clients } = useData()

  const existing = editId ? findDocument(editId) : null
  const isEdit = Boolean(editId)

  const [doc, setDoc] = useState(() => {
    if (existing) return { ...existing, lines: existing.lines.map((l) => ({ ...l })) }
    const type = searchParams.get('type') === 'penawaran' ? 'quote' : 'invoice'
    const clientParam = searchParams.get('client')
    const clientId = clients.some((c) => c.id === clientParam) ? clientParam : clients[0]?.id
    return newDocument(type, clientId, nextDocumentNumber(type))
  })
  const [clientSheet, setClientSheet] = useState(false)
  const [picker, setPicker] = useState(null)
  const [errors, setErrors] = useState({})
  const [rateInput, setRateInput] = useState(String(doc.taxRate))

  const type = DOC_TYPES[doc.type]
  const client = findClient(doc.clientId)
  const totals = documentTotals(doc)
  const termDays = daysBetween(doc.issueDate, doc.dueDate)
  const counts = useMemo(
    () => ({ service: doc.lines.filter((l) => l.kind === 'service').length, item: doc.lines.filter((l) => l.kind === 'item').length }),
    [doc.lines],
  )

  if (isEdit && !existing) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 px-margin text-center bg-surface">
        <Icon name="find_in_page" className="text-[40px] text-primary" />
        <h1 className="font-headline-sm text-headline-sm">Dokumen tidak ditemukan</h1>
        <Link className="h-11 px-5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center" to="/dokumen">
          Lihat Semua Dokumen
        </Link>
      </div>
    )
  }

  const update = (patch) => setDoc((d) => ({ ...d, ...patch }))
  const updateLine = (lineId, patch) => {
    setDoc((d) => ({ ...d, lines: d.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) }))
    setErrors((e) => ({ ...e, [lineId]: undefined, lines: undefined }))
  }

  const changeType = (next) => {
    if (isEdit || next === doc.type) return
    update({ type: next, id: nextDocumentNumber(next, doc.issueDate), dueDate: addDays(doc.issueDate, DOC_TYPES[next].defaultTermDays) })
  }

  const changeIssueDate = (issueDate) => {
    if (!issueDate) return
    const patch = { issueDate, dueDate: addDays(issueDate, Math.max(termDays, 0)) }
    if (!isEdit) patch.id = nextDocumentNumber(doc.type, issueDate)
    update(patch)
  }

  const pickMaster = (record) => {
    const kind = picker
    const existingLine = doc.lines.find((l) => l.refId === record.id)
    if (existingLine) {
      updateLine(existingLine.id, { qty: existingLine.qty + 1 })
      showToast(`${record.name}: qty jadi ${existingLine.qty + 1}`, 'add_circle')
    } else {
      setDoc((d) => ({ ...d, lines: [...d.lines, lineFromMaster(kind, record)] }))
      showToast(`${record.name} ditambahkan`, 'add_circle')
    }
    setErrors((e) => ({ ...e, lines: undefined }))
  }

  const addManual = () => {
    setDoc((d) => ({ ...d, lines: [...d.lines, blankLine(picker)] }))
    setPicker(null)
  }

  const validate = () => {
    const next = {}
    if (!client) next.client = 'Pilih klien terlebih dahulu'
    if (doc.lines.length === 0) next.lines = 'Tambahkan minimal satu jasa atau item'
    doc.lines.forEach((l) => {
      if (!l.name.trim()) next[l.id] = 'Nama wajib diisi'
      else if (!(l.qty > 0)) next[l.id] = 'Kuantitas harus lebih dari 0'
    })
    if (doc.dueDate < doc.issueDate) next.dueDate = 'Tanggal tidak boleh sebelum tanggal terbit'
    setErrors(next)
    if (Object.keys(next).length) showToast('Lengkapi data yang ditandai terlebih dahulu', 'error')
    return Object.keys(next).length === 0
  }

  const save = (andPreview) => {
    if (!validate()) return
    const saved = saveDocument(
      { ...doc, taxRate: Math.max(parseFloat(rateInput) || 0, 0), lines: doc.lines.map((l) => ({ ...l, name: l.name.trim() })) },
      editId,
    )
    if (andPreview) {
      navigate(`/invoice/${saved.id}`, { replace: isEdit })
    } else {
      showToast(`${type.label} ${saved.id} tersimpan`, 'bookmark')
      if (!isEdit) navigate(`/invoice/${saved.id}/edit`, { replace: true })
    }
  }

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-full">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(11,28,48,0.04)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-xs min-w-0">
            <button
              aria-label="Kembali"
              className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface hover:text-primary transition-colors"
              onClick={() => navigate(-1)}
              type="button"
            >
              <Icon name="arrow_back" className="text-[24px]" />
            </button>
            <img alt="KaryaPay Logo" className="h-6 w-auto object-contain" src={LOGO_URL} />
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">{isEdit ? `Edit ${type.label}` : 'Buat Dokumen'}</h1>
          </div>
          <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={PROFILE_URL} />
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface">
        <div className="flex flex-col w-full px-margin pb-48 space-y-space-md">
          {/* Top actions */}
          <div className="flex items-center justify-between pt-space-xs">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-transform active:scale-95"
              onClick={() => (isEdit ? navigate(`/invoice/${editId}`, { replace: true }) : navigate('/'))}
              type="button"
            >
              <Icon name="close" className="text-[18px]" />
              <span className="font-label-md text-label-md">Batal</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container-low transition-transform active:scale-95"
              onClick={() => save(false)}
              type="button"
            >
              <Icon name="bookmark" fill className="text-[18px]" />
              <span className="font-label-md text-label-md">{isEdit ? 'Simpan' : 'Simpan Draft'}</span>
            </button>
          </div>

          {/* Document type */}
          <div className={`w-full bg-surface-container-high p-1.5 rounded-2xl flex items-center shadow-inner ${isEdit ? 'opacity-70' : ''}`}>
            {[
              { key: 'invoice', icon: 'receipt_long', label: 'Invoice Tagihan' },
              { key: 'quote', icon: 'request_quote', label: 'Surat Penawaran' },
            ].map((t) => (
              <button
                key={t.key}
                className={doc.type === t.key ? segmentActive : segmentIdle}
                disabled={isEdit}
                onClick={() => changeType(t.key)}
                type="button"
              >
                <Icon name={t.icon} fill={doc.type === t.key} className="text-[18px]" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Informasi Dasar */}
          <div className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-sm space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SectionIcon name="badge" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Informasi Dasar</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm tracking-wider uppercase">
                {isEdit ? 'Mode Edit' : 'Auto-Generated'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
                <span>{doc.type === 'quote' ? 'Klien / Penerima Penawaran' : 'Klien / Penerima Tagihan'}</span>
                <span className="text-error font-body-sm">*Wajib</span>
              </label>
              <button
                className={`w-full min-h-12 py-2 px-3.5 bg-surface-container-low hover:bg-surface-container rounded-xl flex items-center justify-between text-left transition-colors ${
                  errors.client ? 'ring-2 ring-error/60' : ''
                }`}
                onClick={() => setClientSheet(true)}
                type="button"
              >
                {client ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {initials(client.name)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-label-lg text-label-lg text-on-surface font-semibold block truncate">{client.name}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">{client.email || client.phone}</span>
                    </div>
                  </div>
                ) : (
                  <span className="font-body-md text-body-md text-outline">Pilih klien...</span>
                )}
                <Icon name="unfold_more" className="text-on-surface-variant shrink-0 ml-2" />
              </button>
              {errors.client && <p className="font-body-sm text-body-sm text-error">{errors.client}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="docSubject">
                Perihal / Nama Proyek
              </label>
              <div className={`${fieldBox} h-12 px-3.5 flex items-center`}>
                <input
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                  id="docSubject"
                  onChange={(e) => update({ subject: e.target.value })}
                  placeholder="mis. Redesign Website & Instalasi Jaringan"
                  value={doc.subject}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant">Nomor Dokumen</label>
              <div className="h-12 px-3.5 bg-surface-container-low rounded-xl flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-on-surface font-bold tracking-wide">{doc.id}</span>
                <Icon name="lock" className="text-[18px] text-secondary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="issueDate">
                  Tgl Terbit
                </label>
                <div className={`${fieldBox} h-12 px-2.5 flex items-center`}>
                  <input
                    className="w-full bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none"
                    id="issueDate"
                    onChange={(e) => changeIssueDate(e.target.value)}
                    type="date"
                    value={doc.issueDate}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="dueDate">
                  {type.dueLabel}
                </label>
                <div className={`${fieldBox} h-12 px-2.5 flex items-center ${errors.dueDate ? 'ring-2 ring-error/60' : ''}`}>
                  <input
                    className="w-full bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none"
                    id="dueDate"
                    min={doc.issueDate}
                    onChange={(e) => {
                      if (!e.target.value) return
                      update({ dueDate: e.target.value })
                      setErrors((er) => ({ ...er, dueDate: undefined }))
                    }}
                    type="date"
                    value={doc.dueDate}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap -mt-1">
              {TERM_PRESETS.map((days) => (
                <button
                  key={days}
                  className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm transition-colors ${
                    termDays === days ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}
                  onClick={() => update({ dueDate: addDays(doc.issueDate, days) })}
                  type="button"
                >
                  {days} Hari
                </button>
              ))}
              {!TERM_PRESETS.includes(termDays) && termDays >= 0 && (
                <span className="font-label-sm text-label-sm text-secondary">{termDays} hari</span>
              )}
            </div>
            {errors.dueDate && <p className="font-body-sm text-body-sm text-error">{errors.dueDate}</p>}
          </div>

          {/* Rincian Jasa & Item */}
          <div className="w-full space-y-space-sm">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <SectionIcon name="format_list_bulleted" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Rincian Jasa &amp; Item</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-bold">
                {counts.service} Jasa · {counts.item} Item
              </span>
            </div>

            {doc.lines.length === 0 && (
              <div className={`w-full rounded-2xl border-2 border-dashed p-6 text-center ${errors.lines ? 'border-error/60' : 'border-outline-variant'}`}>
                <Icon name="playlist_add" className="text-[32px] text-primary" />
                <p className="font-label-lg text-label-lg text-on-surface mt-1">Belum ada rincian</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Pilih jasa atau item/sparepart dari master di bawah.</p>
                {errors.lines && <p className="font-body-sm text-body-sm text-error mt-1">{errors.lines}</p>}
              </div>
            )}

            {doc.lines.map((line, index) => (
              <LineItemCard
                key={line.id}
                error={errors[line.id]}
                index={index}
                line={line}
                master={line.refId ? (line.kind === 'service' ? findService(line.refId) : findItem(line.refId)) : null}
                onChange={(patch) => updateLine(line.id, patch)}
                onDelete={() => setDoc((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== line.id) }))}
              />
            ))}

            <div className="grid grid-cols-2 gap-2">
              <button
                className="h-12 rounded-2xl bg-surface-container-lowest text-primary hover:bg-surface-container-low font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
                onClick={() => setPicker('service')}
                type="button"
              >
                <Icon name="handyman" className="text-[20px]" />+ Jasa
              </button>
              <button
                className="h-12 rounded-2xl bg-surface-container-lowest text-secondary hover:bg-surface-container-low font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
                onClick={() => setPicker('item')}
                type="button"
              >
                <Icon name="inventory_2" className="text-[20px]" />+ Item / Sparepart
              </button>
            </div>
          </div>

          {/* Diskon & PPN */}
          <div className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <Icon name="percent" fill className="text-[20px]" />
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Diskon &amp; PPN</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Sesuai ketentuan perpajakan resmi</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">Resmi</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant flex justify-between">
                <span>Diskon (nominal)</span>
                {totals.discount > 0 && <span className="text-error font-semibold">- {formatRupiah(totals.discount)}</span>}
              </label>
              <CurrencyInput aria-label="Diskon" onChange={(discount) => update({ discount })} value={doc.discount} />
            </div>

            <div className="w-full bg-surface-container-low p-1 rounded-xl flex items-center">
              <button
                className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all ${
                  doc.taxActive ? 'text-on-surface-variant font-medium' : 'bg-surface-container-lowest text-on-surface font-bold shadow-sm'
                }`}
                onClick={() => update({ taxActive: false })}
                type="button"
              >
                Nonaktifkan PPN
              </button>
              <button
                className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 ${
                  doc.taxActive ? 'bg-surface-container-lowest text-secondary font-bold shadow-sm' : 'text-on-surface-variant font-medium'
                }`}
                onClick={() => update({ taxActive: true })}
                type="button"
              >
                <Icon name="check_circle" fill={doc.taxActive} className="text-[16px]" />
                Aktifkan PPN
              </button>
            </div>

            <div className={`p-3.5 rounded-xl bg-surface-container transition-all space-y-2.5 ${doc.taxActive ? '' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="ppnPercentInput">
                    Tarif PPN:
                  </label>
                  <input
                    className="w-16 h-8 text-center font-label-lg text-label-lg font-bold text-primary bg-surface-container-lowest rounded-lg shadow-inner focus:outline-none"
                    id="ppnPercentInput"
                    min="0"
                    onChange={(e) => {
                      setRateInput(e.target.value)
                      update({ taxRate: Math.max(parseFloat(e.target.value) || 0, 0) })
                    }}
                    type="number"
                    value={rateInput}
                  />
                  <span className="font-label-md text-label-md text-on-surface-variant font-bold">%</span>
                </div>
                <div className="text-right">
                  <span className="font-body-sm text-body-sm text-on-surface-variant block">Kalkulasi Pajak</span>
                  <span className="font-label-lg text-label-lg text-secondary font-bold">{formatRupiah(totals.tax)}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                {[11, 12].map((r) => (
                  <button
                    key={r}
                    className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm ${totals.taxRate === r ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest text-on-surface-variant'}`}
                    onClick={() => {
                      setRateInput(String(r))
                      update({ taxRate: r })
                    }}
                    type="button"
                  >
                    PPN {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <SectionIcon name="sticky_note_2" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                {doc.type === 'quote' ? 'Syarat & Ketentuan Tambahan' : 'Catatan untuk Klien'}
              </h2>
            </div>
            <textarea
              className="w-full px-3.5 py-3 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline resize-none focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1e40af]"
              onChange={(e) => update({ notes: e.target.value })}
              placeholder={
                doc.type === 'quote'
                  ? 'Satu ketentuan per baris, mis.\nDP 50% saat persetujuan\nGaransi sparepart 1 tahun'
                  : 'Opsional, dicetak di bagian Catatan dokumen.'
              }
              rows={3}
              value={doc.notes}
            />
          </div>

          {/* Sticky summary footer */}
          <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl px-margin pt-3 pb-safe shadow-[0_-8px_24px_rgba(11,28,48,0.08)]">
            <div className="max-w-md mx-auto space-y-2 pb-3">
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-1 gap-2">
                <span>
                  Subtotal: <span className="font-bold text-on-surface">{formatRupiah(totals.subtotal)}</span>
                </span>
                {totals.discount > 0 && <span className="text-error">Diskon: -{formatRupiah(totals.discount)}</span>}
                {doc.taxActive && (
                  <span className="text-secondary">
                    PPN ({totals.taxRate}%): <span className="font-bold">{formatRupiah(totals.tax)}</span>
                  </span>
                )}
              </div>
              <div className="leading-none">
                <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider mb-0.5">
                  {doc.type === 'quote' ? 'Total Penawaran' : 'Total Akhir Tagihan'}
                </span>
                <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-extrabold">{formatRupiah(totals.total)}</span>
              </div>
              <button
                className="w-full py-3.5 px-6 rounded-2xl bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(30,64,175,0.45)] hover:bg-primary transition-all active:scale-[0.98]"
                onClick={() => save(true)}
                type="button"
              >
                <span>{isEdit ? 'Simpan Perubahan' : 'Lanjut ke Pratinjau & Kirim'}</span>
                <Icon name={isEdit ? 'check_circle' : 'arrow_forward'} className="text-[22px]" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <ClientPicker
        open={clientSheet}
        selectedId={doc.clientId}
        onClose={() => setClientSheet(false)}
        onSelect={(clientId) => {
          update({ clientId })
          setErrors((e) => ({ ...e, client: undefined }))
          setClientSheet(false)
        }}
      />
      <MasterPicker
        open={Boolean(picker)}
        kind={picker || 'service'}
        lines={doc.lines}
        onClose={() => setPicker(null)}
        onKindChange={setPicker}
        onManual={addManual}
        onPick={pickMaster}
      />
      {toast}
    </div>
  )
}
