import { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DateRange = { start: string; end: string }

export type DatePreset = {
  id: string
  label: string
  getRange: (today: string) => DateRange
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(ymd: string, n: number) {
  const d = new Date(ymd + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toYMD(d)
}

function startOfWeek(ymd: string) {
  const d = new Date(ymd + 'T00:00:00')
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toYMD(d)
}

function startOfMonth(ymd: string) {
  return ymd.slice(0, 7) + '-01'
}

function endOfMonth(ymd: string) {
  const d = new Date(ymd.slice(0, 7) + '-01T00:00:00')
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return toYMD(d)
}

function prevMonthStart(ymd: string) {
  const d = new Date(ymd.slice(0, 7) + '-01T00:00:00')
  d.setMonth(d.getMonth() - 1)
  return toYMD(d).slice(0, 7) + '-01'
}

function nextMonthStart(ymd: string) {
  const d = new Date(ymd.slice(0, 7) + '-01T00:00:00')
  d.setMonth(d.getMonth() + 1)
  return toYMD(d).slice(0, 7) + '-01'
}

function getDaysInMonth(yearMonth: string): { ymd: string; isWeekend: boolean }[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const days: { ymd: string; isWeekend: boolean }[] = []
  const d = new Date(firstDay)
  while (d.getMonth() === month - 1) {
    const dow = d.getDay()
    days.push({ ymd: toYMD(d), isWeekend: dow === 0 || dow === 6 })
    d.setDate(d.getDate() + 1)
  }
  return days
}

function firstDayOfWeekOffset(yearMonth: string) {
  const d = new Date(yearMonth + '-01T00:00:00')
  const dow = d.getDay() // 0=Sun
  return dow === 0 ? 6 : dow - 1 // Mon=0
}

function fmtMonthYear(yearMonth: string) {
  const d = new Date(yearMonth + '-01T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmtShort(ymd: string) {
  if (!ymd) return ''
  const d = new Date(ymd + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDisplay(ymd: string) {
  if (!ymd) return ''
  const d = new Date(ymd + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Default presets ───────────────────────────────────────────────────────────

export const DEFAULT_PRESETS: DatePreset[] = [
  { id: 'today',      label: 'Today',        getRange: t => ({ start: t, end: t }) },
  { id: 'yesterday',  label: 'Yesterday',    getRange: t => { const y = addDays(t, -1); return { start: y, end: y } } },
  { id: 'last_7',     label: 'Last 7 days',  getRange: t => ({ start: addDays(t, -6), end: t }) },
  { id: 'last_week',  label: 'Last week',    getRange: t => { const s = addDays(startOfWeek(t), -7); return { start: s, end: addDays(s, 6) } } },
  { id: 'last_2w',    label: 'Last 2 weeks', getRange: t => ({ start: addDays(t, -13), end: t }) },
  { id: 'this_month', label: 'This month',   getRange: t => ({ start: startOfMonth(t), end: endOfMonth(t) }) },
  { id: 'last_month', label: 'Last month',   getRange: t => { const p = prevMonthStart(startOfMonth(t)); return { start: p, end: endOfMonth(p) } } },
]

// ── Calendar month grid ───────────────────────────────────────────────────────

function MonthGrid({
  yearMonth, start, end, hover,
  onDayClick, onDayHover,
}: {
  yearMonth: string
  start: string; end: string; hover: string
  onDayClick: (ymd: string) => void
  onDayHover: (ymd: string) => void
}) {
  const days = getDaysInMonth(yearMonth)
  const offset = firstDayOfWeekOffset(yearMonth)
  const rangeEnd = hover && hover > start ? hover : end

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 14 }}>
        {fmtMonthYear(yearMonth)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: '#9CA3AF', paddingBottom: 6 }}>{d}</div>
        ))}
        {Array.from({ length: offset }).map((_, i) => <div key={'e' + i} />)}
        {days.map(({ ymd, isWeekend }) => {
          const isStart   = ymd === start
          const isEnd     = ymd === end || ymd === rangeEnd
          const inRange   = start && rangeEnd && ymd > start && ymd < rangeEnd
          const isSelected = isStart || isEnd

          const bg = isSelected ? '#6C63FF'
            : inRange ? '#EDE9FE'
            : 'transparent'
          const color = isSelected ? '#fff'
            : isWeekend ? '#6C63FF'
            : '#111827'
          const borderRadius = isStart
            ? '50% 0 0 50%'
            : isEnd
              ? '0 50% 50% 0'
              : inRange ? '0' : '50%'
          const cellBg = inRange ? '#EDE9FE' : isSelected ? '#EDE9FE' : 'transparent'
          const singleSelected = isSelected && !inRange && !(isStart && end && end !== start)

          return (
            <div
              key={ymd}
              onClick={() => onDayClick(ymd)}
              onMouseEnter={() => onDayHover(ymd)}
              style={{
                position: 'relative',
                textAlign: 'center',
                background: inRange || (isStart && end && end > start) || (isEnd && start && start < ymd) ? '#EDE9FE' : 'transparent',
                borderRadius: isStart && (!end || end === start) ? '50%' : isStart ? '50% 0 0 50%' : isEnd ? '0 50% 50% 0' : '0',
              }}
            >
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: '50%',
                  fontSize: 13, fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? '#6C63FF' : 'transparent',
                  color: isSelected ? '#fff' : isWeekend ? '#6C63FF' : '#111827',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  position: 'relative', zIndex: 1,
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F3F4F6' }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {parseInt(ymd.slice(8))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main picker panel ─────────────────────────────────────────────────────────

function PickerPanel({
  value, today, presets, activePreset,
  onApply, onCancel, onPresetClick,
}: {
  value: DateRange
  today: string
  presets: DatePreset[]
  activePreset: string
  onApply: (r: DateRange) => void
  onCancel: () => void
  onPresetClick: (id: string) => void
}) {
  const [leftMonth, setLeftMonth]   = useState(() => value.start ? value.start.slice(0, 7) : today.slice(0, 7))
  const [selecting, setSelecting]   = useState<'start' | 'end'>('start')
  const [pending, setPending]       = useState<DateRange>({ start: value.start, end: value.end })
  const [hover, setHover]           = useState('')

  const rightMonth = nextMonthStart(leftMonth).slice(0, 7)

  function handleDayClick(ymd: string) {
    if (selecting === 'start') {
      setPending({ start: ymd, end: '' })
      setSelecting('end')
    } else {
      if (ymd < pending.start) {
        setPending({ start: ymd, end: pending.start })
      } else {
        setPending({ start: pending.start, end: ymd })
      }
      setSelecting('start')
    }
  }

  function handlePreset(id: string) {
    const p = presets.find(x => x.id === id)
    if (!p) return
    const r = p.getRange(today)
    setPending(r)
    setSelecting('start')
    onPresetClick(id)
    // Snap calendar to show the range
    setLeftMonth(r.start.slice(0, 7))
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column',
      width: 760, overflow: 'hidden',
    }}>
      {/* Top nav + calendars */}
      <div style={{ display: 'flex', padding: '20px 20px 16px' }}>
        {/* Left: nav + dual calendar */}
        <div style={{ flex: 1 }}>
          {/* Navigation row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => setLeftMonth(prevMonthStart(leftMonth + '-01').slice(0, 7))}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <ChevronLeft width={14} height={14} color="#374151" />
            </button>
            <button
              onClick={() => setLeftMonth(nextMonthStart(leftMonth + '-01').slice(0, 7))}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <ChevronRight width={14} height={14} color="#374151" />
            </button>
            <div style={{ flex: 1, padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays width={14} height={14} color="#9CA3AF" />
              {pending.start && pending.end
                ? `${fmtDisplay(pending.start)} – ${fmtDisplay(pending.end)}`
                : pending.start
                  ? `${fmtDisplay(pending.start)} – …`
                  : 'Select a date range'}
            </div>
          </div>

          {/* Dual calendars */}
          <div style={{ display: 'flex', gap: 24 }} onMouseLeave={() => setHover('')}>
            <MonthGrid
              yearMonth={leftMonth}
              start={pending.start} end={pending.end} hover={selecting === 'end' ? hover : ''}
              onDayClick={handleDayClick} onDayHover={setHover}
            />
            <div style={{ width: 1, background: '#F3F4F6', flexShrink: 0 }} />
            <MonthGrid
              yearMonth={rightMonth}
              start={pending.start} end={pending.end} hover={selecting === 'end' ? hover : ''}
              onDayClick={handleDayClick} onDayHover={setHover}
            />
          </div>
        </div>

        {/* Right: presets */}
        <div style={{ width: 140, borderLeft: '1px solid #F3F4F6', paddingLeft: 16, marginLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {presets.map(p => (
            <div
              key={p.id}
              onClick={() => handlePreset(p.id)}
              style={{
                padding: '8px 10px', borderRadius: 8, fontSize: 13,
                fontWeight: activePreset === p.id ? 700 : 500,
                color: activePreset === p.id ? '#6C63FF' : '#374151',
                background: activePreset === p.id ? '#F5F3FF' : 'transparent',
                borderLeft: activePreset === p.id ? '3px solid #6C63FF' : '3px solid transparent',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (activePreset !== p.id) e.currentTarget.style.background = '#FAFAFA' }}
              onMouseLeave={e => { if (activePreset !== p.id) e.currentTarget.style.background = 'transparent' }}
            >
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', minWidth: 160, background: '#FAFAFA' }}>
          {pending.start ? fmtShort(pending.start) : <span style={{ color: '#D1D5DB' }}>Start date</span>}
        </div>
        <ArrowRight width={14} height={14} color="#9CA3AF" />
        <div style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', minWidth: 160, background: '#FAFAFA' }}>
          {pending.end ? fmtShort(pending.end) : <span style={{ color: '#D1D5DB' }}>End date</span>}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onCancel}
          style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >Cancel</button>
        <button
          onClick={() => pending.start && pending.end && onApply(pending)}
          disabled={!pending.start || !pending.end}
          style={{
            padding: '8px 24px', borderRadius: 8, border: 'none',
            background: pending.start && pending.end ? '#16A34A' : '#E5E7EB',
            color: pending.start && pending.end ? '#fff' : '#9CA3AF',
            fontSize: 13, fontWeight: 700, cursor: pending.start && pending.end ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (pending.start && pending.end) (e.currentTarget as HTMLElement).style.background = '#15803D' }}
          onMouseLeave={e => { if (pending.start && pending.end) (e.currentTarget as HTMLElement).style.background = '#16A34A' }}
        >Apply</button>
      </div>
    </div>
  )
}

// ── Trigger button + popover ──────────────────────────────────────────────────

export function DateRangePickerButton({
  start, end, presets = DEFAULT_PRESETS, activePreset, onApply, onPresetClick,
}: {
  start: string
  end: string
  presets?: DatePreset[]
  activePreset: string
  onApply: (r: DateRange) => void
  onPresetClick: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const label = start && end
    ? `${fmtDisplay(start)} – ${fmtDisplay(end)}`
    : 'Select date range'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(x => !x)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 14px', borderRadius: 8,
          border: '1px solid #E5E7EB', background: '#fff',
          fontSize: 13, fontWeight: 600, color: '#374151',
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#C4B5FD')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
      >
        <CalendarDays width={14} height={14} color="#6C63FF" />
        <span style={{ color: '#6B7280', fontWeight: 500 }}>Date:</span>
        <span style={{ fontWeight: 700, color: '#111827' }}>{label}</span>
        <ChevronRight width={12} height={12} color="#9CA3AF" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200 }}>
          <PickerPanel
            value={{ start, end }}
            today={today}
            presets={presets}
            activePreset={activePreset}
            onApply={r => { onApply(r); setOpen(false) }}
            onCancel={() => setOpen(false)}
            onPresetClick={onPresetClick}
          />
        </div>
      )}
    </div>
  )
}
