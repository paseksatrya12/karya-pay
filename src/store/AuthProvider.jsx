import { createContext, useContext, useEffect, useMemo, useState } from 'react'

// Autentikasi sisi browser (belum ada backend): akun di localStorage, sesi di localStorage
// ("Ingat Saya") atau sessionStorage. Hash sandi hanya agar sandi tidak tersimpan apa adanya,
// BUKAN pengamanan sungguhan — ganti dengan API server sebelum dipakai produksi.

const USERS_KEY = 'karyapay:users'
const SESSION_KEY = 'karyapay:session'
const PENDING_KEY = 'karyapay:pending-signup'

export const DEMO_ACCOUNT = { email: 'demo@karyapay.id', password: 'karyapay123' }

const AuthContext = createContext(null)

const normalizeEmail = (email = '') => email.trim().toLowerCase()

// cyrb53 diulang beberapa kali dengan email sebagai garam; deterministik di semua browser.
function hashPassword(email, password) {
  let input = `${normalizeEmail(email)}:${password}`
  let h1 = 0
  let h2 = 0
  for (let round = 0; round < 64; round++) {
    h1 = 0xdeadbeef ^ round
    h2 = 0x41c6ce57 ^ round
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    input = `${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}:${password}`
  }
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`
}

const readJSON = (storage, key) => {
  try {
    return JSON.parse(storage.getItem(key))
  } catch {
    return null
  }
}
const writeJSON = (storage, key, value) => {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, JSON.stringify(value))
  } catch {
    // penyimpanan diblokir / penuh
  }
}

const seedUsers = () => [
  {
    id: 'usr-demo',
    name: 'Sarah Putri',
    business: 'Sarah Design & Code Lab',
    email: DEMO_ACCOUNT.email,
    phone: '81234567890',
    passwordHash: hashPassword(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password),
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

const loadUsers = () => {
  const saved = readJSON(localStorage, USERS_KEY)
  return Array.isArray(saved) && saved.length ? saved : seedUsers()
}

const loadSession = () => readJSON(localStorage, SESSION_KEY) || readJSON(sessionStorage, SESSION_KEY)

const newOtpCode = () => String(Math.floor(100000 + Math.random() * 900000))

// "81234567890" / "081234567890" -> "+62 812-3456-7890"
export const formatPhone = (phone = '') => {
  const digits = phone.replace(/\D/g, '').replace(/^(62|0)/, '')
  if (!digits) return ''
  return `+62 ${digits.slice(0, 3)}-${digits.slice(3, 7)}${digits.length > 7 ? `-${digits.slice(7)}` : ''}`
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers)
  const [session, setSession] = useState(loadSession)
  const [pending, setPending] = useState(() => readJSON(sessionStorage, PENDING_KEY))
  // Pesan sekali tampil untuk halaman login setelah keluar (mis. "Anda telah keluar").
  const [logoutNotice, setLogoutNotice] = useState(null)

  useEffect(() => writeJSON(localStorage, USERS_KEY, users), [users])

  const api = useMemo(() => {
    const user = session ? users.find((u) => u.id === session.userId) || null : null

    const startSession = (account, remember) => {
      const next = { userId: account.id, loggedInAt: new Date().toISOString() }
      writeJSON(remember ? localStorage : sessionStorage, SESSION_KEY, next)
      writeJSON(remember ? sessionStorage : localStorage, SESSION_KEY, null)
      setSession(next)
      setLogoutNotice(null)
    }

    const checkCredentials = (email, password) => {
      const account = users.find((u) => u.email === normalizeEmail(email))
      if (!account) return { ok: false, field: 'email', error: 'Email belum terdaftar. Periksa kembali atau daftar akun baru.' }
      if (account.passwordHash !== hashPassword(account.email, password)) {
        return { ok: false, field: 'password', error: 'Kata sandi salah. Coba lagi atau gunakan Lupa Kata Sandi.' }
      }
      return { ok: true, user: account }
    }

    const checkSignupCode = (code) => {
      if (!pending) return { ok: false, error: 'Sesi pendaftaran berakhir. Silakan isi formulir pendaftaran lagi.' }
      if (code !== pending.code) return { ok: false, error: 'Kode OTP salah. Periksa kembali pesan WhatsApp Anda.' }
      return { ok: true }
    }

    const savePending = (next) => {
      writeJSON(sessionStorage, PENDING_KEY, next)
      setPending(next)
    }

    return {
      user,
      logoutNotice,
      pendingSignup: pending,

      // Cek email & sandi tanpa membuat sesi (dipakai untuk menampilkan error sebelum animasi masuk).
      checkCredentials: (email, password) => checkCredentials(email, password),

      login: (email, password, remember = true) => {
        const result = checkCredentials(email, password)
        if (result.ok) startSession(result.user, remember)
        return result
      },

      logout: (notice = null) => {
        setLogoutNotice(notice)
        writeJSON(localStorage, SESSION_KEY, null)
        writeJSON(sessionStorage, SESSION_KEY, null)
        setSession(null)
      },

      // Langkah 1 pendaftaran: simpan data sementara & "kirim" kode OTP ke WhatsApp.
      startSignup: ({ name, business, email, phone, password }) => {
        const normalized = normalizeEmail(email)
        if (users.some((u) => u.email === normalized)) {
          return { ok: false, field: 'email', error: 'Email sudah terdaftar. Silakan masuk ke akun Anda.' }
        }
        const code = newOtpCode()
        savePending({
          name: name.trim(),
          business: business.trim(),
          email: normalized,
          phone: phone.replace(/\D/g, '').replace(/^(62|0)/, ''),
          passwordHash: hashPassword(normalized, password),
          code,
          sentAt: Date.now(),
        })
        return { ok: true, code }
      },

      resendSignupCode: () => {
        if (!pending) return null
        const code = newOtpCode()
        savePending({ ...pending, code, sentAt: Date.now() })
        return code
      },

      checkSignupCode: (code) => checkSignupCode(code),

      // Langkah 2: cocokkan kode, buat akun, langsung masuk.
      verifySignup: (code) => {
        const result = checkSignupCode(code)
        if (!result.ok) return result
        const account = {
          id: `usr-${Date.now().toString(36)}`,
          name: pending.name,
          business: pending.business,
          email: pending.email,
          phone: pending.phone,
          passwordHash: pending.passwordHash,
          createdAt: new Date().toISOString(),
        }
        setUsers((prev) => [...prev, account])
        savePending(null)
        startSession(account, true)
        return { ok: true, user: account }
      },
    }
  }, [users, session, pending, logoutNotice])

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
