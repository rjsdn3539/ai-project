import { create } from 'zustand'
import * as bookApi from '../api/book'

const useCartStore = create((set) => ({
  items: [],

  fetchCart: async () => {
    const { data } = await bookApi.getCart()
    set({ items: data.data || [] })
  },

  addItem: async (bookId) => {
    await bookApi.addToCart(bookId)
    const { data } = await bookApi.getCart()
    set({ items: data.data || [] })
  },

  updateItem: async (bookId, quantity) => {
    await bookApi.updateCart(bookId, quantity)
    const { data } = await bookApi.getCart()
    set({ items: data.data || [] })
  },

  removeItem: async (bookId) => {
    await bookApi.removeFromCart(bookId)
    set((state) => ({ items: state.items.filter((i) => i.bookId !== bookId) }))
  },
}))

export default useCartStore
