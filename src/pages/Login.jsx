import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useToast } from '../components/Toast.jsx'
import useTimeouts from '../hooks/useTimeouts.js'
import AuthHeader from '../components/AuthHeader.jsx'

const inputClass =
  'w-full h-12 pl-11 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_2px_#1e40af] transition-all'

const heroImage =
  '/images/photo-08.jpg'

function GoogleLogo() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4" />
      <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853" />
      <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
    </svg>
  )
}

function GitHubLogo() {
  return (
    <svg className="w-5 h-5 flex-shrink-0 fill-on-surface" viewBox="0 0 24 24">
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

const oauthProviders = [
  { name: 'Google', logo: <GoogleLogo /> },
  { name: 'GitHub', logo: <GitHubLogo /> },
]

export default function Login() {
  const navigate = useNavigate()
  const later = useTimeouts()
  const [toast, showToast] = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [status, setStatus] = useState('idle')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (status !== 'idle') return
    setStatus('loading')
    later(() => {
      setStatus('success')
      later(() => navigate('/'), 800)
    }, 1200)
  }

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-full flex flex-col">
      <AuthHeader />
      <main className="flex-1 flex flex-col relative w-full px-margin pb-safe bg-background">
        <div className="flex flex-col w-full pb-space-xl">
          {/* Visual Hero */}
          <div className="relative w-full rounded-xl overflow-hidden mb-space-md shadow-sm">
            <div
              role="img"
              aria-label="Modern creative freelancer working on an invoice on a sleek tablet in a sunlit Scandinavian style cafe studio, vibrant warm lighting, clean desk with artisan coffee and stationery, indigo aesthetic accents, tactile modern photography."
              className="w-full h-36 bg-cover bg-center"
              style={{ backgroundImage: `url('${heroImage}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent flex flex-col justify-end p-space-md">
              <div className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container self-start mb-1">
                <Icon name="verified" className="text-[14px]" fill />
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Freelancer Hub</span>
              </div>
              <p className="font-headline-sm text-headline-sm text-on-primary">Solusi Invoice &amp; Penawaran Cepat</p>
            </div>
          </div>

          {/* Welcome Greeting */}
          <div className="flex flex-col gap-1 mb-space-lg">
            <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-1.5">
              Selamat Datang Kembali <span className="text-secondary select-none">👋</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Masuk untuk kelola invoice, penawaran harga, dan settlement instan klien Anda.
            </p>
          </div>

          {/* Main Login Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
            <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
              {/* Input: Email */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-lg text-label-lg text-on-surface" htmlFor="emailInput">
                  Alamat Email
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-outline">
                    <Icon name="mail" className="text-[20px]" />
                  </div>
                  <input
                    autoComplete="email"
                    className={`${inputClass} pr-4`}
                    id="emailInput"
                    inputMode="email"
                    name="email"
                    placeholder="freelancer@studio.id"
                    required
                    type="email"
                  />
                </div>
              </div>

              {/* Input: Password */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-lg text-label-lg text-on-surface" htmlFor="passwordInput">
                  Kata Sandi
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-outline">
                    <Icon name="lock" className="text-[20px]" />
                  </div>
                  <input
                    autoComplete="current-password"
                    className={`${inputClass} pr-12`}
                    id="passwordInput"
                    name="password"
                    placeholder="Masukkan kata sandi"
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                    className="absolute right-1 w-11 h-11 flex items-center justify-center rounded-lg text-outline hover:text-on-surface active:scale-95 transition-transform"
                    onClick={() => setShowPassword((v) => !v)}
                    type="button"
                  >
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[22px]" />
                  </button>
                </div>
              </div>

              {/* Options Row: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="sr-only peer"
                    id="rememberMe"
                    name="remember"
                    type="checkbox"
                  />
                  <div className="w-5 h-5 rounded bg-surface-container-high peer-checked:bg-primary-container peer-focus-visible:ring-2 peer-focus-visible:ring-primary-container/40 flex items-center justify-center text-on-primary transition-colors">
                    <Icon name="check" className={`text-[16px] transition-transform ${remember ? 'scale-100' : 'scale-0'}`} />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">Ingat Saya</span>
                </label>
                <Link
                  className="font-label-md text-label-md text-primary-container hover:underline active:opacity-80 py-1"
                  to="/lupa-kata-sandi"
                >
                  Lupa Kata Sandi?
                </Link>
              </div>

              {/* Submit CTA Button */}
              <button
                className={`w-full h-[50px] mt-1 ${status === 'success' ? 'bg-secondary' : 'bg-primary-container'} text-on-primary rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(30,64,175,0.3)] active:scale-[0.98] transition-all`}
                disabled={status !== 'idle'}
                type="submit"
              >
                {status === 'idle' && (
                  <>
                    <span>Masuk ke KaryaPay</span>
                    <Icon name="arrow_forward" className="text-[20px]" />
                  </>
                )}
                {status === 'loading' && (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin inline-block" />
                    <span>Memverifikasi...</span>
                  </>
                )}
                {status === 'success' && (
                  <>
                    <Icon name="check_circle" className="text-[20px]" />
                    <span>Berhasil Masuk</span>
                  </>
                )}
              </button>
            </form>

            {/* Social Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-surface-container-high" />
              </div>
              <span className="relative px-3 bg-surface-container-lowest font-label-sm text-label-sm text-outline uppercase tracking-wider">
                atau masuk lebih cepat dengan
              </span>
            </div>

            {/* Social Auth Buttons */}
            <div className="flex flex-col gap-space-sm">
              {oauthProviders.map(({ name, logo }) => (
                <button
                  key={name}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low text-on-surface flex items-center justify-center gap-3 font-label-lg text-label-lg shadow-sm active:bg-surface-container active:scale-[0.99] transition-all"
                  onClick={() => showToast(`Menghubungkan ke ${name}...`, 'sync')}
                  type="button"
                >
                  {logo}
                  <span>Lanjutkan dengan {name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sign-up Redirect Callout */}
          <div className="mt-space-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Belum punya akun KaryaPay?{' '}
              <Link
                className="font-label-lg text-label-lg text-secondary inline-flex items-center gap-0.5 hover:underline active:opacity-80 ml-1"
                to="/register"
              >
                <span>Daftar Sekarang</span>
                <Icon name="chevron_right" className="text-[16px]" />
              </Link>
            </p>
          </div>

          {/* Trust & Compliance Micro-Badge */}
          <div className="mt-space-lg flex items-center justify-center gap-2 text-on-surface-variant/80">
            <Icon name="encrypted" className="text-[18px] text-secondary" />
            <span className="font-label-sm text-label-sm">Dilindungi enkripsi data perbankan 256-bit standar BI &amp; OJK</span>
          </div>
        </div>
      </main>
      {toast}
    </div>
  )
}
