import { Component, type ErrorInfo, type ReactNode } from 'react'

/** Keeps the shell alive when one panel throws — black-screen freeze. */
export class ErrorBoundary extends Component<{ fallback?: ReactNode; children: ReactNode }, { err: Error | null }> {
  state: { err: Error | null } = { err: null }

  static getDerivedStateFromError(err: Error) {
    return { err }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('Kineora UI crash', err, info.componentStack)
  }

  render() {
    if (this.state.err) {
      return (
        this.props.fallback ?? (
          <div data-testid="ui-crash" style={{ padding: 16, color: '#e66', background: '#1a1a1a', fontFamily: 'system-ui' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Panel crashed</div>
            <div style={{ fontSize: 12, color: '#bbb' }}>{this.state.err.message}</div>
            <button
              type="button"
              onClick={() => this.setState({ err: null })}
              style={{ marginTop: 10, padding: '4px 10px', background: '#2a2a2a', color: '#eee', border: '1px solid #555', borderRadius: 4, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
