import { create } from 'zustand'
import {
  AUTH_CHANGED_EVENT,
  AUTH_CLEARED_EVENT,
  readScopedJson,
  writeScopedJson,
} from '../utils/userScopedStorage'

// localStorage helpers
const CART_KEY = 'cart_items'
let authListenersRegistered = false

const loadCart = () => {
  return readScopedJson(CART_KEY, [])
}

const saveCart = (items) => {
  writeScopedJson(CART_KEY, items)
}

const useCartStore = create((set, get) => ({
  items: loadCart(),   // [{ bookId, title, price, quantity }]

  addItem: (bookId, quantity = 1, bookInfo = {}) => {
    const items = get().items
    const existing = items.find((i) => i.bookId === bookId)
    let next
    if (existing) {
      next = items.map((i) =>
        i.bookId === bookId ? { ...i, quantity: i.quantity + quantity } : i
      )
    } else {
      next = [...items, { bookId, quantity, ...bookInfo }]
    }
    saveCart(next)
    set({ items: next })
  },

  updateItem: (bookId, quantity) => {
    if (quantity < 1) return
    const next = get().items.map((i) =>
      i.bookId === bookId ? { ...i, quantity } : i
    )
    saveCart(next)
    set({ items: next })
  },

  removeItem: (bookId) => {
    const next = get().items.filter((i) => i.bookId !== bookId)
    saveCart(next)
    set({ items: next })
  },

  clearCart: () => {
    saveCart([])
    set({ items: [] })
  },

  // 주문 완료 후 호출 (API가 생기면 연동 가능)
  fetchCart: () => {
    set({ items: loadCart() })
  },
}))

if (!authListenersRegistered) {
  const syncCart = () => useCartStore.setState({ items: loadCart() })
  window.addEventListener(AUTH_CHANGED_EVENT, syncCart)
  window.addEventListener(AUTH_CLEARED_EVENT, syncCart)
  authListenersRegistered = true
}

export default useCartStore
