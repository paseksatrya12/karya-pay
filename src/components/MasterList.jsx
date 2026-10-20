import { useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'

// Komponen bersama untuk halaman Master Jasa & Master Item / Sparepart.

const PROFILE_URL = '/images/photo-01.jpg'

export const inputClass =
  'w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary'
export const labelClass = 'block font-label-md text-label-md text-on-surface font-semibold mb-1'

// Jumlah dokumen yang memakai tiap record master: { [refId]: n }
export function useUsageCounts(documents) {
  return useMemo(() => {
    const counts = {}
    for (const doc of documents || []) {
      const refs = new Set((doc.lines || []).map((l) => l.refId).filter(Boolean))
      refs.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1
      })
    }
    return counts
  }, [documents])
}

// Kategori unik + jumlahnya, urut abjad
export function categoryCounts(records) {
  const counts = {}
  for (const r of records) {
    const cat = r.category?.trim()
    if (cat) counts[cat] = (counts[cat] || 0) + 1
  }
  return Object.keys(counts)
    .sort((a, b) => a.localeCompare(b, 'id'))
    .map((name) => ({ name, count: counts[name] }))
}

// Header
export function MasterHeader({ title }) {
  const navigate = useNavigate()
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(11,28,48,0.04)]">
      <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-xs min-w-0">
          <button
            aria-label="Kembali"
            className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-on-surface hover:text-primary active:scale-95 transition-all"
            type="button"
            onClick={() => navigate(-1)}
          >
            <Icon name="arrow_back" className="text-[24px]" />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold truncate">{title}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">Data Master</span>
          </div>
        </div>
        <Link to="/pengaturan/template" aria-label="Profil" className="w-11 h-11 flex items-center justify-center flex-shrink-0">
          <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={PROFILE_URL} />
        </Link>
      </div>
    </header>
  )
}

// Segmented switch Master Jasa <-> Item & Sparepart
export function MasterSwitch({ serviceCount, itemCount }) {
  const tabs = [
    { to: '/master/jasa', icon: 'handyman', label: 'Jasa', count: serviceCount },
    { to: '/master/item', icon: 'inventory_2', label: 'Item & Sparepart', count: itemCount },
  ]
  return (
    <nav aria-label="Jenis data master" className="px-margin pt-space-md">
      <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container-high rounded-xl">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            replace
            className={({ isActive }) =>
              `h-9 rounded-lg flex items-center justify-center gap-1.5 font-label-md text-label-md transition-all ${
                isActive ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            <Icon name={t.icon} className="text-[18px]" />
            <span className="truncate">{t.label}</span>
            <span className="text-outline">({t.count})</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// Judul + tombol tambah
export function MasterTitle({ title, count, countLabel, note, addLabel, addIcon, onAdd }) {
  return (
    <div className="px-margin pt-space-md pb-space-xs flex items-center justify-between gap-space-sm">
      <div className="flex flex-col min-w-0">
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">{title}</h1>
        <div className="flex items-center gap-space-xs mt-0.5 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
            {count} {countLabel}
          </span>
          {note && (
            <>
              <span className="font-body-sm text-body-sm text-outline-variant">•</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{note}</span>
            </>
          )}
        </div>
      </div>
      <button
        className="h-10 px-space-md bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0"
        type="button"
        onClick={onAdd}
      >
        <Icon name={addIcon} className="text-[18px]" />
        <span>{addLabel}</span>
      </button>
    </div>
  )
}

// Catatan harga default
export function PriceNote({ className = '' }) {
  return (
    <div className={`flex items-start gap-2 p-space-sm rounded-xl bg-primary-fixed/50 text-on-primary-fixed-variant ${className}`}>
      <Icon name="info" className="text-[18px] flex-shrink-0 mt-px" />
      <p className="font-body-sm text-body-sm">
        Harga di master adalah <b className="font-semibold">harga default</b>. Nominal tetap bisa diubah per dokumen saat membuat invoice / penawaran.
      </p>
    </div>
  )
}

// Pencarian + chip kategori
export function SearchAndFilter({ query, onQuery, placeholder, categories, total, filter, onFilter }) {
  const searchRef = useRef(null)
  return (
    <div className="px-margin mt-space-sm flex flex-col gap-space-sm">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
          <Icon name="search" className="text-[20px]" />
        </div>
        <input
          ref={searchRef}
          className="w-full h-12 pl-10 pr-10 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:shadow-md transition-all placeholder:text-outline"
          placeholder={placeholder}
          type="text"
          aria-label={placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query.length > 0 && (
          <button
            aria-label="Hapus pencarian"
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface"
            type="button"
            onClick={() => {
              onQuery('')
              searchRef.current?.focus()
            }}
          >
            <Icon name="cancel" className="text-[18px]" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-margin px-margin no-scrollbar">
        {[{ name: 'all', label: 'Semua', count: total }, ...categories.map((c) => ({ ...c, label: c.name }))].map((c) => {
          const active = filter === c.name
          return (
            <button
              key={c.name}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all ${
                active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
              }`}
              type="button"
              aria-pressed={active}
              onClick={() => onFilter(c.name)}
            >
              {c.label} ({c.count})
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, text, actionLabel, onAction }) {
  return (
    <div className="px-margin py-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-space-sm">
        <Icon name={icon} className="text-[32px]" />
      </div>
      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</span>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-1">{text}</p>
      <button
        className="mt-4 px-space-md py-2 bg-surface-container-high text-primary font-label-md text-label-md rounded-xl active:scale-95 transition-all"
        type="button"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  )
}

// Kartu daftar (badge kode, nama, kategori, deskripsi, harga)
export function MasterCard({ code, name, meta, description, priceLabel, pills, usage, muted, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl p-space-md shadow-sm active:scale-98 transition-all flex flex-col gap-2 ${
        muted ? 'bg-surface-container-low opacity-70' : 'bg-surface-container-lowest'
      }`}
    >
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex flex-col min-w-0 gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm tabular-nums">
              {code}
            </span>
            {meta && <span className="font-label-md text-label-md text-on-surface-variant truncate">{meta}</span>}
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug">{name}</span>
          {description && <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{description}</span>}
        </div>
        <Icon name="chevron_right" className="text-[20px] text-outline flex-shrink-0 mt-0.5" />
      </div>
      <div className="flex items-end justify-between gap-space-sm pt-2 border-t border-surface-container">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {pills}
          {usage > 0 && (
            <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
              <Icon name="description" className="text-[14px]" />
              Dipakai di {usage} dokumen
            </span>
          )}
        </div>
        <span className="font-label-lg text-label-lg text-primary font-bold whitespace-nowrap tabular-nums">{priceLabel}</span>
      </div>
    </button>
  )
}

const pillTones = {
  neutral: 'bg-surface-container-high text-on-surface-variant',
  success: 'bg-secondary-container/60 text-on-secondary-fixed-variant',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-error-container text-on-error-container',
}

export function Pill({ tone = 'neutral', icon, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${pillTones[tone]}`}>
      {icon && <Icon name={icon} className="text-[13px]" />}
      {children}
    </span>
  )
}

// Field: error inline
export function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1 font-body-sm text-body-sm text-error flex items-center gap-1" role="alert">
      <Icon name="error" className="text-[15px]" />
      {children}
    </p>
  )
}

// Field: kategori dengan saran dari data yang ada
export function CategoryField({ id, value, onChange, suggestions, placeholder }) {
  const listId = `${id}-list`
  const shown = suggestions.filter((s) => s !== value).slice(0, 8)
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        Kategori
      </label>
      <input id={id} list={listId} className={inputClass} placeholder={placeholder} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {shown.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {shown.map((s) => (
            <button
              key={s}
              type="button"
              className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:text-primary active:scale-95 transition-all"
              onClick={() => onChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Field: satuan (chip preset + satuan lain)
export function UnitField({ id, value, onChange, options }) {
  const [custom, setCustom] = useState(() => Boolean(value) && !options.includes(value))
  const chip = (active) =>
    `px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
      active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:text-primary'
    }`
  return (
    <fieldset>
      <legend className={labelClass}>Satuan</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((u) => (
          <button
            key={u}
            type="button"
            aria-pressed={!custom && value === u}
            className={chip(!custom && value === u)}
            onClick={() => {
              setCustom(false)
              onChange(u)
            }}
          >
            {u}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={custom}
          className={`${chip(custom)} inline-flex items-center gap-1`}
          onClick={() => {
            setCustom(true)
            if (options.includes(value)) onChange('')
          }}
        >
          <Icon name="edit" className="text-[14px]" />
          Lainnya
        </button>
      </div>
      {custom && (
        <div className="mt-2">
          <label className="sr-only" htmlFor={id}>
            Satuan lainnya
          </label>
          <input
            id={id}
            className={inputClass}
            placeholder="Tulis satuan, mis. Lot, Sesi, Pasang"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
          />
        </div>
      )}
    </fieldset>
  )
}

// Toggle switch berlabel
export function ToggleRow({ id, label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-space-sm p-space-sm rounded-xl bg-surface-container-low">
      <div className="flex flex-col min-w-0">
        <label htmlFor={id} className="font-label-lg text-label-lg text-on-surface">
          {label}
        </label>
        {hint && <span className="font-body-sm text-body-sm text-on-surface-variant">{hint}</span>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-secondary' : 'bg-outline-variant'}`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

// Footer lembar: Simpan + hapus dengan konfirmasi tap kedua
export function SheetFooter({ formId, editing, usage, onDelete, entity }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      {confirming && (
        <p className="font-body-sm text-body-sm text-on-error-container bg-error-container/50 rounded-lg px-3 py-2 flex items-start gap-1.5" role="alert">
          <Icon name="warning" className="text-[16px] flex-shrink-0 mt-px" />
          <span>
            Hapus {entity.toLowerCase()} ini dari master?
            {usage > 0 ? ` Baris di ${usage} dokumen tetap tersimpan apa adanya.` : ''} Tap sekali lagi untuk konfirmasi.
          </span>
        </p>
      )}
      <div className="flex items-center gap-2">
        {editing && (
          <button
            type="button"
            aria-label={confirming ? `Ya, hapus ${entity.toLowerCase()}` : `Hapus ${entity.toLowerCase()}`}
            className={`h-12 rounded-xl flex items-center justify-center gap-1.5 font-label-lg text-label-lg active:scale-95 transition-all flex-shrink-0 ${
              confirming ? 'px-space-md bg-error text-on-error shadow-sm' : 'w-12 bg-error-container/60 text-error'
            }`}
            onClick={() => (confirming ? onDelete() : setConfirming(true))}
          >
            <Icon name="delete" className="text-[20px]" />
            {confirming && <span>Ya, Hapus</span>}
          </button>
        )}
        <button
          type="submit"
          form={formId}
          className="flex-1 h-12 bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <Icon name="check" className="text-[20px]" />
          <span>{editing ? 'Simpan Perubahan' : 'Simpan'}</span>
        </button>
      </div>
    </div>
  )
}
