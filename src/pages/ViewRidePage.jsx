import { ArrowLeft, CalendarDays, Clock3, MapPin, Phone } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import LoadingOverlay from '../components/LoadingOverlay'
import { formatTimeForDisplay } from '../utils/time'

const getLeg = (ride, legKey) => {
  const fallback = legKey === 'legA' ? { pickup: ride.pickup, dropoff: ride.dropoff } : {}
  return {
    pickup: ride?.[legKey]?.pickup || fallback.pickup || '-',
    dropoff: ride?.[legKey]?.dropoff || fallback.dropoff || '-',
    date: ride?.[legKey]?.date || null,
    time: ride?.[legKey]?.time || null,
  }
}

const formatUSPhone = (raw) => {
  if (!raw) return '-'
  const digits = String(raw).replace(/\D/g, '')
  const d = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits
  if (d.length !== 10) return raw
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

const ViewRidePage = ({ rides, getStatusClass, onMarkRideDone, isLoading = false }) => {
  const [isMarkingDone, setIsMarkingDone] = useState(false)
  const { id } = useParams()
  const ride = rides.find((item) => item.id === id)
  const [amount, setAmount] = useState(ride?.payRate && ride.payRate !== 'N/A' ? ride.payRate : '')
  const legA = getLeg(ride || {}, 'legA')
  const legB = getLeg(ride || {}, 'legB')

  if (isLoading) {
    return (
      <main className="view-shell">
        <LoadingOverlay message="Loading ride details" subMessage="Fetching the booking information..." />
      </main>
    )
  }

  if (!ride) {
    return (
      <main className="view-shell">
        <section className="view-card">
          <h2>Ride Not Found</h2>
          <p>There is no ride with this id.</p>
          <Link to="/dashboard" className="btn btn-ghost btn-link">
            Back to Dashboard
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="view-shell">
      <section className="view-card">

        {/* ── Hero Banner ── */}
        <div className="view-hero">
          <div className="view-hero-left">
            <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Ride #{ride.id}</p>
            <h2 className="view-hero-name">{ride.fullName}</h2>
            <div className="view-hero-phones">
              <span className="view-hero-detail"><Phone size={13} />{formatUSPhone(ride.phone)}</span>
              {ride.phone2 && (
                <span className="view-hero-detail"><Phone size={13} />{formatUSPhone(ride.phone2)}</span>
              )}
            </div>
          </div>
          <div className="view-hero-meta">
            {ride.payRate && ride.payRate !== 'N/A' && (
              <span className="view-hero-amount">${ride.payRate}</span>
            )}
            <span className={`status-chip ${getStatusClass(ride.status)} view-status`}>
              {ride.status}
            </span>
          </div>
        </div>

        {/* ── Leg A Tiles ── */}
        <div className="view-leg-section">
          <p className="view-leg-label">Leg A</p>
          <div className="view-tiles">
            <div className="view-tile">
              <div className="tile-icon"><CalendarDays size={18} /></div>
              <div>
                <p className="tile-label">Date</p>
                <p className="tile-value">{ride.date}</p>
              </div>
            </div>
            <div className="view-tile">
              <div className="tile-icon"><Clock3 size={18} /></div>
              <div>
                <p className="tile-label">Time</p>
                <p className="tile-value">{formatTimeForDisplay(ride.time)}</p>
              </div>
            </div>
            <div className="view-tile">
              <div className="tile-icon"><MapPin size={18} /></div>
              <div>
                <p className="tile-label">Pickup</p>
                <p className="tile-value">{legA.pickup}</p>
              </div>
            </div>
            <div className="view-tile">
              <div className="tile-icon dropoff-icon"><MapPin size={18} /></div>
              <div>
                <p className="tile-label">Drop off</p>
                <p className="tile-value">{legA.dropoff}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Leg B Tiles ── */}
        <div className="view-leg-section">
          <p className="view-leg-label">Leg B</p>
          <div className="view-tiles">
            {legB.date && (
              <div className="view-tile">
                <div className="tile-icon"><CalendarDays size={18} /></div>
                <div>
                  <p className="tile-label">Date</p>
                  <p className="tile-value">{legB.date}</p>
                </div>
              </div>
            )}
            {legB.time && (
              <div className="view-tile">
                <div className="tile-icon"><Clock3 size={18} /></div>
                <div>
                  <p className="tile-label">Time</p>
                  <p className="tile-value">{formatTimeForDisplay(legB.time)}</p>
                </div>
              </div>
            )}
            <div className="view-tile">
              <div className="tile-icon"><MapPin size={18} /></div>
              <div>
                <p className="tile-label">Pickup</p>
                <p className="tile-value">{legB.pickup}</p>
              </div>
            </div>
            <div className="view-tile">
              <div className="tile-icon dropoff-icon"><MapPin size={18} /></div>
              <div>
                <p className="tile-label">Drop off</p>
                <p className="tile-value">{legB.dropoff}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="view-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px' }}>
          <Link to="/dashboard" className="btn btn-ghost btn-link view-back-btn">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          {ride.status !== 'Completed' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '6px', padding: '0 10px', backgroundColor: '#f9f9f9' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', marginRight: '5px', color: '#333' }}>$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  style={{
                    border: 'none',
                    padding: '8px 0',
                    fontSize: '14px',
                    width: '120px',
                    backgroundColor: 'transparent',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary view-done-btn"
                disabled={isMarkingDone || !amount}
                onClick={async () => {
                  if (!amount) {
                    alert('Please enter the total amount before marking as complete')
                    return
                  }
                  setIsMarkingDone(true)

                  try {
                    await onMarkRideDone(ride.id, amount)
                    setAmount('')
                  } finally {
                    setIsMarkingDone(false)
                  }
                }}
                title={!amount ? 'Please enter the total amount' : ''}
              >
                {isMarkingDone ? 'Updating...' : 'Mark as Complete'}
              </button>
            </div>
          )}
        </div>

      </section>
    </main>
  )
}

export default ViewRidePage
