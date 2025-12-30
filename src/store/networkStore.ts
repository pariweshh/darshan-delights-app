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
const SERVER_CHECK_TIMEOUT = 8000

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,
  isInternetReachable: true,
  isServerReachable: true,
  connectionStatus: "checking",
  connectionType: "unknown",
  isLoading: false,
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
        // Only set offline if definitely offline
        connectionStatus: isOnline ? "connected" : "offline",
        isLoading: false,
      })

      // If online, check server health
      if (isOnline) {
        await get().checkServerHealth()
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
          // Just came online - optimistically set connected, then verify
          set({ connectionStatus: "connected", isServerReachable: true })
          get().checkServerHealth()
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
    const { lastServerCheckAt, isServerReachable } = get()
    const now = Date.now()

    // Debounce server checks
    if (lastServerCheckAt && now - lastServerCheckAt < SERVER_CHECK_DEBOUNCE) {
      return isServerReachable
    }

    try {
      // Use a lightweight endpoint or create a /health endpoint
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        SERVER_CHECK_TIMEOUT
      )

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
      })

      return isReachable
    } catch (error: any) {
      // Only mark as server_unavailable if we're sure we're online
      const netInfo = await NetInfo.fetch()
      const isOnline =
        netInfo.isConnected && netInfo.isInternetReachable !== false

      if (!isOnline) {
        set({
          isServerReachable: false,
          connectionStatus: "offline",
          serverErrorMessage: "No internet connection",
          lastServerCheckAt: now,
        })
      } else {
        // We're online but server didn't respond
        // Don't immediately mark as unavailable - could be transient
        set({
          lastServerCheckAt: now,
          // Keep current status unless it was "checking"
          connectionStatus:
            get().connectionStatus === "checking"
              ? "connected"
              : get().connectionStatus,
        })
      }

      return false
    }
  },

  checkFullConnectivity: async () => {
    set({ isLoading: true })
    const isOnline = await get().checkConnection()

    if (!isOnline) {
      set({ connectionStatus: "offline", isLoading: false })
      return "offline"
    }

    const isServerUp = await get().checkServerHealth()

    const status = isServerUp ? "connected" : "server_unavailable"
    set({ connectionStatus: status, isLoading: false })
    return status
  },

  requireNetwork: async (customMessage?: string) => {
    const status = await get().checkFullConnectivity()
    return status === "connected"
  },

  setServerReachable: (reachable: boolean, errorMessage?: string) => {
    const currentStatus = get().connectionStatus

    // If going from unreachable to reachable, update immediately
    if (reachable) {
      set({
        isServerReachable: true,
        connectionStatus: "connected",
        serverErrorMessage: null,
      })
      return
    }

    // If going from reachable to unreachable, only update if we're not already offline
    if (currentStatus !== "offline") {
      set({
        isServerReachable: false,
        connectionStatus: "server_unavailable",
        serverErrorMessage: errorMessage || null,
      })
    }
  },
}))
