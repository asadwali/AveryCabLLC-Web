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
