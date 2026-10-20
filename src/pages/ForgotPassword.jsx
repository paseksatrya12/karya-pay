import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import useTimeouts from '../hooks/useTimeouts.js'

const tabBase =
  'flex-1 min-h-[48px] px-2 py-2 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-1.5 transition-all'
const tabActive = 'shadow-sm bg-surface-container-lowest text-primary-container'
const tabInactive = 'text-on-surface-variant hover:text-on-surface'

const modes = {
  wa: {
    idleLabel: 'Kirim Kode OTP WhatsApp 📲',
    successLabel: 'Kode Terkirim ke WhatsApp ✓',
  },
  email: {
    idleLabel: 'Kirim Tautan Pemulihan Email ✉️',
    successLabel: 'Email Verifikasi Terkirim ✓',
  },
}

function useGoBack(fallback) {
  const navigate = useNavigate()
  return () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback))
}

function TopBar({ onBack }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] pt-safe">
      <div className="h-16 px-margin flex items-center justify-between">
        <button
          aria-label="Kembali"
          className="w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
          onClick={onBack}
          type="button"
        >
          <Icon name="arrow_back" className="text-[24px]" />
        </button>
        <div className="flex items-center gap-space-sm">
          <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
            <Icon name="payments" className="text-[18px]" />
          </div>
          <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface font-bold">
            Karya<span className="text-primary-container">Pay</span>
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/50 text-secondary">
            <Icon name="verified_user" className="text-[14px]" />
            <span className="font-label-sm text-label-sm font-semibold tracking-wide uppercase">TLS 256-bit</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1">
            <Icon name="person" className="text-on-primary text-[18px]" />
          </div>
        </div>
      </div>
    </header>
  )
}

function InfoNote({ icon, children }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-low mb-space-md">
      <Icon name={icon} className="text-primary-container text-[18px] shrink-0 mt-0.5" />
      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{children}</p>
    </div>
  )
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const goBack = useGoBack('/login')
  const later = useTimeouts()
  const [mode, setMode] = useState('wa')
  const [phone, setPhone] = useState('812 9840 2198')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const handleSendCode = () => {
    if (status !== 'idle') return
    setStatus('loading')
    later(() => {
      setStatus('success')
      if (mode === 'wa') later(() => navigate('/verifikasi-otp'), 1000)
      else later(() => setStatus('idle'), 3000)
    }, 900)
  }

  const buttonLabel =
    status === 'loading' ? 'Mengirim Permintaan OTP...' : status === 'success' ? modes[mode].successLabel : modes[mode].idleLabel

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-dvh">
      <TopBar onBack={goBack} />
      <main className="flex flex-col relative w-full pt-16 pb-safe bg-surface min-h-dvh px-margin">
        <div className="flex flex-col w-full pb-8">
          <div className="relative w-full overflow-hidden rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm mb-space-md">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-surface-container-high/40 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary-container/20 rounded-full blur-xl pointer-events-none" />
            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-space-md">
                <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-sm">
                  <Icon name="lock_reset" className="text-[36px]" fill />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md">
                  <Icon name="verified" className="text-[16px]" />
                </div>
              </div>
              <h1 className="font-headline-md text-headline-md text-on-surface mb-space-xs">Lupa Kata Sandi? 🔐</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px]">
                Jangan khawatir! Masukkan nomor WhatsApp atau email terdaftar untuk menerima OTP pemulihan akun.
              </p>
            </div>
          </div>

          <div className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-sm mb-space-md">
            <div className="flex items-center gap-space-sm p-1 bg-surface-container rounded-xl mb-space-md">
              <button
                className={`${tabBase} ${mode === 'wa' ? tabActive : tabInactive}`}
                onClick={() => setMode('wa')}
                type="button"
              >
                <Icon name="chat" className="text-[18px]" fill />
                <span className="truncate">
                  WhatsApp <span className="text-[11px] font-bold text-secondary">⚡ Instan</span>
                </span>
              </button>
              <button
                className={`${tabBase} ${mode === 'email' ? tabActive : tabInactive}`}
                onClick={() => setMode('email')}
                type="button"
              >
                <Icon name="mail" className="text-[18px]" />
                <span className="truncate">Email Akun</span>
              </button>
            </div>

            {mode === 'wa' ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="wa-input">
                    Nomor WhatsApp Terdaftar
                  </label>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-label-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    Aktif &amp; Terhubung
                  </span>
                </div>
                <div className="relative flex items-center w-full min-h-[52px] rounded-xl bg-surface-container-lowest shadow-sm mb-space-xs overflow-hidden">
                  <div className="flex items-center gap-1 pl-3 pr-2 py-3 bg-surface-container-low min-h-[52px] select-none">
                    <span className="text-[18px]">🇮🇩</span>
                    <span className="font-label-lg text-label-lg text-on-surface font-bold ml-1">+62</span>
                    <Icon name="arrow_drop_down" className="text-outline text-[16px]" />
                  </div>
                  <input
                    className="flex-1 min-w-0 min-h-[52px] px-3 font-headline-sm text-headline-sm text-on-surface bg-transparent focus:outline-none"
                    id="wa-input"
                    inputMode="numeric"
                    placeholder="812 3456 7890"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <button
                    aria-label="Hapus teks"
                    className="w-10 h-10 flex items-center justify-center text-outline hover:text-on-surface mr-1"
                    onClick={() => setPhone('')}
                    type="button"
                  >
                    <Icon name="cancel" className="text-[18px]" />
                  </button>
                </div>
                <InfoNote icon="info">
                  Kode OTP 6-digit dikirim resmi via bot KaryaPay terverifikasi. Bebas pulsa dan terkirim dalam 5 detik.
                </InfoNote>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="email-input">
                    Alamat Email KaryaPay
                  </label>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                    Pemulihan Cadangan
                  </span>
                </div>
                <div className="relative flex items-center w-full min-h-[52px] rounded-xl bg-surface-container-lowest shadow-sm mb-space-xs overflow-hidden">
                  <div className="flex items-center pl-3.5 pr-2 py-3 bg-surface-container-low min-h-[52px] text-outline">
                    <Icon name="alternate_email" className="text-[20px]" />
                  </div>
                  <input
                    className="flex-1 min-w-0 min-h-[52px] px-3 font-body-lg text-body-lg text-on-surface bg-transparent focus:outline-none"
                    id="email-input"
                    placeholder="nama@studioanda.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <InfoNote icon="mark_email_read">
                  Tautan reset aman dan PIN satu kali akan dikirimkan ke kotak masuk utama Anda. Periksa folder Spam bila belum tiba.
                </InfoNote>
              </div>
            )}

            <button
              className={`w-full min-h-[52px] py-3.5 px-space-md rounded-xl ${status === 'success' ? 'bg-secondary' : 'bg-primary-container'} text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md hover:bg-primary transition-all active:scale-[0.98]`}
              disabled={status !== 'idle'}
              onClick={handleSendCode}
              type="button"
            >
              <Icon name="send_to_mobile" className="text-[20px]" />
              <span>{buttonLabel}</span>
            </button>
          </div>

          <div className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-sm mb-space-md">
            <div className="flex items-center gap-space-sm mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary">
                <Icon name="security" className="text-[20px]" fill />
              </div>
              <div>
                <p className="font-label-lg text-label-lg text-on-surface">KaryaPay Shield Protection</p>
                <p className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">End-to-End Encryption</p>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              KaryaPay tidak pernah meminta kode sandi, nomor PIN transaksi, atau OTP via telepon maupun pesan pribadi. Waspadai segala
              bentuk penipuan.
            </p>
          </div>

          <div className="flex flex-col items-center gap-space-sm pt-2">
            <button
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-primary font-label-lg text-label-lg hover:bg-surface-container transition-colors"
              onClick={() => navigate('/login')}
              type="button"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              <span>
                Ingat kata sandi Anda? <span className="font-bold underline decoration-primary">Masuk Sekarang</span>
              </span>
            </button>
            <div className="flex items-center justify-center gap-3 mt-space-sm text-outline">
              <div className="flex items-center gap-1">
                <Icon name="account_balance" className="text-[16px]" />
                <span className="font-label-sm text-label-sm font-semibold tracking-wider uppercase">Standar BI</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <div className="flex items-center gap-1">
                <Icon name="verified" className="text-[16px]" />
                <span className="font-label-sm text-label-sm font-semibold tracking-wider uppercase">OJK Terdaftar</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-outline text-center mt-1">
              © 2025 KaryaPay Indonesia • Solusi Keuangan Kreator &amp; Freelancer
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
