import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, CalendarDays, SlidersHorizontal,
  Download, Clock, Zap, Camera, LayoutGrid, Keyboard, MousePointer2,
  X, ArrowLeft, ArrowRight, Monitor, Trash2, ImageOff, FileText,
  NotebookPen, CameraOff, Coffee,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { ROUTES } from '../lib/routes'

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

interface Screenshot {
  id: string
  time: string   // "09:02"
  seed: number
}

type BatchType = 'normal' | 'no_screenshot' | 'break'

interface ScreenBatch {
  id: string
  slotStart: string  // "09:00"
  slotEnd: string    // "09:10"
  type: BatchType
  project: string
  breakReason?: string   // only for type='break'
  keystrokes: number
  mouseClicks: number
  activityRate: number
  screenshots: Screenshot[]
}

interface Worker { id: string; name: string; initials: string; color: string; bg: string }

// ─────────────────────────────────────────────────────────────
//  CONSTANTS / DATA
// ─────────────────────────────────────────────────────────────

const TODAY = '2026-06-02'

const WORKERS: Worker[] = [
  { id: 'w1', name: 'Alice Chen',    initials: 'AC', color: '#6C63FF', bg: '#EEEDFF' },
  { id: 'w2', name: 'Bob Martinez',  initials: 'BM', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'w3', name: 'Carmen Santos', initials: 'CS', color: '#06B6D4', bg: '#ECFEFF' },
  { id: 'w4', name: 'David Kim',     initials: 'DK', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'w5', name: 'Elena Patel',   initials: 'EP', color: '#EC4899', bg: '#FDF2F8' },
  { id: 'w6', name: 'Frank Osei',    initials: 'FO', color: '#10B981', bg: '#F0FDF4' },
]

const PROJECTS = ['API Integration', 'Frontend UI', 'QA Testing', 'Client Meeting', 'Code Review', 'Support Tickets', 'Documentation', 'Infrastructure']

const TIMEZONES = [
  { id: 'est',  label: 'EST',     offset: 'UTC-5' },
  { id: 'ph',   label: 'PH Time', offset: 'UTC+8' },
  { id: 'ist',  label: 'IST',     offset: 'UTC+5:30' },
]

// Deterministic hash
function _hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

function toMins(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function toTime(m: number) { const h = Math.floor(m / 60) % 24, mn = m % 60; return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}` }
function addDays(ds: string, n: number) { const d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0] }
function fmtDateFull(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) }
function fmtClock12(t: string) { const [h, m] = t.split(':').map(Number); const ap = h < 12 ? 'am' : 'pm'; return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}` }
function fmtDurMins(mins: number) { const h = Math.floor(mins / 60), m = mins % 60; return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m` }

const BREAK_REASONS = ['Lunch break', 'Tea break', 'Morning break', 'Afternoon break', 'Away from desk']

// Snap minutes to nearest 10-min boundary
function snap10(mins: number) { return toTime(Math.floor(mins / 10) * 10) }

// Generate batches for a worker+date
function generateBatches(workerId: string, date: string): ScreenBatch[] {
  // Work sessions: morning 09:00-12:00, afternoon 13:00-17:30
  const sessions = [
    { start: '09:00', end: '12:00' },
    { start: '13:00', end: '17:30' },
  ]
  const workerProjects: Record<string, string[]> = {
    w1: ['API Integration', 'Code Review'],
    w2: ['Frontend UI'],
    w3: ['QA Testing'],
    w4: ['Support Tickets'],
    w5: ['Client Meeting', 'Documentation'],
    w6: ['Infrastructure'],
  }
  const projects = workerProjects[workerId] ?? PROJECTS

  // Deterministic special slots per worker+date
  // Break 1: morning — somewhere in 10:00–10:50 window
  const break1 = snap10(600 + (_hash(`${workerId}_${date}_b1`) % 6) * 10)
  // Break 2: afternoon — somewhere in 14:30–15:20 window
  const break2 = snap10(870 + (_hash(`${workerId}_${date}_b2`) % 6) * 10)
  // No-screenshot 1: late morning — somewhere in 11:00–11:50
  const noss1  = snap10(660 + (_hash(`${workerId}_${date}_n1`) % 6) * 10)
  // No-screenshot 2: mid-afternoon — somewhere in 15:30–16:20
  const noss2  = snap10(930 + (_hash(`${workerId}_${date}_n2`) % 6) * 10)

  const breakSlots  = new Set([break1, break2])
  const nossSlots   = new Set([noss1, noss2])
  const breakReason1 = BREAK_REASONS[_hash(`${workerId}_${date}_br1`) % BREAK_REASONS.length]
  const breakReason2 = BREAK_REASONS[_hash(`${workerId}_${date}_br2`) % BREAK_REASONS.length]
  const breakReasons: Record<string, string> = { [break1]: breakReason1, [break2]: breakReason2 }

  const batches: ScreenBatch[] = []

  for (const sess of sessions) {
    let cursor = toMins(sess.start)
    const end = toMins(sess.end)

    while (cursor + 10 <= end) {
      const slotStart = toTime(cursor)
      const slotEnd = toTime(cursor + 10)
      const seed = _hash(`${workerId}_${date}_${slotStart}`)
      const projectIdx = Math.floor(seed / 100) % projects.length
      const project = projects[projectIdx]

      // ── Break slot ────────────────────────────────────────
      if (breakSlots.has(slotStart)) {
        batches.push({
          id: `${workerId}_${date}_${slotStart}`,
          slotStart, slotEnd,
          type: 'break',
          breakReason: breakReasons[slotStart],
          project: '',
          keystrokes: 0, mouseClicks: 0, activityRate: 0,
          screenshots: [],
        })
        cursor += 10
        continue
      }

      // ── No-screenshot slot ────────────────────────────────
      if (nossSlots.has(slotStart)) {
        batches.push({
          id: `${workerId}_${date}_${slotStart}`,
          slotStart, slotEnd,
          type: 'no_screenshot',
          project,
          keystrokes: 0, mouseClicks: 0, activityRate: 0,
          screenshots: [],
        })
        cursor += 10
        continue
      }

      // ── Normal slot ───────────────────────────────────────
      const activityRate = 45 + (seed % 50)
      const keystrokes = 100 + (seed % 900)
      const mouseClicks = 10 + (seed % 80)

      // 1-3 screenshots per batch
      const ssCount = 1 + (seed % 3)
      const screenshots: Screenshot[] = []
      for (let i = 0; i < ssCount; i++) {
        const ssMins = cursor + Math.floor((10 / (ssCount + 1)) * (i + 1))
        screenshots.push({
          id: `${workerId}_${date}_${slotStart}_${i}`,
          time: toTime(ssMins),
          seed: _hash(`${workerId}_${date}_${slotStart}_${i}`),
        })
      }

      batches.push({
        id: `${workerId}_${date}_${slotStart}`,
        slotStart, slotEnd,
        type: 'normal',
        project,
        keystrokes, mouseClicks, activityRate,
        screenshots,
      })

      cursor += 10
    }
  }

  return batches
}

// ─────────────────────────────────────────────────────────────
//  SCREENSHOT PLACEHOLDER  (SVG fake screen)
// ─────────────────────────────────────────────────────────────

function ScreenshotImage({ seed, width, height, style }: { seed: number; width: number; height: number; style?: React.CSSProperties }) {
  const isDark = seed % 3 !== 0
  const bg      = isDark ? '#1e1e2e' : '#f8fafc'
  const toolbar = isDark ? '#16213e' : '#e2e8f0'
  const sidebar = isDark ? '#242438' : '#f1f5f9'
  const line1   = isDark ? '#3d3d5c' : '#cbd5e1'
  const line2   = isDark ? '#4a4a6a' : '#e2e8f0'
  const accentColors = ['#6C63FF','#3B82F6','#10B981','#F59E0B','#EC4899','#06B6D4']
  const accent  = accentColors[seed % accentColors.length]
  const accent2 = accentColors[(seed + 2) % accentColors.length]
  const accent3 = accentColors[(seed + 4) % accentColors.length]
  const textLight = isDark ? '#4a5568' : '#94a3b8'

  // Vary the "type" of screen shown
  const screenType = seed % 4  // 0=code, 1=dashboard, 2=form, 3=table

  return (
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', ...style }}
    >
      {/* Background */}
      <rect width={width} height={height} fill={bg} />

      {/* Top menu bar */}
      <rect width={width} height={22} fill={toolbar} />
      <rect x={8} y={8} width={6} height={6} rx={3} fill="#EF4444" />
      <rect x={18} y={8} width={6} height={6} rx={3} fill="#F59E0B" />
      <rect x={28} y={8} width={6} height={6} rx={3} fill="#10B981" />
      <rect x={width * 0.3} y={6} width={width * 0.4} height={10} rx={3} fill={isDark ? '#2a2a40' : '#cbd5e1'} />

      {screenType === 0 && (
        /* Code editor */
        <>
          {/* Sidebar file tree */}
          <rect x={0} y={22} width={width * 0.22} height={height - 22} fill={sidebar} />
          {[0,1,2,3,4,5,6,7].map(i => (
            <rect key={i} x={8} y={32 + i * 14} width={width * 0.15 - (i % 3) * 10} height={6} rx={2} fill={i === 2 ? accent : line1} opacity={i === 2 ? 0.9 : 0.6} />
          ))}
          {/* Code lines */}
          {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
            const lineW = (0.4 + ((_hash(`${seed}_line_${i}`) % 40) / 100)) * (width * 0.74)
            const col = [accent, accent2, textLight, textLight, accent3][i % 5]
            return <rect key={i} x={width * 0.24} y={28 + i * ((height - 28) / 14)} width={lineW} height={5} rx={2} fill={col} opacity={0.75} />
          })}
        </>
      )}

      {screenType === 1 && (
        /* Dashboard */
        <>
          {/* Sidebar nav */}
          <rect x={0} y={22} width={width * 0.18} height={height - 22} fill={sidebar} />
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={6} y={30 + i * 18} width={width * 0.12} height={9} rx={3} fill={i === 1 ? accent : line1} opacity={i === 1 ? 0.9 : 0.5} />
          ))}
          {/* Chart area */}
          <rect x={width * 0.2} y={28} width={width * 0.76} height={height * 0.38} rx={4} fill={isDark ? '#2a2a40' : '#fff'} stroke={line2} strokeWidth={1} />
          {/* Bar chart bars */}
          {[0,1,2,3,4,5,6].map(i => {
            const barH = 15 + (_hash(`${seed}_bar_${i}`) % 40)
            return (
              <rect key={i}
                x={width * 0.22 + i * (width * 0.74 / 8)}
                y={28 + height * 0.38 - barH - 6}
                width={width * 0.06} height={barH} rx={2}
                fill={i % 2 === 0 ? accent : accent2} opacity={0.85}
              />
            )
          })}
          {/* Stat cards */}
          {[0,1,2].map(i => (
            <rect key={i} x={width * 0.2 + i * (width * 0.26)} y={28 + height * 0.44} width={width * 0.23} height={height * 0.28} rx={4} fill={isDark ? '#2a2a40' : '#fff'} stroke={line2} strokeWidth={1} />
          ))}
        </>
      )}

      {screenType === 2 && (
        /* Form / editor */
        <>
          <rect x={width * 0.1} y={30} width={width * 0.8} height={height - 40} rx={6} fill={isDark ? '#252538' : '#fff'} stroke={line2} strokeWidth={1} />
          {/* Form fields */}
          {[0,1,2,3].map(i => (
            <React.Fragment key={i}>
              <rect x={width * 0.14} y={42 + i * 28} width={width * 0.25} height={6} rx={2} fill={textLight} opacity={0.6} />
              <rect x={width * 0.14} y={52 + i * 28} width={width * 0.7} height={12} rx={3} fill={line2} opacity={0.5} />
            </React.Fragment>
          ))}
          {/* Submit button */}
          <rect x={width * 0.14} y={height - 34} width={width * 0.25} height={14} rx={4} fill={accent} opacity={0.9} />
        </>
      )}

      {screenType === 3 && (
        /* Data table */
        <>
          {/* Table header */}
          <rect x={0} y={22} width={width} height={18} fill={isDark ? '#252538' : '#f1f5f9'} />
          {[0,1,2,3].map(i => (
            <rect key={i} x={8 + i * (width / 4)} y={28} width={width / 4 - 12} height={6} rx={2} fill={textLight} opacity={0.7} />
          ))}
          {/* Table rows */}
          {[0,1,2,3,4,5,6].map(i => (
            <React.Fragment key={i}>
              <rect x={0} y={40 + i * 16} width={width} height={16} fill={i % 2 === 0 ? bg : (isDark ? '#252538' : '#f8fafc')} />
              {[0,1,2,3].map(j => (
                <rect key={j} x={8 + j * (width / 4)} y={45 + i * 16} width={width / 4 - 16} height={5} rx={2}
                  fill={j === 0 && i === 2 ? accent : line1} opacity={j === 0 && i === 2 ? 0.9 : 0.5} />
              ))}
            </React.Fragment>
          ))}
        </>
      )}

      {/* OS-style status bar at bottom */}
      <rect x={0} y={height - 14} width={width} height={14} fill={toolbar} opacity={0.8} />
      <rect x={8} y={height - 10} width={40} height={5} rx={2} fill={line1} opacity={0.6} />
      <rect x={width - 60} y={height - 10} width={50} height={5} rx={2} fill={line1} opacity={0.6} />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
//  ACTIVITY BAR  (red/yellow/green progress bar)
// ─────────────────────────────────────────────────────────────

function ActivityBar({ rate }: { rate: number }) {
  const color = rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${rate}%`, background: color, borderRadius: 99, transition: 'width 0.3s' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  LIGHTBOX
// ─────────────────────────────────────────────────────────────

interface LightboxState { screenshot: Screenshot; batchId: string; indexInAll: number; total: number }

function Lightbox({ state, onClose, onPrev, onNext }: {
  state: LightboxState
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 24,
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
          width: 40, height: 40, cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      ><X width={20} height={20} /></button>

      {/* Prev */}
      <button
        onClick={e => { e.stopPropagation(); onPrev() }}
        style={{
          position: 'fixed', left: 24, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
          width: 44, height: 44, cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      ><ArrowLeft width={22} height={22} /></button>

      {/* Next */}
      <button
        onClick={e => { e.stopPropagation(); onNext() }}
        style={{
          position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
          width: 44, height: 44, cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      ><ArrowRight width={22} height={22} /></button>

      {/* Image */}
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '82vh' }}>
        <ScreenshotImage
          seed={state.screenshot.seed}
          width={Math.min(1200, window.innerWidth * 0.82)}
          height={Math.min(720, window.innerHeight * 0.75)}
          style={{ borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        />
        {/* Caption */}
        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
            Screenshot <strong style={{ color: '#fff' }}>{state.indexInAll + 1}</strong> of <strong style={{ color: '#fff' }}>{state.total}</strong>
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
            {fmtClock12(state.screenshot.time)}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
            Esc to close · ← → to navigate
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  KPI CARD
// ─────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, iconBg, iconColor }: {
  icon: React.ReactNode; label: string; value: string; sub?: string
  iconBg: string; iconColor: string
}) {
  return (
    <div style={{
      flex: 1, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12,
      padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  FILTER PANEL (slide-out, same as timesheets)
// ─────────────────────────────────────────────────────────────

function FilterPanel({
  open, onClose,
  filterProjects, setFilterProjects,
  filterActivityMin, setFilterActivityMin,
  filterActivityMax, setFilterActivityMax,
  filterActivityLevels, setFilterActivityLevels,
}: {
  open: boolean; onClose: () => void
  filterProjects: string[]; setFilterProjects: (v: string[]) => void
  filterActivityMin: number; setFilterActivityMin: (v: number) => void
  filterActivityMax: number; setFilterActivityMax: (v: number) => void
  filterActivityLevels: Set<string>; setFilterActivityLevels: (v: Set<string>) => void
}) {
  function clearAll() {
    setFilterProjects([])
    setFilterActivityMin(0)
    setFilterActivityMax(100)
    setFilterActivityLevels(new Set())
  }

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'block' }

  return (
    <>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={onClose} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
        background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 200, transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Filters</span>
          <button onClick={clearAll} style={{ fontSize: 12, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear all</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Projects */}
          <div style={{ marginBottom: 24 }}>
            <span style={sectionLabel}>Project</span>
            <select
              value={filterProjects[0] ?? ''}
              onChange={e => setFilterProjects(e.target.value ? [e.target.value] : [])}
              style={inp}
            >
              <option value="">All projects</option>
              {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Activity range */}
          <div style={{ marginBottom: 24 }}>
            <span style={sectionLabel}>Activity Rate</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Min %</div>
                <input type="number" min={0} max={100} value={filterActivityMin}
                  onChange={e => setFilterActivityMin(Math.min(Number(e.target.value), filterActivityMax))} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Max %</div>
                <input type="number" min={0} max={100} value={filterActivityMax}
                  onChange={e => setFilterActivityMax(Math.max(Number(e.target.value), filterActivityMin))} style={inp} />
              </div>
            </div>
          </div>

          {/* Activity levels */}
          <div style={{ marginBottom: 24 }}>
            <span style={sectionLabel}>Activity Level</span>
            {(['Low','Medium','High'] as const).map(lvl => (
              <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={filterActivityLevels.has(lvl)}
                  onChange={ev => setFilterActivityLevels(prev => {
                    const next = new Set(prev); ev.target.checked ? next.add(lvl) : next.delete(lvl); return next
                  })}
                  style={{ width: 15, height: 15, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#374151' }}>{lvl}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                  background: lvl === 'High' ? '#F0FDF4' : lvl === 'Medium' ? '#FFFBEB' : '#FEF2F2',
                  color: lvl === 'High' ? '#10B981' : lvl === 'Medium' ? '#F59E0B' : '#EF4444',
                }}>{lvl === 'Low' ? '<40%' : lvl === 'Medium' ? '40–70%' : '>70%'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #F0F0F0' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '9px', border: 'none', borderRadius: 7, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
//  APPS SUB-PAGE  (placeholder)
// ─────────────────────────────────────────────────────────────

function AppsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: '#9CA3AF' }}>
      <Monitor width={40} height={40} strokeWidth={1.2} />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280' }}>Apps tracking coming soon</div>
      <div style={{ fontSize: 13 }}>This section will show app usage breakdowns by project.</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  DATE PICKER  (input[type=date] with nav arrows + Today)
// ─────────────────────────────────────────────────────────────

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isToday = date === TODAY

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <button
        onClick={() => onChange(addDays(date, -1))}
        style={{ width: 32, height: 34, border: '1px solid #E5E7EB', borderRight: 'none', borderRadius: '7px 0 0 7px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
      ><ChevronLeft width={14} height={14} /></button>

      <div
        style={{ height: 34, padding: '0 10px', border: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#111827', fontWeight: 500, minWidth: 148, position: 'relative' }}
        onClick={() => inputRef.current?.showPicker?.()}
      >
        <CalendarDays width={13} height={13} color="#9CA3AF" />
        {fmtDateFull(date)}
        <input
          ref={inputRef}
          type="date"
          value={date}
          onChange={e => e.target.value && onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
        />
      </div>

      <button
        onClick={() => onChange(addDays(date, 1))}
        style={{ width: 32, height: 34, border: '1px solid #E5E7EB', borderLeft: 'none', borderRadius: '0 7px 7px 0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
      ><ChevronRight width={14} height={14} /></button>

      <button
        onClick={() => onChange(TODAY)}
        style={{
          marginLeft: 6, height: 34, padding: '0 12px', border: `1px solid ${isToday ? '#6C63FF' : '#E5E7EB'}`,
          borderRadius: 7, background: isToday ? '#F5F3FF' : '#fff', cursor: 'pointer',
          fontSize: 12.5, fontWeight: 600, color: isToday ? '#6C63FF' : '#6B7280',
        }}
      >Today</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  NOTE POPUP
// ─────────────────────────────────────────────────────────────

function NotePopup({ slotLabel, rect, existingNotes, onAppend, onClose }: {
  slotLabel: string; rect: DOMRect
  existingNotes: string[]; onAppend: (text: string) => void; onClose: () => void
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const POP_W = 320

  // Position: prefer above the anchor, flip below if near viewport top
  const hasNotes    = existingNotes.length > 0
  const approxH     = hasNotes ? 80 + existingNotes.length * 72 + 120 : 200
  const preferTop   = rect.top - approxH - 8
  const top  = preferTop > 8 ? preferTop : rect.bottom + 8
  const left = Math.min(Math.max(rect.left + rect.width / 2 - POP_W / 2, 8), window.innerWidth - POP_W - 8)

  const canSave = text.trim().length > 0

  function handleSave() {
    if (!canSave) return
    onAppend(text.trim())
    setText('')
    textareaRef.current?.focus()
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 450 }} onClick={onClose} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top, left, width: POP_W, zIndex: 451,
          background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB',
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
          overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <NotebookPen width={14} height={14} color="#6C63FF" />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>
                Notes
                {hasNotes && <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 5 }}>({existingNotes.length})</span>}
              </div>
              <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 1 }}>{slotLabel}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', lineHeight: 1, padding: 2 }}>
            <X width={14} height={14} />
          </button>
        </div>

        {/* Existing notes list */}
        {hasNotes && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {existingNotes.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                {/* Note number bubble */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#F0EEFF',
                  color: '#6C63FF', fontSize: 10, fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <div style={{
                  flex: 1, padding: '7px 10px', background: '#F9FAFB',
                  border: '1px solid #F0F0F0', borderRadius: 7,
                  fontSize: 12.5, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {n}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add another note */}
        <div style={{ padding: hasNotes ? '10px 14px 0' : '12px 14px 0', flexShrink: 0 }}>
          {hasNotes && (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Add another note
            </div>
          )}
          <textarea
            ref={textareaRef}
            autoFocus={!hasNotes}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave() }}
            placeholder={hasNotes ? 'Write another note…' : 'Add a note for this time slot…'}
            rows={3}
            style={{
              width: '100%', padding: '8px 10px', border: `1px solid ${canSave ? '#C7C3FF' : '#E5E7EB'}`,
              borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#111827',
              outline: 'none', resize: 'none', boxSizing: 'border-box',
              background: '#FAFAFA', lineHeight: 1.6, transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10.5, color: '#C4C4C4' }}>⌘↵ to save</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onClose} style={{ padding: '5px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#6B7280' }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                padding: '5px 14px', border: 'none', borderRadius: 6,
                background: canSave ? '#6C63FF' : '#E5E7EB',
                color: canSave ? '#fff' : '#9CA3AF',
                cursor: canSave ? 'pointer' : 'default',
                fontSize: 12, fontWeight: 600,
              }}
            >Save note</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
//  ALL NOTES PANEL
// ─────────────────────────────────────────────────────────────

interface NoteEntry {
  batchId: string; slotLabel: string; project: string
  texts: string[]; primarySeed: number
}

function AllNotesPanel({ open, onClose, notes, workerColor }: {
  open: boolean; onClose: () => void
  notes: NoteEntry[]; workerColor: string
}) {
  const totalNotes = notes.reduce((s, n) => s + n.texts.length, 0)

  return (
    <>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={onClose} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 200, transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotebookPen width={16} height={16} color="#6C63FF" />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>All Notes</span>
          </div>
          <span style={{ fontSize: 12, color: '#9CA3AF', background: '#F3F4F6', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>
            {totalNotes} note{totalNotes !== 1 ? 's' : ''} · {notes.length} slot{notes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {notes.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 10, color: '#9CA3AF' }}>
              <FileText width={32} height={32} strokeWidth={1.2} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>No notes yet</div>
              <div style={{ fontSize: 12, textAlign: 'center' }}>Click the note icon on any screenshot card to add one.</div>
            </div>
          ) : (
            notes.map(n => (
              <div key={n.batchId} style={{ marginBottom: 16, border: '1px solid #E8E8E8', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>

                {/* Batch header: thumbnail + meta */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #F0F0F0' }}>
                  {/* Screenshot thumbnail */}
                  <div style={{ width: 90, flexShrink: 0, overflow: 'hidden' }}>
                    <ScreenshotImage seed={n.primarySeed} width={90} height={58} />
                  </div>

                  {/* Meta */}
                  <div style={{ flex: 1, padding: '9px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, color: workerColor,
                        background: `${workerColor}18`, padding: '2px 8px', borderRadius: 99,
                      }}>{n.project}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {n.texts.length} note{n.texts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>{n.slotLabel}</span>
                  </div>
                </div>

                {/* Notes list */}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {n.texts.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#F0EEFF', color: '#6C63FF',
                        fontSize: 9.5, fontWeight: 700, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                      }}>{i + 1}</div>
                      <p style={{ margin: 0, fontSize: 12.5, color: '#374151', lineHeight: 1.65, whiteSpace: 'pre-wrap', flex: 1 }}>
                        {t}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
//  SPECIAL SLOT CARDS  (no screenshot / break)
// ─────────────────────────────────────────────────────────────

function NoScreenshotCard({ batch }: { batch: ScreenBatch }) {
  return (
    <div style={{
      background: '#FFFBEB', border: '1.5px dashed #FCD34D',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Header chip */}
      <div style={{ padding: '9px 12px 7px', borderBottom: '1px solid #FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#92400E',
          background: '#FEF3C7', padding: '3px 9px', borderRadius: 99,
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <CameraOff width={10} height={10} />
          No Screenshot
        </span>
        <span style={{ fontSize: 10.5, color: '#B45309' }}>Needs review</span>
      </div>

      {/* Placeholder area */}
      <div style={{
        height: 140, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'repeating-linear-gradient(45deg, #FFFBEB, #FFFBEB 8px, #FEF9C3 8px, #FEF9C3 16px)',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CameraOff width={22} height={22} color="#D97706" strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400E' }}>No screenshot captured</div>
          <div style={{ fontSize: 11, color: '#B45309', marginTop: 3 }}>Tracker may have been paused</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 12px 10px', borderTop: '1px solid #FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#92400E' }}>
          {fmtClock12(batch.slotStart)} – {fmtClock12(batch.slotEnd)}
        </span>
        <span style={{ fontSize: 11, color: '#D97706', fontWeight: 500 }}>10 min gap</span>
      </div>
    </div>
  )
}

function BreakCard({ batch }: { batch: ScreenBatch }) {
  return (
    <div style={{
      background: '#F0F9FF', border: '1.5px solid #BAE6FD',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Header chip */}
      <div style={{ padding: '9px 12px 7px', borderBottom: '1px solid #E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#0369A1',
          background: '#E0F2FE', padding: '3px 9px', borderRadius: 99,
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <Coffee width={10} height={10} />
          On Break
        </span>
        <span style={{ fontSize: 10.5, color: '#0284C7' }}>Expected</span>
      </div>

      {/* Visual area */}
      <div style={{
        height: 140, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(2,132,199,0.15)' }}>
          <Coffee width={24} height={24} color="#0284C7" strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>
            {batch.breakReason ?? 'Break'}
          </div>
          <div style={{ fontSize: 11, color: '#0284C7', marginTop: 3 }}>No activity tracked</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 12px 10px', borderTop: '1px solid #E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0369A1' }}>
          {fmtClock12(batch.slotStart)} – {fmtClock12(batch.slotEnd)}
        </span>
        <span style={{ fontSize: 11, color: '#0284C7', fontWeight: 500 }}>10 min</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  SCREENSHOT CARD  (10min view)
// ─────────────────────────────────────────────────────────────

function BatchCard({
  batch, workerColor, notes, screenshotsDeleted,
  onScreenshotClick, onNoteClick, onDeleteScreenshots, onDeleteActivity,
}: {
  batch: ScreenBatch
  workerColor: string
  notes: string[]
  screenshotsDeleted: boolean
  onScreenshotClick: (ss: Screenshot) => void
  onNoteClick: (rect: DOMRect) => void
  onDeleteScreenshots: () => void
  onDeleteActivity: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<null | 'screenshots' | 'activity'>(null)
  const noteRef = useRef<HTMLButtonElement>(null)
  const primary = batch.screenshots[0]
  const actColor = batch.activityRate >= 70 ? '#10B981' : batch.activityRate >= 40 ? '#F59E0B' : '#EF4444'
  const hasNotes = notes.length > 0

  function handleNoteClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (noteRef.current) onNoteClick(noteRef.current.getBoundingClientRect())
  }

  function handleDelete(type: 'screenshots' | 'activity', e: React.MouseEvent) {
    e.stopPropagation()
    if (deleteConfirm === type) {
      // confirmed — execute
      if (type === 'screenshots') onDeleteScreenshots()
      else onDeleteActivity()
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(type)
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDeleteConfirm(null) }}
      style={{
        background: '#fff', border: `1px solid ${hovered ? '#C7C3FF' : '#E8E8E8'}`,
        borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? '0 4px 16px rgba(108,99,255,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
    >
      {/* Project chip */}
      <div style={{ padding: '9px 12px 6px', borderBottom: '1px solid #F3F4F6' }}>
        <Link
          to={ROUTES.projects}
          style={{
            fontSize: 11.5, fontWeight: 700, color: workerColor,
            background: `${workerColor}18`, padding: '3px 9px', borderRadius: 99,
            textDecoration: 'none', display: 'inline-block',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
          }}
          title={batch.project}
          onClick={e => e.stopPropagation()}
        >
          {batch.project}
        </Link>
      </div>

      {/* Screenshot thumbnail */}
      <div style={{ position: 'relative' }}>
        {screenshotsDeleted ? (
          /* Deleted screenshots placeholder */
          <div style={{
            width: '100%', height: 172, background: '#F9FAFB',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 6, color: '#D1D5DB',
          }}>
            <ImageOff width={28} height={28} strokeWidth={1.2} />
            <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>Screenshots deleted</span>
          </div>
        ) : (
          <div style={{ cursor: 'pointer' }} onClick={() => onScreenshotClick(primary)}>
            <ScreenshotImage seed={primary.seed} width={300} height={172} />

            {/* Count badge */}
            {hovered && batch.screenshots.length > 1 && (
              <div style={{
                position: 'absolute', top: 8, left: 8,
                background: 'rgba(0,0,0,0.62)', color: '#fff',
                fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px',
                pointerEvents: 'none',
              }}>
                {batch.screenshots.length} screenshots
              </div>
            )}

            {/* Extra thumbnails strip */}
            {batch.screenshots.length > 1 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 2, padding: '0 2px 2px', background: 'linear-gradient(transparent, rgba(0,0,0,0.4))' }}>
                {batch.screenshots.map(ss => (
                  <div
                    key={ss.id}
                    onClick={e => { e.stopPropagation(); onScreenshotClick(ss) }}
                    style={{ flex: 1, height: 28, overflow: 'hidden', borderRadius: 3, cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.3)' }}
                  >
                    <ScreenshotImage seed={ss.seed} width={80} height={28} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Hover delete actions overlay ── */}
        {hovered && (
          <div
            style={{
              position: 'absolute', top: 0, right: 0, left: 0,
              display: 'flex', gap: 6, padding: '8px',
              justifyContent: 'flex-end',
              background: 'linear-gradient(rgba(0,0,0,0.45), transparent)',
              pointerEvents: 'none',
            }}
          >
            {/* Delete screenshots button */}
            {!screenshotsDeleted && (
              <button
                onClick={e => handleDelete('screenshots', e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600,
                  background: deleteConfirm === 'screenshots' ? '#EF4444' : 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  pointerEvents: 'all',
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <ImageOff width={11} height={11} />
                {deleteConfirm === 'screenshots' ? 'Confirm?' : 'Del. screenshots'}
              </button>
            )}

            {/* Delete activity button */}
            <button
              onClick={e => handleDelete('activity', e)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                background: deleteConfirm === 'activity' ? '#EF4444' : 'rgba(0,0,0,0.55)',
                color: '#fff',
                pointerEvents: 'all',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <Trash2 width={11} height={11} />
              {deleteConfirm === 'activity' ? 'Confirm?' : 'Del. activity'}
            </button>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div style={{ padding: '8px 12px 10px' }}>
        {/* Time range */}
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          {fmtClock12(batch.slotStart)} – {fmtClock12(batch.slotEnd)}
        </div>

        {/* Activity bar */}
        <ActivityBar rate={batch.activityRate} />

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#6B7280' }}>
            <Keyboard width={11} height={11} />
            <span>{batch.keystrokes}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#6B7280' }}>
            <MousePointer2 width={11} height={11} />
            <span>{batch.mouseClicks}</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, color: actColor }}>
            {batch.activityRate}%
          </div>

          {/* Note icon — always visible */}
          <button
            ref={noteRef}
            onClick={handleNoteClick}
            title={hasNotes ? `${notes.length} note${notes.length > 1 ? 's' : ''} — click to add another` : 'Add note'}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              height: 22, padding: '0 7px', border: 'none', borderRadius: 5,
              background: hasNotes ? '#F0EEFF' : 'transparent',
              cursor: 'pointer',
              color: hasNotes ? '#6C63FF' : '#D1D5DB',
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
              fontSize: 10.5, fontWeight: hasNotes ? 700 : 400,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6C63FF'; (e.currentTarget as HTMLElement).style.background = '#F0EEFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = hasNotes ? '#6C63FF' : '#D1D5DB'; (e.currentTarget as HTMLElement).style.background = hasNotes ? '#F0EEFF' : 'transparent' }}
          >
            <FileText width={12} height={12} />
            {hasNotes && <span>{notes.length}</span>}
          </button>
        </div>

        {/* Note preview */}
        {hasNotes && (
          <div style={{ marginTop: 6, borderTop: '1px solid #F0F0F0', paddingTop: 6 }}>
            {notes.length === 1 ? (
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5, fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {notes[0]}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {notes.slice(0, 2).map((n, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#F0EEFF', color: '#6C63FF', fontSize: 8.5, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.45, fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', flex: 1 }}>{n}</span>
                  </div>
                ))}
                {notes.length > 2 && <span style={{ fontSize: 10.5, color: '#9CA3AF', marginLeft: 19 }}>+{notes.length - 2} more</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  ALL VIEW CARD  (just timestamp + big image)
// ─────────────────────────────────────────────────────────────

function AllScreenCard({ ss, workerColor, project, onClick }: {
  ss: Screenshot; workerColor: string; project: string; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: '#fff', border: `1px solid ${hovered ? '#C7C3FF' : '#E8E8E8'}`,
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(108,99,255,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Project chip */}
      <div style={{ padding: '8px 10px 5px' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: workerColor,
          background: `${workerColor}18`, padding: '2px 8px', borderRadius: 99,
          display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis', maxWidth: '100%',
        }}>{project}</span>
      </div>

      {/* Image */}
      <div style={{ position: 'relative' }}>
        <ScreenshotImage seed={ss.seed} width={300} height={172} />
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(108,99,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: 'rgba(108,99,255,0.85)', color: '#fff', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600 }}>
              View screenshot
            </div>
          </div>
        )}
      </div>

      {/* Time */}
      <div style={{ padding: '7px 10px 9px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
        {fmtClock12(ss.time)}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────

type ViewMode = '10min' | 'all'

export function ActivityPage({ view }: { view: 'screenshots' | 'apps' }) {
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode]         = useState<ViewMode>('10min')
  const [date, setDate]                 = useState(() => {
    const d = searchParams.get('date')
    return (d === 'today' || !d) ? TODAY : d
  })
  const [workerId, setWorkerId]         = useState(() => {
    const name = searchParams.get('worker')
    if (!name) return 'w1'
    return WORKERS.find(w => w.name.toLowerCase() === name.toLowerCase())?.id ?? 'w1'
  })
  const [timezone, setTimezone]         = useState('est')
  const [filterOpen, setFilterOpen]     = useState(false)
  const [lightbox, setLightbox]         = useState<LightboxState | null>(null)

  // Notes & deletions
  const [notes, setNotes]                           = useState<Record<string, string[]>>({})
  const [notePopup, setNotePopup]                   = useState<{ batchId: string; rect: DOMRect } | null>(null)
  const [notesOpen, setNotesOpen]                   = useState(false)
  const [deletedBatchIds, setDeletedBatchIds]       = useState<Set<string>>(new Set())
  const [screenshotsDeleted, setScreenshotsDeleted] = useState<Set<string>>(new Set())

  // Filters
  const [filterProjects, setFilterProjects]             = useState<string[]>([])
  const [filterActivityMin, setFilterActivityMin]       = useState(0)
  const [filterActivityMax, setFilterActivityMax]       = useState(100)
  const [filterActivityLevels, setFilterActivityLevels] = useState<Set<string>>(new Set())

  const isFilterActive = filterProjects.length > 0 || filterActivityMin > 0 || filterActivityMax < 100 || filterActivityLevels.size > 0

  const worker = WORKERS.find(w => w.id === workerId) ?? WORKERS[0]

  // Generate batches for selected worker + date
  const allBatches = useMemo(() => generateBatches(workerId, date), [workerId, date])

  // Apply filters + exclude deleted batches
  const batches = useMemo(() => allBatches.filter(b => {
    if (deletedBatchIds.has(b.id)) return false
    if (filterProjects.length > 0 && !filterProjects.includes(b.project)) return false
    if (b.activityRate < filterActivityMin || b.activityRate > filterActivityMax) return false
    if (filterActivityLevels.size > 0) {
      const lvl = b.activityRate >= 70 ? 'High' : b.activityRate >= 40 ? 'Medium' : 'Low'
      if (!filterActivityLevels.has(lvl)) return false
    }
    return true
  }), [allBatches, deletedBatchIds, filterProjects, filterActivityMin, filterActivityMax, filterActivityLevels])

  // Sorted note entries for AllNotesPanel — normal batches only
  const noteEntries = useMemo((): NoteEntry[] =>
    batches
      .filter(b => b.type === 'normal' && notes[b.id]?.length > 0)
      .map(b => ({
        batchId: b.id,
        slotLabel: `${fmtClock12(b.slotStart)} – ${fmtClock12(b.slotEnd)}`,
        project: b.project,
        texts: notes[b.id],
        primarySeed: b.screenshots[0]?.seed ?? 0,
      })),
    [batches, notes]
  )

  // All individual screenshots in order (for lightbox prev/next) — normal batches only
  const allScreenshots = useMemo(() => batches.filter(b => b.type === 'normal').flatMap(b => b.screenshots.map(ss => ({ ss, batch: b }))), [batches])

  // Group batches by hour
  const byHour = useMemo(() => {
    const map = new Map<number, ScreenBatch[]>()
    batches.forEach(b => {
      const hr = Math.floor(toMins(b.slotStart) / 60)
      const arr = map.get(hr) ?? []; arr.push(b); map.set(hr, arr)
    })
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [batches])

  // KPIs — only count normal batches for time/activity, all for display
  const normalBatches    = useMemo(() => batches.filter(b => b.type === 'normal'), [batches])
  const totalMins        = useMemo(() => normalBatches.length * 10, [normalBatches])
  const avgActivity      = useMemo(() => normalBatches.length > 0 ? Math.round(normalBatches.reduce((s, b) => s + b.activityRate, 0) / normalBatches.length) : 0, [normalBatches])
  const totalScreenshots = useMemo(() => normalBatches.reduce((s, b) => s + b.screenshots.length, 0), [normalBatches])

  function openLightbox(ss: Screenshot) {
    const idx = allScreenshots.findIndex(x => x.ss.id === ss.id)
    if (idx < 0) return
    const batch = allScreenshots[idx].batch
    setLightbox({ screenshot: ss, batchId: batch.id, indexInAll: idx, total: allScreenshots.length })
  }

  function prevScreenshot() {
    if (!lightbox || lightbox.indexInAll <= 0) return
    const prev = allScreenshots[lightbox.indexInAll - 1]
    setLightbox({ screenshot: prev.ss, batchId: prev.batch.id, indexInAll: lightbox.indexInAll - 1, total: lightbox.total })
  }

  function nextScreenshot() {
    if (!lightbox || lightbox.indexInAll >= lightbox.total - 1) return
    const next = allScreenshots[lightbox.indexInAll + 1]
    setLightbox({ screenshot: next.ss, batchId: next.batch.id, indexInAll: lightbox.indexInAll + 1, total: lightbox.total })
  }

  // ── Render ──────────────────────────────────────────────────

  const selBtn = (active: boolean): React.CSSProperties => ({
    padding: '0 18px', height: 34, border: 'none', borderRadius: 7,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: active ? '#6C63FF' : 'transparent',
    color: active ? '#fff' : '#6B7280',
    transition: 'background 0.15s, color 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title={view === 'apps' ? 'Activity · Apps' : 'Activity · Screenshots'} />

      {view === 'apps' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
          <AppsPage />
        </div>
      ) : (
        <>
          {/* ── Filter bar ── */}
          <div style={{
            padding: '12px 28px', borderBottom: '1px solid #F0F0F0',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            {/* 10min / All toggle */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2, flexShrink: 0 }}>
              <button onClick={() => setViewMode('10min')} style={selBtn(viewMode === '10min')}>10 Min</button>
              <button onClick={() => setViewMode('all')} style={selBtn(viewMode === 'all')}>All</button>
            </div>

            {/* Notes button */}
            <button
              onClick={() => setNotesOpen(x => !x)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 34, padding: '0 12px',
                border: `1px solid ${notesOpen ? '#6C63FF' : '#E5E7EB'}`,
                borderRadius: 7, background: notesOpen ? '#F5F3FF' : '#fff',
                cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                color: notesOpen ? '#6C63FF' : '#6B7280', flexShrink: 0,
              }}
            >
              <NotebookPen width={13} height={13} />
              Notes
              {noteEntries.length > 0 && (
                <span style={{ background: '#6C63FF', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 2 }}>
                  {noteEntries.length}
                </span>
              )}
            </button>

            {/* Filter icon */}
            <button
              title="Filters"
              onClick={() => setFilterOpen(x => !x)}
              style={{
                position: 'relative', width: 34, height: 34,
                border: `1px solid ${filterOpen || isFilterActive ? '#6C63FF' : '#E5E7EB'}`,
                borderRadius: 7, background: filterOpen || isFilterActive ? '#F5F3FF' : '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: filterOpen || isFilterActive ? '#6C63FF' : '#6B7280', flexShrink: 0,
              }}
            >
              <SlidersHorizontal width={14} height={14} />
              {isFilterActive && (
                <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: '#6C63FF', border: '1.5px solid #fff' }} />
              )}
            </button>

            {/* Employee dropdown */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <select
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                style={{
                  height: 34, padding: '0 32px 0 32px', border: '1px solid #E5E7EB', borderRadius: 7,
                  fontSize: 13, color: '#111827', background: '#fff', cursor: 'pointer',
                  outline: 'none', appearance: 'none', fontFamily: 'inherit', fontWeight: 500,
                }}
              >
                {WORKERS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: worker.bg, color: worker.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, pointerEvents: 'none' }}>
                {worker.initials}
              </div>
              <ChevronDown style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width={13} height={13} color="#9CA3AF" />
            </div>

            {/* Timezone dropdown */}
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              style={{
                height: 34, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 7,
                fontSize: 13, color: '#111827', background: '#fff', cursor: 'pointer',
                outline: 'none', appearance: 'none', fontFamily: 'inherit', flexShrink: 0,
              }}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.id} value={tz.id}>{tz.label} ({tz.offset})</option>
              ))}
            </select>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Date nav */}
            <DateNav date={date} onChange={setDate} />

            {/* Download */}
            <button style={{ width: 34, height: 34, border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0 }}>
              <Download width={14} height={14} />
            </button>
          </div>

          {/* ── Scrollable content ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 32px' }}>

            {/* KPI cards */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <KpiCard
                icon={<Clock width={20} height={20} />} iconBg="#EEEDFF" iconColor="#6C63FF"
                label="Worked Time" value={fmtDurMins(totalMins)}
                sub={`${batches.length} tracked slots`}
              />
              <KpiCard
                icon={<Zap width={20} height={20} />} iconBg="#FFF7ED" iconColor="#F59E0B"
                label="Avg Activity" value={`${avgActivity}%`}
                sub={avgActivity >= 70 ? 'Great activity' : avgActivity >= 40 ? 'Average activity' : 'Low activity'}
              />
              <KpiCard
                icon={<Camera width={20} height={20} />} iconBg="#F0FDF4" iconColor="#10B981"
                label="Screenshots" value={String(totalScreenshots)}
                sub="captured today"
              />
              <KpiCard
                icon={<LayoutGrid width={20} height={20} />} iconBg="#FDF2F8" iconColor="#EC4899"
                label="Total Slots" value={String(normalBatches.length)}
                sub="10-min intervals"
              />
            </div>

            {/* Empty state */}
            {batches.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, color: '#9CA3AF', gap: 10 }}>
                <Camera width={40} height={40} strokeWidth={1.2} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280' }}>No screenshots for this day</div>
                <div style={{ fontSize: 13 }}>Try selecting a different date or clearing your filters.</div>
              </div>
            )}

            {/* Timeline */}
            {batches.length > 0 && byHour.map(([hour, hourBatches]) => {
              const hourStart    = toTime(hour * 60)
              const hourEnd     = toTime((hour + 1) * 60)
              const hourMins    = hourBatches.filter(b => b.type === 'normal').length * 10
              const allSsInHour = hourBatches.filter(b => b.type === 'normal').flatMap(b => b.screenshots)

              return (
                <div key={hour} style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
                  {/* Left: vertical timeline */}
                  <div style={{ width: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                    {/* Circle dot */}
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #6C63FF', background: '#fff', flexShrink: 0, zIndex: 1 }} />
                    {/* Vertical line */}
                    <div style={{ flex: 1, width: 2, background: '#E5E7EB', marginTop: 4 }} />
                  </div>

                  {/* Right: header + cards */}
                  <div style={{ flex: 1, paddingLeft: 16 }}>
                    {/* Hour header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                        {fmtClock12(hourStart)} – {fmtClock12(hourEnd)}
                      </span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>·</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>Total worked: <strong style={{ color: '#374151' }}>{fmtDurMins(hourMins)}</strong></span>
                      {viewMode === '10min' && (
                        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#9CA3AF' }}>
                          {allSsInHour.length} screenshot{allSsInHour.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* ── 10 MIN VIEW ── */}
                    {viewMode === '10min' && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 14,
                      }}>
                        {hourBatches.map(batch => {
                          if (batch.type === 'no_screenshot') return <NoScreenshotCard key={batch.id} batch={batch} />
                          if (batch.type === 'break')         return <BreakCard         key={batch.id} batch={batch} />
                          return (
                            <BatchCard
                              key={batch.id}
                              batch={batch}
                              workerColor={worker.color}
                              notes={notes[batch.id] ?? []}
                              screenshotsDeleted={screenshotsDeleted.has(batch.id)}
                              onScreenshotClick={ss => openLightbox(ss)}
                              onNoteClick={rect => setNotePopup({ batchId: batch.id, rect })}
                              onDeleteScreenshots={() => setScreenshotsDeleted(prev => new Set([...prev, batch.id]))}
                              onDeleteActivity={() => setDeletedBatchIds(prev => new Set([...prev, batch.id]))}
                            />
                          )
                        })}
                      </div>
                    )}

                    {/* ── ALL VIEW ── only normal screenshots */}
                    {viewMode === 'all' && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: 14,
                      }}>
                        {hourBatches.flatMap(batch => {
                          // Special slots: show a compact inline marker
                          if (batch.type === 'no_screenshot') return [(
                            <div key={batch.id} style={{ background: '#FFFBEB', border: '1.5px dashed #FCD34D', borderRadius: 10, padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <CameraOff width={18} height={18} color="#D97706" strokeWidth={1.5} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>No screenshot</div>
                                <div style={{ fontSize: 11, color: '#B45309', marginTop: 1 }}>{fmtClock12(batch.slotStart)} – {fmtClock12(batch.slotEnd)}</div>
                              </div>
                            </div>
                          )]
                          if (batch.type === 'break') return [(
                            <div key={batch.id} style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: 10, padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Coffee width={18} height={18} color="#0284C7" strokeWidth={1.5} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369A1' }}>{batch.breakReason ?? 'On Break'}</div>
                                <div style={{ fontSize: 11, color: '#0284C7', marginTop: 1 }}>{fmtClock12(batch.slotStart)} – {fmtClock12(batch.slotEnd)}</div>
                              </div>
                            </div>
                          )]
                          return batch.screenshots.map(ss => (
                            <AllScreenCard
                              key={ss.id}
                              ss={ss}
                              workerColor={worker.color}
                              project={batch.project}
                              onClick={() => openLightbox(ss)}
                            />
                          ))
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Filter panel */}
      <FilterPanel
        open={filterOpen} onClose={() => setFilterOpen(false)}
        filterProjects={filterProjects} setFilterProjects={setFilterProjects}
        filterActivityMin={filterActivityMin} setFilterActivityMin={setFilterActivityMin}
        filterActivityMax={filterActivityMax} setFilterActivityMax={setFilterActivityMax}
        filterActivityLevels={filterActivityLevels} setFilterActivityLevels={setFilterActivityLevels}
      />

      {/* All Notes panel */}
      <AllNotesPanel
        open={notesOpen} onClose={() => setNotesOpen(false)}
        notes={noteEntries} workerColor={worker.color}
      />

      {/* Note popup */}
      {notePopup && (() => {
        const b = batches.find(x => x.id === notePopup.batchId)
        if (!b) return null
        return (
          <NotePopup
            slotLabel={`${fmtClock12(b.slotStart)} – ${fmtClock12(b.slotEnd)}`}
            rect={notePopup.rect}
            existingNotes={notes[b.id] ?? []}
            onAppend={text => setNotes(prev => ({ ...prev, [b.id]: [...(prev[b.id] ?? []), text] }))}
            onClose={() => setNotePopup(null)}
          />
        )
      })()}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          state={lightbox}
          onClose={() => setLightbox(null)}
          onPrev={prevScreenshot}
          onNext={nextScreenshot}
        />
      )}
    </div>
  )
}

// tiny chevron for select
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
