import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const mockMenuItems = [
  {
    id: 1,
    name: 'Full Thali',
    description: 'Dal, sabzi, rice, roti, pickle & papad. Home-cooked, region-rotated weekly.',
    price: 120,
    category: 'thali',
    is_veg: true,
    emoji: '🍱',
    image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
  },
  {
    id: 2,
    name: 'Comfort Tiffin',
    description: '2 rotis, a hearty sabzi, and curd. Ideal for working lunch. Light yet filling.',
    price: 80,
    category: 'tiffin',
    is_veg: true,
    emoji: '🍛',
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  },
  {
    id: 3,
    name: 'Non-Veg Special',
    description: 'Egg curry or chicken with rice or roti. Rotating weekly by our talented cooks.',
    price: 140,
    category: 'special',
    is_veg: false,
    emoji: '🍲',
    image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80',
  },
  {
    id: 4,
    name: 'Senior Care Meal',
    description: 'Low-oil, low-spice, easy-to-eat meals designed for elders. Soft textures, great taste.',
    price: 90,
    category: 'special',
    is_veg: true,
    emoji: '🥣',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  },
  {
    id: 5,
    name: 'Student Saver Tiffin',
    description: 'High value, low price. Dal chawal with sabzi. Subscribe weekly for the best deal.',
    price: 60,
    category: 'tiffin',
    is_veg: true,
    emoji: '🍜',
    image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
  },
  {
    id: 6,
    name: 'Regional Special',
    description: 'Rotates weekly — Rajasthani, Bengali, Odia, or South Indian. Explore India in a tiffin.',
    price: 130,
    category: 'special',
    is_veg: true,
    emoji: '🫕',
    image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80',
  }
]
// ─── Orders API ───────────────────────────────────────────────────────────────

export async function fetchReadyOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_name, phone, address, zone, items, total, status, created_at')
    .eq('status', 'ready')
    .is('delivery_partner_id', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function acceptOrder(orderId, deliveryPartnerId) {
  const { error } = await supabase
    .from('orders')
    .update({ delivery_partner_id: deliveryPartnerId, status: 'picked' })
    .eq('id', orderId)
    .is('delivery_partner_id', null)
  if (error) throw error
}

export async function completeOrder(orderId) {
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('cook_id')
    .eq('id', orderId)
    .single()
  if (fetchError) throw fetchError

  const { error } = await supabase
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', orderId)
  if (error) throw error

  if (order?.cook_id) {
    await supabase.rpc('increment_cook_orders', { cook_id_input: order.cook_id })
  }
}

export function subscribeToOrders({ onNewOrder, onOrderGone }) {
  const channel = supabase
    .channel('orders-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      if (payload.new?.status === 'ready' && !payload.new?.delivery_partner_id) onNewOrder(payload.new)
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
      const isAvailable = payload.new?.status === 'ready' && !payload.new?.delivery_partner_id
      isAvailable ? onNewOrder(payload.new) : onOrderGone(payload.new.id)
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (payload) => {
      onOrderGone(payload.old.id)
    })
    .subscribe()
  return channel
}

// ─── Cook Orders API ──────────────────────────────────────────────────────────

/**
 * Fetch active orders assigned to this cook.
 * cookId = cooks.id (the integer/uuid primary key of the cooks table)
 * Orders are excluded once picked up, delivered, or cancelled.
 */
export async function fetchCookOrders(cookId, zone) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_name, phone, address, zone, items, total, status, created_at, cook_id')
    .eq('zone', zone)                          
    .in('status', ['pending', 'preparing', 'ready'])
    .or(`cook_id.is.null,cook_id.eq.${cookId}`) 
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function acceptCookOrder(orderId, cookId) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'preparing', cook_id: Number(cookId) })  
    .eq('id', orderId)
    .is('cook_id', null)
  if (error) throw error
}

export async function rejectCookOrder(orderId) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
  if (error) throw error
}

export async function markOrderReady(orderId) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'ready' })
    .eq('id', orderId)
  if (error) throw error
}

/**
 * Fetch cook profile by auth user id.
 * Returns null (not throws) if no cook profile exists for this user.
 */
export async function fetchCookProfile(userId) {
  const { data, error } = await supabase
    .from('cooks')
    .select('id, name, zone, rating, total_orders, user_id, phone, is_available') // ← fixed
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}
/**
 * Fetch completed (delivered) orders for cook profile history.
 * cookId = cooks.id
 */
export async function fetchCookCompletedOrders(cookId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_name, items, total, status, created_at, zone')
    .eq('cook_id', cookId)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Real-time subscription for a cook's orders.
 * Filters on cook_id so only relevant order changes fire.
 */
export function subscribeToCookOrders(cookId, zone, { onOrderNew, onOrderUpdated, onOrderRemoved }) {
  const channel = supabase.channel(`zone-orders-${zone}-${Date.now()}`)

  channel
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders', filter: `zone=eq.${zone}` },
      (payload) => {
        if (payload.new.status === 'pending') onOrderNew(payload.new)
      }
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `zone=eq.${zone}` },
      (payload) => {
        const { status, cook_id } = payload.new
        if (cook_id && cook_id !== cookId && status !== 'pending') {
          onOrderRemoved(payload.new.id)
        } else if (['picked', 'delivered', 'cancelled'].includes(status)) {
          onOrderRemoved(payload.new.id)
        } else {
          onOrderUpdated(payload.new)
        }
      }
    )
    .subscribe()

  return channel
}
export function subscribeToOrder(orderId, onUpdate) {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => { if (payload.new) onUpdate(payload.new) }
    )
    .subscribe()
  return channel
}

export async function fetchDeliveryPartnerById(id) {
  if (!id) return null
  const { data } = await supabase
    .from('delivery_partners')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data
}
export async function fetchDeliveryPartnerProfile(userId) {
  const { data, error } = await supabase
    .from('delivery_partners')
    .select('*')
    .eq('user_id', userId)   // looks up by auth user id
    .maybeSingle()
  if (error) throw error
  return data
}
export async function toggleCookAvailability(cookId, is_available) {
  const { error } = await supabase
    .from('cooks')
    .update({ is_available })
    .eq('id', cookId)
  if (error) throw error
}