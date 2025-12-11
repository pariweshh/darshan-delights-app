import * as LocalAuthentication from "expo-local-authentication"
import { useCallback, useEffect, useState } from "react"
import { Platform } from "react-native"

/**
 * Simplified hook for biometric device capabilities
 * Authentication logic is handled by authStore
 */

export interface UseBiometricAuthReturn {
  // Device capability state
  isBiometricSupported: boolean
  isBiometricEnrolled: boolean
  availableBiometrics: LocalAuthentication.AuthenticationType[]
  isLoading: boolean

  // Utility methods
  checkBiometricSupport: () => Promise<void>
  getBiometricType: () => string
  getBiometricIcon: () => string
  authenticateWithBiometrics: (promptMessage?: string) => Promise<{
    success: boolean
    error?: string
  }>
}

export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false)
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false)
  const [availableBiometrics, setAvailableBiometrics] = useState<
    LocalAuthentication.AuthenticationType[]
  >([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Check device biometric capabilities
   */
  const checkBiometricSupport = useCallback(async () => {
    setIsLoading(true)
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      const biometricTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync()

      setIsBiometricSupported(hasHardware)
      setIsBiometricEnrolled(isEnrolled)
      setAvailableBiometrics(biometricTypes)

      if (__DEV__) {
        console.log("Biometric Support:", {
          hasHardware,
          isEnrolled,
          types: biometricTypes,
        })
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error checking biometric support:", error)
      }
      setIsBiometricSupported(false)
      setIsBiometricEnrolled(false)
      setAvailableBiometrics([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Get human-readable biometric type name
   */
  const getBiometricType = useCallback((): string => {
    const { FACIAL_RECOGNITION, FINGERPRINT, IRIS } =
      LocalAuthentication.AuthenticationType

    if (availableBiometrics.includes(FACIAL_RECOGNITION)) {
      return Platform.OS === "ios" ? "Face ID" : "Face Recognition"
    }

    if (availableBiometrics.includes(FINGERPRINT)) {
      return Platform.OS === "ios" ? "Touch ID" : "Fingerprint"
    }

    if (availableBiometrics.includes(IRIS)) {
      return "Iris Recognition"
    }

    return "Biometrics"
  }, [availableBiometrics])

  /**
   * Get appropriate Ionicons icon name
   */
  const getBiometricIcon = useCallback((): string => {
    const { FACIAL_RECOGNITION, FINGERPRINT } =
      LocalAuthentication.AuthenticationType

    if (availableBiometrics.includes(FACIAL_RECOGNITION)) {
      return "scan-outline"
    }

    if (availableBiometrics.includes(FINGERPRINT)) {
      return "finger-print-outline"
    }

    return "lock-closed-outline"
  }, [availableBiometrics])

  /**
   * Authenticate with biometrics (for testing or standalone use)
   * Note: For login, use authStore.loginWithBiometrics() instead
   */
  const authenticateWithBiometrics = useCallback(
    async (
      promptMessage?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isBiometricSupported) {
        return {
          success: false,
          error: "Biometric authentication is not supported on this device",
        }
      }

      if (!isBiometricEnrolled) {
        return {
          success: false,
          error:
            "No biometrics enrolled. Please set up biometrics in device settings.",
        }
      }

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: promptMessage || "Authenticate to continue",
          cancelLabel: "Cancel",
          fallbackLabel: "Use Passcode",
          disableDeviceFallback: false,
        })

        if (result.success) {
          return { success: true }
        }

        // Handle specific error cases
        const errorMessages: Record<string, string> = {
          user_cancel: "Authentication was cancelled",
          user_fallback: "User chose to use passcode",
          system_cancel: "Authentication was cancelled by system",
          not_enrolled: "No biometrics enrolled on this device",
          lockout: "Too many failed attempts. Please try again later.",
          lockout_permanent: "Biometrics locked. Please use your passcode.",
        }

        return {
          success: false,
          error: errorMessages[result.error || ""] || "Authentication failed",
        }
      } catch (error) {
        if (__DEV__) {
          console.error("Biometric authentication error:", error)
        }
        return {
          success: false,
          error: "An unexpected error occurred during authentication",
        }
      }
    },
    [isBiometricSupported, isBiometricEnrolled]
  )

  // Check biometric support on mount
  useEffect(() => {
    checkBiometricSupport()
  }, [checkBiometricSupport])

  return {
    isBiometricSupported,
    isBiometricEnrolled,
    availableBiometrics,
    isLoading,
    checkBiometricSupport,
    getBiometricType,
    getBiometricIcon,
    authenticateWithBiometrics,
  }
}
