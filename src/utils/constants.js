// Delivery zones served
export const ZONES = ['Bistupur', 'Sakchi', 'Telco Colony', 'Kadma', 'Jugsalai', 'Mango']

// Menu categories for filter buttons
export const MENU_CATEGORIES = [
  { key: 'all',     label: 'All Items' },
  { key: 'thali',   label: 'Thalis' },
  { key: 'tiffin',  label: 'Tiffins' },
  { key: 'special', label: 'Specials' }
]

// Order status progression
export const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'picked', 'delivered', 'cancelled']

// User roles
export const ROLES = {
  CUSTOMER: 'customer',
  COOK:     'cook',
  DELIVERY: 'delivery',
  ADMIN:    'admin'
}

// Subscription plans
export const SUBSCRIPTION_PLANS = [
  {
    id: 'weekly',
    label: 'Weekly',
    price: 499,
    meals: 5,
    desc: '5 tiffins, Mon–Fri'
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: 1499,
    meals: 22,
    desc: '22 tiffins, Mon–Sat'
  },
  {
    id: 'student',
    label: 'Student',
    price: 999,
    meals: 22,
    desc: 'Student Saver only, Mon–Sat'
  }
]

// WhatsApp support number
export const WHATSAPP_NUMBER = '919800000000'

// Delivery promise in minutes
export const DELIVERY_TIME_MIN = 45