import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Mail, MapPin, Phone, User } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import LoadingOverlay from '../components/LoadingOverlay'
import { formatTimeForDisplay } from '../utils/time'

const ViewRidePage = ({ rides, getStatusClass, onMarkRideDone, isLoading = false }) => {
  const [isMarkingDone, setIsMarkingDone] = useState(false)
  const { id } = useParams()
  const ride = rides.find((item) => item.id === id)

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
          </div>
          <span className={`status-chip ${getStatusClass(ride.status)} view-status`}>
            {ride.status}
          </span>
        </div>

        {/* ── Route Strip ── */}
        <div className="view-route">
          <div className="view-route-point">
            <div className="route-dot pickup" />
            <div>
              <p className="route-label">Pickup</p>
              <p className="route-value">{ride.pickup}</p>
            </div>
          </div>

          <div className="route-line">
            <ArrowRight size={18} className="route-arrow" />
          </div>

          <div className="view-route-point align-end">
            <div className="route-dot dropoff" />
            <div>
              <p className="route-label">Drop off</p>
              <p className="route-value">{ride.dropoff}</p>
            </div>
          </div>
        </div>

        {/* ── Detail Tiles ── */}
        <div className="view-tiles">
          <div className="view-tile">
            <div className="tile-icon">
              <User size={18} />
            </div>
            <div>
              <p className="tile-label">Full name</p>
              <p className="tile-value">{ride.fullName}</p>
            </div>
          </div>

          <div className="view-tile">
            <div className="tile-icon">
              <Mail size={18} />
            </div>
            <div>
              <p className="tile-label">Email</p>
              <p className="tile-value">{ride.email || '-'}</p>
            </div>
          </div>

          <div className="view-tile">
            <div className="tile-icon">
              <Phone size={18} />
            </div>
            <div>
              <p className="tile-label">Phone</p>
              <p className="tile-value">{ride.phone || '-'}</p>
            </div>
          </div>

          <div className="view-tile">
            <div className="tile-icon">
              <CalendarDays size={18} />
            </div>
            <div>
              <p className="tile-label">Date</p>
              <p className="tile-value">{ride.date}</p>
            </div>
          </div>

          <div className="view-tile">
            <div className="tile-icon">
              <Clock3 size={18} />
            </div>
            <div>
              <p className="tile-label">Time</p>
              <p className="tile-value">{formatTimeForDisplay(ride.time)}</p>
            </div>
          </div>

          <div className="view-tile">
            <div className="tile-icon">
              <MapPin size={18} />
            </div>
            <div>
              <p className="tile-label">Pickup location</p>
              <p className="tile-value">{ride.pickup}</p>
            </div>
          </div>

          <div className="view-tile">
            <div className="tile-icon dropoff-icon">
              <MapPin size={18} />
            </div>
            <div>
              <p className="tile-label">Drop off location</p>
              <p className="tile-value">{ride.dropoff}</p>
            </div>
          </div>

          <div className="view-tile">
            <div className="tile-icon status-icon">
              <span className="tile-status-dot" />
            </div>
            <div>
              <p className="tile-label">Status</p>
              <p className="tile-value">
                <span className={`status-chip ${getStatusClass(ride.status)}`}>{ride.status}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="view-footer">
          <Link to="/dashboard" className="btn btn-ghost btn-link view-back-btn">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          {ride.status !== 'Completed' && (
            <button
              type="button"
              className="btn btn-primary view-done-btn"
              disabled={isMarkingDone}
              onClick={async () => {
                setIsMarkingDone(true)

                try {
                  await onMarkRideDone(ride.id)
                } finally {
                  setIsMarkingDone(false)
                }
              }}
            >
              {isMarkingDone ? 'Updating...' : 'Mark as Done'}
            </button>
          )}
        </div>

      </section>
    </main>
  )
}

export default ViewRidePage
