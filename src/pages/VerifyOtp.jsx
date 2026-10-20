import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useToast } from '../components/Toast.jsx'
import useTimeouts from '../hooks/useTimeouts.js'

const OTP_LENGTH = 6
const RESEND_SECONDS = 48

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

function OtpBox({ value, focused, inputRef, index, onChange, onKeyDown, onPaste, onFocus, onBlur }) {
  const boxClass = focused
    ? 'bg-surface-container-lowest shadow-md text-primary-container'
    : value
      ? 'bg-surface-container-lowest shadow-sm text-on-surface'
      : 'bg-surface-container shadow-inner text-outline-variant'

  return (
    <div className={`relative w-12 h-14 rounded-xl flex items-center justify-center font-display text-display transition-all ${boxClass}`}>
      <input
        ref={inputRef}
        aria-label={`Digit ${index + 1}`}
        autoComplete={index === 0 ? 'one-time-code' : 'off'}
        className="absolute inset-0 w-full h-full bg-transparent text-center text-on-surface font-display text-display caret-transparent rounded-xl focus:outline-none"
        inputMode="numeric"
        maxLength={OTP_LENGTH}
        pattern="[0-9]*"
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {!value && focused && <span className="w-0.5 h-6 bg-primary-container rounded-full animate-pulse pointer-events-none" />}
      {!value && !focused && <span className="w-2 h-2 rounded-full bg-outline-variant/60 pointer-events-none" />}
    </div>
  )
}

export default function VerifyOtp() {
  const navigate = useNavigate()
  const goBack = useGoBack('/login')
  const later = useTimeouts()
  const [toast, showToast] = useToast()
  const [digits, setDigits] = useState(['8', '4', '2', '9', '', ''])
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS)
  const [status, setStatus] = useState('idle')
  const inputs = useRef([])

  const focusInput = (i) => inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus()

  useEffect(() => {
    focusInput(digits.findIndex((d) => !d))
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft])

  const fillFrom = (start, chars) => {
    const next = [...digits]
    chars.slice(0, OTP_LENGTH - start).forEach((c, k) => {
      next[start + k] = c
    })
    setDigits(next)
    focusInput(start + Math.min(chars.length, OTP_LENGTH - start))
  }

  const handleChange = (i) => (e) => {
    const chars = e.target.value.replace(/\D/g, '').split('')
    if (!chars.length) {
      setDigits((prev) => prev.map((d, k) => (k === i ? '' : d)))
      return
    }
    if (digits[i] && chars.length === 2) chars.splice(chars.indexOf(digits[i]), 1)
    fillFrom(i, chars)
  }

  const handleKeyDown = (i) => (e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      setDigits((prev) => prev.map((d, k) => (k === i - 1 ? '' : d)))
      focusInput(i - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusInput(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusInput(i + 1)
    }
  }

  const handlePaste = (i) => (e) => {
    const chars = e.clipboardData.getData('text').replace(/\D/g, '').split('')
    if (!chars.length) return
    e.preventDefault()
    fillFrom(i, chars)
  }

  const handleResend = () => {
    setTimeLeft(RESEND_SECONDS)
    setDigits(Array(OTP_LENGTH).fill(''))
    focusInput(0)
    showToast('Kode OTP baru dikirim ke WhatsApp Anda', 'chat')
  }

  const handleVerify = () => {
    if (status !== 'idle') return
    if (digits.some((d) => !d)) {
      showToast('Masukkan 6 digit kode OTP terlebih dahulu', 'error')
      focusInput(digits.findIndex((d) => !d))
      return
    }
    setStatus('loading')
    later(() => {
      setStatus('success')
      later(() => navigate('/'), 800)
    }, 1000)
  }

  const canResend = timeLeft <= 0
  const timerText = `00:${String(Math.max(timeLeft, 0)).padStart(2, '0')}`

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-dvh">
      <TopBar onBack={goBack} />
      <main className="flex flex-col relative w-full pt-16 pb-safe bg-surface min-h-dvh px-margin">
        <div className="flex flex-col w-full pb-8">
          {/* Subtle Top Decorative Glow */}
          <div className="relative w-full overflow-hidden pt-4 pb-2">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-36 bg-secondary-container/30 rounded-full blur-3xl pointer-events-none" />
            {/* Header Visual Badge */}
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-secondary-container/40 animate-ping opacity-75" />
                <div className="w-20 h-20 rounded-full bg-secondary-container/60 flex items-center justify-center shadow-md">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-inner">
                    <Icon name="chat" className="text-[32px]" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                  <Icon name="verified" className="text-[16px]" fill />
                </div>
              </div>
            </div>
          </div>

          {/* Title & Context */}
          <div className="flex flex-col items-center text-center mt-3 px-2">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Verifikasi Kode OTP 💬</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xs">
              Kode keamanan 6-digit telah dikirimkan via WhatsApp resmi KaryaPay ke nomor:
            </p>
            {/* Target Phone Pill with Edit Link */}
            <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-full bg-surface-container shadow-sm">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">+62 812-3456-7890</span>
              <button
                className="ml-1 text-primary-container font-label-md text-label-md underline hover:text-primary transition-colors flex items-center gap-0.5"
                onClick={goBack}
                type="button"
              >
                <span>Ubah</span>
                <Icon name="edit" className="text-[13px]" />
              </button>
            </div>
          </div>

          {/* 6-Digit OTP Interactive Input Matrix */}
          <div className="mt-8 px-1">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-sm mx-auto">
              {digits.map((digit, i) => (
                <OtpBox
                  key={i}
                  index={i}
                  value={digit}
                  focused={focusedIndex === i}
                  inputRef={(el) => (inputs.current[i] = el)}
                  onChange={handleChange(i)}
                  onKeyDown={handleKeyDown(i)}
                  onPaste={handlePaste(i)}
                  onFocus={(e) => {
                    setFocusedIndex(i)
                    e.target.select()
                  }}
                  onBlur={() => setFocusedIndex((f) => (f === i ? -1 : f))}
                />
              ))}
            </div>
            <div className="text-center mt-2.5">
              <span className="font-body-sm text-body-sm text-on-surface-variant/80 flex items-center justify-center gap-1">
                <Icon name="touch_app" className="text-[14px]" /> Ketuk kotak untuk input kode
              </span>
            </div>
          </div>

          {/* WhatsApp Verified Tip Callout */}
          <div className="mt-6 p-3.5 rounded-xl bg-secondary-container/40 text-on-secondary-container shadow-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center text-on-secondary mt-0.5">
              <Icon name="verified" className="text-[18px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-secondary font-bold flex items-center gap-1">Tips Keamanan WhatsApp</span>
              <p className="font-body-sm text-body-sm text-on-secondary-container/90 mt-0.5 leading-snug">
                Pastikan nomor WhatsApp aktif. Cek pesan masuk dari akun resmi bercentang hijau{' '}
                <span className="font-bold">“KaryaPay Notifikasi”</span>. Jangan berikan kode ini kepada siapapun!
              </p>
            </div>
          </div>

          {/* Resend Timer & Fallback Dispatch Options */}
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md">
              <Icon name="progress_activity" className={`text-[16px] text-primary ${canResend ? '' : 'animate-spin'}`} />
              <span>
                Kirim ulang kode dalam <span className="font-bold text-on-surface">{timerText}</span> detik
              </span>
            </div>
            <div className="w-full mt-4 flex flex-col gap-2.5">
              <button
                className={`w-full py-3 px-4 rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 transition-all ${
                  canResend
                    ? 'bg-secondary text-on-secondary shadow-sm active:scale-[0.98]'
                    : 'bg-surface-container text-on-surface-variant/50 cursor-not-allowed opacity-80'
                }`}
                disabled={!canResend}
                onClick={handleResend}
                type="button"
              >
                <Icon name="qr_code_2" className="text-[18px]" />
                <span>Kirim Ulang via WhatsApp</span>
              </button>
              <button
                className="w-full py-2.5 px-4 rounded-xl text-primary-container font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
                onClick={() => showToast('Mengirim kode via SMS...', 'sms')}
                type="button"
              >
                <Icon name="sms" className="text-[18px]" />
                <span>Kirim via SMS / Panggilan Suara</span>
              </button>
            </div>
          </div>

          {/* Primary CTA Action */}
          <div className="mt-6 pt-2">
            <button
              className={`w-full py-3.5 px-6 rounded-xl ${status === 'success' ? 'bg-secondary' : 'bg-primary-container'} text-on-primary font-headline-sm text-headline-sm font-semibold shadow-lg shadow-primary-container/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
              disabled={status !== 'idle'}
              onClick={handleVerify}
              type="button"
            >
              {status === 'idle' && (
                <>
                  <span>Verifikasi &amp; Lanjutkan</span>
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
                  <span>Verifikasi Berhasil</span>
                </>
              )}
            </button>
          </div>

          {/* Trust Seal & 24/7 CS Support */}
          <div className="mt-8 pt-4 border-t-0 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1 text-on-surface-variant/70 font-label-sm text-label-sm uppercase tracking-wider mb-2">
              <Icon name="lock" className="text-[14px]" />
              <span>Enkripsi Ujung-ke-Ujung Standar Perbankan</span>
            </div>
            <button
              className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary font-body-sm text-body-sm"
              onClick={() => showToast('Menghubungkan ke CS KaryaPay...', 'support_agent')}
              type="button"
            >
              <Icon name="support_agent" className="text-[17px] text-secondary" />
              <span>
                Butuh bantuan memulihkan akun? <strong className="text-primary font-semibold">Hubungi CS 24/7</strong>
              </span>
            </button>
          </div>
        </div>
      </main>
      {toast}
    </div>
  )
}
