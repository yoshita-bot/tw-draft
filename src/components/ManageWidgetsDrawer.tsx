interface WidgetDef { id: string; label: string }

interface ManageWidgetsDrawerProps {
  isOpen: boolean
  onClose: () => void
  smallWidgets: WidgetDef[]
  largeWidgets: WidgetDef[]
  smallVisible: Set<string>
  largeVisible: Set<string>
  onToggle: (id: string, zone: 'small' | 'large', show: boolean) => void
}

export function ManageWidgetsDrawer({
  isOpen, onClose, smallWidgets, largeWidgets, smallVisible, largeVisible, onToggle,
}: ManageWidgetsDrawerProps) {
  return (
    <>
      <div className={`drawer-overlay${isOpen ? ' open' : ''}`} onClick={onClose} />
      <div className={`drawer${isOpen ? ' open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Manage widgets</span>
          <button className="drawer-close" onClick={onClose} title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          <div className="picker-section-title">Small widgets</div>
          <div className="picker-grid">
            {smallWidgets.map(w => (
              <div className="picker-card" key={w.id}>
                <span className="picker-card-name">{w.label}</span>
                <label className="toggle">
                  <input type="checkbox" checked={smallVisible.has(w.id)} onChange={e => onToggle(w.id, 'small', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>

          <div className="picker-section-title">Large widgets</div>
          <div className="picker-grid">
            {largeWidgets.map(w => (
              <div className="picker-card" key={w.id}>
                <span className="picker-card-name">{w.label}</span>
                <label className="toggle">
                  <input type="checkbox" checked={largeVisible.has(w.id)} onChange={e => onToggle(w.id, 'large', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="drawer-footer">
          <button className="done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  )
}
