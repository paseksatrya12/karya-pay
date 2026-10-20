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
import { SERVICE_UNITS } from '../store/documents.js'
import { formatRupiah } from '../format.js'

const FORM_ID = 'service-form'

const toForm = (service, nextCode) => ({
  code: service?.code ?? nextCode,
  name: service?.name ?? '',
  category: service?.category ?? '',
  unit: service?.unit ?? SERVICE_UNITS[0],
  price: service?.price ?? 0,
  description: service?.description ?? '',
  active: service?.active ?? true,
})

// Lembar tambah / edit jasa
function ServiceSheet({ service, services, nextCode, categories, usage, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => toForm(service, nextCode))
  const [errors, setErrors] = useState({})
  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }
  const onInput = (field) => (e) => set(field)(e.target.value)

  const submit = (e) => {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    const next = {}
    if (!form.name.trim()) next.name = 'Nama jasa wajib diisi.'
    if (!(form.price > 0)) next.price = 'Harga default harus lebih dari Rp 0.'
    if (code && services.some((s) => s.id !== service?.id && s.code?.toLowerCase() === code.toLowerCase())) {
      next.code = `Kode ${code} sudah dipakai jasa lain.`
    }
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    onSave({
      ...(service || {}),
      code,
      name: form.name.trim(),
      category: form.category.trim(),
      unit: form.unit.trim() || SERVICE_UNITS[0],
      price: form.price,
      description: form.description.trim(),
      active: form.active,
    })
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={service ? 'Edit Jasa' : 'Tambah Jasa Baru'}
      subtitle={service ? `${service.code}${usage ? ` • Dipakai di ${usage} dokumen` : ''}` : 'Simpan jasa yang sering Anda tawarkan'}
      footer={<SheetFooter formId={FORM_ID} editing={Boolean(service)} usage={usage} entity="Jasa" onDelete={onDelete} />}
    >
      <form id={FORM_ID} className="flex flex-col gap-3.5 pt-2" onSubmit={submit} noValidate>
        <div>
          <label className={labelClass} htmlFor="svc-name">
            Nama Jasa <span className="text-error">*</span>
          </label>
          <input
            id="svc-name"
            className={`${inputClass} ${errors.name ? 'ring-2 ring-error' : ''}`}
            placeholder="Contoh: Desain Logo & Brand Guideline"
            type="text"
            value={form.name}
            onChange={onInput('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'svc-name-error' : undefined}
            autoFocus={!service}
          />
          <FieldError id="svc-name-error">{errors.name}</FieldError>
        </div>

        <div>
          <label className={labelClass} htmlFor="svc-code">
            Kode
          </label>
          <input
            id="svc-code"
            className={`${inputClass} tabular-nums uppercase ${errors.code ? 'ring-2 ring-error' : ''}`}
            placeholder={nextCode}
            type="text"
            value={form.code}
            onChange={onInput('code')}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? 'svc-code-error' : undefined}
          />
          <FieldError id="svc-code-error">{errors.code}</FieldError>
        </div>

        <CategoryField id="svc-category" value={form.category} onChange={set('category')} suggestions={categories} placeholder="Contoh: Desain, Pengembangan" />

        <UnitField id="svc-unit" value={form.unit} onChange={set('unit')} options={SERVICE_UNITS} />

        <div>
          <label className={labelClass} htmlFor="svc-price">
            Harga Default <span className="text-error">*</span>
          </label>
          <CurrencyInput
            id="svc-price"
            value={form.price}
            onChange={set('price')}
            className={errors.price ? 'shadow-[0_0_0_2px_#ba1a1a]' : ''}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? 'svc-price-error' : 'svc-price-hint'}
          />
          {errors.price ? (
            <FieldError id="svc-price-error">{errors.price}</FieldError>
          ) : (
            <p id="svc-price-hint" className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Per {form.unit || 'satuan'} • bisa diubah per dokumen.
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="svc-description">
            Deskripsi
          </label>
          <textarea
            id="svc-description"
            rows={3}
            className={`${inputClass} h-auto py-2.5 resize-none`}
            placeholder="Lingkup pekerjaan yang ikut tercetak di dokumen"
            value={form.description}
            onChange={onInput('description')}
          />
        </div>

        <ToggleRow
          id="svc-active"
          label="Jasa Aktif"
          hint={form.active ? 'Muncul saat memilih jasa di dokumen' : 'Disembunyikan dari pilihan dokumen baru'}
          checked={form.active}
          onChange={set('active')}
        />
      </form>
    </BottomSheet>
  )
}

export default function MasterServices() {
  const { services, items, documents, saveService, deleteService, nextServiceCode } = useData()
  const [toast, showToast] = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [inactiveLast, setInactiveLast] = useState(true)
  // null = tertutup, 'new' = tambah, objek = edit
  const [editing, setEditing] = useState(null)

  const usage = useUsageCounts(documents)
  const categories = useMemo(() => categoryCounts(services), [services])
  const activeCount = services.filter((s) => s.active !== false).length

  const q = query.toLowerCase().trim()
  const visible = useMemo(() => {
    const list = services.filter((s) => {
      const matchesCategory = filter === 'all' || s.category?.trim() === filter
      const haystack = `${s.name} ${s.code} ${s.category || ''} ${s.description || ''}`.toLowerCase()
      return matchesCategory && (q === '' || haystack.includes(q))
    })
    return inactiveLast ? [...list].sort((a, b) => (a.active === false) - (b.active === false)) : list
  }, [services, filter, q, inactiveLast])

  const resetFilters = () => {
    setQuery('')
    setFilter('all')
  }

  const save = (record) => {
    saveService(record)
    setEditing(null)
    showToast('Jasa disimpan', 'verified')
  }

  const remove = () => {
    deleteService(editing.id)
    if (filter !== 'all' && !services.some((s) => s.id !== editing.id && s.category?.trim() === filter)) setFilter('all')
    setEditing(null)
    showToast('Jasa dihapus', 'delete')
  }

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-full">
      <MasterHeader title="Master Jasa" />

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <MasterSwitch serviceCount={services.length} itemCount={items.length} />

        <MasterTitle
          title="Daftar Jasa"
          count={services.length}
          countLabel="Jasa Terdaftar"
          note={`${activeCount} aktif`}
          addLabel="+ Jasa"
          addIcon="add_business"
          onAdd={() => setEditing('new')}
        />

        <div className="px-margin mt-space-sm">
          <PriceNote />
        </div>

        <SearchAndFilter
          query={query}
          onQuery={setQuery}
          placeholder="Cari nama jasa, kode, atau kategori..."
          categories={categories}
          total={services.length}
          filter={filter}
          onFilter={setFilter}
        />

        {visible.length > 0 ? (
          <div className="px-margin mt-space-sm flex flex-col gap-space-sm pb-6">
            {services.some((s) => s.active === false) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  aria-pressed={inactiveLast}
                  className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary"
                  onClick={() => setInactiveLast((v) => !v)}
                >
                  <Icon name={inactiveLast ? 'check_box' : 'check_box_outline_blank'} className="text-[18px]" />
                  Nonaktif di bawah
                </button>
              </div>
            )}
            {visible.map((s) => {
              const inactive = s.active === false
              return (
                <MasterCard
                  key={s.id}
                  code={s.code}
                  name={s.name}
                  meta={s.category}
                  description={s.description}
                  priceLabel={`${formatRupiah(s.price)} / ${s.unit || 'Paket'}`}
                  usage={usage[s.id] || 0}
                  muted={inactive}
                  pills={
                    inactive ? (
                      <Pill icon="visibility_off">Nonaktif</Pill>
                    ) : (
                      <Pill tone="success" icon="check_circle">
                        Aktif
                      </Pill>
                    )
                  }
                  onClick={() => setEditing(s)}
                />
              )
            })}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon="handyman"
            title="Belum Ada Jasa"
            text="Tambahkan jasa yang sering Anda kerjakan agar invoice & penawaran lebih cepat dibuat."
            actionLabel="+ Tambah Jasa"
            onAction={() => setEditing('new')}
          />
        ) : (
          <EmptyState
            icon="search_off"
            title="Jasa Tidak Ditemukan"
            text="Coba gunakan kata kunci lain atau periksa filter kategori yang Anda pilih."
            actionLabel="Reset Pencarian"
            onAction={resetFilters}
          />
        )}
      </main>

      <BottomNav />

      {editing && (
        <ServiceSheet
          key={editing === 'new' ? 'new' : editing.id}
          service={editing === 'new' ? null : editing}
          services={services}
          nextCode={nextServiceCode()}
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
