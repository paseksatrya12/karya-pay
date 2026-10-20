// Preferensi template cetak, diatur di /pengaturan/template dan dipakai saat mencetak dokumen.
export const TEMPLATE_STORAGE_KEY = 'karyapay:template-settings'

export const DEFAULT_TERMS =
  'Terima kasih atas kerja sama Anda. Pembayaran mohon ditransfer dalam waktu 14 hari kerja ke rekening terlampir. Konfirmasi pembayaran otomatis via WhatsApp KaryaPay.'

export const TEMPLATE_FIELD_KEYS = ['logo', 'signature', 'qris', 'tax', 'terms', 'watermark']

export const defaultTemplateSettings = {
  template: 'Modern Minimalist',
  color: '#1E40AF',
  fields: Object.fromEntries(TEMPLATE_FIELD_KEYS.map((key) => [key, true])),
  paper: 'A4',
  orientation: 'Potret',
  terms: DEFAULT_TERMS,
}

export function loadTemplateSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY))
    if (saved) {
      return {
        ...defaultTemplateSettings,
        ...saved,
        fields: { ...defaultTemplateSettings.fields, ...saved.fields },
      }
    }
  } catch {
    // penyimpanan tidak tersedia, pakai default
  }
  return defaultTemplateSettings
}

export function saveTemplateSettings(settings) {
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export const SIGNATURE_STORAGE_KEY = 'karyapay:signature'

export function loadSignature() {
  try {
    return localStorage.getItem(SIGNATURE_STORAGE_KEY)
  } catch {
    return null
  }
}
