import { create } from 'zustand'

export const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => {
    const existingItem = state.items.find(i => i.id === item.id)
    if (existingItem) {
      return {
        items: state.items.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
    }
    return { items: [...state.items, { ...item, quantity: 1 }] }
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(i => 
      i.id === id ? { ...i, quantity } : i
    )
  })),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    const state = useCartStore.getState()
    return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
}))