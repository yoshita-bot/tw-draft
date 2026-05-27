import { useEffect, useRef, useState } from 'react'
import { X, Bell, CalendarClock, UserCog, AlertTriangle, Info, CheckCheck, Calendar, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { NOTIFICATIONS, type Notification } from '../../data/mockData'

// One icon per type — shape communicates category, no color needed
const TYPE_ICON: Record<Notification['type'], React.ComponentType<{ size?: number; className?: string }>> = {
  leave:    CalendarClock,
  schedule: Calendar,
  hr:       UserCog,
  alert:    AlertTriangle,
  system:   Info,
}

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [items, setItems] = useState(NOTIFICATIONS)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const unread = items.filter(n => !n.read)
  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })))
  const dismiss = (id: string) => setItems(prev => prev.filter(n => n.id !== id))
  const markRead = (id: string) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const today   = items.filter(n => n.time.includes('min') || n.time.includes('hr') || n.time === 'Just now')
  const earlier = items.filter(n => !today.includes(n))

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-blackish/10 backdrop-blur-[1px]" onClick={onClose} />
      )}

      <div
        ref={panelRef}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-96 bg-white border-l border-gray-100',
          'flex flex-col shadow-2xl transition-transform duration-250 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Bell size={15} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-blackish">Notifications</h2>
            {unread.length > 0
              ? <p className="text-xs text-muted">{unread.length} unread</p>
              : <p className="text-xs text-muted">All caught up</p>
            }
          </div>
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-muted hover:bg-sky hover:text-blackish transition-colors cursor-pointer shrink-0"
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-sky hover:text-blackish transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <div className="w-12 h-12 rounded-2xl bg-sky flex items-center justify-center">
                <Bell size={20} className="text-muted" />
              </div>
              <p className="text-sm font-semibold text-blackish">No notifications</p>
              <p className="text-xs text-muted">You're all caught up!</p>
            </div>
          ) : (
            <>
              {today.length > 0 && (
                <div>
                  <div className="px-5 pt-4 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Today</span>
                  </div>
                  {today.map(n => <NotifRow key={n.id} notif={n} onDismiss={dismiss} onRead={markRead} />)}
                </div>
              )}
              {earlier.length > 0 && (
                <div>
                  <div className="px-5 pt-4 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Earlier</span>
                  </div>
                  {earlier.map(n => <NotifRow key={n.id} notif={n} onDismiss={dismiss} onRead={markRead} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function NotifRow({ notif, onDismiss, onRead }: {
  notif: Notification
  onDismiss: (id: string) => void
  onRead: (id: string) => void
}) {
  const Icon = TYPE_ICON[notif.type]

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 cursor-pointer transition-colors',
        notif.read ? 'hover:bg-gray-50' : 'bg-[#FAFBFF] hover:bg-sky/60',
      )}
      onClick={() => onRead(notif.id)}
    >
      {/* Icon — neutral always, shape carries type meaning */}
      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <p className={cn(
          'text-xs leading-tight',
          notif.read ? 'font-medium text-muted' : 'font-semibold text-blackish',
        )}>
          {notif.title}
        </p>
        <p className="text-[11px] text-muted leading-snug mt-0.5">{notif.body}</p>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted/50 font-medium">{notif.time}</p>
          {notif.action && (
            <button
              onClick={e => e.stopPropagation()}
              className="group/action flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-royal font-medium transition-colors cursor-pointer"
            >
              {notif.action}
              <ArrowRight size={10} className="opacity-0 group-hover/action:opacity-100 transition-opacity -translate-x-1 group-hover/action:translate-x-0 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Single unread indicator — one dot, one color */}
      {!notif.read && (
        <span className="absolute right-5 top-4 w-1.5 h-1.5 rounded-full bg-royal shrink-0" />
      )}

      {/* Dismiss on hover */}
      <button
        onClick={e => { e.stopPropagation(); onDismiss(notif.id) }}
        className="absolute right-4 top-3.5 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center text-muted hover:bg-gray-200 hover:text-blackish transition-all cursor-pointer"
        title="Dismiss"
      >
        <X size={11} />
      </button>
    </div>
  )
}
