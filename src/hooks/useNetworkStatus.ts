import { useCallback, useEffect } from "react"
import { useNetworkStore } from "../store/networkStore"

/**
 * Initialize network monitoring - call once in root layout
 */
export function useNetworkInit() {
  const initialize = useNetworkStore((state) => state.initialize)

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [initialize])
}

/**
 * Access network state in components
 */
export function useNetwork() {
  const isConnected = useNetworkStore((state) => state.isConnected)
  const isInternetReachable = useNetworkStore(
    (state) => state.isInternetReachable
  )
  const isServerReachable = useNetworkStore((state) => state.isServerReachable)
  const connectionStatus = useNetworkStore((state) => state.connectionStatus)
  const isLoading = useNetworkStore((state) => state.isLoading)
  const serverErrorMessage = useNetworkStore(
    (state) => state.serverErrorMessage
  )
  const checkConnection = useNetworkStore((state) => state.checkConnection)
  const checkServerHealth = useNetworkStore((state) => state.checkServerHealth)
  const checkFullConnectivity = useNetworkStore(
    (state) => state.checkFullConnectivity
  )
  const requireNetwork = useNetworkStore((state) => state.requireNetwork)

  return {
    // States
    isConnected,
    isInternetReachable,
    isServerReachable,
    connectionStatus,
    isLoading,
    serverErrorMessage,

    // Computed
    isFullyConnected: connectionStatus === "connected",
    isOffline: connectionStatus === "offline",
    isServerDown: connectionStatus === "server_unavailable",

    // Actions
    checkConnection,
    checkServerHealth,
    checkFullConnectivity,
    requireNetwork,
  }
}

/**
 * Hook for screens that require connectivity
 */
export function useConnectivityGuard() {
  const {
    connectionStatus,
    isLoading,
    checkFullConnectivity,
    serverErrorMessage,
  } = useNetwork()

  const retry = useCallback(async () => {
    return await checkFullConnectivity()
  }, [checkFullConnectivity])

  return {
    connectionStatus,
    isLoading,
    serverErrorMessage,
    retry,
    showContent: connectionStatus === "connected" && !isLoading,
    showOffline: connectionStatus === "offline" && !isLoading,
    showServerError: connectionStatus === "server_unavailable" && !isLoading,
    showLoading: isLoading || connectionStatus === "checking",
  }
}
