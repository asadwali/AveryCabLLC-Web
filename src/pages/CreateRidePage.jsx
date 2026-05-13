import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'

const emptyRide = {
  fullName: '',
  phone: '',
  phone2: '',
  legA: {
    date: '',
    time: '',
    pickup: '',
    dropoff: '',
  },
  legB: {
    date: '',
    time: '',
    pickup: '',
    dropoff: '',
  },
  status: 'Pending',
  payRate: 'N/A',
}

const normalizeToUsPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  const withoutCountryCode = digits.startsWith('1') ? digits.slice(1) : digits
  const phoneDigits = withoutCountryCode.slice(0, 10)
  return phoneDigits ? `+1${phoneDigits}` : ''
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

const CreateRidePage = ({ onCreateRide, isAdmin, users = [], adminEmails = [] }) => {
  const [formData, setFormData] = useState(emptyRide)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const navigate = useNavigate()

  const assignableUsers = users.filter((user) => {
    if (!user?.uid) {
      return false
    }

    const userEmail = String(user.email || '').toLowerCase()
    return !adminEmails.includes(userEmail)
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhoneChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData((prev) => ({ ...prev, phone: digits }))
  }

  const handlePhone2Change = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData((prev) => ({ ...prev, phone2: digits }))
  }

  const handleLegChange = (legKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [legKey]: {
        ...prev[legKey],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const rideData = {
        ...formData,
        phone: normalizeToUsPhone(formData.phone),
        phone2: normalizeToUsPhone(formData.phone2),
      }
      const payload = isAdmin && selectedUserId ? { ...rideData, selectedUserId } : rideData
      await onCreateRide(payload)
      navigate('/dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="dashboard-shell create-shell">
      {isSubmitting && (
        <LoadingOverlay message="Saving booking" subMessage="Submitting ride details..." />
      )}
      <section className="form-card">
        <p className="eyebrow">Add Ride</p>
        <h2>Create New Ride</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row-2">
            <label>
              Full name
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
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
                  value={formatUsPhoneInput(formData.phone)}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </label>
          </div>
          <div className="modal-row-2">
            <label>
              Phone 2 <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span>
              <div className="phone-input-wrap">
                <span className="phone-prefix">+1</span>
                <input
                  type="tel"
                  name="phone2"
                  value={formatUsPhoneInput(formData.phone2)}
                  onChange={handlePhone2Change}
                  placeholder="(555) 987-6543"
                />
              </div>
            </label>
          </div>
          <div className="leg-grid">
            <section className="leg-card" aria-label="Leg A locations">
              <h3>Leg A</h3>
              <div className="modal-row-2">
                <label>
                  Date
                  <input
                    type="date"
                    value={formData.legA.date}
                    onChange={(event) => handleLegChange('legA', 'date', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Time
                  <input
                    type="time"
                    value={formData.legA.time}
                    onChange={(event) => handleLegChange('legA', 'time', event.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                Pickup location
                <input
                  value={formData.legA.pickup}
                  onChange={(event) => handleLegChange('legA', 'pickup', event.target.value)}
                  required
                />
              </label>
              <label>
                Drop off location
                <input
                  value={formData.legA.dropoff}
                  onChange={(event) => handleLegChange('legA', 'dropoff', event.target.value)}
                  required
                />
              </label>
            </section>

            <section className="leg-card" aria-label="Leg B locations">
              <h3>Leg B</h3>
              <div className="modal-row-2">
                <label>
                  Date
                  <input
                    type="date"
                    value={formData.legB.date}
                    onChange={(event) => handleLegChange('legB', 'date', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Time
                  <input
                    type="time"
                    value={formData.legB.time}
                    onChange={(event) => handleLegChange('legB', 'time', event.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                Pickup location
                <input
                  value={formData.legB.pickup}
                  onChange={(event) => handleLegChange('legB', 'pickup', event.target.value)}
                  required
                />
              </label>
              <label>
                Drop off location
                <input
                  value={formData.legB.dropoff}
                  onChange={(event) => handleLegChange('legB', 'dropoff', event.target.value)}
                  required
                />
              </label>
            </section>
          </div>
          {isAdmin && (
            <label>
              Create Ride For (User)
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">-- Select a user --</option>
                {assignableUsers.map((user) => (
                  <option key={user.uid} value={user.uid}>
                    {user.name || user.email || user.uid}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="modal-actions">
            <Link to="/dashboard" className="btn btn-ghost btn-link">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Create Ride'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default CreateRidePage
