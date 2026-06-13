import { AlertCircle, Calendar } from 'lucide-react'
import { TASKS } from '../../data/tasksData'
import type { TaskStatus, TaskPriority } from '../../data/tasksData'
import { getMemberById } from '../../data/projectsData'

const STATUS_META: Record<TaskStatus, { label: string; bg: string; color: string }> = {
  inprogress: { label: 'In Progress', bg: '#EFF6FF', color: '#1D4ED8' },
  review:     { label: 'Review',      bg: '#FFF7ED', color: '#C2410C' },
  done:       { label: 'Done',        bg: '#DCFCE7', color: '#15803D' },
}
const PRIORITY_META: Record<TaskPriority, { label: string; bg: string; color: string }> = {
  urgent: { label: 'Urgent', bg: '#FEF2F2', color: '#DC2626' },
  normal: { label: 'Normal', bg: '#F3F4F6', color: '#6B7280' },
}

const COL = '1fr 90px 72px 110px 80px'

export function TodosWidget({ gripNode }: { gripNode?: React.ReactNode } = {}) {
  const tasks = TASKS.filter(t => t.status !== 'done').slice(0, 9)

  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">To-dos</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="#" className="widget-link">View all tasks →</a>
          {gripNode}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 2 }}>
        {['Task', 'Assignees', 'Priority', 'Deadline', 'Status'].map(h => (
          <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {tasks.map((t, i) => {
        const st  = STATUS_META[t.status]
        const pri = PRIORITY_META[t.priority]
        const members = [...(t.managerIds ?? []), ...(t.memberIds ?? [])].slice(0, 3).map(getMemberById).filter(Boolean)
        return (
          <div
            key={t.id}
            style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, alignItems: 'center', padding: '9px 0', borderBottom: i < tasks.length - 1 ? '1px solid #F3F4F6' : 'none' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {t.priority === 'urgent' && <AlertCircle width={12} height={12} color="#DC2626" style={{ flexShrink: 0 }} />}
              <span style={{ fontSize: 12.5, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
            </div>
            {/* Assignees */}
            <div style={{ display: 'flex' }}>
              {members.map((m, idx) => m ? (
                <div key={m.id} title={m.name} style={{ marginLeft: idx === 0 ? 0 : -6, zIndex: 3 - idx, width: 22, height: 22, borderRadius: '50%', background: m.bg, color: m.fg, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff', flexShrink: 0 }}>
                  {m.initials}
                </div>
              ) : null)}
            </div>
            {/* Priority */}
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: pri.bg, color: pri.color, display: 'inline-block', whiteSpace: 'nowrap' }}>
              {pri.label}
            </span>
            {/* Deadline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
              {t.deadline ? <><Calendar width={11} height={11} color="#9CA3AF" />{t.deadline.slice(5).replace('-', '/')}</> : <span style={{ color: '#D1D5DB' }}>—</span>}
            </div>
            {/* Status */}
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: st.bg, color: st.color, display: 'inline-block', whiteSpace: 'nowrap' }}>
              {st.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
