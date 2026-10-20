import { useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import CurrencyInput from '../components/CurrencyInput.jsx'
import Icon from '../components/Icon.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  CategoryField,
  EmptyState,
  FieldError,
  MasterCard,
  MasterHeader,
  MasterSwitch,
  MasterTitle,
  Pill,
  PriceNote,
  SearchAndFilter,
  SheetFooter,
  ToggleRow,
  UnitField,
  categoryCounts,
  inputClass,
  labelClass,
  useUsageCounts,
} from '../components/MasterList.jsx'
import { useData } from '../store/DataProvider.jsx'
import { ITEM_UNITS } from '../store/documents.js'
import { formatNumber, formatRupiah } from '../format.js'

const FORM_ID = 'item-form'
const LOW_STOCK = 3

const isTracked = (item) => item.stock !== null && item.stock !== undefined

function StockPill({ item }) {
  if (!isTracked(item)) return <Pill icon="all_inclusive">Tidak dilacak</Pill>
  const stock = Number(item.stock) || 0
  if (stock <= 0)
    return (
      <Pill tone="danger" icon="block">
        Stok Habis
      </Pill>
    )
  if (stock <= LOW_STOCK)
    return (
      <Pill tone="warning" icon="warning">
        Stok Menipis: {formatNumber(stock)}
      </Pill>
    )
  return (
    <Pill tone="success" icon="inventory">
      Stok: {formatNumber(stock)} {item.unit || 'Pcs'}
    </Pill>
  )
}

const toForm = (item, nextCode) => ({
  code: item?.code ?? nextCode,
  name: item?.name ?? '',
  category: item?.category ?? '',
  brand: item?.brand ?? '',
  unit: item?.unit ?? ITEM_UNITS[0],
  price: item?.price ?? 0,
  tracked: item ? isTracked(item) : true,
  stock: item && isTracked(item) ? String(item.stock) : '0',
  description: item?.description ?? '',
})

// Lembar tambah / edit item
function ItemSheet({ item, items, nextCode, categories, usage, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => toForm(item, nextCode))
  const [errors, setErrors] = useState({})
  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }
  const onInput = (field) => (e) => set(field)(e.target.value)

  const stockNumber = Math.max(0, Math.floor(Number(form.stock) || 0))
  const step = (delta) => set('stock')(String(Math.max(0, stockNumber + delta)))

  const submit = (e) => {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    const next = {}
    if (!form.name.trim()) next.name = 'Nama item wajib diisi.'
    if (!(form.price > 0)) next.price = 'Harga jual harus lebih dari Rp 0.'
    if (code && items.some((i) => i.id !== item?.id && i.code?.toLowerCase() === code.toLowerCase())) {
      next.code = `Kode ${code} sudah dipakai item lain.`
    }
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    onSave({
      ...(item || {}),
      code,
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      unit: form.unit.trim() || ITEM_UNITS[0],
      price: form.price,
      stock: form.tracked ? stockNumber : null,
      description: form.description.trim(),
    })
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={item ? 'Edit Item' : 'Tambah Item Baru'}
      subtitle={item ? `${item.code}${usage ? ` • Dipakai di ${usage} dokumen` : ''}` : 'Barang, sparepart, lisensi atau material'}
      footer={<SheetFooter formId={FORM_ID} editing={Boolean(item)} usage={usage} entity="Item" onDelete={onDelete} />}
    >
      <form id={FORM_ID} className="flex flex-col gap-3.5 pt-2" onSubmit={submit} noValidate>
        <div>
          <label className={labelClass} htmlFor="itm-name">
            Nama Item <span className="text-error">*</span>
          </label>
          <input
            id="itm-name"
            className={`${inputClass} ${errors.name ? 'ring-2 ring-error' : ''}`}
            placeholder="Contoh: SSD NVMe 1TB"
            type="text"
            value={form.name}
            onChange={onInput('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'itm-name-error' : undefined}
            autoFocus={!item}
          />
          <FieldError id="itm-name-error">{errors.name}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass} htmlFor="itm-code">
              Kode / SKU
            </label>
            <input
              id="itm-code"
              className={`${inputClass} tabular-nums uppercase ${errors.code ? 'ring-2 ring-error' : ''}`}
              placeholder={nextCode}
              type="text"
              value={form.code}
              onChange={onInput('code')}
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? 'itm-code-error' : undefined}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="itm-brand">
              Merek
            </label>
            <input id="itm-brand" className={inputClass} placeholder="Contoh: Samsung" type="text" value={form.brand} onChange={onInput('brand')} />
          </div>
        </div>
        {errors.code && (
          <div className="-mt-2.5">
            <FieldError id="itm-code-error">{errors.code}</FieldError>
          </div>
        )}

        <CategoryField id="itm-category" value={form.category} onChange={set('category')} suggestions={categories} placeholder="Contoh: Sparepart Komputer, Jaringan" />

        <UnitField id="itm-unit" value={form.unit} onChange={set('unit')} options={ITEM_UNITS} />

        <div>
          <label className={labelClass} htmlFor="itm-price">
            Harga Jual <span className="text-error">*</span>
          </label>
          <CurrencyInput
            id="itm-price"
            value={form.price}
            onChange={set('price')}
            className={errors.price ? 'shadow-[0_0_0_2px_#ba1a1a]' : ''}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? 'itm-price-error' : 'itm-price-hint'}
          />
          {errors.price ? (
            <FieldError id="itm-price-error">{errors.price}</FieldError>
          ) : (
            <p id="itm-price-hint" className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Per {form.unit || 'satuan'} • bisa diubah per dokumen.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor={form.tracked ? 'itm-stock' : 'itm-untracked'}>
              Stok
            </label>
            {form.tracked && <span className="font-body-sm text-body-sm text-on-surface-variant">{form.unit || 'satuan'}</span>}
          </div>
          {form.tracked && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Kurangi stok"
                className="w-11 h-11 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
                onClick={() => step(-1)}
                disabled={stockNumber <= 0}
              >
                <Icon name="remove" className="text-[20px]" />
              </button>
              <input
                id="itm-stock"
                className={`${inputClass} text-center font-bold tabular-nums`}
                type="text"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => set('stock')(e.target.value.replace(/\D/g, ''))}
                onBlur={() => set('stock')(String(stockNumber))}
              />
              <button
                type="button"
                aria-label="Tambah stok"
                className="w-11 h-11 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center active:scale-95 transition-all"
                onClick={() => step(1)}
              >
                <Icon name="add" className="text-[20px]" />
              </button>
            </div>
          )}
          <ToggleRow
            id="itm-untracked"
            label="Tidak lacak stok"
            hint="Untuk lisensi, hosting, atau barang pesan-antar"
            checked={!form.tracked}
            onChange={(untracked) => set('tracked')(!untracked)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="itm-description">
            Deskripsi
          </label>
          <textarea
            id="itm-description"
            rows={3}
            className={`${inputClass} h-auto py-2.5 resize-none`}
            placeholder="Spesifikasi, garansi, isi kemasan"
            value={form.description}
            onChange={onInput('description')}
          />
        </div>
      </form>
    </BottomSheet>
  )
}

export default function MasterItems() {
  const { services, items, documents, saveItem, deleteItem, nextItemCode } = useData()
  const [toast, showToast] = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  // null = tertutup, 'new' = tambah, objek = edit
  const [editing, setEditing] = useState(null)

  const usage = useUsageCounts(documents)
  const categories = useMemo(() => categoryCounts(items), [items])
  const lowStock = items.filter((i) => isTracked(i) && Number(i.stock) <= LOW_STOCK).length

  const q = query.toLowerCase().trim()
  const visible = items.filter((i) => {
    const matchesCategory = filter === 'all' || i.category?.trim() === filter
    const haystack = `${i.name} ${i.code} ${i.category || ''} ${i.brand || ''} ${i.description || ''}`.toLowerCase()
    return matchesCategory && (q === '' || haystack.includes(q))
  })

  const resetFilters = () => {
    setQuery('')
    setFilter('all')
  }

  const save = (record) => {
    saveItem(record)
    setEditing(null)
    showToast('Item disimpan', 'verified')
  }

  const remove = () => {
    deleteItem(editing.id)
    if (filter !== 'all' && !items.some((i) => i.id !== editing.id && i.category?.trim() === filter)) setFilter('all')
    setEditing(null)
    showToast('Item dihapus', 'delete')
  }

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-full">
      <MasterHeader title="Item & Sparepart" />

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <MasterSwitch serviceCount={services.length} itemCount={items.length} />

        <MasterTitle
          title="Daftar Item"
          count={items.length}
          countLabel="Item Terdaftar"
          note={lowStock > 0 ? `${lowStock} stok menipis` : 'Stok aman'}
          addLabel="+ Item"
          addIcon="add_box"
          onAdd={() => setEditing('new')}
        />

        <div className="px-margin mt-space-sm">
          <PriceNote />
        </div>

        <SearchAndFilter
          query={query}
          onQuery={setQuery}
          placeholder="Cari nama item, kode, merek, atau kategori..."
          categories={categories}
          total={items.length}
          filter={filter}
          onFilter={setFilter}
        />

        {visible.length > 0 ? (
          <div className="px-margin mt-space-sm flex flex-col gap-space-sm pb-6">
            {visible.map((i) => (
              <MasterCard
                key={i.id}
                code={i.code}
                name={i.name}
                meta={[i.category, i.brand].filter(Boolean).join(' • ')}
                description={i.description}
                priceLabel={`${formatRupiah(i.price)} / ${i.unit || 'Pcs'}`}
                usage={usage[i.id] || 0}
                pills={<StockPill item={i} />}
                onClick={() => setEditing(i)}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            title="Belum Ada Item"
            text="Tambahkan sparepart atau barang yang sering Anda jual agar mudah dipilih di dokumen."
            actionLabel="+ Tambah Item"
            onAction={() => setEditing('new')}
          />
        ) : (
          <EmptyState
            icon="search_off"
            title="Item Tidak Ditemukan"
            text="Coba gunakan kata kunci lain atau periksa filter kategori yang Anda pilih."
            actionLabel="Reset Pencarian"
            onAction={resetFilters}
          />
        )}
      </main>

      <BottomNav />

      {editing && (
        <ItemSheet
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? null : editing}
          items={items}
          nextCode={nextItemCode()}
          categories={categories.map((c) => c.name)}
          usage={editing === 'new' ? 0 : usage[editing.id] || 0}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
      {toast}
    </div>
  )
}
