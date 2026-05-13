import { CalendarDays, Clock3, Download, MapPin, Phone, X } from 'lucide-react'
import { useRef, useState } from 'react'
import logo from '../assets/logo.jpeg'
import { formatTimeForDisplay } from '../utils/time'

const TAX_RATE = 0.0635

const getNumericAmount = (value) => {
  const parsed = Number(String(value || '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)

const formatUSPhone = (raw) => {
  if (!raw) return null
  const digits = String(raw).replace(/\D/g, '')
  const d = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits
  if (d.length !== 10) return raw
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

const getLeg = (ride, legKey) => {
  const fallback = legKey === 'legA'
    ? { date: ride.date, time: ride.time, pickup: ride.pickup, dropoff: ride.dropoff }
    : {}
  return {
    date: ride?.[legKey]?.date || fallback.date || '-',
    time: ride?.[legKey]?.time || fallback.time || '-',
    pickup: ride?.[legKey]?.pickup || fallback.pickup || '-',
    dropoff: ride?.[legKey]?.dropoff || fallback.dropoff || '-',
  }
}

const getStatusClass = (status) => {
  const normalized = String(status || 'Pending').toLowerCase()

  if (normalized === 'completed') return 'completed'
  if (normalized === 'scheduled') return 'scheduled'
  if (normalized === 'in-progress') return 'in-progress'
  if (normalized === 'cancelled') return 'cancelled'
  return 'pending'
}

const InvoiceDocument = ({ rides, fromDate, toDate, statusFilter, onClose }) => {
  const invoiceRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const totalAmount = rides.reduce((sum, ride) => sum + getNumericAmount(ride.payRate), 0)
  const taxAmount = totalAmount * TAX_RATE
  const grandTotal = totalAmount + taxAmount
  const generatedOn = new Date().toLocaleString()

  const handleDownload = async () => {
    setIsExporting(true)
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const html2pdf = (await import('html2pdf.js')).default
    const element = invoiceRef.current
    const opt = {
      margin: [8, 8],
      filename: `averycarb-invoice-${fromDate || 'all'}-${toDate || 'all'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    }

    try {
      await html2pdf().set(opt).from(element).save()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="modal-overlay invoice-overlay" role="dialog" aria-modal="true">
      <article className="invoice-card">

        {/* ── Toolbar (excluded from PDF) ── */}
        <div className="invoice-toolbar">
          <button type="button" className="icon-btn" onClick={handleDownload} disabled={isExporting}>
            <Download size={16} />
            {isExporting ? 'Preparing PDF...' : 'Download PDF'}
          </button>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
            Close
          </button>
        </div>

        {/* ── Printable area ── */}
        <div ref={invoiceRef} className={`invoice-printable ${isExporting ? 'pdf-export' : ''}`}>

          <header className="invoice-header">
            <div className="invoice-brand">
              <img src={logo} alt="Averycarb logo" className="invoice-logo" />
              <div>
                <p className="invoice-eyebrow">Invoice</p>
                <h3>Averycarb</h3>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>Generated</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700 }}>{generatedOn}</p>
            </div>
          </header>

          <section className="invoice-meta">
            <p><strong>Status Filter:</strong> {statusFilter}</p>
            <p><strong>From:</strong> {fromDate || 'N/A'}</p>
            <p><strong>To:</strong> {toDate || 'N/A'}</p>
            <p><strong>Total Rides:</strong> {rides.length}</p>
          </section>

          {/* ── Ride Grid Table ── */}
          {rides.length === 0 ? (
            <p className="invoice-empty">No rides found for the selected filters.</p>
          ) : (
            <div className="invoice-grid-wrap">
              <table className="invoice-grid-table">
                <thead>
                  <tr>
                    <th>Ride</th>
                    <th className="leg-cell">Leg A</th>
                    <th className="leg-cell">Leg B</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride, index) => {
                    const legA = getLeg(ride, 'legA')
                    const legB = getLeg(ride, 'legB')
                    const phone = formatUSPhone(ride.phone)
                    const phone2 = formatUSPhone(ride.phone2)

                    return (
                      <tr key={ride.id || index}>
                        <td>
                          <div className="ride-meta-stack">
                            <p className="ride-meta-title">{ride.fullName || '-'}</p>
                            <p className="ride-meta-sub">Ride #{ride.id || index + 1}</p>
                            {phone && (
                              <p className="ride-meta-sub ride-meta-with-icon">
                                <Phone size={13} strokeWidth={2.2} aria-hidden="true" />
                                <span>{phone}</span>
                              </p>
                            )}
                            {phone2 && (
                              <p className="ride-meta-sub ride-meta-with-icon">
                                <Phone size={13} strokeWidth={2.2} aria-hidden="true" />
                                <span>{phone2}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="leg-cell">
                          <div className="route-compact">
                            <div className="route-compact-datetime">
                              <p className="route-compact-line route-compact-date">
                                <CalendarDays size={13} strokeWidth={2.2} aria-hidden="true" />
                                <span>{legA.date}</span>
                              </p>
                              <p className="route-compact-line route-compact-time">
                                <Clock3 size={13} strokeWidth={2.2} aria-hidden="true" />
                                <span>{formatTimeForDisplay(legA.time) || '-'}</span>
                              </p>
                            </div>
                            <p className="route-compact-line">
                              <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                              <strong>Pickup:</strong>
                              <span>{legA.pickup}</span>
                            </p>
                            <p className="route-compact-line">
                              <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                              <strong>Drop:</strong>
                              <span>{legA.dropoff}</span>
                            </p>
                          </div>
                        </td>
                        <td className="leg-cell">
                          <div className="route-compact">
                            <div className="route-compact-datetime">
                              <p className="route-compact-line route-compact-date">
                                <CalendarDays size={13} strokeWidth={2.2} aria-hidden="true" />
                                <span>{legB.date || 'N/A'}</span>
                              </p>
                              <p className="route-compact-line route-compact-time">
                                <Clock3 size={13} strokeWidth={2.2} aria-hidden="true" />
                                <span>{formatTimeForDisplay(legB.time) || 'N/A '}</span>
                              </p>
                            </div>
                            <p className="route-compact-line">
                              <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                              <strong>Pickup:</strong>
                              <span>{legB.pickup}</span>
                            </p>
                            <p className="route-compact-line">
                              <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                              <strong>Drop:</strong>
                              <span>{legB.dropoff}</span>
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className={`status-chip ${getStatusClass(ride.status)}`}>
                            {ride.status || 'Pending'}
                          </span>
                        </td>
                        <td className="amount-cell">{formatCurrency(getNumericAmount(ride.payRate))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Bottom Summary ── */}
          <div className="invoice-end-summary">
            {/* <section className="invoice-tax-info">
              <h4>Tax Information</h4>
              <p>Tax rate applied: 6.35%</p>
              <p>Taxable amount: {formatCurrency(totalAmount)}</p>
              <p>Calculated tax: {formatCurrency(taxAmount)}</p>
            </section> */}

            <div className="invoice-totals invoice-totals-right">
              <div className="invoice-totals-row">
                <span>Total Amount</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="invoice-totals-row">
                <span>Tax</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="invoice-totals-row invoice-grand-total">
                <span>Grand Total</span>
                <strong>{formatCurrency(grandTotal)}</strong>
              </div>
            </div>
          </div>

          <footer className="invoice-footer-centered">
            <p>Thank you for choosing Averycarb.</p>
            <p>Design &amp; Develop By ITechia Solutions</p>
          </footer>

        </div>
      </article>
    </section>
  )
}

export default InvoiceDocument
