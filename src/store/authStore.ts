import * as LocalAuthentication from "expo-local-authentication"
import * as Notifications from "expo-notifications"
import * as SecureStore from "expo-secure-store"
import { Alert, Platform } from "react-native"
import { create } from "zustand"

import {
  signIn,
  signUp,
  updateUserInfo,
  verifyUserPassword,
} from "@/src/api/auth"
import { STORAGE_KEYS } from "@/src/config/constants"
import { User } from "@/src/types"
import {
  getLoggedInUser,
  isAuthenticated,
  removeUserAuth,
  setUserAuth,
} from "@/src/utils/storage"

const promptForPassword = (): Promise<{
  password: string
  cancelled: boolean
}> => {
  return new Promise((resolve) => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Enable Biometric Login",
        "Please enter your password to securely enable biometric authentication",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve({ password: "", cancelled: true }),
          },
          {
            text: "Enable",
            onPress: (password: any) =>
              resolve({ password: password || "", cancelled: false }),
          },
        ],
        "secure-text"
      )
    } else {
      // For Android, we'll handle this differently in the UI
      resolve({ password: "", cancelled: true })
    }
  })
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isLoggingOut: boolean
  error: string | null
  biometricAuthEnabled: boolean
  isInitialising: boolean

  // Actions
  setInitialising: (initialising: boolean) => void
  checkSession: (skipBiometricCheck?: boolean) => Promise<void>
  setSession: (token: string, user: User) => Promise<void>
  login: (
    identifier: string,
    password: string
  ) => Promise<{ user: User } | undefined>
  loginWithBiometrics: () => Promise<{ success: boolean; error?: string }>
  signup: (
    username: string,
    email: string,
    password: string,
    fName: string,
    lName: string,
    agreedToPolicies: boolean
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateUser: (
    token: string,
    userData: Partial<User>
  ) => Promise<User | undefined>
  loadBiometricPreference: () => Promise<void>
  setBiometricAuth: (
    enabled: boolean
  ) => Promise<{ success: boolean; error?: string }>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isLoggingOut: false,
  error: null,
  biometricAuthEnabled: false,
  isInitialising: false,

  setInitialising: (initialising: boolean) =>
    set({ isInitialising: initialising }),

  setSession: async (token: string, user: User) => {
    try {
      set({ isLoading: true, error: null })

      // store the jwt
      await setUserAuth(token)

      // update state
      set({
        user,
        token,
        error: null,
        isLoading: false,
      })

      // load biometric preference for the user
      await get().loadBiometricPreference()
    } catch (error: any) {
      console.error("Error setting session:", error)
      set({
        error: error.message || "Failed to set session",
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  login: async (identifier: string, password: string) => {
    try {
      set({ isLoading: true, error: null })

      const res = await signIn({ identifier, password })

      await setUserAuth(res.jwt || "")

      const { biometricAuthEnabled } = get()

      if (biometricAuthEnabled) {
        await SecureStore.setItemAsync(
          STORAGE_KEYS.AUTH_TOKEN,
          JSON.stringify(res.jwt)
        )
      }

      set({
        user: res.user,
        token: res.jwt,
        error: null,
        isLoading: false,
      })
      return { user: res.user }
    } catch (error: any) {
      const errorMessage = error.message?.includes("status code 400")
        ? "Incorrect email or password. Please ensure you have confirmed your email address."
        : error.message || "Login failed"

      set({
        error: errorMessage,
        user: null,
        token: null,
        isLoading: false,
      })

      await removeUserAuth()

      return undefined
    }
  },

  loginWithBiometrics: async () => {
    try {
      set({ isLoading: true, error: null })
      const { biometricAuthEnabled } = get()

      if (!biometricAuthEnabled) {
        set({ isLoading: false })
        return {
          success: false,
          error: "Biometric authentication is not enabled",
        }
      }

      const storedToken = await SecureStore.getItemAsync(
        STORAGE_KEYS.AUTH_TOKEN
      )
      if (!storedToken) {
        set({ isLoading: false })
        return { success: false, error: "No stored token found" }
      }

      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()

      if (!compatible || !enrolled) {
        set({ isLoading: false })
        return {
          success: false,
          error: "Biometric authentication is not available",
        }
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to login",
        cancelLabel: "Cancel",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      })

      const token = JSON.parse(storedToken)

      if (result.success) {
        if (!token) {
          set({ isLoading: false })
          return { success: false, error: "Stored token is invalid" }
        }

        await setUserAuth(token || "")
        const { user } = await getLoggedInUser()

        set({
          user: user,
          token: token,
          isLoading: false,
          error: null,
        })

        return { success: true }
      } else {
        set({ isLoading: false })
        return {
          success: false,
          error:
            result?.error === "user_cancel"
              ? "Authentication cancelled"
              : "Authentication failed",
        }
      }
    } catch (error: any) {
      console.error("Biometric login error:", error)
      set({ isLoading: false, error: error.message })
      return { success: false, error: "Biometric authentication failed" }
    }
  },

  signup: async (username, email, password, fName, lName, agreedToPolicies) => {
    try {
      set({ isLoading: true, error: null })
      const res = await signUp({
        username,
        email,
        password,
        fName,
        lName,
        platform: "mobile",
        agreedToPolicies,
      })

      if (res?.user) {
        set({ error: null, isLoading: false })
        return { success: true }
      }

      set({ isLoading: false })
      return { success: false, error: "Registration failed" }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },

  updateUser: async (token: string, userData: Partial<User>) => {
    if (!token) return undefined
    set({ error: null })

    try {
      const res = await updateUserInfo(token, userData)
      if (res?.id) {
        set({ user: res, error: null })
      }
      return res
    } catch (error: any) {
      set({ error: error.message })
      return undefined
    }
  },

  logout: async () => {
    try {
      set({ isLoggingOut: true, error: null })
      await removeUserAuth()
      await SecureStore.deleteItemAsync(STORAGE_KEYS.STORED_CREDENTIALS)

      // Clear cart when logging out
      const { useCartStore } = await import("./cartStore")
      useCartStore.getState().clearCartOnLogout()

      // Clear favorites when logging out
      const { useFavoritesStore } = await import("./favoritesStore")
      useFavoritesStore.getState().clearFavoritesOnLogout()

      // clear notifications when logging out
      const { useNotificationStore } = await import("./notificationStore")
      useNotificationStore.getState().reset()

      await Notifications.setBadgeCountAsync(0)

      set({
        user: null,
        token: null,
        isLoggingOut: false,
        error: null,
        biometricAuthEnabled: false,
      })
    } catch (error: any) {
      set({ error: error.message, isLoggingOut: false })
    }
  },

  checkSession: async () => {
    try {
      set({ isLoading: true, error: null })
      const res = await isAuthenticated()

      if (res && res.session.isValid) {
        const { user, token } = res.session

        set({
          user,
          token,
          isLoading: false,
          error: null,
        })

        await get().loadBiometricPreference()
      } else {
        const isActualError =
          res?.session?.error &&
          !res.session.error.toLowerCase().includes("no token") &&
          !res.session.error.toLowerCase().includes("not found") &&
          !res.session.error.toLowerCase().includes("no user")
        set({
          user: null,
          token: null,
          isLoading: false,
          error: isActualError ? res.session.error : null,
          biometricAuthEnabled: false,
        })
      }
    } catch (error: any) {
      const errorMessage = error.message?.toLowerCase() || ""
      const isSessionMissingError =
        errorMessage.includes("no token") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("no user") ||
        errorMessage.includes("no session")
      set({
        user: null,
        token: null,
        isLoading: false,
        error: isSessionMissingError ? null : error.message,
      })
    }
  },

  loadBiometricPreference: async () => {
    try {
      const enabled = await SecureStore.getItemAsync(
        STORAGE_KEYS.BIOMETRIC_ENABLED
      )
      set({ biometricAuthEnabled: enabled === "true" })
    } catch (error) {
      console.error("Error loading biometric preference:", error)
      set({ biometricAuthEnabled: false })
    }
  },

  setBiometricAuth: async (enabled: boolean) => {
    try {
      if (enabled) {
        const compatible = await LocalAuthentication.hasHardwareAsync()
        const enrolled = await LocalAuthentication.isEnrolledAsync()

        if (!compatible || !enrolled) {
          return {
            success: false,
            error: "Biometric authentication is not available on this device",
          }
        }

        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to enable biometric login",
          cancelLabel: "Cancel",
          fallbackLabel: "Use Passcode",
          disableDeviceFallback: false,
        })

        if (!authResult.success) {
          return {
            success: false,
            error:
              authResult.error === "user_cancel"
                ? "Authentication cancelled"
                : "Authentication failed",
          }
        }

        const { user, token } = get()
        if (user && token) {
          const currentCredentials = await SecureStore.getItemAsync(
            STORAGE_KEYS.STORED_CREDENTIALS
          )

          if (!currentCredentials) {
            const { password, cancelled } = await promptForPassword()

            if (cancelled) {
              return {
                success: false,
                error: "Password required to enable biometric authentication",
              }
            }

            if (!password || password.trim() === "") {
              return { success: false, error: "Password cannot be empty" }
            }

            const result = await verifyUserPassword(token, password)

            if (result?.valid) {
              await SecureStore.setItemAsync(
                STORAGE_KEYS.STORED_CREDENTIALS,
                JSON.stringify({ identifier: user.email, password })
              )
            } else {
              return {
                success: false,
                error: "Incorrect password. Please try again.",
              }
            }
          }
        } else {
          return {
            success: false,
            error: "User information not available. Please login again.",
          }
        }
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.STORED_CREDENTIALS)
      }

      await SecureStore.setItemAsync(
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        enabled.toString()
      )
      set({ biometricAuthEnabled: enabled })

      return { success: true }
    } catch (error: any) {
      console.error("Error setting biometric preference:", error)
      return { success: false, error: "Failed to update biometric preference" }
    }
  },
}))
