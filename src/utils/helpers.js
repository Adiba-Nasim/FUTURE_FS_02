/**
 * Format a number as Indian Rupee price
 * formatPrice(120) → "₹120"
 */
export const formatPrice = (amount) => `₹${amount}`

/**
 * Format a JS Date or ISO string to readable Indian date-time
 * formatDate('2024-03-01T10:30:00') → "1 Mar 2024, 10:30 AM"
 */
export const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calculate total price from cart items
 * getCartTotal([{ price: 120, quantity: 2 }]) → 240
 */
export const getCartTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)

/**
 * Calculate total item count from cart
 */
export const getCartCount = (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)

/**
 * Map order status to a human-readable label + color
 */
export const getStatusMeta = (status) => {
  const map = {
    pending:   { label: 'Order Placed',   color: '#f59e0b' },
    preparing: { label: 'Being Cooked',   color: '#3b82f6' },
    ready:     { label: 'Ready to Pick',  color: '#8b5cf6' },
    picked:    { label: 'Out for Delivery', color: '#f97316' },
    delivered: { label: 'Delivered',      color: '#22c55e' },
    cancelled: { label: 'Cancelled',      color: '#ef4444' }
  }
  return map[status] || { label: status, color: '#6b7280' }
}

/**
 * Generate a short readable order ID from a UUID
 * shortId('abc123-...') → 'ABC123'
 */
export const shortId = (id) =>
  id ? id.replace(/-/g, '').slice(0, 6).toUpperCase() : 'N/A'

/**
 * Debounce a function call
 */
export const debounce = (fn, delay = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}