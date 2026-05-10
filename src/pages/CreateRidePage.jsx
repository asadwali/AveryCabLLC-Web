import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'

const emptyRide = {
  fullName: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  pickup: '',
  dropoff: '',
  status: 'Pending',
}

const CreateRidePage = ({ onCreateRide }) => {
  const [formData, setFormData] = useState(emptyRide)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await onCreateRide(formData)
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
        <h2>Create New Item</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
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
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Date
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </label>
          <label>
            Time
            <input type="time" name="time" value={formData.time} onChange={handleChange} required />
          </label>
          <label>
            Pickup location
            <input name="pickup" value={formData.pickup} onChange={handleChange} required />
          </label>
          <label>
            Drop off location
            <input name="dropoff" value={formData.dropoff} onChange={handleChange} required />
          </label>
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
