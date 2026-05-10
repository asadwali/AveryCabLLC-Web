import { useEffect, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'
import { formatTimeForDisplay, formatTimeForInput } from '../utils/time'

const DashboardPage = ({
  rides,
  onLogout,
  onUpdateRide,
  onDeleteRide,
  getStatusClass,
  isLoading = false,
}) => {
  const rowsPerPage = 10
  const [activeMode, setActiveMode] = useState(null)
  const [selectedRide, setSelectedRide] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All')
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredRides =
    statusFilter === 'All'
      ? rides
      : rides.filter((ride) => (ride.status || 'Pending').toLowerCase() === statusFilter.toLowerCase())

  const totalPages = Math.max(1, Math.ceil(filteredRides.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRides = filteredRides.slice(startIndex, startIndex + rowsPerPage)

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const openModal = (mode, ride) => {
    setSelectedRide({
      ...ride,
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
    setSelectedRide((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSave = async (event) => {
    event.preventDefault()
    setIsProcessing(true)

    try {
      await onUpdateRide(selectedRide)
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
          <label className="header-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Full name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Time</th>
                <th>Pickup location</th>
                <th>Drop off location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRides.length > 0 ? (
                paginatedRides.map((ride) => (
                  <tr key={ride.id}>
                    <td>{ride.fullName}</td>
                    <td>{ride.email || '-'}</td>
                    <td>{ride.phone || '-'}</td>
                    <td>{ride.date}</td>
                    <td>{formatTimeForDisplay(ride.time)}</td>
                    <td>{ride.pickup}</td>
                    <td>{ride.dropoff}</td>
                    <td>
                      <span className={`status-chip ${getStatusClass(ride.status)} `}>
                        {ride.status || 'Pending'}
                      </span>
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
                        {ride.status !== 'Completed' && (
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
                  <td colSpan={9} className="no-record-cell">
                    No record found please add new booking
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
          <article className="modal-card">
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
                    <p className="modal-hero-eyebrow">Ride #{selectedRide.id}</p>
                    <h3 className="modal-hero-title">Edit Ride</h3>
                  </div>
                  {/* <button type="button" className="modal-close-x" onClick={closeModal}>
                    <X size={16} />
                  </button> */}
                </div>
                <form onSubmit={handleEditSave}>
                  <div className="modal-body modal-form">
                    <label>
                      Full name
                      <input
                        name="fullName"
                        value={selectedRide.fullName}
                        onChange={handleFieldChange}
                        required
                      />
                    </label>
                    <div className="modal-row-2">
                      <label>
                        Email
                        <input
                          type="email"
                          name="email"
                          value={selectedRide.email || ''}
                          onChange={handleFieldChange}
                          required
                        />
                      </label>
                      <label>
                        Phone
                        <input
                          type="tel"
                          name="phone"
                          value={selectedRide.phone || ''}
                          onChange={handleFieldChange}
                          required
                        />
                      </label>
                    </div>
                    <div className="modal-row-2">
                      <label>
                        Date
                        <input
                          type="date"
                          name="date"
                          value={selectedRide.date}
                          onChange={handleFieldChange}
                          required
                        />
                      </label>
                      <label>
                        Time
                        <input
                          type="time"
                          name="time"
                          value={selectedRide.time}
                          onChange={handleFieldChange}
                          required
                        />
                      </label>
                    </div>
                    <label>
                      Pickup location
                      <input
                        name="pickup"
                        value={selectedRide.pickup}
                        onChange={handleFieldChange}
                        required
                      />
                    </label>
                    <label>
                      Drop off location
                      <input
                        name="dropoff"
                        value={selectedRide.dropoff}
                        onChange={handleFieldChange}
                        required
                      />
                    </label>
                    <label>
                      Status
                      <select
                        name="status"
                        value={selectedRide.status}
                        onChange={handleFieldChange}
                        required
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </label>
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
    </main>
  )
}

export default DashboardPage
