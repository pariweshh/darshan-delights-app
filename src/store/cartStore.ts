import {
  addToCart,
  deleteBasket,
  deleteCartItem,
  getUserCartItems,
  updateCartItem,
} from "@/src/api/cart"
import { CartItem } from "@/src/types"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface CartState {
  cart: CartItem[]
  isLoading: boolean
  error: string | null
  lastOperation: "add" | "update" | "remove" | null
  lastOperationSuccess: boolean

  fetchCart: (token: string) => Promise<void>
  addItem: (product: CartItem, token: string) => Promise<CartItem | null>
  clearCart: (token: string) => Promise<number>
  removeItem: (
    cartItemId: number | null,
    userId: number | string | null,
    token: string
  ) => Promise<CartItem | null>
  updateQuantity: (
    cartItemId: number,
    product: CartItem,
    token: string
  ) => Promise<CartItem | null>
  getTotalPrice: () => number
  getItemCount: () => number
  clearCartOnLogout: () => void
  getItemQuantityInCart: (productId: number) => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [] as CartItem[],
      isLoading: false,
      error: null,
      lastOperation: null,
      lastOperationSuccess: false,

      fetchCart: async (token: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await getUserCartItems(token)
          set({ cart: data, isLoading: false, error: null })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },

      addItem: async (
        itemData: CartItem,
        token: string
      ): Promise<CartItem | null> => {
        const state = get()
        set({ isLoading: true, error: null, lastOperation: "add" })

        try {
          const existingItem = state.cart.find(
            (item) => +item.product_id === +itemData.product_id
          )

          let result: CartItem

          if (existingItem?.basket_item_id) {
            const newQuantity = +existingItem.quantity + itemData.quantity
            const weightPerUnit = existingItem.weight
              ? existingItem.weight / existingItem.quantity
              : (itemData.weight || 0) / itemData.quantity

            const updatedData = {
              quantity: newQuantity,
              amount: (newQuantity * existingItem.unit_price).toFixed(2),
              weight: weightPerUnit * newQuantity,
            }

            result = await updateCartItem(
              existingItem.basket_item_id,
              updatedData,
              token
            )

            console.log({ result })

            const itemIndex = state.cart.findIndex(
              (item) => item.basket_item_id === result.basket_item_id
            )
            if (itemIndex >= 0) {
              set({
                cart: state.cart.map((item, index) =>
                  index === itemIndex ? result : item
                ),
                isLoading: false,
                error: null,
                lastOperationSuccess: true,
              })
            }
            AsyncStorage.setItem("cart-storage", JSON.stringify(state.cart))
          } else {
            result = await addToCart(itemData, token)

            set({
              cart: [...state.cart, result],
              isLoading: false,
              error: null,
              lastOperationSuccess: true,
            })
          }
          return result
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to add item to cart",
            lastOperationSuccess: false,
          })
          return null
        }
      },

      updateQuantity: async (
        cartItemId: number,
        cartData: CartItem,
        token: string
      ) => {
        const state = get()
        set({ isLoading: true, error: null, lastOperation: "update" })
        try {
          const result = await updateCartItem(cartItemId, cartData, token)

          const itemIndex = state.cart.findIndex(
            (item) => item.basket_item_id === result.basket_item_id
          )

          if (itemIndex >= 0) {
            set({
              cart: state.cart.map((item, index) =>
                index === itemIndex ? result : item
              ),
              isLoading: false,
              error: null,
              lastOperationSuccess: true,
            })
          }
          AsyncStorage.setItem("cart-storage", JSON.stringify(state.cart))
          return result
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to update item quantity!",
            lastOperationSuccess: false,
          })
          return null
        }
      },

      removeItem: async (
        cartItemId: number | null,
        userId: number | string | null,
        token: string
      ) => {
        if (!cartItemId || !userId) return null
        set({ isLoading: true, error: null, lastOperation: "remove" })
        try {
          const res = await deleteCartItem(cartItemId, token)
          if (res?.id) {
            const items = await getUserCartItems(token)
            set({
              cart: items,
              isLoading: false,
              error: null,
              lastOperationSuccess: true,
            })
            AsyncStorage.setItem("cart-storage", JSON.stringify(items))
            return res
          }
          return null
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to remove item from cart",
            lastOperationSuccess: false,
          })
          return null
        }
      },

      clearCart: async (token: string): Promise<number> => {
        set({ isLoading: true, error: null })
        const res = await deleteBasket(token)

        if (res.count) {
          set({ cart: [] as CartItem[], isLoading: false, error: null })
          AsyncStorage.removeItem("cart-storage")
          return res.count
        }
        set({ isLoading: false, error: "Failed to clear cart" })
        return 0
      },

      clearCartOnLogout: () => {
        set({
          cart: [] as CartItem[],
          isLoading: false,
          error: null,
          lastOperation: null,
          lastOperationSuccess: false,
        })
        AsyncStorage.removeItem("cart-storage")
      },

      getTotalPrice: () => {
        return get().cart.reduce((total, item) => {
          return total + item.unit_price * item.quantity
        }, 0)
      },

      getItemCount: () => {
        return get().cart.reduce((total, item) => {
          return total + item.quantity
        }, 0)
      },

      getItemQuantityInCart: (productId: number): number => {
        const item = get().cart.find((item) => +item.product_id === +productId)
        return item?.quantity ?? 0
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
