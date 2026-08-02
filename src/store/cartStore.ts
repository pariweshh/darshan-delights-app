import { CART_KEYS } from '@/src/hooks/queries/useCart'
import { create } from 'zustand'

interface CartState {
  clearCartOnLogout: () => void
}

export const useCartStore = create<CartState>()(() => ({
  clearCartOnLogout: () => {
    import('@/src/providers/QueryProvider').then(({ queryClientInstance }) => {
      queryClientInstance?.setQueryData(CART_KEYS.detail(), [])
    })
  },
}))
