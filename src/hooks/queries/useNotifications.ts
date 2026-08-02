import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/src/api/notifications'
import { Notification } from '@/src/types/notifications'
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

const PAGE_SIZE = 20

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_KEYS.all, 'list'] as const,
  infinite: (userId: string | null | undefined) =>
    [...NOTIFICATION_KEYS.lists(), 'infinite', userId] as const,
}

export function useInfiniteNotifications(
  token: string | null,
  userId?: string | null
) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_KEYS.infinite(userId),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getNotifications(token!, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pageCount } = lastPage.meta.pagination
      return page < pageCount ? page + 1 : undefined
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, token }: { id: number; token: string }) =>
      markNotificationAsRead(id, token),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.lists() })
      const previous = queryClient.getQueriesData<any>({
        queryKey: NOTIFICATION_KEYS.lists(),
      })
      queryClient.setQueriesData<any>(
        { queryKey: NOTIFICATION_KEYS.lists() },
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((n: Notification) =>
                n.id === id
                  ? { ...n, isRead: true, readAt: new Date().toISOString() }
                  : n
              ),
            })),
          }
        }
      )
      return { previous }
    },
    onError: (_, __, context) => {
      context?.previous?.forEach(([key, data]: [any, any]) => {
        queryClient.setQueryData(key, data)
      })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ token }: { token: string }) =>
      markAllNotificationsAsRead(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, token }: { id: number; token: string }) =>
      deleteNotification(id, token),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.lists() })
      const previous = queryClient.getQueriesData<any>({
        queryKey: NOTIFICATION_KEYS.lists(),
      })
      queryClient.setQueriesData<any>(
        { queryKey: NOTIFICATION_KEYS.lists() },
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.filter((n: Notification) => n.id !== id),
            })),
          }
        }
      )
      return { previous }
    },
    onError: (_, __, context) => {
      context?.previous?.forEach(([key, data]: [any, any]) => {
        queryClient.setQueryData(key, data)
      })
    },
  })
}
