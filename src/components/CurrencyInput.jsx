import { formatNumber } from '../format.js'

// Input nominal Rupiah: badge "Rp" tetap + pemisah ribuan otomatis (15.000.000).
export default function CurrencyInput({ value, onChange, className = '', inputClassName = '', compact = false, ...props }) {
  const handleChange = (e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)

  return (
    <div
      className={`flex items-center bg-surface-container-low rounded-xl focus-within:bg-surface-container-lowest focus-within:shadow-[0_0_0_2px_#1e40af] transition-all ${
        compact ? 'h-10 px-2.5' : 'h-12 px-3.5'
      } ${className}`}
    >
      <span className="font-label-md text-label-md text-outline mr-1.5 select-none">Rp</span>
      <input
        inputMode="numeric"
        type="text"
        autoComplete="off"
        className={`w-full min-w-0 bg-transparent font-label-lg text-label-lg text-on-surface font-bold tabular-nums focus:outline-none ${inputClassName}`}
        value={value ? formatNumber(value) : ''}
        placeholder="0"
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        {...props}
      />
    </div>
  )
}
