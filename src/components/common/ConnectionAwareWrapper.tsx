import AppColors from "@/src/constants/Colors"
import { useConnectivityGuard } from "@/src/hooks/useNetworkStatus"
import React, { ReactNode, useCallback, useEffect, useState } from "react"
import { StyleSheet } from "react-native"
import ConnectionErrorScreen from "./ConnectionErrorScreen"

interface ConnectionAwareWrapperProps {
  children: ReactNode
  // Custom loading component (optional)
  LoadingComponent?: ReactNode
  // Called when connection is restored
  onConnectionRestored?: () => void
  // Show skeleton loader instead of error on initial load
  showSkeletonOnInitialLoad?: boolean
  // Custom skeleton component
  SkeletonComponent?: ReactNode
}

export default function ConnectionAwareWrapper({
  children,
  LoadingComponent,
  onConnectionRestored,
  showSkeletonOnInitialLoad = false,
  SkeletonComponent,
}: ConnectionAwareWrapperProps) {
  const {
    connectionStatus,
    isLoading,
    retry,
    showContent,
    showOffline,
    showServerError,
  } = useConnectivityGuard()

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [wasDisconnected, setWasDisconnected] = useState(false)

  // Track if we've loaded content at least once
  useEffect(() => {
    if (showContent && !hasLoadedOnce) {
      setHasLoadedOnce(true)
    }
  }, [showContent, hasLoadedOnce])

  // Track disconnection
  useEffect(() => {
    if (showOffline || showServerError) {
      setWasDisconnected(true)
    }
  }, [showOffline, showServerError])

  // Call onConnectionRestored when coming back online
  useEffect(() => {
    if (wasDisconnected && showContent) {
      setWasDisconnected(false)
      onConnectionRestored?.()
    }
  }, [wasDisconnected, showContent, onConnectionRestored])

  const handleRetry = useCallback(async () => {
    const status = await retry()
    if (status === "connected") {
      onConnectionRestored?.()
    }
  }, [retry, onConnectionRestored])

  // Initial loading
  if (isLoading) {
    if (showSkeletonOnInitialLoad && SkeletonComponent) {
      return <>{SkeletonComponent}</>
    }
    if (LoadingComponent) {
      return <>{LoadingComponent}</>
    }
    // Default: show nothing (let the screen handle its own loading)
    return null
  }

  // Offline state
  if (showOffline) {
    return <ConnectionErrorScreen status="offline" onRetry={handleRetry} />
  }

  // Server unavailable state
  if (showServerError) {
    return (
      <ConnectionErrorScreen
        status="server_unavailable"
        onRetry={handleRetry}
      />
    )
  }

  // Connected - show content
  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
})
