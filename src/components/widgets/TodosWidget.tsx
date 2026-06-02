import { useState } from 'react'
import { TODOS } from '../../data/dashboardData'
import { avatarStyle, initials } from '../../utils/avatar'

export function TodosWidget() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">To-dos</span>
        <a href="#" className="widget-link">View all tasks →</a>
      </div>
      <div>
        {TODOS.map((t) => {
          const s = avatarStyle(t.assignee)
          const done = !!checked[t.id]
          return (
            <div className={`todo-row${done ? ' done' : ''}`} key={t.id}>
              <input
                type="checkbox"
                className="todo-check"
                checked={done}
                onChange={() => toggle(t.id)}
              />
              <span className="todo-name">{t.name}</span>
              <div className="avatar" style={{ width: 22, height: 22, fontSize: 8, fontWeight: 700, flexShrink: 0, background: s.bg, color: s.color }} title={t.assignee}>
                {initials(t.assignee)}
              </div>
              <span className="badge-pill badge-team" style={{ fontSize: 10 }}>{t.tag}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
