import {
  cancelOrder,
  createOrderAndPaymentIntent,
  deleteOrder,
  getOrderById,
  getUserOrders,
} from '@/src/api/orders'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CART_KEYS } from './useCart'

export const ORDERS_KEYS = {
  all: ['orders'] as const,
  lists: () => [...ORDERS_KEYS.all, 'list'] as const,
  list: (userId: number, limit?: number, start?: number) =>
    [...ORDERS_KEYS.lists(), userId, { limit, start }] as const,
  infinite: (userId: number) => [...ORDERS_KEYS.lists(), userId, 'infinite'] as const,
  details: () => [...ORDERS_KEYS.all, 'detail'] as const,

  detail: (id: string) => [...ORDERS_KEYS.details(), id] as const,
}

interface UseOrdersParams {
  userId: number | null
  token: string | null
  limit?: number
  start?: number
  enabled?: boolean
}

interface UseInfiniteOrdersParams {
  userId: number | null
  token: string | null
  limit?: number
  enabled?: boolean
}

export function useInfiniteOrders({ userId, token, limit = 10, enabled = true }: UseInfiniteOrdersParams) {
  return useInfiniteQuery({
    queryKey: ORDERS_KEYS.infinite(userId!),
    queryFn: ({ pageParam }: { pageParam: number }) => getUserOrders(token!, limit, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.orders.length, 0)
      return fetched < lastPage.totalOrders ? fetched : undefined
    },
    initialPageParam: 0,
    enabled: enabled && !!userId && !!token,
    staleTime: 1000 * 30,
  })
}

export function useOrders({ userId, token, limit = 10, start, enabled = true }: UseOrdersParams) {
  return useQuery({
    queryKey: ORDERS_KEYS.list(userId!, limit, start),
    queryFn: () => getUserOrders(token!, limit, start),
    enabled: enabled && !!userId && !!token,
    staleTime: 1000 * 30,
  })
}

export function useOrderById(orderId: string, token: string | null) {
  return useQuery({
    queryKey: ORDERS_KEYS.detail(orderId),
    queryFn: () => getOrderById(orderId, token!),
    enabled: !!orderId && !!token,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, token }: { orderId: number; token: string }) =>
      cancelOrder(orderId, token),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.detail(String(orderId)) })
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() })
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, token }: { orderId: number; token: string }) =>
      deleteOrder(orderId, token),
    onSuccess: (_data, { orderId }) => {
      queryClient.removeQueries({ queryKey: ORDERS_KEYS.detail(String(orderId)) })
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() })
    },
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: Parameters<typeof createOrderAndPaymentIntent>[0]) =>
      createOrderAndPaymentIntent(params),
    onSuccess: () => {
      // Invalidate order list and cart after a successful order
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: CART_KEYS.detail() })
    },
  })
}
