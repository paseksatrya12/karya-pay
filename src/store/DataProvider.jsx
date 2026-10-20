import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { addDays, todayISO } from '../format.js'
import { DOC_TYPES } from './documents.js'
import { seedClients, seedDocuments, seedItems, seedProfile, seedServices } from './seed.js'

const STORAGE_KEY = 'karyapay:data'
const VERSION = 1

const DataContext = createContext(null)

const seedData = () => ({
  version: VERSION,
  profile: seedProfile,
  services: seedServices,
  items: seedItems,
  clients: seedClients,
  documents: seedDocuments,
})

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.version === VERSION) return { ...seedData(), ...saved }
  } catch {
    // penyimpanan tidak tersedia, pakai data contoh
  }
  return seedData()
}

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// Kode berurutan untuk master, mis. JS-009 / SP-009
function nextCode(records, prefix) {
  const max = records.reduce((m, r) => {
    const match = String(r.code || '').match(new RegExp(`^${prefix}-(\\d+)$`))
    return match ? Math.max(m, Number(match[1])) : m
  }, 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

function upsert(records, record) {
  const exists = records.some((r) => r.id === record.id)
  return exists ? records.map((r) => (r.id === record.id ? { ...r, ...record } : r)) : [record, ...records]
}

export function DataProvider({ children }) {
  const [data, setData] = useState(loadData)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // abaikan jika penyimpanan penuh / diblokir
    }
  }, [data])

  const nextDocumentNumber = useCallback(
    (type, isoDate = todayISO()) => {
      const prefix = `${DOC_TYPES[type].prefix}-${isoDate.slice(0, 4)}`
      const max = data.documents.reduce((m, d) => {
        const match = d.id.match(new RegExp(`^${prefix}-(\\d+)$`))
        return match ? Math.max(m, Number(match[1])) : m
      }, 0)
      return `${prefix}-${String(max + 1).padStart(3, '0')}`
    },
    [data.documents],
  )

  const api = useMemo(() => {
    const saveMaster = (collection, codePrefix, idPrefix) => (record) => {
      const saved = {
        ...record,
        id: record.id || newId(idPrefix),
        code: record.code?.trim() || nextCode(data[collection], codePrefix),
      }
      setData((prev) => ({ ...prev, [collection]: upsert(prev[collection], saved) }))
      return saved
    }
    const remove = (collection) => (id) =>
      setData((prev) => ({ ...prev, [collection]: prev[collection].filter((r) => r.id !== id) }))

    return {
      ...data,

      findService: (id) => data.services.find((s) => s.id === id),
      saveService: saveMaster('services', 'JS', 'svc'),
      deleteService: remove('services'),
      nextServiceCode: () => nextCode(data.services, 'JS'),

      findItem: (id) => data.items.find((i) => i.id === id),
      saveItem: saveMaster('items', 'SP', 'itm'),
      deleteItem: remove('items'),
      nextItemCode: () => nextCode(data.items, 'SP'),

      findClient: (id) => data.clients.find((c) => c.id === id),
      saveClient: (record) => {
        const saved = { ...record, id: record.id || newId('cli') }
        setData((prev) => ({ ...prev, clients: upsert(prev.clients, saved) }))
        return saved
      },
      deleteClient: remove('clients'),

      findDocument: (id) => data.documents.find((d) => d.id === id),
      nextDocumentNumber,
      // Simpan dokumen baru / hasil edit. `previousId` dipakai bila nomor dokumen berubah saat edit.
      saveDocument: (doc, previousId) => {
        const saved = { ...doc, updatedAt: new Date().toISOString() }
        setData((prev) => {
          const others = previousId && previousId !== doc.id ? prev.documents.filter((d) => d.id !== previousId) : prev.documents
          return { ...prev, documents: upsert(others, saved) }
        })
        return saved
      },
      updateDocument: (id, patch) =>
        setData((prev) => ({
          ...prev,
          documents: prev.documents.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)),
        })),
      deleteDocument: remove('documents'),
      // Buat invoice baru dari penawaran, baris & nominal ikut tersalin.
      convertQuoteToInvoice: (quoteId) => {
        const quote = data.documents.find((d) => d.id === quoteId)
        if (!quote) return null
        const issueDate = todayISO()
        const invoice = {
          ...quote,
          id: nextDocumentNumber('invoice', issueDate),
          type: 'invoice',
          status: 'draft',
          issueDate,
          dueDate: addDays(issueDate, DOC_TYPES.invoice.defaultTermDays),
          sourceQuoteId: quote.id,
          notes: '',
          lines: quote.lines.map((l) => ({ ...l })),
          updatedAt: new Date().toISOString(),
        }
        setData((prev) => ({
          ...prev,
          documents: [invoice, ...prev.documents.map((d) => (d.id === quoteId ? { ...d, status: 'accepted' } : d))],
        }))
        return invoice
      },

      saveProfile: (patch) => setData((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } })),
      resetData: () => setData(seedData()),
    }
  }, [data, nextDocumentNumber])

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData harus dipakai di dalam <DataProvider>')
  return ctx
}
