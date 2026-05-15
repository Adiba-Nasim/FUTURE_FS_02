import { supabase } from './supabase'

// ─── MENU ─────────────────────────────────────────────────────────────────────

export const fetchMenuItems = async (category = null) => {
  let query = supabase.from('menu_items').select('*').eq('is_available', true)
  if (category && category !== 'all') query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  return data
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export const placeOrder = async (orderData) => {
  const payload = {
    customer_name: orderData.customer_name,
    phone:         orderData.mobile_no,
    address:       orderData.address,
    zone:          orderData.zone,
    items:         orderData.items,
    total:         Math.round(orderData.total),
    status:        'pending',
    cook_id:       null,
    ...(orderData.customer_id ? { customer_id: orderData.customer_id } : {})
  }
  
  const { data, error } = await supabase
    .from('orders')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}
export const fetchOrderById = async (id) => {
  if (!id) return null
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export const fetchOrdersByUser = async (customerId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const fetchAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ─── COOKS ────────────────────────────────────────────────────────────────────

export const fetchCooks = async () => {
  const { data, error } = await supabase.from('cooks').select('*')
  if (error) throw error
  return data
}