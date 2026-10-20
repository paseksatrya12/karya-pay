import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useToast } from '../components/Toast.jsx'
import useTimeouts from '../hooks/useTimeouts.js'
import AuthHeader from '../components/AuthHeader.jsx'
import { useAuth } from '../store/AuthProvider.jsx'

const inputClass =
  'w-full h-12 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none transition-colors'

const avatars = [
  {
    alt: 'Close up avatar profile of an Indonesian freelance graphic designer smiling with modern glasses in a bright workspace, soft indigo light',
    src: '/images/photo-09.jpg',
  },
  {
    alt: 'Close up avatar portrait of an energetic young female tech freelancer wearing a denim shirt in an architectural cafe setting',
    src: '/images/photo-10.jpg',
  },
  {
    alt: 'Close up avatar portrait of a confident male software consultant with a friendly look in minimalist studio lighting',
    src: '/images/photo-11.jpg',
  },
]

const trustMetrics = [
  { value: '100%', label: 'Sesuai PPN', color: 'text-primary-container' },
  { value: '3 Detik', label: 'Kirim WA', color: 'text-secondary' },
  { value: 'Rp 0', label: 'Setup Awal', color: 'text-primary' },
]

const strengthLevels = [
  { label: 'Belum Diisi', text: 'text-on-surface-variant', bars: 0, bar: '' },
  { label: 'Lemah', text: 'text-error', bars: 1, bar: 'bg-error' },
  { label: 'Cukup', text: 'text-tertiary-container', bars: 2, bar: 'bg-tertiary-container' },
  { label: 'Bagus', text: 'text-primary-container', bars: 3, bar: 'bg-primary-container' },
  { label: 'Sangat Kuat 🔒', text: 'text-secondary', bars: 4, bar: 'bg-secondary' },
]

function getStrength(val) {
  if (!val) return strengthLevels[0]
  let score = 0
  if (val.length >= 6) score++
  if (val.length >= 8 && /[A-Z]/.test(val)) score++
  if (/[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val)) score++
  return strengthLevels[Math.max(score, 1)]
}

const errorRing = 'shadow-[0_0_0_2px_#ba1a1a]'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function IconInput({ icon, error, className = 'pr-3.5', ...props }) {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
        <Icon name={icon} className="text-[20px]" />
      </div>
      <input aria-invalid={Boolean(error)} className={`${inputClass} pl-11 ${className} ${error ? errorRing : ''}`} {...props} />
    </div>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="font-body-sm text-body-sm text-error flex items-center gap-1">
      <Icon name="error" className="text-[15px]" />
      {message}
    </p>
  )
}

function Required() {
  return <span className="text-error">*</span>
}

function validate(form, password, agreed) {
  const errors = {}
  const phone = form.phone.replace(/\D/g, '').replace(/^(62|0)/, '')
  if (!form.name.trim()) errors.name = 'Nama lengkap wajib diisi.'
  if (!form.email.trim()) errors.email = 'Email kerja wajib diisi.'
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Format email tidak valid.'
  if (!phone) errors.phone = 'Nomor WhatsApp wajib diisi untuk verifikasi OTP.'
  else if (!/^8\d{7,11}$/.test(phone)) errors.phone = 'Nomor WhatsApp tidak valid, contoh: 812 3456 7890.'
  if (password.length < 8) errors.password = 'Kata sandi minimal 8 karakter.'
  if (!agreed) errors.agreed = 'Silakan setujui Syarat Layanan & Kebijakan Privasi.'
  return errors
}

export default function Register() {
  const navigate = useNavigate()
  const { startSignup } = useAuth()
  const later = useTimeouts()
  const [toast, showToast] = useToast()
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '' })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState('idle')
  const [errors, setErrors] = useState({})

  const strength = getStrength(password)

  const field = (key) => ({
    value: form[key],
    error: errors[key],
    onChange: (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
    },
  })

  const handleSubmit = () => {
    if (status !== 'idle') return
    const found = validate(form, password, agreed)
    setErrors(found)
    const firstKey = Object.keys(found)[0]
    if (firstKey) {
      document.getElementById(firstKey === 'agreed' ? 'termsCheck' : firstKey === 'phone' ? 'whatsapp' : firstKey)?.focus()
      return
    }
    setStatus('loading')
    later(() => {
      const result = startSignup({ ...form, password })
      if (!result.ok) {
        setStatus('idle')
        setErrors({ [result.field]: result.error })
        document.getElementById(result.field)?.focus()
        return
      }
      setStatus('success')
      later(() => navigate('/verifikasi-otp'), 700)
    }, 900)
  }

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-full flex flex-col">
      <AuthHeader />
      <main className="flex-1 flex flex-col relative w-full px-margin pb-safe bg-background">
        <div className="flex flex-col w-full pb-8">
          <div className="flex flex-col gap-space-lg">
            {/* Hero / Headline Box */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-sm">
                <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary-container">
                  <Icon name="verified" className="text-on-secondary-container text-[16px]" fill />
                  <span className="font-label-sm text-label-sm text-on-secondary-container">Daftar Gratis 14 Hari Pro</span>
                </div>
                <div className="flex items-center -space-x-2">
                  {avatars.map((avatar) => (
                    <div key={avatar.src} className="w-6 h-6 rounded-full overflow-hidden shadow-sm bg-surface-container-highest">
                      <img className="w-full h-full object-cover" alt={avatar.alt} src={avatar.src} />
                    </div>
                  ))}
                </div>
              </div>
              <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-space-xs">
                Mulai Kelola Invoice Profesional 🚀
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Buat invoice resmi, hitung PPN otomatis, dan terima bayaran langsung ke rekening atau e-wallet tanpa ribet.
              </p>
              {/* Trust Metrics Bar */}
              <div className="mt-space-md pt-space-sm grid grid-cols-3 gap-space-xs">
                {trustMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex flex-col items-center text-center p-2 rounded-lg bg-surface-container-lowest shadow-sm"
                  >
                    <span className={`font-headline-sm text-headline-sm ${metric.color}`}>{metric.value}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Social Onboarding */}
            <div className="flex flex-col gap-space-sm">
              <button
                className="w-full h-[50px] bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 rounded-xl shadow-sm flex items-center justify-center gap-space-sm active:scale-[0.98]"
                onClick={() => showToast('Daftar dengan Google belum tersedia. Silakan isi formulir.', 'info')}
                type="button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span className="font-label-lg text-label-lg text-on-surface">Daftar kilat dengan Google</span>
              </button>
              {/* Divider */}
              <div className="flex items-center gap-space-sm my-1">
                <div className="h-[1px] flex-1 bg-surface-container-highest" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">atau isi formulir pendaftaran</span>
                <div className="h-[1px] flex-1 bg-surface-container-highest" />
              </div>
            </div>

            {/* Registration Card Form */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              {/* Field: Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface flex items-center justify-between" htmlFor="name">
                  <span>
                    Nama Lengkap <Required />
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Sesuai KTP / Rekening</span>
                </label>
                <IconInput icon="person" id="name" placeholder="Contoh: Sarah Putri" type="text" autoComplete="name" {...field('name')} />
                <FieldError message={errors.name} />
              </div>

              {/* Field: Business / Studio Name */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="business">
                    Nama Usaha / Studio
                  </label>
                  <span className="font-label-sm text-label-sm text-secondary bg-surface-container-high px-2 py-0.5 rounded-full">
                    Kop Invoice Otomatis
                  </span>
                </div>
                <IconInput icon="storefront" id="business" placeholder="Contoh: Sarah Design & Code Lab" type="text" autoComplete="organization" {...field('business')} />
              </div>

              {/* Field: Work Email */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
                  Email Kerja <Required />
                </label>
                <IconInput icon="alternate_email" id="email" placeholder="sarah@studiokarya.com" type="email" autoComplete="email" {...field('email')} />
                <FieldError message={errors.email} />
              </div>

              {/* Field: WhatsApp Number */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="whatsapp">
                  Nomor WhatsApp Aktif <Required />
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none bg-surface-container-high py-1 px-2 rounded-lg">
                    <Icon name="chat" className="text-[18px] text-secondary" />
                    <span className="font-label-md text-label-md text-on-surface font-semibold">+62</span>
                  </div>
                  <input
                    aria-invalid={Boolean(errors.phone)}
                    className={`${inputClass} pl-24 pr-3.5 ${errors.phone ? errorRing : ''}`}
                    id="whatsapp"
                    inputMode="tel"
                    placeholder="812 3456 7890"
                    type="tel"
                    autoComplete="tel-national"
                    value={form.phone}
                    onChange={field('phone').onChange}
                  />
                </div>
                <FieldError message={errors.phone} />
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <Icon name="info" className="text-[15px] text-secondary" />
                  Untuk pengiriman invoice instan &amp; rekap status pembayaran ke klien.
                </p>
              </div>

              {/* Field: Password & Interactive Strength */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
                  Kata Sandi <Required />
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <Icon name="lock" className="text-[20px]" />
                  </div>
                  <input
                    aria-invalid={Boolean(errors.password)}
                    className={`${inputClass} pl-11 pr-12 ${errors.password ? errorRing : ''}`}
                    id="password"
                    placeholder="Minimal 8 karakter unik"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors((er) => ({ ...er, password: undefined }))
                    }}
                  />
                  <button
                    aria-label="Tampilkan sandi"
                    className="absolute right-2 w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    type="button"
                  >
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                  </button>
                </div>
                {/* Dynamic Visual Password Strength Meter */}
                <div className="flex flex-col gap-1.5 mt-1 bg-surface-container-low p-2.5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Kekuatan Sandi:</span>
                    <span className={`font-label-sm text-label-sm font-bold ${password ? strength.text : 'text-on-surface'}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-full rounded-full transition-colors duration-300 ${n <= strength.bars ? strength.bar : 'bg-surface-container-highest'}`}
                      />
                    ))}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <Icon name="shield" className="text-[14px]" />
                    Kombinasikan huruf besar, angka, dan simbol.
                  </span>
                </div>
                <FieldError message={errors.password} />
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-space-sm pt-space-xs cursor-pointer select-none">
                <input
                  className="mt-1 w-5 h-5 rounded text-primary-container bg-surface-container-low accent-primary-container focus:ring-0 cursor-pointer"
                  id="termsCheck"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked)
                    if (errors.agreed) setErrors((er) => ({ ...er, agreed: undefined }))
                  }}
                />
                <span className="font-body-sm text-body-sm text-on-surface leading-snug">
                  Saya menyetujui <span className="text-primary-container font-semibold">Syarat Layanan</span> &amp;{' '}
                  <span className="text-primary-container font-semibold">Kebijakan Privasi</span> KaryaPay untuk pengelolaan data invoice
                  &amp; transaksi.
                </span>
              </label>
              <FieldError message={errors.agreed} />

              {/* Main Action CTA Button */}
              <button
                className={`w-full h-[50px] ${status === 'success' ? 'bg-secondary' : 'bg-primary-container'} text-on-primary rounded-xl font-label-lg text-label-lg shadow-md flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mt-space-xs`}
                disabled={status !== 'idle'}
                onClick={handleSubmit}
                type="button"
              >
                {status === 'idle' && (
                  <>
                    <span>Buat Akun Gratis Sekarang</span>
                    <Icon name="arrow_forward" className="text-[20px]" />
                  </>
                )}
                {status === 'loading' && (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Menyiapkan Workspace...</span>
                  </>
                )}
                {status === 'success' && (
                  <>
                    <Icon name="check_circle" className="text-[20px]" />
                    <span>Akun Siap Digunakan!</span>
                  </>
                )}
              </button>
            </div>

            {/* Security Microcopy & Quick Guarantee */}
            <div className="flex items-center justify-center gap-space-sm text-center px-space-sm">
              <div className="inline-flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
                <Icon name="verified_user" className="text-[16px] text-secondary" />
                <span>Bebas biaya langganan awal</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span>Tanpa kartu kredit</span>
              </div>
            </div>

            {/* Footer Quick Login Switch */}
            <div className="flex flex-col items-center justify-center gap-1 pt-1 pb-2">
              <p className="font-body-md text-body-md text-on-surface-variant">Sudah memiliki akun aktif?</p>
              <Link className="inline-flex items-center gap-1 text-primary-container font-label-lg text-label-lg hover:underline py-1" to="/login">
                <span>Masuk ke Akun Saya</span>
                <Icon name="login" className="text-[18px]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      {toast}
    </div>
  )
}
