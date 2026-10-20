import { useEffect, useRef } from 'react'

// setTimeout yang otomatis dibersihkan saat komponen di-unmount.
export default function useTimeouts() {
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  return (fn, ms) => timers.current.push(setTimeout(fn, ms))
}
