import { CART_KEYS } from '@/src/hooks/queries/useCart'
import { create } from 'zustand'

interface CartState {
  clearCartOnLogout: () => void
}

export const useCartStore = create<CartState>()(() => ({
  clearCartOnLogout: () => {
    import('@/src/providers/QueryProvider').then(({ queryClientInstance }) => {
      // Keys are token-scoped (Bug #8) — clear every user's cart cache on logout
      queryClientInstance?.setQueriesData(
        { queryKey: CART_KEYS.all },
        []
      )
    })
  },
}))
