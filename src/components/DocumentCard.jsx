import Icon from './Icon.jsx'
import { daysBetween, formatDateShort, formatRupiah, todayISO } from '../format.js'
import { DOC_STATUS, DOC_TYPES, documentTotals } from '../store/documents.js'

export const statusStyles = {
  paid: { label: DOC_STATUS.paid.label, icon: 'check_circle', fill: true, box: 'bg-secondary-fixed/30 text-secondary', pill: 'bg-secondary-fixed/40 text-on-secondary-fixed-variant font-bold' },
  sent: { label: DOC_STATUS.sent.label, icon: 'send', box: 'bg-primary-fixed text-primary', pill: 'bg-surface-variant text-primary font-bold' },
  draft: { label: DOC_STATUS.draft.label, icon: 'edit_document', box: 'bg-surface-container text-on-surface-variant', pill: 'bg-surface-container text-on-surface-variant font-semibold' },
  overdue: { label: DOC_STATUS.overdue.label, icon: 'error_outline', box: 'bg-tertiary-fixed text-tertiary', pill: 'bg-tertiary-fixed text-tertiary font-bold' },
  accepted: { label: DOC_STATUS.accepted.label, icon: 'task_alt', box: 'bg-secondary-container/50 text-secondary', pill: 'bg-secondary-container/60 text-on-secondary-container font-bold' },
  rejected: { label: DOC_STATUS.rejected.label, icon: 'block', box: 'bg-error-container/40 text-error', pill: 'bg-surface-container-high text-error font-semibold' },
}

// Urutan terbaru dulu: tanggal terbit, lalu waktu terakhir diubah
export const byNewest = (a, b) =>
  String(b.issueDate || '').localeCompare(String(a.issueDate || '')) ||
  String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))

const styleFor = (status) => statusStyles[status] || statusStyles.draft

// Nomor WhatsApp internasional: 0812… -> 62812…
export const toWaNumber = (phone = '') => String(phone).replace(/\D/g, '').replace(/^0/, '62')

export function waLink(phone, text) {
  const number = toWaNumber(phone)
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

// Pesan pengingat pembayaran yang sopan untuk invoice
export function reminderText(doc, client) {
  const total = formatRupiah(documentTotals(doc).total)
  const greeting = client?.pic ? `Halo ${client.pic}` : 'Halo'
  return `${greeting}, semoga sehat selalu. Kami ingin mengingatkan dengan hormat bahwa ${DOC_TYPES[doc.type]?.label || 'Invoice'} #${doc.id}${
    doc.subject ? ` (${doc.subject})` : ''
  } sebesar ${total} jatuh tempo pada ${formatDateShort(doc.dueDate)}. Mohon kesediaannya untuk melakukan pembayaran. Terima kasih atas kerja samanya 🙏`
}

export function StatusPill({ status }) {
  const style = styleFor(status)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm flex-shrink-0 ${style.pill}`}>
      {style.label}
    </span>
  )
}

function kindSummary(lines = []) {
  const services = lines.filter((l) => l.kind === 'service').length
  const items = lines.filter((l) => l.kind === 'item').length
  if (!items) return null
  return [services && `${services} Jasa`, `${items} Sparepart`].filter(Boolean).join(' · ')
}

export default function DocumentCard({ doc, client, onOpen, onRemind }) {
  const style = styleFor(doc.status)
  const overdue = doc.status === 'overdue'
  const isQuote = doc.type === 'quote'
  const amount = documentTotals(doc).total
  const summary = kindSummary(doc.lines)
  const clientName = client?.name || 'Klien tidak dikenal'

  let meta = formatDateShort(doc.issueDate)
  if (isQuote) meta = 'Penawaran'
  else if (overdue) meta = `Lewat ${Math.max(daysBetween(doc.dueDate, todayISO()), 0)} hari`

  const description = <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">{doc.subject || '-'}</span>

  return (
    <article
      className="flex flex-col p-4 rounded-xl bg-surface-container-lowest shadow-sm gap-space-xs active:bg-surface-container-low transition-colors cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.box}`}>
            <Icon name={style.icon} fill={style.fill} className="text-[20px]" />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-label-lg text-label-lg text-on-surface font-bold truncate">{clientName}</h3>
            <span className={`font-label-sm text-label-sm ${overdue ? 'text-tertiary-container font-medium' : 'text-on-surface-variant'}`}>
              #{doc.id} • {meta}
            </span>
          </div>
        </div>
        <StatusPill status={doc.status} />
      </div>

      {summary && (
        <div className="flex items-center gap-1 text-[11px] font-label-sm text-on-surface-variant">
          <Icon name="inventory_2" className="text-[13px] text-outline" />
          <span>{summary}</span>
        </div>
      )}

      {overdue ? (
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-col min-w-0">
            {description}
            <span className="font-headline-sm text-headline-sm text-tertiary font-extrabold">{formatRupiah(amount)}</span>
          </div>
          {onRemind && (
            <button
              aria-label="Ingatkan via WhatsApp"
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-secondary text-on-secondary font-label-sm text-label-sm font-bold shadow-sm active:scale-95 transition-all flex-shrink-0"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemind()
              }}
            >
              <Icon name="chat" className="text-[18px]" />
              <span>Tagih WA</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 pt-1">
          {doc.status === 'sent' && !isQuote ? (
            <span className="font-body-sm text-body-sm text-primary font-semibold flex items-center gap-1 min-w-0">
              <Icon name="schedule" className="text-[14px]" />
              <span className="truncate">Jatuh tempo {formatDateShort(doc.dueDate)}</span>
            </span>
          ) : (
            description
          )}
          <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold flex-shrink-0">{formatRupiah(amount)}</span>
        </div>
      )}
    </article>
  )
}
