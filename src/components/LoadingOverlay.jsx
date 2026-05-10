import { Loader2 } from 'lucide-react'

const LoadingOverlay = ({ message = 'Loading...', subMessage = '' }) => {
  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-card">
        <div className="loading-spinner-wrap">
          <Loader2 size={28} className="loading-spinner" />
        </div>
        <div className="loading-copy">
          <p className="loading-title">{message}</p>
          {subMessage ? <p className="loading-text">{subMessage}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay