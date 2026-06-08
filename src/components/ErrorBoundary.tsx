import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', gap: 12, padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#6B7280', maxWidth: 360 }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 8, padding: '8px 20px', border: 'none', borderRadius: 8, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
