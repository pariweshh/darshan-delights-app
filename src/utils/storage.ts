import { API_CONFIG, STORAGE_KEYS } from "@/src/config/constants"
import { SessionCheckResult, User } from "@/src/types"
import axios, { AxiosError, isAxiosError } from "axios"
import * as SecureStore from "expo-secure-store"

const strapiApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
})

export const getLoggedInUser = async (): Promise<SessionCheckResult> => {
  try {
    const tokenString = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN)
    const token = tokenString ? JSON.parse(tokenString) : null

    if (!token) {
      return {
        isValid: false,
        user: null,
        token: null,
        error: "No token found",
      }
    }

    const response = await strapiApi.get<User>("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })

    const userData = response.data

    if (userData?.blocked) {
      return {
        isValid: false,
        user: null,
        token: null,
        error: "User account is blocked",
      }
    }

    if (!userData.confirmed) {
      return {
        isValid: false,
        user: userData,
        token: token,
        error: "User account is not confirmed",
      }
    }

    return {
      isValid: true,
      user: userData,
      token: token,
    }
  } catch (error) {
    console.error("Session check error:", error)

    if (isAxiosError(error)) {
      const axiosError = error as AxiosError

      if (axiosError.response?.status === 401) {
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN)
        } catch (deleteError) {
          console.error("Error removing token:", deleteError)
        }

        return {
          isValid: false,
          user: null,
          token: null,
          error: "Token expired or invalid",
        }
      }

      return {
        isValid: false,
        user: null,
        token: null,
        error:
          (axiosError.response?.data as { message: string })?.message ||
          axiosError.message ||
          "Network error",
      }
    }

    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN)
    } catch (deleteError) {
      console.error("Error removing token:", deleteError)
    }

    return {
      isValid: false,
      user: null,
      token: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export const isAuthenticated = async () => {
  const session = await getLoggedInUser()
  return {
    session: {
      isValid: session.isValid,
      user: session.user,
      token: session.token,
      error: session?.error || "",
    },
  }
}

export const setUserAuth = async (value: string): Promise<void> => {
  if (!value) return
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(value))
}

export const removeUserAuth = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN)
}

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(
      STORAGE_KEYS.ONBOARDING_COMPLETED
    )
    return value === "true"
  } catch {
    return false
  }
}

export const setOnboardingCompleted = async (): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETED, "true")
}
