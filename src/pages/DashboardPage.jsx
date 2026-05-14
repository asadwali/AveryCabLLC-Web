import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, Eye, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import InvoiceDocument from '../components/InvoiceDocument'
import LoadingOverlay from '../components/LoadingOverlay'
import { formatTimeForDisplay, formatTimeForInput } from '../utils/time'

const MONTH_MAP = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
}

const parseDateValue = (value) => {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    // Try "DD Month YYYY" format (e.g., "11 May 2026")
    const simpleMatch = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
    if (simpleMatch) {
      const day = Number(simpleMatch[1])
      const monthName = simpleMatch[2].charAt(0).toUpperCase() + simpleMatch[2].slice(1).toLowerCase()
      const year = Number(simpleMatch[3])
      const monthIndex = MONTH_MAP[monthName]
      if (monthIndex !== undefined) {
        return new Date(year, monthIndex, day)
      }
    }

    // Try "DD Month YYYY at HH:MM:SS UTC±X" format (e.g., "11 May 2026 at 23:12:33 UTC+5")
    const dateTimeMatch = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+at/)
    if (dateTimeMatch) {
      const day = Number(dateTimeMatch[1])
      const monthName = dateTimeMatch[2].charAt(0).toUpperCase() + dateTimeMatch[2].slice(1).toLowerCase()
      const year = Number(dateTimeMatch[3])
      const monthIndex = MONTH_MAP[monthName]
      if (monthIndex !== undefined) {
        return new Date(year, monthIndex, day)
      }
    }

    // Try ISO format "YYYY-MM-DD"
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) {
      return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
    }

    // Try US format "MM/DD/YYYY"
    const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (usMatch) {
      return new Date(Number(usMatch[3]), Number(usMatch[1]) - 1, Number(usMatch[2]))
    }

    // Try generic parsing
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const normalizeToUsPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  const withoutCountryCode = digits.startsWith('1') ? digits.slice(1) : digits
  const phoneDigits = withoutCountryCode.slice(0, 10)
  return phoneDigits ? `+1${phoneDigits}` : ''
}

const getPhoneDigits = (value) => {
  const normalized = normalizeToUsPhone(value)
  return normalized.replace(/^\+1/, '')
}

const formatUsPhoneInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10)

  if (!digits) {
    return ''
  }

  if (digits.length <= 3) {
    return `(${digits}`
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

const formatUsPhoneDisplay = (value) => {
  const digits = getPhoneDigits(value)

  if (!digits) {
    return '-'
  }

  return `+1 ${formatUsPhoneInput(digits)}`
}

const getLeg = (ride, legKey) => {
  const fallback = legKey === 'legA'
    ? { date: ride.date, time: ride.time, pickup: ride.pickup, dropoff: ride.dropoff }
    : {}
  return {
    date: ride?.[legKey]?.date || fallback.date || '',
    time: ride?.[legKey]?.time || fallback.time || '',
    pickup: ride?.[legKey]?.pickup || fallback.pickup || '',
    dropoff: ride?.[legKey]?.dropoff || fallback.dropoff || '',
  }
}

const DashboardPage = ({
  rides,
  onLogout,
  onUpdateRide,
  onDeleteRide,
  getStatusClass,
  isAdmin = false,
  isLoading = false,
}) => {
  const rowsPerPage = 10
  const [activeMode, setActiveMode] = useState(null)
  const [selectedRide, setSelectedRide] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewMode, setViewMode] = useState('card')

  const statusFilteredRides =
    statusFilter === 'All'
      ? rides
      : rides.filter((ride) => (ride.status || 'Pending').toLowerCase() === statusFilter.toLowerCase())

  const fromDateValue = parseDateValue(fromDate)
  const toDateValue = parseDateValue(toDate)

  const filteredRides = statusFilteredRides.filter((ride) => {
    if (!fromDateValue && !toDateValue) {
      return true
    }

    const parsedRideDate = parseDateValue(ride.date)
    if (!parsedRideDate) {
      return false
    }

    const rideDay = toStartOfDay(parsedRideDate)
    const fromDay = fromDateValue ? toStartOfDay(fromDateValue) : null
    const toDay = toDateValue ? toStartOfDay(toDateValue) : null

    const matchesFrom = !fromDay || rideDay >= fromDay
    const matchesTo = !toDay || rideDay <= toDay
    return matchesFrom && matchesTo
  })

  const totalPages = Math.max(1, Math.ceil(filteredRides.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRides = filteredRides.slice(startIndex, startIndex + rowsPerPage)

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, fromDate, toDate])

  const openModal = (mode, ride) => {
    const legA = getLeg(ride, 'legA')
    const legB = getLeg(ride, 'legB')

    setSelectedRide({
      ...ride,
      phone: getPhoneDigits(ride.phone),
      legA: {
        ...legA,
        time: formatTimeForInput(legA.time),
      },
      legB: {
        ...legB,
        time: formatTimeForInput(legB.time),
      },
      time: formatTimeForInput(ride.time),
    })
    setActiveMode(mode)
  }

  const closeModal = () => {
    setActiveMode(null)
    setSelectedRide(null)
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    if (name === 'phone') {
      setSelectedRide((prev) => ({ ...prev, phone: value.replace(/\D/g, '').slice(0, 10) }))
      return
    }

    if (name.includes('.')) {
      const [legKey, legField] = name.split('.')
      setSelectedRide((prev) => ({
        ...prev,
        [legKey]: {
          ...(prev[legKey] || {}),
          [legField]: value,
        },
      }))
      return
    }

    setSelectedRide((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSave = async (event) => {
    event.preventDefault()
    setIsProcessing(true)

    try {
      await onUpdateRide({
        ...selectedRide,
        phone: normalizeToUsPhone(selectedRide.phone),
      })
      closeModal()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    setIsProcessing(true)

    try {
      await onDeleteRide(selectedRide.id)
      closeModal()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = async () => {
    setIsProcessing(true)

    try {
      await onLogout()
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <main className="dashboard-shell dashboard-loading-shell">
        <LoadingOverlay message="Loading bookings" subMessage="Fetching your dashboard data..." />
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Operations Dashboard</p>
          <h2>Ride Management List</h2>
        </div>
        <div className="header-actions">
          {/* <div className="view-toggle" role="group" aria-label="Select ride list view">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
            >
              Card View
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
          </div> */}
          <label className="header-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          {isAdmin && (
            <>
              <label className="header-filter header-date-filter">
                <span>From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </label>
              <label className="header-filter header-date-filter">
                <span>To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-primary"
                disabled={filteredRides.length === 0}
                onClick={() => setIsInvoiceOpen(true)}
              >
                Generate Invoice
              </button>
            </>
          )}
          <Link to="/rides/new" className="btn btn-primary btn-link">
            <Plus size={16} />
            Create New Item
          </Link>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {isProcessing && (
        <LoadingOverlay message="Please wait" subMessage="Saving your changes..." />
      )}

      <section className="table-card">
        {/* {viewMode === 'card' ? (
          <div className="ride-list-wrap">
            {paginatedRides.length > 0 ? (
              <div className="ride-list">
                {paginatedRides.map((ride, index) => (
                  <article key={ride.id} className="ride-item-card">
                    <div className="ride-item-top">
                      <div>
                        <p className="ride-id">Ride #{startIndex + index + 1}</p>
                        <div className="ride-name-row">
                          <h3 className="ride-name">{ride.fullName}</h3>
                          <span className="ride-phone-inline">{formatUsPhoneDisplay(ride.phone)}</span>
                        </div>
                      </div>
                      <div className="ride-top-badges">
                        <span className={`status-chip ${getStatusClass(ride.status)} `}>
                          {ride.status || 'Pending'}
                        </span>
                        <span className="amount-capsule">
                          Amount: {ride.payRate && ride.payRate !== 'N/A' ? `$ ${ride.payRate}` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="ride-leg-grid">
                      <section className="ride-leg-card">
                        <p className="ride-leg-title">Leg A</p>
                        <div className="ride-leg-meta-grid">
                          <p><strong>Date:</strong> {getLeg(ride, 'legA').date || '-'}</p>
                          <p><strong>Time:</strong> {formatTimeForDisplay(getLeg(ride, 'legA').time) || '-'}</p>
                        </div>
                        <div className="leg-route-card">
                          <div className="leg-route-item">
                            <p className="leg-route-label">Pickup</p>
                            <p className="leg-route-value">{getLeg(ride, 'legA').pickup || '-'}</p>
                          </div>
                          <div className="leg-route-item">
                            <p className="leg-route-label">Drop off</p>
                            <p className="leg-route-value">{getLeg(ride, 'legA').dropoff || '-'}</p>
                          </div>
                        </div>
                      </section>

                      <section className="ride-leg-card">
                        <p className="ride-leg-title">Leg B</p>
                        <div className="ride-leg-meta-grid">
                          <p><strong>Date:</strong> {getLeg(ride, 'legB').date || '-'}</p>
                          <p><strong>Time:</strong> {formatTimeForDisplay(getLeg(ride, 'legB').time) || '-'}</p>
                        </div>
                        <div className="leg-route-card">
                          <div className="leg-route-item">
                            <p className="leg-route-label">Pickup</p>
                            <p className="leg-route-value">{getLeg(ride, 'legB').pickup || '-'}</p>
                          </div>
                          <div className="leg-route-item">
                            <p className="leg-route-label">Drop off</p>
                            <p className="leg-route-value">{getLeg(ride, 'legB').dropoff || '-'}</p>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="actions-row ride-actions-row">
                      {ride.status !== 'Completed' && (
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => openModal('edit', ride)}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      )}
                      <Link to={`/rides/${ride.id}`} className="icon-btn link-action">
                        <Eye size={16} />
                        View
                      </Link>
                      {isAdmin && (
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => openModal('delete', ride)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="no-record-cell">No record found please add new booking</div>
            )}
          </div>
        ) : ( */}
          <div className="table-wrap modern-table-wrap">
            <table className="ride-grid-table">
              <thead>
                <tr>
                  <th>Ride</th>
                  <th className="leg-cell">Leg A</th>
                  <th className="leg-cell">Leg B</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRides.length > 0 ? (
                  paginatedRides.map((ride, index) => (
                    <tr key={ride.id}>
                      <td>
                        <div className="ride-meta-stack">
                          <p className="ride-meta-title">{ride.fullName}</p>
                          <p className="ride-meta-sub">Ride #{startIndex + index + 1}</p>
                          <p className="ride-meta-sub ride-meta-with-icon">
                            <Phone size={13} strokeWidth={2.2} aria-hidden="true" />
                            <span>{formatUsPhoneDisplay(ride.phone)}</span>
                          </p>
                        </div>
                      </td>
                      <td className="leg-cell">
                        <div className="route-compact">
                          <div className="route-compact-datetime">
                            <p className="route-compact-line route-compact-date">
                              <CalendarDays size={13} strokeWidth={2.2} aria-hidden="true" />
                              <span>{getLeg(ride, 'legA').date || 'N/A'}</span>
                            </p>
                            <p className="route-compact-line route-compact-time">
                              <Clock3 size={13} strokeWidth={2.2} aria-hidden="true" />
                              <span>{formatTimeForDisplay(getLeg(ride, 'legA').time) || 'N/A'}</span>
                            </p>
                          </div>
                          <p className="route-compact-line">
                            <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                            <strong>Pickup:</strong>
                            <span>{getLeg(ride, 'legA').pickup || 'N/A'}</span>
                          </p>
                          <p className="route-compact-line">
                            <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                            <strong>Drop:</strong>
                            <span>{getLeg(ride, 'legA').dropoff || 'N/A'}</span>
                          </p>
                        </div>
                      </td>
                      <td className="leg-cell">
                        <div className="route-compact">
                          <div className="route-compact-datetime">
                            <p className="route-compact-line route-compact-date">
                              <CalendarDays size={13} strokeWidth={2.2} aria-hidden="true" />
                              <span>{getLeg(ride, 'legB').date || 'N/A'}</span>
                            </p>
                            <p className="route-compact-line route-compact-time">
                              <Clock3 size={13} strokeWidth={2.2} aria-hidden="true" />
                              <span>{formatTimeForDisplay(getLeg(ride, 'legB').time) || 'N/A'}</span>
                            </p>
                          </div>
                          <p className="route-compact-line">
                            <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                            <strong>Pickup:</strong>
                            <span>{getLeg(ride, 'legB').pickup || 'N/A'}</span>
                          </p>
                          <p className="route-compact-line">
                            <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                            <strong>Drop:</strong>
                            <span>{getLeg(ride, 'legB').dropoff || 'N/A'}</span>
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={`status-chip ${getStatusClass(ride.status)} `}>
                          {ride.status || 'Pending'}
                        </span>
                      </td>
                      <td className="amount-cell">
                        {ride.payRate && ride.payRate !== 'N/A' ? `$ ${ride.payRate}` : 'N/A'}
                      </td>
                      <td>
                        <div className="actions-row">
                          {ride.status !== 'Completed' && (
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => openModal('edit', ride)}
                            >
                              <Pencil size={16} />
                              Edit
                            </button>
                          )}
                          <Link to={`/rides/${ride.id}`} className="icon-btn link-action">
                            <Eye size={16} />
                            View
                          </Link>
                          {isAdmin && (
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => openModal('delete', ride)}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-record-cell">No record found please add new booking</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        {/* )} */}

        <div className="table-footer">
          <p className="table-summary">
            Showing {filteredRides.length === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + rowsPerPage, filteredRides.length)} of {filteredRides.length}
          </p>

          <div className="pagination-wrap">
            <button
              type="button"
              className="pager-btn"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`pager-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="pager-btn"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {activeMode && selectedRide && (
        <section className="modal-overlay" role="dialog" aria-modal="true">
          <article className={`modal-card ${activeMode === 'edit' ? 'modal-card-edit' : ''}`}>
            {/* <button type="button" className="close-btn" onClick={closeModal}>
              <X size={18} />
            </button> */}

            {activeMode === 'delete' ? (
              <>
                <div className="modal-hero modal-hero-danger">
                  <div className="modal-hero-icon">
                    <Trash2 size={22} />
                  </div>
                  <div>
                    <p className="modal-hero-eyebrow">Confirm Action</p>
                    <h3 className="modal-hero-title">Delete Ride?</h3>
                  </div>
                  {/* <button type="button" className="modal-close-x" onClick={closeModal}>
                    <X size={16} />
                  </button> */}
                </div>
                <div className="modal-body">
                  <p className="modal-delete-msg">
                    You are about to permanently remove the ride for
                    <strong> {selectedRide.fullName}</strong>.
                    This action cannot be undone.
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger modal-danger-btn" onClick={handleDelete}>
                    <Trash2 size={15} />
                    Yes, Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-hero modal-hero-edit">
                  <div className="modal-hero-icon">
                    <Pencil size={20} />
                  </div>
                  <div>
                    <p className="modal-hero-eyebrow">Ride #{filteredRides.findIndex(r => r.id === selectedRide.id) + 1}</p>
                    <h3 className="modal-hero-title">Edit Ride</h3>
                  </div>
                  {/* <button type="button" className="modal-close-x" onClick={closeModal}>
                    <X size={16} />
                  </button> */}
                </div>
                <form onSubmit={handleEditSave}>
                  <div className="modal-body modal-form">
                    <div className="modal-row-2">
                      <label>
                        Full name
                        <input
                          name="fullName"
                          value={selectedRide.fullName}
                          onChange={handleFieldChange}
                          required
                        />
                      </label>
                      <label>
                        Phone
                        <div className="phone-input-wrap">
                          <span className="phone-prefix">+1</span>
                          <input
                            type="tel"
                            name="phone"
                            value={formatUsPhoneInput(selectedRide.phone || '')}
                            onChange={handleFieldChange}
                            placeholder="(555) 123-4567"
                            required
                          />
                        </div>
                      </label>
                    </div>
                    <div className="leg-grid">
                      <section className="leg-card" aria-label="Edit Leg A locations">
                        <h3>Leg A</h3>
                        <div className="modal-row-2">
                          <label>
                            Date
                            <input
                              type="date"
                              name="legA.date"
                              value={selectedRide.legA?.date || ''}
                              onChange={handleFieldChange}
                              required
                            />
                          </label>
                          <label>
                            Time
                            <input
                              type="time"
                              name="legA.time"
                              value={selectedRide.legA?.time || ''}
                              onChange={handleFieldChange}
                              required
                            />
                          </label>
                        </div>
                        <label>
                          Pickup location
                          <input
                            name="legA.pickup"
                            value={selectedRide.legA?.pickup || ''}
                            onChange={handleFieldChange}
                            required
                          />
                        </label>
                        <label>
                          Drop off location
                          <input
                            name="legA.dropoff"
                            value={selectedRide.legA?.dropoff || ''}
                            onChange={handleFieldChange}
                            required
                          />
                        </label>
                      </section>

                      <section className="leg-card" aria-label="Edit Leg B locations">
                        <h3>Leg B</h3>
                        <div className="modal-row-2">
                          <label>
                            Date
                            <input
                              type="date"
                              name="legB.date"
                              value={selectedRide.legB?.date || ''}
                              onChange={handleFieldChange}
                              required
                            />
                          </label>
                          <label>
                            Time
                            <input
                              type="time"
                              name="legB.time"
                              value={selectedRide.legB?.time || ''}
                              onChange={handleFieldChange}
                              required
                            />
                          </label>
                        </div>
                        <label>
                          Pickup location
                          <input
                            name="legB.pickup"
                            value={selectedRide.legB?.pickup || ''}
                            onChange={handleFieldChange}
                            required
                          />
                        </label>
                        <label>
                          Drop off location
                          <input
                            name="legB.dropoff"
                            value={selectedRide.legB?.dropoff || ''}
                            onChange={handleFieldChange}
                            required
                          />
                        </label>
                      </section>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary modal-save-btn" disabled={isProcessing}>
                      <Pencil size={14} />
                        {isProcessing ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </article>
        </section>
      )}

      {isAdmin && isInvoiceOpen && (
        <InvoiceDocument
          rides={filteredRides}
          fromDate={fromDate}
          toDate={toDate}
          statusFilter={statusFilter}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </main>
  )
}

export default DashboardPage
