import Icon from './Icon.jsx'

export default function AuthHeader() {
  return (
    <header className="w-full pt-safe bg-background">
      <div className="h-16 px-margin flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(30,64,175,0.25)]">
            <Icon name="payments" className="text-on-primary text-[20px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-sm tracking-tight text-primary leading-none">
              Karya<span className="text-secondary">Pay</span>
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">INVOICE &amp; SETTLE</span>
          </div>
        </div>
        <div className="flex items-center gap-space-xs">
          <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-high">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-secondary-fixed-variant">Secure TLS</span>
          </div>
        </div>
      </div>
    </header>
  )
}
