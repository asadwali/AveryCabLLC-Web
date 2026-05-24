// Format date as MM/DD/YYYY for display
export const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return ''
  let dateObj = dateValue instanceof Date ? dateValue : null
  if (!dateObj) {
    // Try to parse string
    dateObj = new Date(dateValue)
    if (Number.isNaN(dateObj.getTime())) {
      // Try to parse known formats: "13 May 2026"
      const match = String(dateValue).match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
      if (match) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']
        const day = Number(match[1])
        const month = months.findIndex(m => m.toLowerCase() === match[2].toLowerCase())
        const year = Number(match[3])
        if (month !== -1) {
          dateObj = new Date(year, month, day)
        }
      }
    }
  }
  if (!dateObj || Number.isNaN(dateObj.getTime())) return String(dateValue)
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
  const dd = String(dateObj.getDate()).padStart(2, '0')
  const yyyy = dateObj.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}
export const formatTimeForStorage = (timeValue) => {
  if (!timeValue) {
    return ''
  }

  if (/\b(am|pm)\b/i.test(timeValue)) {
    return timeValue.trim().replace(/\s+/g, ' ').toUpperCase()
  }

  const [hoursString, minutesString] = timeValue.split(':')
  const hours = Number(hoursString)
  const minutes = minutesString ?? '00'

  if (Number.isNaN(hours)) {
    return timeValue
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 || 12

  return `${String(normalizedHours).padStart(2, '0')}:${minutes} ${period}`
}

export const formatTimeForInput = (timeValue) => {
  if (!timeValue) {
    return ''
  }

  const match = String(timeValue).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)

  if (match) {
    let hours = Number(match[1])
    const minutes = match[2]
    const period = match[3].toUpperCase()

    if (period === 'PM' && hours !== 12) {
      hours += 12
    }

    if (period === 'AM' && hours === 12) {
      hours = 0
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  return String(timeValue).slice(0, 5)
}

export const formatTimeForDisplay = (timeValue) => {
  if (!timeValue) {
    return ''
  }

  if (/\b(am|pm)\b/i.test(timeValue)) {
    return String(timeValue).trim().replace(/\s+/g, ' ').toUpperCase()
  }

  const [hoursString, minutesString] = String(timeValue).split(':')
  const hours = Number(hoursString)
  const minutes = minutesString ?? '00'

  if (Number.isNaN(hours)) {
    return timeValue
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 || 12

  return `${String(normalizedHours).padStart(2, '0')}:${minutes} ${period}`
}

export const formatDateForStorage = () => {
  const now = new Date()
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const day = String(now.getDate()).padStart(2, '0')
  const month = months[now.getMonth()]
  const year = now.getFullYear()
  return `${day} ${month} ${year}`
}
