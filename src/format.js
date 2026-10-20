// Format angka dengan pemisah ribuan lokal, mis. 15000000 -> "15.000.000"
export const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))
export const formatRupiah = (n) => `Rp ${formatNumber(n)}`

// Tanggal disimpan sebagai string ISO "YYYY-MM-DD" dan dibaca sebagai waktu lokal.
export const parseISODate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const toISODate = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const todayISO = () => toISODate(new Date())

export const addDays = (iso, days) => {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export const daysBetween = (fromIso, toIso) =>
  Math.round((parseISODate(toIso) - parseISODate(fromIso)) / 86400000)

// "26 Oktober 2024"
export const formatDate = (iso) =>
  iso ? parseISODate(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

// "26 Okt 2024"
export const formatDateShort = (iso) =>
  iso ? parseISODate(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

function spell(n) {
  const rest = (value, divisor) => (value % divisor ? ` ${spell(value % divisor)}` : '')
  if (n < 12) return satuan[n]
  if (n < 20) return `${spell(n - 10)} belas`
  if (n < 100) return `${spell(Math.floor(n / 10))} puluh${rest(n, 10)}`
  if (n < 200) return `seratus${rest(n, 100)}`
  if (n < 1000) return `${spell(Math.floor(n / 100))} ratus${rest(n, 100)}`
  if (n < 2000) return `seribu${rest(n, 1000)}`
  if (n < 1e6) return `${spell(Math.floor(n / 1000))} ribu${rest(n, 1000)}`
  if (n < 1e9) return `${spell(Math.floor(n / 1e6))} juta${rest(n, 1e6)}`
  if (n < 1e12) return `${spell(Math.floor(n / 1e9))} miliar${rest(n, 1e9)}`
  return `${spell(Math.floor(n / 1e12))} triliun${rest(n, 1e12)}`
}

// Terbilang rupiah, mis. 10545000 -> "Sepuluh juta lima ratus empat puluh lima ribu rupiah"
export function terbilang(amount) {
  const n = Math.round(Math.abs(amount || 0))
  const text = n === 0 ? 'nol rupiah' : `${spell(n)} rupiah`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const initials = (name = '') =>
  name
    .replace(/^(PT|CV|UD)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
