import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, memo } from 'react'
import { AppState, Platform } from 'react-native'

const STALE_TIME = {
  SHORT: 1000 * 30, // 30 seconds
  MEDIUM: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 10, // 10 minutes
}

const GCACHE_TIME = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 30, // 30 minutes
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.SHORT,
        gcTime: GCACHE_TIME.SHORT,
        retry: 1, // OPTIMIZATION (2026-08-04): was 3 — stacked with the axios
        // interceptor's own retries it multiplied GET attempts up to 16× and
        // stalled UX ~6s on 5xx. One RQ-level retry keeps resilience without
        // the multiplier (api/client.ts still retries idempotent GET/HEAD).
        refetchOnWindowFocus: Platform.OS === 'web',
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}

// Singleton reference so other modules (e.g. authStore) can clear caches on logout
export let queryClientInstance: QueryClient | null = null

export const QueryProvider = memo(({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => createQueryClient())
  queryClientInstance = queryClient

  useState(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        queryClient.resumePausedMutations()
      }
    })
    return () => subscription.remove()
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
})
QueryProvider.displayName = "QueryProvider";
