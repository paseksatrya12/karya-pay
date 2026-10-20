import { Component } from 'react'
import Icon from './Icon.jsx'

const RELOAD_KEY = 'karyapay:chunk-reload'

const isChunkError = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    String(error?.message || error),
  )

export function PageLoader() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-3 py-24 text-on-surface-variant">
      <Icon name="progress_activity" className="text-[32px] text-primary animate-spin" />
      <span className="font-label-md text-label-md">Memuat halaman...</span>
    </div>
  )
}

// Menangkap error render halaman. Bila file halaman gagal diunduh (cache dev server / versi lama
// setelah deploy), muat ulang otomatis satu kali; selebihnya tampilkan pesan, bukan layar kosong.
export default class PageBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    if (!isChunkError(error)) return
    try {
      if (sessionStorage.getItem(RELOAD_KEY) !== window.location.pathname) {
        sessionStorage.setItem(RELOAD_KEY, window.location.pathname)
        window.location.reload()
      }
    } catch {
      // sessionStorage tidak tersedia, biarkan pengguna memuat ulang manual
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 px-margin py-24 text-center bg-surface">
        <div className="w-14 h-14 rounded-full bg-error-container text-error flex items-center justify-center">
          <Icon name="error" className="text-[28px]" />
        </div>
        <h1 className="font-headline-sm text-headline-sm text-on-surface">Halaman gagal dimuat</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
          {isChunkError(error) ? 'File halaman tidak dapat diunduh. Periksa koneksi atau server, lalu muat ulang.' : String(error.message || error)}
        </p>
        <button
          className="mt-2 h-11 px-5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center gap-1.5 active:scale-95"
          onClick={() => window.location.reload()}
          type="button"
        >
          <Icon name="refresh" className="text-[20px]" />
          Muat Ulang
        </button>
      </div>
    )
  }
}
