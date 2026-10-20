import { createPortal } from 'react-dom'
import { DOC_TYPES, documentTotals, groupLines, lineTotal } from '../store/documents.js'
import { formatDate, formatNumber, formatRupiah, todayISO, terbilang } from '../format.js'
import './PrintDocument.css'

const MM_TO_PX = 96 / 25.4

const PAPERS = {
  A4: { label: 'A4', width: 210, height: 297, css: 'A4' },
  Letter: { label: 'Letter', width: 215.9, height: 279.4, css: 'letter' },
  Thermal: { label: 'Nota 80mm', width: 80, height: 297, css: '80mm 297mm' },
}

const TEMPLATE_CLASS = {
  'Modern Minimalist': 'kp-tpl-modern',
  'Corporate Formal': 'kp-tpl-corporate',
  'Kreatif & Studio': 'kp-tpl-creative',
  'Ringkas / Compact': 'kp-tpl-compact',
}

// Ukuran kertas + aturan @page untuk pengaturan template tertentu.
export function getPageSpec({ paper = 'A4', orientation = 'Potret' } = {}) {
  const base = PAPERS[paper] || PAPERS.A4
  const thermal = paper === 'Thermal'
  const landscape = !thermal && orientation === 'Lanskap'
  const width = landscape ? base.height : base.width
  const height = landscape ? base.width : base.height
  return {
    thermal,
    width,
    height,
    widthPx: Math.round(width * MM_TO_PX),
    pageRule: thermal
      ? `@page { size: ${base.css}; margin: 0; }`
      : `@page { size: ${base.css} ${landscape ? 'landscape' : 'portrait'}; margin: 12mm 0; }`,
  }
}

const hexToRgba = (hex, alpha) => {
  const value = hex.replace('#', '')
  const n = parseInt(value.length === 3 ? value.replace(/./g, '$&$&') : value, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const contactLine = (profile) => [profile.phone && `Telp/WA ${profile.phone}`, profile.email, profile.website].filter(Boolean).join('  ·  ')

// Pola QR dekoratif (bukan QR yang bisa dipindai), dibentuk dari NMID agar konsisten.
function QrMark({ seed = 'KARYAPAY' }) {
  const size = 21
  let hash = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const random = () => {
    hash = (hash * 1103515245 + 12345) >>> 0
    return hash / 4294967296
  }
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)
  const cells = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inFinder(x, y) && random() > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
    }
  }
  const finder = (x, y) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" fill="#0f172a" aria-hidden="true">
      {finder(0, 0)}
      {finder(size - 7, 0)}
      {finder(0, size - 7)}
      {cells}
    </svg>
  )
}

function Signature({ place, date, signature, name, title, label }) {
  return (
    <div className="kp-sign">
      {place !== undefined && (
        <div>
          {place}
          {place ? ', ' : ''}
          {date}
        </div>
      )}
      <div>{label}</div>
      <div className="kp-sign-space">{signature && <img src={signature} alt="Tanda tangan" />}</div>
      <div className="kp-sign-name">{name}</div>
      {title && <div className="kp-sign-title">{title}</div>}
    </div>
  )
}

function LinesTable({ lines }) {
  const groups = groupLines(lines)
  const showGroups = groups.length > 1
  let number = 0

  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th className="kp-col-no kp-center">No</th>
          <th>Uraian Pekerjaan / Barang</th>
          <th className="kp-col-qty kp-center">Qty</th>
          <th className="kp-col-unit">Satuan</th>
          <th className="kp-col-price kp-right">Harga Satuan</th>
          <th className="kp-col-total kp-right">Jumlah</th>
        </tr>
      </thead>
      {groups.map((group, gi) => (
        <tbody key={group.kind}>
          {showGroups && (
            <tr className="kp-group">
              <td colSpan={6}>
                {String.fromCharCode(65 + gi)}. {group.groupTitle}
              </td>
            </tr>
          )}
          {group.lines.map((line) => {
            number += 1
            return (
              <tr key={line.id}>
                <td className="kp-center">{number}</td>
                <td>
                  <span className="kp-item-name">{line.name || '-'}</span>
                  {line.code && <span className="kp-item-code">{line.code}</span>}
                  {line.description && <div className="kp-item-desc">{line.description}</div>}
                </td>
                <td className="kp-center kp-num">{formatNumber(line.qty)}</td>
                <td>{line.unit}</td>
                <td className="kp-right kp-num">{formatNumber(line.price)}</td>
                <td className="kp-right kp-num">{formatNumber(lineTotal(line))}</td>
              </tr>
            )
          })}
          {showGroups && (
            <tr className="kp-group-total">
              <td colSpan={5} className="kp-right">
                Subtotal {group.label}
              </td>
              <td className="kp-right kp-num">{formatNumber(group.lines.reduce((s, l) => s + lineTotal(l), 0))}</td>
            </tr>
          )}
        </tbody>
      ))}
    </table>
  )
}

function Totals({ doc, totals }) {
  return (
    <table className="kp-totals">
      <tbody>
        <tr>
          <td>Subtotal</td>
          <td className="kp-num">{formatRupiah(totals.subtotal)}</td>
        </tr>
        {totals.discount > 0 && (
          <tr className="kp-minus">
            <td>Diskon</td>
            <td className="kp-num">- {formatRupiah(totals.discount)}</td>
          </tr>
        )}
        {doc.taxActive && totals.discount > 0 && (
          <tr>
            <td>Dasar Pengenaan Pajak</td>
            <td className="kp-num">{formatRupiah(totals.dpp)}</td>
          </tr>
        )}
        {doc.taxActive && (
          <tr>
            <td>PPN {totals.taxRate}%</td>
            <td className="kp-num">{formatRupiah(totals.tax)}</td>
          </tr>
        )}
        <tr className="kp-sep">
          <td colSpan={2} />
        </tr>
        <tr className="kp-grand">
          <td>TOTAL</td>
          <td className="kp-num">{formatRupiah(totals.total)}</td>
        </tr>
      </tbody>
    </table>
  )
}

function OfficialDocument({ doc, client, profile, settings, signature, spec }) {
  const type = DOC_TYPES[doc.type]
  const isQuote = doc.type === 'quote'
  const totals = documentTotals(doc)
  const fields = settings.fields
  const accent = settings.color || '#1E40AF'
  const sign = fields.signature ? signature : null
  const banks = [...(profile.banks || [])].sort((a, b) => Number(!!b.primary) - Number(!!a.primary))
  const noteLines = (doc.notes || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const clientName = client?.name || 'Klien'
  const showQris = fields.qris && Boolean(profile.qrisNmid)
  const attention = client?.pic ?`u.p. ${client.pic}${client.picRole ? ` (${client.picRole})` : ''}` : null

  return (
    <div
      className={`kp-doc ${TEMPLATE_CLASS[settings.template] || 'kp-tpl-modern'}`}
      style={{
        '--kp-w': `${spec.width}mm`,
        '--kp-h': `${spec.height}mm`,
        '--accent': accent,
        '--accent-soft': hexToRgba(accent, 0.08),
      }}
    >
      {fields.watermark && doc.status === 'paid' && <div className="kp-watermark">LUNAS</div>}

      {/* Kop surat */}
      <header className="kp-letterhead">
        <div className="kp-brand">
          {fields.logo && profile.logo && <img className="kp-logo" src={profile.logo} alt="" />}
          <div>
            <div className="kp-biz">{profile.businessName}</div>
            {profile.tagline && <div className="kp-tagline">{profile.tagline}</div>}
            <div className="kp-contact">
              {profile.address && <div>{profile.address}</div>}
              <div>{contactLine(profile)}</div>
              {fields.tax && profile.npwp && <div>NPWP: {profile.npwp}</div>}
            </div>
          </div>
        </div>
        <div className="kp-doctitle">
          <div className={`kp-title ${isQuote ? 'kp-title--long' : ''}`}>{type.title}</div>
          <div className="kp-docnumber">No. {doc.id}</div>
          {!isQuote && doc.status === 'paid' && <div className="kp-stamp">LUNAS</div>}
        </div>
      </header>

      {isQuote ? (
        <>
          <section className="kp-letter">
            <table className="kp-letter-meta">
              <tbody>
                <tr>
                  <td>Nomor</td>
                  <td>:</td>
                  <td>{doc.id}</td>
                </tr>
                <tr>
                  <td>Lampiran</td>
                  <td>:</td>
                  <td>1 (satu) berkas rincian harga</td>
                </tr>
                <tr>
                  <td>Perihal</td>
                  <td>:</td>
                  <td>Penawaran Harga{doc.subject ? ` ${doc.subject}` : ''}</td>
                </tr>
              </tbody>
            </table>
            <div className="kp-letter-date">
              {profile.city ? `${profile.city}, ` : ''}
              {formatDate(doc.issueDate)}
            </div>
          </section>
          <section className="kp-recipient">
            <div>Kepada Yth.</div>
            <div className="kp-party-name">{clientName}</div>
            {attention && <div>{attention}</div>}
            {client?.address && <div>{client.address}</div>}
          </section>
          <p className="kp-paragraph">Dengan hormat,</p>
          <p className="kp-paragraph" style={{ marginTop: '2mm' }}>
            Bersama surat ini, kami {profile.businessName} bermaksud mengajukan penawaran harga
            {doc.subject ? (
              <>
                {' '}
                untuk <strong>{doc.subject}</strong>
              </>
            ) : null}{' '}
            dengan rincian sebagai berikut:
          </p>
        </>
      ) : (
        <section className="kp-parties">
          <div>
            <div className="kp-label">Ditagihkan Kepada</div>
            <div className="kp-party-name">{clientName}</div>
            {attention && <div className="kp-party-line">{attention}</div>}
            {client?.address && <div className="kp-party-line">{client.address}</div>}
            {(client?.phone || client?.email) && (
              <div className="kp-party-line">{[client.phone, client.email].filter(Boolean).join('  ·  ')}</div>
            )}
          </div>
          <table className="kp-meta">
            <tbody>
              <tr>
                <td>{type.numberLabel}</td>
                <td>{doc.id}</td>
              </tr>
              <tr>
                <td>Tanggal</td>
                <td>{formatDate(doc.issueDate)}</td>
              </tr>
              <tr className={doc.status === 'paid' ? '' : 'kp-due'}>
                <td>{type.dueLabel}</td>
                <td>{formatDate(doc.dueDate)}</td>
              </tr>
              {doc.subject && (
                <tr>
                  <td>Perihal</td>
                  <td>{doc.subject}</td>
                </tr>
              )}
              {doc.sourceQuoteId && (
                <tr>
                  <td>Ref. Penawaran</td>
                  <td>{doc.sourceQuoteId}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      <LinesTable lines={doc.lines} />

      <section className="kp-summary">
        <div className="kp-words">
          <div className="kp-label">Terbilang</div>
          <div className="kp-words-value"># {terbilang(totals.total)} #</div>
        </div>
        <Totals doc={doc} totals={totals} />
      </section>

      {isQuote ? (
        <>
          <section className="kp-notes">
            <div className="kp-label">Syarat &amp; Ketentuan</div>
            <ol>
              <li>Penawaran ini berlaku hingga {formatDate(doc.dueDate)}.</li>
              <li>{doc.taxActive ? `Harga sudah termasuk PPN ${totals.taxRate}%.` : 'Harga belum termasuk PPN.'}</li>
              {noteLines.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ol>
          </section>
          <p className="kp-closing">
            Demikian surat penawaran ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.
          </p>
          <section className="kp-approvals">
            <Signature label="Disetujui oleh," name={client?.pic || clientName} title={client?.pic ? clientName : 'Tanda tangan & nama jelas'} />
            <Signature label="Hormat kami," signature={sign} name={profile.ownerName} title={profile.ownerTitle || profile.businessName} />
          </section>
        </>
      ) : (
        <>
          {fields.terms && (settings.terms || noteLines.length > 0) && (
            <section className="kp-notes">
              <div className="kp-label">Catatan</div>
              {noteLines.map((note) => (
                <p key={note}>{note}</p>
              ))}
              {settings.terms && <p>{settings.terms}</p>}
            </section>
          )}
          <section className={`kp-bottom ${showQris ? 'kp-bottom--qris' : ''}`}>
            <div>
              {banks.length > 0 && (
                <>
                  <div className="kp-label">Pembayaran Transfer Ke</div>
                  {banks.map((bank) => (
                    <div className="kp-bank" key={bank.id || bank.number}>
                      <div>
                        <div className="kp-bank-name">{bank.bank}</div>
                        <div>a.n. {bank.holder}</div>
                      </div>
                      <div className="kp-bank-number kp-num">{bank.number}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
            {showQris && (
              <div className="kp-qris">
                <div className="kp-bank-name">QRIS</div>
                <QrMark seed={profile.qrisNmid} />
                <div>NMID {profile.qrisNmid}</div>
              </div>
            )}
            <Signature
              place={profile.city || ''}
              date={formatDate(doc.issueDate)}
              label="Hormat kami,"
              signature={sign}
              name={profile.ownerName}
              title={profile.ownerTitle || profile.businessName}
            />
          </section>
        </>
      )}

      <div className="kp-spacer" />
      <footer className="kp-footer">
        <span>
          {type.label} {doc.id} · {profile.businessName}
        </span>
        <span>Diterbitkan melalui KaryaPay · {formatDate(todayISO())}</span>
      </footer>
    </div>
  )
}

function ThermalReceipt({ doc, client, profile, settings }) {
  const type = DOC_TYPES[doc.type]
  const totals = documentTotals(doc)
  const primaryBank = (profile.banks || []).find((b) => b.primary) || profile.banks?.[0]

  return (
    <div className="kp-receipt">
      <div className="kp-receipt-center">
        <div className="kp-receipt-biz">{profile.businessName}</div>
        {profile.address && <div>{profile.address}</div>}
        {profile.phone && <div>{profile.phone}</div>}
      </div>
      <div className="kp-receipt-dash" />
      <div className="kp-receipt-center" style={{ fontWeight: 800 }}>
        {doc.type === 'quote' ? 'PENAWARAN HARGA' : type.title}
      </div>
      <div className="kp-receipt-row">
        <span>No</span>
        <span>{doc.id}</span>
      </div>
      <div className="kp-receipt-row">
        <span>Tanggal</span>
        <span>{formatDate(doc.issueDate)}</span>
      </div>
      <div className="kp-receipt-row">
        <span>{type.dueLabel}</span>
        <span>{formatDate(doc.dueDate)}</span>
      </div>
      <div className="kp-receipt-row">
        <span>Klien</span>
        <span>{client?.name || '-'}</span>
      </div>
      <div className="kp-receipt-dash" />
      {doc.lines.map((line) => (
        <div className="kp-receipt-item" key={line.id}>
          <div style={{ fontWeight: 600 }}>{line.name}</div>
          <div className="kp-receipt-row">
            <span>
              {formatNumber(line.qty)} {line.unit} x {formatNumber(line.price)}
            </span>
            <span>{formatNumber(lineTotal(line))}</span>
          </div>
        </div>
      ))}
      <div className="kp-receipt-dash" />
      <div className="kp-receipt-row">
        <span>Subtotal</span>
        <span>{formatNumber(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className="kp-receipt-row">
          <span>Diskon</span>
          <span>-{formatNumber(totals.discount)}</span>
        </div>
      )}
      {doc.taxActive && (
        <div className="kp-receipt-row">
          <span>PPN {totals.taxRate}%</span>
          <span>{formatNumber(totals.tax)}</span>
        </div>
      )}
      <div className="kp-receipt-row kp-receipt-total">
        <span>TOTAL</span>
        <span>{formatRupiah(totals.total)}</span>
      </div>
      <div style={{ marginTop: '1.5mm', fontStyle: 'italic' }}>{terbilang(totals.total)}</div>
      {doc.type === 'invoice' && primaryBank && (
        <>
          <div className="kp-receipt-dash" />
          <div className="kp-receipt-center">
            Transfer {primaryBank.bank} {primaryBank.number}
            <br />
            a.n. {primaryBank.holder}
          </div>
        </>
      )}
      {settings.fields.terms && settings.terms && doc.type === 'invoice' && (
        <div className="kp-receipt-center" style={{ marginTop: '2mm' }}>
          {settings.terms}
        </div>
      )}
      <div className="kp-receipt-dash" />
      <div className="kp-receipt-center">Terima kasih</div>
    </div>
  )
}

export default function PrintDocument({ doc, client, profile, settings, signature }) {
  const spec = getPageSpec(settings)
  return spec.thermal ? (
    <ThermalReceipt doc={doc} client={client} profile={profile} settings={settings} />
  ) : (
    <OfficialDocument doc={doc} client={client} profile={profile} settings={settings} signature={signature} spec={spec} />
  )
}

// Salinan dokumen di luar bingkai aplikasi, khusus untuk window.print().
export function PrintPortal(props) {
  const spec = getPageSpec(props.settings)
  return createPortal(
    <div id="print-root">
      <style>{spec.pageRule}</style>
      <PrintDocument {...props} />
    </div>,
    document.body,
  )
}
