import type { Product } from '@card-erp/shared-types'
import type { CartItem } from '~/types'

const CART_STORAGE_KEY = 'card-erp:buyer-cart'

interface CartState {
  items: CartItem[]
}

const toCartItem = (product: Product, quantity: number): CartItem => ({
  productId: product.id,
  name: product.name,
  price: product.sellingPrice,
  quantity,
  image: product.images[0]?.url,
})

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
  }),

  getters: {
    totalItems: (state): number => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state): number =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    isEmpty: (state): boolean => state.items.length === 0,
  },

  actions: {
    addItem(product: Product, quantity = 1): void {
      if (quantity <= 0) {
        return
      }

      const existing = this.items.find((item) => item.productId === product.id)

      if (existing) {
        existing.quantity += quantity
        return
      }

      this.items.push(toCartItem(product, quantity))
    },

    removeItem(productId: string): void {
      this.items = this.items.filter((item) => item.productId !== productId)
    },

    updateQuantity(productId: string, quantity: number): void {
      const existing = this.items.find((item) => item.productId === productId)

      if (!existing) {
        return
      }

      if (quantity <= 0) {
        this.removeItem(productId)
        return
      }

      existing.quantity = quantity
    },

    clear(): void {
      this.items = []
    },
  },

  persist: {
    key: CART_STORAGE_KEY,
  },
})
