import NetInfo, { NetInfoState } from "@react-native-community/netinfo"
import { create } from "zustand"
import { API_CONFIG } from "../config/constants"

export type ConnectionStatus =
  | "connected" // Everything working
  | "offline" // No internet connection
  | "server_unavailable" // Internet works, server down
  | "checking" // Initial check in progress

interface NetworkState {
  // Connection states
  isConnected: boolean
  isInternetReachable: boolean | null
  isServerReachable: boolean
  connectionStatus: ConnectionStatus
  connectionType: string
  isLoading: boolean

  // Timestamps
  lastCheckedAt: number | null
  lastServerCheckAt: number | null

  // Error info
  serverErrorMessage: string | null

  // Actions
  initialize: () => () => void
  checkConnection: () => Promise<boolean>
  checkServerHealth: () => Promise<boolean>
  checkFullConnectivity: () => Promise<ConnectionStatus>
  requireNetwork: (customMessage?: string) => Promise<boolean>
  setServerReachable: (reachable: boolean, errorMessage?: string) => void
}

// Debounce helper
let serverCheckTimeout: NodeJS.Timeout | null = null
const SERVER_CHECK_DEBOUNCE = 5000 // 5 seconds between server checks

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,
  isInternetReachable: true,
  isServerReachable: true,
  connectionStatus: "checking",
  connectionType: "unknown",
  isLoading: true,
  lastCheckedAt: null,
  lastServerCheckAt: null,
  serverErrorMessage: null,

  initialize: () => {
    // Get initial state
    NetInfo.fetch().then(async (state: NetInfoState) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false

      set({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        lastCheckedAt: Date.now(),
      })

      // If online, check server health
      if (isOnline) {
        await get().checkServerHealth()
      } else {
        set({
          connectionStatus: "offline",
          isLoading: false,
        })
      }
    })

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(
      async (state: NetInfoState) => {
        const prevState = get()
        const wasOnline =
          prevState.isConnected && prevState.isInternetReachable !== false
        const nowOnline =
          state.isConnected && state.isInternetReachable !== false

        set({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          connectionType: state.type,
          lastCheckedAt: Date.now(),
        })

        // Connection state changed
        if (!wasOnline && nowOnline) {
          // Just came online - check server
          await get().checkServerHealth()
        } else if (wasOnline && !nowOnline) {
          // Just went offline
          set({
            connectionStatus: "offline",
            isServerReachable: false,
          })
        }
      }
    )

    return unsubscribe
  },

  checkConnection: async () => {
    const state = await NetInfo.fetch()
    const isOnline = state.isConnected && state.isInternetReachable !== false

    set({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
      lastCheckedAt: Date.now(),
    })

    if (!isOnline) {
      set({ connectionStatus: "offline" })
      return !isOnline
    }

    return isOnline
  },

  checkServerHealth: async () => {
    const { lastServerCheckAt } = get()
    const now = Date.now()

    // Debounce server checks
    if (lastServerCheckAt && now - lastServerCheckAt < SERVER_CHECK_DEBOUNCE) {
      return get().isServerReachable
    }

    try {
      // Use a lightweight endpoint or create a /health endpoint
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/categories?pagination[limit]=1`,
        {
          method: "GET",
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      const isReachable = response.ok || response.status < 500

      set({
        isServerReachable: isReachable,
        connectionStatus: isReachable ? "connected" : "server_unavailable",
        serverErrorMessage: isReachable
          ? null
          : "Server is temporarily unavailable",
        lastServerCheckAt: now,
        isLoading: false,
      })

      return isReachable
    } catch (error: any) {
      // Determine if it's a network error or server error
      const isNetworkError =
        error.name === "AbortError" ||
        error.message?.includes("Network") ||
        error.message?.includes("fetch")

      set({
        isServerReachable: false,
        connectionStatus: isNetworkError ? "offline" : "server_unavailable",
        serverErrorMessage: isNetworkError
          ? "Unable to connect to the internet"
          : "Server is temporarily unavailable",
        lastServerCheckAt: now,
        isLoading: false,
      })

      return false
    }
  },

  checkFullConnectivity: async () => {
    const isOnline = await get().checkConnection()

    if (!isOnline) {
      set({ connectionStatus: "offline", isLoading: false })
      return "offline"
    }

    const isServerUp = await get().checkServerHealth()

    if (!isServerUp) {
      set({ connectionStatus: "server_unavailable", isLoading: false })
      return "server_unavailable"
    }

    set({ connectionStatus: "connected", isLoading: false })
    return "connected"
  },

  requireNetwork: async (customMessage?: string) => {
    const status = await get().checkFullConnectivity()
    return status === "connected"
  },

  setServerReachable: (reachable: boolean, errorMessage?: string) => {
    set({
      isServerReachable: reachable,
      connectionStatus: reachable ? "connected" : "server_unavailable",
      serverErrorMessage: errorMessage || null,
    })
  },
}))
