import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { useToast } from '../components/Toast.jsx'
import { waLink } from '../components/DocumentCard.jsx'
import { useData } from '../store/DataProvider.jsx'
import { DOC_TYPES, documentTotals, groupLines, lineTotal } from '../store/documents.js'
import { formatDate, formatDateShort, formatNumber, formatRupiah, terbilang } from '../format.js'

const LOGO_URL = '/images/logo.png'
const SIGNATURE_KEY = 'karyapay:signature'

const statusBadges = {
  draft: { label: 'Draft', icon: 'edit_document', className: 'bg-surface-container text-on-surface-variant' },
  sent: { label: 'Menunggu Pembayaran', quoteLabel: 'Menunggu Persetujuan', icon: 'schedule', className: 'bg-amber-50 text-amber-800' },
  paid: { label: 'Lunas', icon: 'check_circle', fill: true, className: 'bg-emerald-50 text-emerald-800' },
  overdue: { label: 'Jatuh Tempo', icon: 'error_outline', className: 'bg-tertiary-fixed text-tertiary' },
  accepted: { label: 'Disetujui', icon: 'task_alt', className: 'bg-secondary-container/50 text-on-secondary-container' },
  rejected: { label: 'Ditolak', icon: 'block', className: 'bg-error-container/40 text-error' },
}

const copyText = (text) => navigator.clipboard?.writeText(text).catch(() => {})

function loadSignature() {
  try {
    return localStorage.getItem(SIGNATURE_KEY)
  } catch {
    return null
  }
}

function LineItem({ line }) {
  return (
    <div className="p-space-sm rounded-lg bg-surface-bright flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <span className="text-body-md font-body-md text-on-surface font-semibold">{line.name || '-'}</span>
        <span className="text-body-md font-body-md text-on-surface font-bold text-right shrink-0">{formatRupiah(lineTotal(line))}</span>
      </div>
      <div className="flex justify-between gap-2 text-body-sm font-body-sm text-on-surface-variant">
        <span className="min-w-0">{line.description}</span>
        <span className="shrink-0 text-right">
          {formatNumber(line.qty)} {line.unit} × {formatRupiah(line.price)}
        </span>
      </div>
    </div>
  )
}

function ContactRow({ icon, iconClass, children, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Icon name={icon} className={`text-[14px] ${iconClass}`} />
      {children}
    </div>
  )
}

function TotalRow({ label, value, children }) {
  return (
    <div className="flex justify-between text-body-sm font-body-sm text-on-surface-variant">
      {children || <span>{label}</span>}
      <span className="text-on-surface font-semibold">{value}</span>
    </div>
  )
}

// Konfirmasi dari bawah layar, gaya sama seperti konfirmasi "Tandai Lunas" asli
function ConfirmSheet({ open, icon, iconClass, title, subtitle, confirmLabel, confirmClass, onCancel, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[55] bg-on-background/40 flex items-end" onClick={onCancel}>
      <div
        className="w-full bg-surface-container-lowest rounded-t-3xl p-margin pb-safe space-y-space-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto" />
        <div className="flex items-center gap-space-sm">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
            <Icon name={icon} fill className="text-[22px]" />
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-sm pb-space-sm">
          <button className="h-11 rounded-xl bg-surface-container-low text-on-surface font-label-lg text-label-lg" onClick={onCancel} type="button">
            Batal
          </button>
          <button className={`h-11 rounded-xl font-label-lg text-label-lg ${confirmClass}`} onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuRow({ icon, label, note, danger, onClick }) {
  return (
    <button
      className={`w-full flex items-center gap-space-sm p-space-sm rounded-xl text-left active:bg-surface-container transition-colors ${
        danger ? 'text-error' : 'text-on-surface'
      }`}
      onClick={onClick}
      type="button"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          danger ? 'bg-error-container/50 text-error' : 'bg-surface-container text-primary'
        }`}
      >
        <Icon name={icon} className="text-[20px]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-label-lg text-label-lg font-bold">{label}</span>
        {note && <span className="font-body-sm text-body-sm text-on-surface-variant">{note}</span>}
      </div>
    </button>
  )
}

function NotFound({ onBack }) {
  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-full">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(11,28,48,0.04)]">
        <div className="h-16 px-margin flex items-center gap-space-xs">
          <button
            aria-label="Kembali"
            className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface hover:text-primary transition-colors"
            onClick={onBack}
            type="button"
          >
            <Icon name="arrow_back" className="text-[24px]" />
          </button>
          <h1 className="font-headline-sm text-headline-sm text-on-surface">Detail Dokumen</h1>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-margin pt-16 pb-16">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-space-sm">
          <Icon name="find_in_page" className="text-[32px]" />
        </div>
        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Dokumen tidak ditemukan</span>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-1">
          Dokumen mungkin sudah dihapus atau nomornya berubah.
        </p>
        <Link
          className="mt-4 px-space-md py-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-xl flex items-center gap-1 active:scale-95 transition-all"
          to="/dokumen"
        >
          <Icon name="receipt_long" className="text-[18px]" />
          Lihat Semua Dokumen
        </Link>
      </main>
    </div>
  )
}

export default function InvoiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [toast, showToast] = useToast()
  const { documents, profile, findDocument, findClient, updateDocument, deleteDocument, convertQuoteToInvoice } = useData()
  const [confirm, setConfirm] = useState(null) // 'paid' | 'convert' | 'delete'
  const [menuOpen, setMenuOpen] = useState(false)
  const [signature] = useState(loadSignature)

  const doc = findDocument(id)
  if (!doc) return <NotFound onBack={() => navigate('/dokumen')} />

  const client = findClient(doc.clientId)
  const isQuote = doc.type === 'quote'
  const typeInfo = DOC_TYPES[doc.type] || DOC_TYPES.invoice
  const totals = documentTotals(doc)
  const groups = groupLines(doc.lines)
  const bothKinds = totals.services > 0 && totals.items > 0
  const badge = statusBadges[doc.status] || statusBadges.draft
  const banks = [...(profile.banks || [])].sort((a, b) => Number(!!b.primary) - Number(!!a.primary))
  const isPaid = doc.status === 'paid'
  const isAccepted = doc.status === 'accepted'
  const convertedInvoice = isQuote ? documents.find((d) => d.sourceQuoteId === doc.id) : null
  const sourceQuote = doc.sourceQuoteId ? findDocument(doc.sourceQuoteId) : null

  const publicLink = `${window.location.origin}/invoice/${doc.id}`
  const greeting = client?.pic ? `Halo ${client.pic}` : 'Halo'
  const waText = isQuote
    ? `${greeting}, berikut ${typeInfo.label} #${doc.id} dari ${profile.businessName} dengan nilai ${formatRupiah(totals.total)}. Detail penawaran: ${publicLink}`
    : `${greeting}, berikut ${typeInfo.label} #${doc.id} dari ${profile.businessName} sebesar ${formatRupiah(totals.total)}, jatuh tempo ${formatDateShort(doc.dueDate)}. Detail tagihan: ${publicLink}`

  const closeConfirm = () => setConfirm(null)

  const markPaid = () => {
    updateDocument(doc.id, { status: 'paid' })
    closeConfirm()
    showToast('Invoice telah ditandai Lunas!', 'check_circle')
  }

  const convert = () => {
    const invoice = convertQuoteToInvoice(doc.id)
    closeConfirm()
    if (!invoice) return
    showToast(`Invoice #${invoice.id} berhasil dibuat`, 'receipt_long')
    navigate(`/invoice/${invoice.id}`)
  }

  const remove = () => {
    deleteDocument(doc.id)
    closeConfirm()
    navigate('/dokumen', { replace: true })
  }

  const setStatus = (status, message, icon) => {
    updateDocument(doc.id, { status })
    setMenuOpen(false)
    showToast(message, icon)
  }

  const onWhatsApp = () => {
    if (doc.status === 'draft') {
      updateDocument(doc.id, { status: 'sent' })
      showToast('Dokumen dikirim, status menjadi Terkirim', 'send')
    }
  }

  const copyAccount = (bank) => {
    copyText(String(bank.number).replace(/\D/g, ''))
    showToast(`Nomor rekening ${bank.bank} disalin!`, 'content_copy')
  }

  const shareLink = () => {
    copyText(publicLink)
    showToast(`Tautan ${typeInfo.label.toLowerCase()} berhasil disalin!`, 'share')
  }

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-full">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(11,28,48,0.04)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-xs min-w-0">
            <button
              aria-label="Kembali"
              className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface hover:text-primary transition-colors flex-shrink-0"
              onClick={() => navigate(-1)}
              type="button"
            >
              <Icon name="arrow_back" className="text-[24px]" />
            </button>
            <div className="flex items-center gap-space-xs min-w-0">
              <img alt="KaryaPay Logo" className="h-6 w-auto object-contain flex-shrink-0" src={LOGO_URL} />
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">{isQuote ? 'Detail Penawaran' : 'Detail Invoice'}</h1>
            </div>
          </div>
          <div className="flex items-center -mr-2 flex-shrink-0">
            <button
              aria-label="Edit dokumen"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors"
              onClick={() => navigate(`/invoice/${doc.id}/edit`)}
              type="button"
            >
              <Icon name="edit" className="text-[22px]" />
            </button>
            <button
              aria-label="Opsi lainnya"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors"
              onClick={() => setMenuOpen(true)}
              type="button"
            >
              <Icon name="more_vert" className="text-[22px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface">
        <div className="flex flex-col w-full pb-36">
          {/* Status overview */}
          <section className="px-margin pt-space-md">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-surface-container-high text-on-primary-fixed-variant flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block mr-1.5 animate-pulse" />#{doc.id}
                  </span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant truncate">{formatDateShort(doc.issueDate)}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm flex-shrink-0 ${badge.className}`}>
                  <Icon name={badge.icon} fill={badge.fill} className="text-[14px]" />
                  {isQuote && badge.quoteLabel ? badge.quoteLabel : badge.label}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">{typeInfo.dueLabel}</p>
                  <p className={`text-headline-sm font-headline-sm ${isPaid || isAccepted ? 'text-on-surface' : 'text-tertiary'}`}>
                    {formatDateShort(doc.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    {isQuote ? 'Nilai Penawaran' : 'Total Tagihan'}
                  </p>
                  <p className="text-currency-card font-currency-card text-primary">{formatRupiah(totals.total)}</p>
                </div>
              </div>
              {(convertedInvoice || sourceQuote) && (
                <Link
                  className="flex items-center gap-1.5 pt-2 border-t border-surface-container font-label-md text-label-md text-primary"
                  to={`/invoice/${(convertedInvoice || sourceQuote).id}`}
                >
                  <Icon name="link" className="text-[16px]" />
                  <span className="truncate">
                    {convertedInvoice ? `Sudah dijadikan Invoice #${convertedInvoice.id}` : `Dibuat dari Penawaran #${sourceQuote.id}`}
                  </span>
                  <Icon name="chevron_right" className="text-[16px] ml-auto" />
                </Link>
              )}
            </div>
          </section>

          {/* Document preview */}
          <section className="px-margin pt-space-md">
            <div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-lg overflow-hidden">
              <div className="absolute -right-6 top-28 select-none pointer-events-none opacity-[0.04]">
                <Icon name="verified" className="text-[180px] text-primary" />
              </div>

              <div className="flex items-start justify-between gap-2 pb-space-md">
                <div className="flex items-center gap-space-sm min-w-0">
                  <img
                    alt={`Logo ${profile.businessName}`}
                    className="w-12 h-12 rounded-lg object-contain shadow-sm bg-surface-container-low p-1.5 flex-shrink-0"
                    src={profile.logo || LOGO_URL}
                  />
                  <div className="min-w-0">
                    <h2 className="text-headline-sm font-headline-sm text-on-surface leading-tight">{profile.businessName}</h2>
                    {profile.tagline && <p className="text-body-sm font-body-sm text-on-surface-variant">{profile.tagline}</p>}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-primary font-bold flex-shrink-0">
                  {isQuote ? 'SPH' : 'ASLI'}
                </span>
              </div>

              <div className="text-body-sm font-body-sm text-on-surface-variant pb-space-md">
                {profile.email && (
                  <ContactRow icon="mail" iconClass="text-primary">
                    <span className="truncate">{profile.email}</span>
                  </ContactRow>
                )}
                {profile.phone && (
                  <ContactRow icon="call" iconClass="text-secondary" className="pt-0.5">
                    <span>{profile.phone}</span>
                  </ContactRow>
                )}
              </div>

              <div className="bg-surface-container-low rounded-xl p-space-md mb-space-md">
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  {isQuote ? 'Ditujukan Kepada:' : 'Ditujukan Kepada (Billed To):'}
                </p>
                <p className="text-headline-sm font-headline-sm text-on-surface">{client?.name || 'Klien tidak dikenal'}</p>
                {client?.pic && (
                  <div className="flex items-center gap-1 text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                    <Icon name="person" className="text-[15px]" />
                    <span>
                      Attn: {client.pic}
                      {client.picRole ? ` (${client.picRole})` : ''}
                    </span>
                  </div>
                )}
                {client?.address && (
                  <div className="flex items-start gap-1 text-body-sm font-body-sm text-on-surface-variant">
                    <Icon name="location_on" className="text-[15px] mt-0.5" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>

              {doc.subject && (
                <div className="mb-space-md">
                  <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Perihal</p>
                  <p className="text-body-md font-body-md text-on-surface font-semibold">{doc.subject}</p>
                </div>
              )}

              {/* Rincian per jenis */}
              <div className="space-y-space-sm mb-space-md">
                <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant pb-1">
                  <span>RINCIAN PEKERJAAN</span>
                  <span>JUMLAH</span>
                </div>
                {groups.length === 0 && (
                  <p className="p-space-sm rounded-lg bg-surface-bright text-body-sm font-body-sm text-on-surface-variant text-center">
                    Belum ada rincian pekerjaan atau item.
                  </p>
                )}
                {groups.map((group) => (
                  <div key={group.kind} className="space-y-space-xs">
                    <div className="flex items-center gap-1.5 text-label-md font-label-md text-primary pt-1">
                      <Icon name={group.icon} className="text-[16px]" />
                      <span>{group.groupTitle}</span>
                      <span className="text-on-surface-variant font-medium">({group.lines.length})</span>
                    </div>
                    {group.lines.map((line) => (
                      <LineItem key={line.id} line={line} />
                    ))}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-surface-container-high rounded-xl p-space-md flex flex-col gap-2 mb-space-md">
                {bothKinds ? (
                  <>
                    <TotalRow label="Subtotal Jasa" value={formatRupiah(totals.services)} />
                    <TotalRow label="Subtotal Item / Sparepart" value={formatRupiah(totals.items)} />
                  </>
                ) : (
                  <TotalRow label="Subtotal" value={formatRupiah(totals.subtotal)} />
                )}
                {totals.discount > 0 && <TotalRow label="Diskon" value={`- ${formatRupiah(totals.discount)}`} />}
                {doc.taxActive && (
                  <TotalRow value={formatRupiah(totals.tax)}>
                    <span className="flex items-center gap-1" title="Pajak Pertambahan Nilai Resmi">
                      PPN ({totals.taxRate}%)
                      <Icon name="info" className="text-[13px] text-primary" />
                    </span>
                  </TotalRow>
                )}
                <div className="flex justify-between items-center pt-2 mt-1 bg-surface-container-highest px-3 py-2 rounded-lg">
                  <div>
                    <span className="text-label-md font-label-md text-primary block leading-none">TOTAL AKHIR</span>
                    <span className="text-body-sm font-body-sm text-on-surface-variant text-[11px]">
                      {doc.taxActive ? 'Termasuk Pajak' : 'Tanpa PPN'}
                    </span>
                  </div>
                  <span className="text-currency-card font-currency-card text-primary">{formatRupiah(totals.total)}</span>
                </div>
                <p className="text-[11px] font-body-sm text-on-surface-variant italic leading-snug">Terbilang: {terbilang(totals.total)}</p>
              </div>

              {doc.notes && (
                <div className="rounded-xl p-space-md mb-space-md border border-dashed border-outline-variant">
                  <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Catatan</p>
                  <p className="text-body-sm font-body-sm text-on-surface whitespace-pre-line">{doc.notes}</p>
                </div>
              )}

              {/* Payment methods (invoice saja) */}
              {!isQuote && banks.length > 0 && (
                <div className="bg-surface-container-low rounded-xl p-space-md mb-space-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Metode Pembayaran Resmi</p>
                    {profile.qrisNmid && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded">
                        <Icon name="qr_code_2" className="text-[13px]" />
                        QRIS Aktif
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    {banks.map((bank, index) => (
                      <div key={bank.id || bank.number} className="flex items-center justify-between bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
                        <div className="flex items-center gap-space-sm min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                            <Icon name="account_balance" className="text-[22px]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-label-md font-label-md text-on-surface font-bold flex items-center gap-1.5">
                              {bank.bank}
                              {bank.primary && (
                                <span className="text-[10px] font-bold text-primary bg-primary-fixed px-1.5 py-px rounded">UTAMA</span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-body-sm font-body-sm text-on-surface-variant font-mono">{bank.number}</p>
                              <button
                                aria-label={`Salin nomor rekening ${bank.bank}`}
                                className="text-primary hover:text-surface-tint p-1 rounded"
                                onClick={() => copyAccount(bank)}
                                type="button"
                              >
                                <Icon name="content_copy" className="text-[16px]" />
                              </button>
                            </div>
                            <p className="text-[11px] text-on-surface-variant">a/n {bank.holder}</p>
                          </div>
                        </div>
                        {index === 0 && profile.qrisNmid && (
                          <div className="w-12 h-12 bg-surface-container-high rounded-md flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                            <Icon name="qr_code" className="text-[28px]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature */}
              <div className="p-space-md rounded-xl bg-surface-bright flex flex-col items-center text-center relative overflow-hidden">
                <div className="flex items-center gap-1 text-label-sm font-label-sm text-secondary mb-1">
                  <Icon name="verified_user" className="text-[16px]" />
                  <span>DITANDATANGANI SECARA RESMI</span>
                </div>
                <div className="w-44 h-16 flex items-center justify-center my-1">
                  {signature ? (
                    <img alt={`Tanda tangan ${profile.ownerName}`} className="max-w-full max-h-full object-contain" src={signature} />
                  ) : (
                    <svg
                      className="w-full h-full text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 200 60"
                    >
                      <path d="M 20 40 Q 40 10 60 30 T 90 20 T 115 45 Q 130 15 150 25 T 180 35 M 45 42 Q 95 48 160 38" />
                    </svg>
                  )}
                </div>
                <p className="text-headline-sm font-headline-sm text-on-surface">{profile.ownerName}</p>
                <p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">
                  Ditandatangani secara digital pada {formatDate(doc.issueDate)}
                </p>
              </div>
            </div>
          </section>

          {/* Sticky action deck */}
          <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md p-margin pb-safe shadow-[0_-4px_24px_rgba(11,28,48,0.08)]">
            <div className="max-w-md mx-auto flex flex-col gap-space-xs">
              <a
                className="w-full h-[50px] bg-[#006a61] hover:bg-[#005049] text-on-secondary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
                href={waLink(client?.phone, waText)}
                onClick={onWhatsApp}
                rel="noreferrer"
                target="_blank"
              >
                <Icon name="chat" className="text-[20px]" />
                Kirim via WhatsApp
              </a>
              <div className="grid grid-cols-3 gap-space-xs">
                <button
                  className="h-11 px-1 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 text-center leading-tight active:bg-surface-container transition-colors"
                  onClick={() => navigate(`/invoice/${doc.id}/pdf`)}
                  type="button"
                >
                  <Icon name="print" className="text-[18px] text-primary flex-shrink-0" />
                  <span>Cetak / PDF</span>
                </button>
                {isQuote ? (
                  <button
                    className="h-11 px-1 rounded-lg bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md flex items-center justify-center gap-1.5 text-center leading-tight active:bg-primary-fixed-dim transition-colors disabled:opacity-70"
                    disabled={isAccepted}
                    onClick={() => setConfirm('convert')}
                    type="button"
                  >
                    <Icon name={isAccepted ? 'task_alt' : 'receipt_long'} className="text-[18px] text-primary flex-shrink-0" />
                    <span>{isAccepted ? 'Sudah Disetujui' : 'Jadikan Invoice'}</span>
                  </button>
                ) : (
                  <button
                    className="h-11 px-1 rounded-lg bg-emerald-50 text-emerald-800 font-label-md text-label-md flex items-center justify-center gap-1.5 text-center leading-tight active:bg-emerald-100 transition-colors disabled:opacity-70"
                    disabled={isPaid}
                    onClick={() => setConfirm('paid')}
                    type="button"
                  >
                    <Icon name="check_circle" fill={isPaid} className="text-[18px] text-emerald-600 flex-shrink-0" />
                    <span>{isPaid ? 'Sudah Lunas' : 'Tandai Lunas'}</span>
                  </button>
                )}
                <button
                  className="h-11 px-1 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 text-center leading-tight active:bg-surface-container transition-colors"
                  onClick={shareLink}
                  type="button"
                >
                  <Icon name="share" className="text-[18px] text-surface-tint flex-shrink-0" />
                  <span>Bagikan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Overflow menu */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={`${typeInfo.label} #${doc.id}`} subtitle={client?.name}>
        <div className="flex flex-col gap-1">
          <MenuRow icon="edit" label="Edit Dokumen" note="Ubah klien, rincian, atau harga" onClick={() => navigate(`/invoice/${doc.id}/edit`)} />
          {doc.status === 'draft' && <MenuRow icon="send" label="Tandai Terkirim" note="Dokumen sudah dikirim ke klien" onClick={() => setStatus('sent', 'Status diubah menjadi Terkirim', 'send')} />}
          {isQuote && doc.status !== 'rejected' && !isAccepted && (
            <MenuRow icon="block" label="Tandai Ditolak" note="Klien tidak melanjutkan penawaran" onClick={() => setStatus('rejected', 'Penawaran ditandai Ditolak', 'block')} />
          )}
          {!isQuote && doc.status === 'sent' && (
            <MenuRow icon="error_outline" label="Tandai Jatuh Tempo" note="Pembayaran melewati batas waktu" onClick={() => setStatus('overdue', 'Invoice ditandai Jatuh Tempo', 'error_outline')} />
          )}
          <MenuRow icon="print" label="Cetak / PDF" onClick={() => navigate(`/invoice/${doc.id}/pdf`)} />
          <MenuRow
            icon="delete"
            label="Hapus Dokumen"
            note="Tindakan ini tidak bisa dibatalkan"
            danger
            onClick={() => {
              setMenuOpen(false)
              setConfirm('delete')
            }}
          />
        </div>
      </BottomSheet>

      {/* Confirmations */}
      <ConfirmSheet
        open={confirm === 'paid'}
        icon="check_circle"
        iconClass="bg-emerald-50 text-emerald-600"
        title="Tandai tagihan ini sebagai LUNAS?"
        subtitle={`#${doc.id} • ${formatRupiah(totals.total)}`}
        confirmLabel="Ya, Tandai Lunas"
        confirmClass="bg-[#006a61] text-on-secondary"
        onCancel={closeConfirm}
        onConfirm={markPaid}
      />
      <ConfirmSheet
        open={confirm === 'convert'}
        icon="receipt_long"
        iconClass="bg-primary-fixed text-primary"
        title="Jadikan penawaran ini Invoice?"
        subtitle={`Rincian #${doc.id} disalin ke invoice baru & penawaran ditandai Disetujui`}
        confirmLabel="Ya, Buat Invoice"
        confirmClass="bg-primary-container text-on-primary"
        onCancel={closeConfirm}
        onConfirm={convert}
      />
      <ConfirmSheet
        open={confirm === 'delete'}
        icon="delete"
        iconClass="bg-error-container text-error"
        title={`Hapus ${typeInfo.label.toLowerCase()} ini?`}
        subtitle={`#${doc.id} • ${client?.name || ''} akan dihapus permanen`}
        confirmLabel="Ya, Hapus"
        confirmClass="bg-error text-on-error"
        onCancel={closeConfirm}
        onConfirm={remove}
      />
      {toast}
    </div>
  )
}
