import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import BottomNav from '../components/BottomNav.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { useToast } from '../components/Toast.jsx'
import { useData } from '../store/DataProvider.jsx'
import { SIGNATURE_STORAGE_KEY, loadSignature } from '../store/templateSettings.js'

const PEN_COLOR = '#00288e'
const PEN_WIDTH = 2.75
const LOGO_URL =
  '/images/logo.png'
const AVATAR_URL =
  '/images/photo-01.jpg'

const LOGO_MAX_SIZE = 512

// Field profil yang diedit di form "Informasi Usaha"
const PROFILE_FIELDS = ['businessName', 'tagline', 'ownerName', 'ownerTitle', 'phone', 'email', 'website', 'address', 'city', 'npwp']

const pickProfileFields = (profile) => Object.fromEntries(PROFILE_FIELDS.map((key) => [key, profile[key] || '']))

const BANK_OPTIONS = ['BCA', 'Bank Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB Niaga', 'Permata', 'Danamon', 'BTN', 'Bank Jago', 'SeaBank']

const BANK_CODES = { bca: 'BCA', mandiri: 'MDR', bri: 'BRI', bni: 'BNI', bsi: 'BSI', cimb: 'CIMB', permata: 'PMT', danamon: 'DMN', btn: 'BTN', jago: 'JAGO', seabank: 'SEA' }

// Singkatan bank untuk ikon baris rekening, mis. "Bank Mandiri" -> "MDR"
function bankCode(name = '') {
  const lower = name.toLowerCase()
  const known = Object.keys(BANK_CODES).find((key) => lower.includes(key))
  if (known) return BANK_CODES[known]
  return name.replace(/^bank\s+/i, '').replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() || 'BANK'
}

const emptyBank = { bank: '', number: '', holder: '', primary: false }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass = 'w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none'

const signatureTabs = [
  { id: 'pad', icon: 'gesture', label: 'Gambar di Layar' },
  { id: 'upload', icon: 'cloud_upload', label: 'Unggah PNG' },
]

// Baca gambar lalu perkecil ke PNG (sisi terpanjang maks. `maxSize`). `width`/`height` = ukuran asli.
function imageFileToPng(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve({ src: canvas.toDataURL('image/png'), width: img.width, height: img.height })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

const logoFileName = (src = '') => (src.startsWith('data:') ? 'logo_kop_usaha.png' : src.split('/').pop() || 'logo_kop_usaha.png')

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

function applyPen(ctx) {
  ctx.strokeStyle = PEN_COLOR
  ctx.fillStyle = PEN_COLOR
  ctx.lineWidth = PEN_WIDTH
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function drawDot(ctx, p) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, PEN_WIDTH / 2, 0, Math.PI * 2)
  ctx.fill()
}

function drawStroke(ctx, pts) {
  if (pts.length === 1) return drawDot(ctx, pts[0])
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  const m = mid(pts[0], pts[1])
  ctx.lineTo(m.x, m.y)
  for (let i = 1; i < pts.length - 1; i++) {
    const next = mid(pts[i], pts[i + 1])
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, next.x, next.y)
  }
  const last = pts[pts.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}

function useSignaturePad(onStart) {
  const canvasRef = useRef(null)
  const strokes = useRef([])
  const current = useRef(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const context = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    applyPen(ctx)
    return ctx
  }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    applyPen(ctx)
    strokes.current.forEach((s) => drawStroke(ctx, s))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(rect.width * dpr)
      const h = Math.round(rect.height * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        redraw()
      }
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    window.addEventListener('resize', resize)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [redraw])

  const pointFrom = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = pointFrom(e)
    const stroke = [p]
    strokes.current.push(stroke)
    current.current = stroke
    const ctx = context()
    if (ctx) drawDot(ctx, p)
    setIsEmpty(false)
    onStart?.()
  }

  const onPointerMove = (e) => {
    const stroke = current.current
    if (!stroke) return
    const ctx = context()
    if (!ctx) return
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    const list = events.length ? events : [e.nativeEvent]
    list.forEach((ev) => {
      const p = pointFrom(ev)
      const prev = stroke[stroke.length - 1]
      if (Math.hypot(p.x - prev.x, p.y - prev.y) < 0.75) return
      stroke.push(p)
      const n = stroke.length
      ctx.beginPath()
      if (n === 2) {
        const m = mid(stroke[0], stroke[1])
        ctx.moveTo(stroke[0].x, stroke[0].y)
        ctx.lineTo(m.x, m.y)
      } else {
        const start = mid(stroke[n - 3], stroke[n - 2])
        const end = mid(stroke[n - 2], stroke[n - 1])
        ctx.moveTo(start.x, start.y)
        ctx.quadraticCurveTo(stroke[n - 2].x, stroke[n - 2].y, end.x, end.y)
      }
      ctx.stroke()
    })
  }

  const onPointerUp = () => {
    const stroke = current.current
    current.current = null
    if (!stroke || stroke.length < 2) return
    const ctx = context()
    if (!ctx) return
    const n = stroke.length
    const start = mid(stroke[n - 2], stroke[n - 1])
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(stroke[n - 1].x, stroke[n - 1].y)
    ctx.stroke()
  }

  const clear = () => {
    strokes.current = []
    current.current = null
    redraw()
    setIsEmpty(true)
  }

  const toDataURL = () => canvasRef.current.toDataURL('image/png')

  return {
    canvasRef,
    isEmpty,
    clear,
    toDataURL,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}

function SampleSignature() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 320 176" aria-hidden="true">
      <path
        d="M 45 110 C 65 70, 78 40, 95 65 C 105 85, 90 120, 110 115 C 130 110, 140 85, 160 92 C 175 97, 185 118, 205 105 C 225 90, 240 75, 275 88"
        fill="none"
        stroke={PEN_COLOR}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="282" cy="86" fill={PEN_COLOR} r="3.5" />
    </svg>
  )
}

function SectionHeader({ icon, title, children }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-space-xs text-primary">
        <Icon name={icon} className="text-[20px]" />
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, aside, children }) {
  return (
    <div>
      {aside ? (
        <div className="flex items-center justify-between mb-1">
          <label className="block font-label-md text-label-md text-on-surface-variant">{label}</label>
          {aside}
        </div>
      ) : (
        <label className="block font-label-md text-label-md text-on-surface-variant mb-1">{label}</label>
      )}
      {children}
    </div>
  )
}

function InputBox({ icon, iconClass = 'text-on-surface-variant', children }) {
  return (
    <div className="bg-surface-container-low rounded-lg px-space-md h-12 flex items-center">
      <Icon name={icon} className={`${iconClass} text-[20px] mr-2`} />
      {children}
    </div>
  )
}

function BankRow({ bank, onEdit }) {
  const code = bankCode(bank.bank)
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Ubah rekening ${bank.bank} ${bank.number}`}
      className="w-full text-left flex items-center justify-between p-space-md bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center gap-space-md min-w-0">
        <div
          className={`w-12 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center font-headline-sm font-bold shadow-sm flex-shrink-0 ${
            code.length > 3 ? 'text-[13px]' : ''
          } ${bank.primary ? 'text-primary' : 'text-secondary'}`}
        >
          {code}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-label-lg text-label-lg text-on-surface font-semibold tracking-wide truncate">{bank.number}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {bank.bank} · a.n. {bank.holder}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {bank.primary && <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary text-[10px] font-bold">Utama</span>}
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-outline" title="Ubah Rekening">
          <Icon name="more_vert" className="text-[18px]" />
        </span>
      </div>
    </button>
  )
}

// Lembar tambah / ubah rekening bank
function BankSheet({ bank, isOnlyBank, onClose, onSave, onDelete }) {
  const editing = Boolean(bank.id)
  const [form, setForm] = useState(() => ({ ...emptyBank, ...bank }))
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const primary = form.primary || isOnlyBank

  const submit = (e) => {
    e.preventDefault()
    if (!form.bank.trim() || !form.number.trim() || !form.holder.trim()) {
      setError('Nama bank, nomor rekening, dan atas nama wajib diisi.')
      return
    }
    onSave({ ...form, bank: form.bank.trim(), number: form.number.trim(), holder: form.holder.trim(), primary })
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={editing ? 'Ubah Rekening' : 'Tambah Rekening Bank'}
      subtitle="Dicetak sebagai tujuan transfer pada invoice"
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form="bank-form"
            className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-space-xs shadow-md transition-all active:scale-[0.98]"
          >
            <Icon name="check" className="text-[20px]" />
            <span>{editing ? 'Simpan Perubahan' : 'Simpan Rekening'}</span>
          </button>
          {editing &&
            (confirmDelete ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-10 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="h-10 rounded-xl bg-error text-on-error font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Icon name="delete" className="text-[18px]" />
                  <span>Ya, Hapus</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full h-10 text-error font-label-md text-label-md rounded-xl flex items-center justify-center gap-1.5 hover:bg-error-container/20 active:scale-95 transition-all"
              >
                <Icon name="delete" className="text-[18px]" />
                <span>Hapus Rekening</span>
              </button>
            ))}
        </div>
      }
    >
      <form id="bank-form" className="flex flex-col gap-space-sm pt-1" onSubmit={submit} noValidate>
        <Field label="Nama Bank">
          <InputBox icon="account_balance">
            <input className={inputClass} list="bank-options" placeholder="Contoh: BCA" type="text" value={form.bank} onChange={update('bank')} autoFocus={!editing} />
          </InputBox>
          <datalist id="bank-options">
            {BANK_OPTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
        <Field label="No. Rekening">
          <InputBox icon="pin">
            <input className={`${inputClass} tracking-wide`} placeholder="Contoh: 883-092-1144" type="text" inputMode="numeric" value={form.number} onChange={update('number')} />
          </InputBox>
        </Field>
        <Field label="Atas Nama">
          <InputBox icon="person">
            <input className={inputClass} placeholder="Nama pemilik rekening" type="text" value={form.holder} onChange={update('holder')} />
          </InputBox>
        </Field>
        <div className="flex items-center justify-between p-space-sm pl-space-md bg-surface-container-low rounded-lg">
          <div className="flex flex-col pr-2">
            <span className="font-label-lg text-label-lg text-on-surface font-semibold">Jadikan utama</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {isOnlyBank ? 'Rekening satu-satunya otomatis menjadi utama' : 'Ditampilkan paling atas pada invoice'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={primary}
            aria-label="Jadikan rekening utama"
            disabled={isOnlyBank}
            onClick={() => setForm((f) => ({ ...f, primary: !f.primary }))}
            className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 focus:outline-none active:scale-95 disabled:opacity-60 ${
              primary ? 'bg-secondary' : 'bg-outline-variant'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full bg-surface-container-lowest shadow-sm transform transition-transform flex items-center justify-center ${
                primary ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            >
              {primary && <Icon name="check" className="text-[14px] text-secondary" />}
            </span>
          </button>
        </div>
        {error && (
          <p className="font-body-sm text-body-sm text-error flex items-center gap-1" role="alert">
            <Icon name="error" className="text-[16px]" />
            {error}
          </p>
        )}
      </form>
    </BottomSheet>
  )
}

function MasterRow({ to, icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md hover:bg-surface-container-low transition-colors active:scale-[0.99]"
    >
      <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
        <Icon name={icon} className="text-[22px]" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{title}</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{subtitle}</span>
      </div>
      <Icon name="chevron_right" className="text-outline text-[22px] flex-shrink-0" />
    </Link>
  )
}

function QrPattern() {
  return (
    <svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 48 48" aria-hidden="true">
      <rect fill="none" height="14" rx="2" stroke="currentColor" strokeWidth="3" width="14" x="4" y="4" />
      <rect height="6" width="6" x="8" y="8" />
      <rect fill="none" height="14" rx="2" stroke="currentColor" strokeWidth="3" width="14" x="30" y="4" />
      <rect height="6" width="6" x="34" y="8" />
      <rect fill="none" height="14" rx="2" stroke="currentColor" strokeWidth="3" width="14" x="4" y="30" />
      <rect height="6" width="6" x="8" y="34" />
      <rect height="4" width="4" x="22" y="10" />
      <rect height="6" width="6" x="22" y="22" />
      <rect height="4" width="4" x="32" y="24" />
      <rect height="8" width="4" x="24" y="34" />
      <rect height="4" width="8" x="34" y="34" />
    </svg>
  )
}

export default function SignatureSettings() {
  const [toast, showToast] = useToast(2500)
  const { profile, saveProfile, services, items } = useData()
  const [info, setInfo] = useState(() => pickProfileFields(profile))
  const [bankSheet, setBankSheet] = useState(null)
  const [saved, setSaved] = useState(loadSignature)
  const [showSaved, setShowSaved] = useState(true)
  const [showSample, setShowSample] = useState(() => !loadSignature())
  const [mode, setMode] = useState('pad')
  const [upload, setUpload] = useState(null)
  const [sigSaving, setSigSaving] = useState(false)
  const [allSaving, setAllSaving] = useState(false)
  const [avatar, setAvatar] = useState(AVATAR_URL)
  const [logoInfo, setLogoInfo] = useState(() => ({ name: logoFileName(profile.logo), width: 0, height: 0, format: 'PNG' }))
  const avatarInput = useRef(null)
  const cameraInput = useRef(null)
  const galleryInput = useRef(null)
  const signatureInput = useRef(null)
  const objectUrls = useRef([])
  const timers = useRef([])

  const pad = useSignaturePad(() => {
    setShowSample(false)
    setShowSaved(false)
  })

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))

  const trackUrl = (file) => {
    const url = URL.createObjectURL(file)
    objectUrls.current.push(url)
    return url
  }

  const switchMode = (next) => {
    if (next === mode) return
    setMode(next)
    if (next === 'upload') showToast('Mode unggah gambar PNG aktif.', 'cloud_upload')
  }

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatar(trackUrl(file))
    showToast('Foto profil diperbarui.', 'photo_camera')
  }

  // Logo disimpan sebagai data URL PNG (maks. 512px) agar ikut tercetak di kop dokumen
  const handleLogo = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Format tidak didukung. Gunakan PNG atau JPG.', 'error')
      return
    }
    try {
      const { src, width, height } = await imageFileToPng(file, LOGO_MAX_SIZE)
      const format = file.type === 'image/png' ? 'PNG' : file.type === 'image/jpeg' ? 'JPG' : file.type.replace('image/', '').toUpperCase()
      saveProfile({ logo: src })
      setLogoInfo({ name: file.name, width, height, format, uploaded: true })
      showToast('Logo kop invoice diperbarui.', 'add_photo_alternate')
    } catch {
      showToast('Gambar tidak dapat dibaca.', 'error')
    }
  }

  // Ukuran logo tersimpan dibaca dari gambar pratinjau (kecuali baru diunggah: pakai ukuran asli)
  const measureLogo = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
    setLogoInfo((info) => (info.uploaded || (info.width === width && info.height === height) ? info : { ...info, width, height }))
  }

  const logoReady = Math.max(logoInfo.width, logoInfo.height) >= 500
  const logoMeta = logoInfo.width ? `Dimensi: ${logoInfo.width} x ${logoInfo.height} px • ${logoInfo.format}` : 'Memuat ukuran gambar…'

  const handleSignatureFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Pilih file gambar PNG/JPG.', 'error')
      return
    }
    try {
      const { src } = await imageFileToPng(file)
      setUpload({ src, name: file.name })
    } catch {
      showToast('Gambar tidak dapat dibaca.', 'error')
    }
  }

  const clearSignature = () => {
    if (mode === 'pad') {
      pad.clear()
      setShowSample(false)
      setShowSaved(false)
    } else {
      setUpload(null)
    }
    showToast('Area goresan dibersihkan. Silakan bubuhkan tanda tangan baru.', 'restart_alt')
  }

  const saveSignature = () => {
    if (sigSaving) return
    let dataUrl
    if (mode === 'pad') {
      if (pad.isEmpty) {
        showToast('Bubuhkan tanda tangan pada kanvas terlebih dahulu.', 'gesture')
        return
      }
      dataUrl = pad.toDataURL()
    } else {
      if (!upload) {
        showToast('Pilih file PNG tanda tangan terlebih dahulu.', 'cloud_upload')
        return
      }
      dataUrl = upload.src
    }
    setSigSaving(true)
    later(() => {
      setSigSaving(false)
      try {
        localStorage.setItem(SIGNATURE_STORAGE_KEY, dataUrl)
      } catch {
        showToast('Gagal menyimpan: penyimpanan perangkat penuh.', 'error')
        return
      }
      setSaved(dataUrl)
      setShowSaved(true)
      if (mode === 'pad') pad.clear()
      showToast('Tanda tangan digital tersimpan!', 'verified_user')
    }, 700)
  }

  const updateInfo = (field) => (e) => setInfo((f) => ({ ...f, [field]: e.target.value }))

  const saveAll = () => {
    if (allSaving) return
    const patch = Object.fromEntries(Object.entries(info).map(([key, value]) => [key, value.trim()]))
    if (!patch.businessName || !patch.ownerName) {
      showToast('Nama usaha dan nama penanda tangan wajib diisi.', 'error')
      return
    }
    if (patch.email && !EMAIL_PATTERN.test(patch.email)) {
      showToast('Format email faktur tidak valid.', 'error')
      return
    }
    setAllSaving(true)
    later(() => {
      setAllSaving(false)
      saveProfile(patch)
      setInfo(patch)
      showToast('Semua perubahan branding & profil berhasil disimpan.')
    }, 900)
  }

  // Rekening bank: selalu ada satu rekening utama
  const banks = profile.banks || []

  const saveBank = (bank) => {
    const id = bank.id || `bank-${Date.now().toString(36)}`
    let next = bank.id ? banks.map((b) => (b.id === id ? { ...b, ...bank } : b)) : [...banks, { ...bank, id }]
    if (bank.primary) next = next.map((b) => ({ ...b, primary: b.id === id }))
    if (!next.some((b) => b.primary)) next = next.map((b, i) => ({ ...b, primary: i === 0 }))
    saveProfile({ banks: next })
    setBankSheet(null)
    showToast(bank.id ? 'Rekening diperbarui.' : 'Rekening baru ditambahkan.', 'account_balance')
  }

  const deleteBank = () => {
    let next = banks.filter((b) => b.id !== bankSheet.id)
    if (next.length && !next.some((b) => b.primary)) next = next.map((b, i) => ({ ...b, primary: i === 0 }))
    saveProfile({ banks: next })
    setBankSheet(null)
    showToast('Rekening dihapus.', 'delete')
  }

  const padOverlay = !pad.isEmpty ? null : showSaved && saved ? (
    <img alt="Tanda tangan tersimpan" className="absolute inset-0 w-full h-full object-contain pointer-events-none" src={saved} />
  ) : showSample ? (
    <SampleSignature />
  ) : null

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-full">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(11,28,48,0.04)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img alt="KaryaPay Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold">KaryaPay</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none hidden">Pengaturan</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button type="button" aria-label="Notifikasi" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary relative transition-colors">
              <Icon name="notifications" className="text-[24px]" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface" />
            </button>
            <div className="w-11 h-11 flex items-center justify-center">
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={avatar} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full pb-8">
          {/* Profil */}
          <div className="px-margin pt-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center gap-space-md relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-surface-container rounded-full opacity-60 pointer-events-none" />
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm bg-surface-container">
                  <img alt={`${profile.ownerName} Profil`} className="w-full h-full object-cover" src={avatar} />
                </div>
                <button
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary-container transition-transform active:scale-90"
                  title="Ubah Foto"
                >
                  <Icon name="photo_camera" className="text-[16px]" />
                </button>
                <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </div>
              <div className="flex flex-col min-w-0 z-10">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <h1 className="font-headline-md text-headline-md text-on-surface truncate">{profile.ownerName || profile.businessName}</h1>
                  <span title="Terverifikasi" className="inline-flex">
                    <Icon name="verified" fill className="text-secondary text-[18px]" />
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{profile.email}</p>
                <div className="mt-space-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant self-start">
                  <Icon name="workspace_premium" fill className="text-[14px]" />
                  <span className="font-label-sm text-label-sm font-bold tracking-tight">Freelancer Pro Plan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Master */}
          <section className="px-margin mt-space-lg flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs text-primary">
              <Icon name="database" className="text-[20px]" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Data Master</h2>
            </div>
            <MasterRow to="/master/jasa" icon="handyman" title="Master Jasa" subtitle={`${services.length} jasa · harga default`} />
            <MasterRow to="/master/item" icon="inventory_2" title="Item & Sparepart" subtitle={`${items.length} item · stok & harga`} />
            <MasterRow to="/pengaturan/template" icon="palette" title="Template & Tampilan Cetak" subtitle="Layout, warna aksen & ukuran kertas" />
          </section>

          <div className="px-margin flex flex-col gap-space-lg mt-space-lg">
            {/* Informasi Usaha */}
            <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <SectionHeader icon="storefront" title="Informasi Usaha & Kontak" />
              <div className="flex flex-col gap-space-sm">
                <Field label="Nama Usaha / Studio">
                  <InputBox icon="badge">
                    <input className={inputClass} type="text" value={info.businessName} onChange={updateInfo('businessName')} />
                  </InputBox>
                </Field>
                <Field label="Tagline">
                  <InputBox icon="short_text">
                    <input className={inputClass} type="text" placeholder="Contoh: Jasa Servis & Instalasi Jaringan" value={info.tagline} onChange={updateInfo('tagline')} />
                  </InputBox>
                </Field>
                <Field
                  label="No. WhatsApp Bisnis"
                  aside={
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary">
                      <Icon name="check_circle" className="text-[14px]" /> Terhubung WhatsApp
                    </span>
                  }
                >
                  <div className="bg-surface-container-low rounded-lg px-space-md h-12 flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <Icon name="chat" className="text-secondary text-[20px] mr-2" />
                      <input className={inputClass} type="tel" inputMode="tel" value={info.phone} onChange={updateInfo('phone')} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">Terverifikasi</span>
                  </div>
                </Field>
                <Field label="Email Faktur & Dokumen">
                  <InputBox icon="mail">
                    <input className={inputClass} type="email" inputMode="email" value={info.email} onChange={updateInfo('email')} />
                  </InputBox>
                </Field>
                <Field label="Website (Opsional)">
                  <InputBox icon="language">
                    <input className={inputClass} type="text" inputMode="url" placeholder="usahaanda.id" value={info.website} onChange={updateInfo('website')} />
                  </InputBox>
                </Field>
                <Field label="Alamat Domisili Kantor / Studio">
                  <div className="bg-surface-container-low rounded-lg p-space-md flex items-start">
                    <Icon name="location_on" className="text-on-surface-variant text-[20px] mr-2 mt-0.5" />
                    <textarea className={`${inputClass} resize-none`} rows={2} value={info.address} onChange={updateInfo('address')} />
                  </div>
                </Field>
                <Field label="Kota (untuk tanggal surat)">
                  <InputBox icon="location_city">
                    <input className={inputClass} type="text" placeholder="Contoh: Jakarta" value={info.city} onChange={updateInfo('city')} />
                  </InputBox>
                </Field>
                <Field label="NPWP">
                  <InputBox icon="receipt_long">
                    <input className={`${inputClass} tracking-wide`} type="text" inputMode="numeric" placeholder="00.000.000.0-000.000" value={info.npwp} onChange={updateInfo('npwp')} />
                  </InputBox>
                </Field>
              </div>

              {/* Penanda tangan dokumen */}
              <div className="flex flex-col gap-space-sm pt-space-md border-t border-surface-container">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold flex items-center gap-1.5">
                  <Icon name="history_edu" className="text-primary text-[18px]" /> Penanda Tangan Dokumen
                </p>
                <Field label="Nama Pemilik / Penanda Tangan">
                  <InputBox icon="person">
                    <input className={inputClass} type="text" value={info.ownerName} onChange={updateInfo('ownerName')} />
                  </InputBox>
                </Field>
                <Field label="Jabatan">
                  <InputBox icon="work">
                    <input className={inputClass} type="text" placeholder="Contoh: Pemilik Usaha" value={info.ownerTitle} onChange={updateInfo('ownerTitle')} />
                  </InputBox>
                </Field>
              </div>
            </section>

            {/* Logo Kop Invoice */}
            <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <SectionHeader icon="palette" title="Logo Kop Invoice">
                <span className="px-2 py-1 bg-surface-container text-primary font-label-sm text-label-sm rounded-lg">Format Resmi</span>
              </SectionHeader>
              <div className="flex items-center gap-space-md p-space-md bg-surface-container-low rounded-xl">
                <div className="w-20 h-20 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-center p-2 flex-shrink-0">
                  {profile.logo ? (
                    <img alt={`Logo ${profile.businessName}`} className="w-full h-full object-contain" src={profile.logo} onLoad={measureLogo} />
                  ) : (
                    <Icon name="image" className="text-outline text-[32px]" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{profile.logo ? logoInfo.name : 'Belum ada logo'}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{profile.logo ? logoMeta : 'Unggah logo untuk kop dokumen'}</span>
                  {!profile.logo || !logoInfo.width ? null : logoReady ? (
                    <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                      <Icon name="task_alt" className="text-[14px]" /> Siap dicetak di kop dokumen
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1 text-error font-label-sm text-label-sm">
                      <Icon name="warning" className="text-[14px]" /> Resolusi di bawah 500px
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <button
                  type="button"
                  onClick={() => cameraInput.current?.click()}
                  className="h-12 bg-surface-container hover:bg-surface-variant text-primary font-label-md text-label-md rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-98"
                >
                  <Icon name="photo_camera" className="text-[18px]" />
                  <span>Foto Kamera</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInput.current?.click()}
                  className="h-12 bg-surface-container hover:bg-surface-variant text-primary font-label-md text-label-md rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-98"
                >
                  <Icon name="add_photo_alternate" className="text-[18px]" />
                  <span>Pilih Galeri HP</span>
                </button>
                <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleLogo} />
                <input ref={galleryInput} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogo} />
              </div>
              <div className="flex items-start gap-2 bg-surface-container-high/40 p-2.5 rounded-lg">
                <Icon name="info" className="text-outline text-[16px] mt-0.5" />
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Format PNG/JPG transparan min. 500x500px untuk kop invoice resmi beresolusi tinggi.
                </p>
              </div>
            </section>

            {/* Tanda Tangan Digital */}
            <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <SectionHeader icon="draw" title="Tanda Tangan Digital">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${saved ? 'bg-secondary' : 'bg-outline-variant'}`}
                  title={saved ? 'Status Aktif' : 'Belum Tersimpan'}
                />
              </SectionHeader>

              <div role="tablist" className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl">
                {signatureTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === tab.id}
                    onClick={() => switchMode(tab.id)}
                    className={`h-10 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all ${
                      mode === tab.id ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Icon name={tab.icon} className="text-[18px]" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="relative flex flex-col items-center">
                <div
                  className={`w-full h-44 bg-surface-container-low rounded-xl relative overflow-hidden flex items-center justify-center cursor-crosshair select-none touch-none shadow-inner ${
                    mode === 'pad' ? '' : 'hidden'
                  }`}
                >
                  <div className="absolute inset-x-8 bottom-10 flex flex-col items-center pointer-events-none">
                    <div className="w-full h-[1px] bg-outline-variant/70 border-b border-dashed border-outline" />
                    <span className="font-label-sm text-label-sm text-outline mt-1 tracking-wider uppercase text-[10px]">Garis Dasar Tanda Tangan</span>
                  </div>
                  {padOverlay}
                  <canvas ref={pad.canvasRef} className="absolute inset-0 w-full h-full touch-none" aria-label="Kanvas tanda tangan" {...pad.handlers} />
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] font-label-sm pointer-events-none">Kanvas Responsif Sentuh</span>
                </div>

                {mode === 'upload' && (
                  <button
                    type="button"
                    onClick={() => signatureInput.current?.click()}
                    className="w-full h-44 bg-surface-container-low rounded-xl relative overflow-hidden flex flex-col items-center justify-center gap-1.5 shadow-inner text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    {upload ? (
                      <>
                        <img alt="Pratinjau tanda tangan" className="absolute inset-0 w-full h-full object-contain p-4 pointer-events-none" src={upload.src} />
                        <span className="absolute top-3 right-3 max-w-[70%] truncate px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] font-label-sm">{upload.name}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="cloud_upload" className="text-[32px] text-primary" />
                        <span className="font-label-md text-label-md text-on-surface">Ketuk untuk memilih file PNG</span>
                        <span className="font-body-sm text-body-sm">Latar transparan, maks. 800px</span>
                      </>
                    )}
                  </button>
                )}
                <input ref={signatureInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleSignatureFile} />

                <div className="flex items-center justify-between w-full mt-space-sm gap-space-sm">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="h-10 px-4 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-error rounded-xl font-label-md text-label-md flex items-center gap-1.5 transition-colors active:scale-95"
                  >
                    <Icon name="restart_alt" className="text-[18px]" />
                    <span>Bersihkan (Clear)</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveSignature}
                    disabled={sigSaving}
                    className="h-10 px-4 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label-md text-label-md flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-80"
                  >
                    <Icon name={sigSaving ? 'progress_activity' : 'check'} className={`text-[18px] ${sigSaving ? 'animate-spin' : ''}`} />
                    <span>{sigSaving ? 'Menyimpan…' : 'Simpan Goresan'}</span>
                  </button>
                </div>
              </div>

              {saved ? (
                <div className="flex items-center gap-2 p-space-sm bg-secondary-container/50 rounded-lg text-on-secondary-fixed-variant">
                  <Icon name="verified_user" fill className="text-secondary text-[18px] flex-shrink-0" />
                  <p className="font-body-sm text-body-sm leading-tight">
                    Tanda tangan digital tersimpan &amp; akan otomatis disematkan pada dokumen penawaran &amp; invoice.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-space-sm bg-surface-container-low rounded-lg text-on-surface-variant">
                  <Icon name="info" className="text-outline text-[18px] flex-shrink-0" />
                  <p className="font-body-sm text-body-sm leading-tight">
                    Belum ada tanda tangan tersimpan. Bubuhkan goresan lalu tekan Simpan Goresan.
                  </p>
                </div>
              )}
            </section>

            {/* Rekening & QRIS */}
            <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <SectionHeader icon="account_balance" title="Rekening & QRIS">
                <button
                  className="text-primary font-label-md text-label-md flex items-center gap-0.5 hover:underline"
                  type="button"
                  onClick={() => setBankSheet({ ...emptyBank })}
                >
                  <Icon name="add" className="text-[16px]" /> Tambah Bank
                </button>
              </SectionHeader>
              <div className="flex flex-col gap-space-xs">
                {banks.map((bank) => (
                  <BankRow key={bank.id} bank={bank} onEdit={() => setBankSheet(bank)} />
                ))}
                {banks.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setBankSheet({ ...emptyBank })}
                    className="p-space-md bg-surface-container-low rounded-xl flex items-center gap-space-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    <Icon name="add_card" className="text-primary text-[22px]" />
                    <span className="font-body-sm text-body-sm text-left">Belum ada rekening. Tambahkan rekening tujuan transfer untuk invoice.</span>
                  </button>
                )}
              </div>
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="qr_code_scanner" className="text-secondary text-[20px]" />
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">QRIS Statis Toko</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">Semua e-Wallet</span>
                </div>
                <div className="flex items-center gap-space-md">
                  <div className="w-16 h-16 bg-surface-container-lowest rounded-lg p-1.5 shadow-sm flex items-center justify-center relative flex-shrink-0">
                    <QrPattern />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-md text-body-md text-on-surface font-semibold truncate">{profile.qrisNmid ? `NMID: ${profile.qrisNmid}` : 'NMID belum diatur'}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Menerima pembayaran Gopay, OVO, ShopeePay, Dana &amp; BCA Mobile</span>
                    <button type="button" className="mt-1 text-primary font-label-sm text-label-sm flex items-center gap-1 hover:underline self-start">
                      <Icon name="file_upload" className="text-[14px]" /> Ganti File QRIS
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Simpan */}
            <div className="pt-space-xs">
              <button
                type="button"
                onClick={saveAll}
                disabled={allSaving}
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-space-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-80"
              >
                <Icon name={allSaving ? 'progress_activity' : 'save'} className={`text-[20px] ${allSaving ? 'animate-spin' : ''}`} />
                <span>{allSaving ? 'Menyimpan…' : 'Simpan Seluruh Pengaturan'}</span>
              </button>
              <p className="text-center font-body-sm text-body-sm text-on-surface-variant mt-2">
                Perubahan profil otomatis diperbarui ke seluruh tautan invoice aktif.
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-20 right-margin z-40 pb-safe pointer-events-auto">
        <Link
          to="/invoice/baru"
          className="flex items-center gap-space-xs h-12 pl-space-md pr-space-lg rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_8px_24px_-4px_rgba(30,64,175,0.38)] active:scale-95 transition-all duration-150"
        >
          <Icon name="add" className="text-[22px]" />
          <span>Buat Dokumen</span>
        </Link>
      </div>
      <BottomNav />
      {bankSheet && (
        <BankSheet
          key={bankSheet.id || 'new'}
          bank={bankSheet}
          isOnlyBank={banks.length === 0 || (banks.length === 1 && banks[0].id === bankSheet.id)}
          onClose={() => setBankSheet(null)}
          onSave={saveBank}
          onDelete={deleteBank}
        />
      )}
      {toast}
    </div>
  )
}
