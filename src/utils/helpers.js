/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format a date to a readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Get priority color
 * @param {string} priority - Priority level
 * @returns {string} CSS color variable
 */
export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'var(--danger-color)'
    case 'medium':
      return 'var(--warning-color)'
    case 'low':
      return 'var(--secondary-color)'
    default:
      return 'var(--text-secondary)'
  }
}
