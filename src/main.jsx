import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

// Root-level error boundary to prevent permanent black screen
class RootErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) {
    console.error('[GOATED] Root crash:', error, info?.componentStack?.slice(0, 500));
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#030712', color: '#94a3b8', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🐐</div>
          <div style={{ fontSize: '18px', color: 'white', fontWeight: 600 }}>Something went wrong</div>
          <div style={{ fontSize: '14px', maxWidth: '400px', textAlign: 'center' }}>The app encountered an error. This usually fixes itself with a refresh.</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button onClick={() => location.reload()} style={{ padding: '8px 20px', background: '#10b981', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Reload
            </button>
            <button onClick={() => { localStorage.clear(); location.reload(); }} style={{ padding: '8px 20px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
)

// Signal to the error handler in index.html that React mounted successfully
if (typeof window.__goatedMounted === 'function') window.__goatedMounted();
