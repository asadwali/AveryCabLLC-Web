import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import LoadingOverlay from '../components/LoadingOverlay'

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [toast, setToast] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setToast('')
    setIsSubmitting(true)

    const result = await onLogin(formData)

    if (!result?.success) {
      setToast(result?.message || 'Login failed. Please try again.')
    }

    setIsSubmitting(false)
  }

  return (
    <main className="auth-shell">
      {isSubmitting && (
        <LoadingOverlay message="Signing you in" subMessage="Checking credentials..." />
      )}
      <div className="auth-top-brand">
        <img src="/logo.jpeg" alt="Avery Cab logo" className="auth-logo" />
        <p className="auth-company">Avery Cab LLC</p>
      </div>

      <section className="auth-card">
        <div className="brand-block">
          <p className="eyebrow">Avery Cab Panel</p>
          <h1>Welcome Back</h1>
          <p>Sign in to manage daily rides, pickup schedules, and trip status.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {toast && <p className="auth-toast" role="alert">{toast}</p>}

          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <Mail size={18} />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="driver@averycab.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary full-width" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
