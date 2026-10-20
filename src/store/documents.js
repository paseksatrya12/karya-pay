// Aturan bisnis dokumen (invoice & penawaran) yang dipakai form, detail, dan cetak.

export const DOC_TYPES = {
  invoice: {
    label: 'Invoice',
    prefix: 'INV',
    title: 'INVOICE',
    numberLabel: 'No. Invoice',
    dueLabel: 'Jatuh Tempo',
    defaultTermDays: 14,
  },
  quote: {
    label: 'Penawaran',
    prefix: 'QUO',
    title: 'SURAT PENAWARAN HARGA',
    numberLabel: 'No. Penawaran',
    dueLabel: 'Berlaku Hingga',
    defaultTermDays: 30,
  },
}

export const DOC_STATUS = {
  draft: { label: 'Draft' },
  sent: { label: 'Terkirim' },
  paid: { label: 'Lunas' },
  overdue: { label: 'Jatuh Tempo' },
  accepted: { label: 'Disetujui' },
  rejected: { label: 'Ditolak' },
}

export const LINE_KINDS = {
  service: { label: 'Jasa', groupTitle: 'Jasa / Pekerjaan', icon: 'handyman' },
  item: { label: 'Item / Sparepart', groupTitle: 'Item / Sparepart', icon: 'inventory_2' },
}

export const SERVICE_UNITS = ['Paket', 'Jam', 'Hari', 'Bulan', 'Screen', 'Halaman', 'Titik', 'Unit', 'Kunjungan', 'Proyek']
export const ITEM_UNITS = ['Pcs', 'Unit', 'Set', 'Meter', 'Roll', 'Box', 'Lisensi', 'Tahun', 'Liter', 'Kg']

export const lineTotal = (line) => Math.round((Number(line.qty) || 0) * (Number(line.price) || 0))

export function documentTotals(doc) {
  const lines = doc.lines || []
  const sumKind = (kind) => lines.filter((l) => l.kind === kind).reduce((s, l) => s + lineTotal(l), 0)
  const services = sumKind('service')
  const items = sumKind('item')
  const subtotal = services + items
  const discount = Math.min(Math.max(Number(doc.discount) || 0, 0), subtotal)
  const dpp = subtotal - discount
  const taxRate = Number(doc.taxRate) || 0
  const tax = doc.taxActive ? Math.round((dpp * taxRate) / 100) : 0
  return { services, items, subtotal, discount, dpp, taxRate, tax, total: dpp + tax }
}

// Kelompokkan baris per jenis, urutan Jasa lalu Item/Sparepart.
export const groupLines = (lines = []) =>
  Object.keys(LINE_KINDS)
    .map((kind) => ({ kind, ...LINE_KINDS[kind], lines: lines.filter((l) => l.kind === kind) }))
    .filter((g) => g.lines.length > 0)

// Baris baru dari master jasa / item. Harga tersalin dan tetap bisa diedit di dokumen.
export const lineFromMaster = (kind, master) => ({
  id: `ln-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  kind,
  refId: master.id,
  code: master.code,
  name: master.name,
  description: master.description || '',
  qty: 1,
  unit: master.unit,
  price: master.price,
})

export const blankLine = (kind = 'service') => ({
  id: `ln-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  kind,
  refId: null,
  code: '',
  name: '',
  description: '',
  qty: 1,
  unit: kind === 'service' ? 'Paket' : 'Pcs',
  price: 0,
})
