import { useEffect, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ScreenshotBannerProps {
  timestamp: Date | null
  onDismiss: () => void
}

export function ScreenshotBanner({ timestamp, onDismiss }: ScreenshotBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!timestamp) return
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [timestamp])

  if (!timestamp) return null

  const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Screenshot taken at ${timeStr}`}
      className={cn(
        'fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-blackish text-white shadow-lg text-sm font-semibold transition-all duration-300 z-50',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      )}
    >
      <Camera size={15} className="text-teal shrink-0" />
      <span>Screenshot taken · <span className="font-mono text-teal">{timeStr}</span></span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(onDismiss, 300)
        }}
        aria-label="Dismiss notification"
        className="ml-1 text-white/50 hover:text-white transition-colors cursor-pointer"
      >
        <X size={13} />
      </button>
    </div>
  )
}
