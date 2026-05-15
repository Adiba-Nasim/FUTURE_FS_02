import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: false,
  error: null,

  signUp: async (email, password, name, role = 'customer', mobile_no = null, zone = null) => {
  set({ loading: true, error: null })
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } }
    })
    if (error) throw error

    const userId = data.user.id

    if (role === 'customer') {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ user_id: userId, name, mobile_no, role, zone: null })
      if (profileError) throw profileError

    } else if (role === 'cook') {
      const { error: cookError } = await supabase
        .from('cooks')
        .insert({ user_id: userId, name, phone: mobile_no, zone, rating: 0, total_orders: 0, is_available: true })
      if (cookError) throw cookError

    } else if (role === 'delivery') {
      const { error: deliveryError } = await supabase
        .from('delivery_partners')
        .insert({ user_id: userId, name, phone:mobile_no, zone, is_available: true })
      if (deliveryError) throw deliveryError
    }

    set({ user: data.user, role, loading: false })
    return { success: true, role }
  } catch (err) {
    set({ error: err.message, loading: false })
    return { success: false, error: err.message }
  }
},
  signIn: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const role = data.user?.user_metadata?.role || 'customer'
      set({ user: data.user, role, loading: false })
      return { success: true, role }
    } catch (err) {
      set({ error: err.message, loading: false })
      return { success: false, error: err.message }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, role: null, error: null })
  },

  restoreSession: async () => {
    set({ loading: true })
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      const role = data.session.user.user_metadata?.role || 'customer'
      set({ user: data.session.user, role, loading: false })
    } else {
      set({ loading: false })
    }
  },

  refreshUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const role = user.user_metadata?.role || 'customer'
      set({ user, role })
    }
  },

  clearError: () => set({ error: null })
}))