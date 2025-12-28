import NetInfo from "@react-native-community/netinfo"
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, STORAGE_KEYS } from "../config/constants"
import { useNetworkStore } from "../store/networkStore"

// Custom error classes
export class NetworkError extends Error {
  constructor(message: string = "No internet connection") {
    super(message)
    this.name = "NetworkError"
  }
}

export class ServerError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = "ServerError"
    this.statusCode = statusCode
  }
}

export class ServerUnavailableError extends Error {
  constructor(message: string = "Server is temporarily unavailable") {
    super(message)
    this.name = "ServerUnavailableError"
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message)
    this.name = "TimeoutError"
  }
}

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api`,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Check network connectivity before making request
      const netInfo = await NetInfo.fetch()
      if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
        useNetworkStore.getState().setServerReachable(false)
        throw new NetworkError()
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error
      }
    }

    try {
      const tokenString = await SecureStore.getItemAsync(
        STORAGE_KEYS.AUTH_TOKEN
      )
      if (tokenString) {
        const token = JSON.parse(tokenString)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (error) {
      console.error("Error retrieving auth token:", error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Server responded successfully - mark as reachable
    useNetworkStore.getState().setServerReachable(true)
    return response
  },
  async (error: AxiosError) => {
    // Handle network errors (no response received)
    if (!error.response) {
      if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
        // Check if it's actually a network issue or server issue
        const netInfo = await NetInfo.fetch()

        if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
          useNetworkStore
            .getState()
            .setServerReachable(false, "No internet connection")
          return Promise.reject(new NetworkError())
        } else {
          // Internet works but server didn't respond
          useNetworkStore
            .getState()
            .setServerReachable(false, "Server unavailable")
          return Promise.reject(new ServerUnavailableError())
        }
      }

      // Timeout
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        useNetworkStore
          .getState()
          .setServerReachable(false, "Request timed out")
        return Promise.reject(
          new TimeoutError("Request timed out. Please try again.")
        )
      }
    }

    // Server responded with an error status
    if (error.response) {
      const status = error.response.status

      // 5xx errors - server issues
      if (status >= 500) {
        useNetworkStore.getState().setServerReachable(false, "Server error")
        return Promise.reject(
          new ServerUnavailableError(
            "Server is experiencing issues. Please try again later."
          )
        )
      }

      // 401 - Unauthorized
      if (status === 401) {
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN)
          await SecureStore.deleteItemAsync(STORAGE_KEYS.STORED_CREDENTIALS)
        } catch (clearError) {
          console.error("Error clearing auth data:", clearError)
        }
        return Promise.reject(
          new ServerError("Session expired. Please log in again.", 401)
        )
      }

      // 404 - Not found (this is often expected, not a server error)
      if (status === 404) {
        const message =
          (error.response.data as any)?.error?.message || "Resource not found"
        return Promise.reject(new ServerError(message, 404))
      }

      // Other 4xx errors
      const message =
        (error.response.data as any)?.error?.message ||
        (error.response.data as any)?.message ||
        "Something went wrong"
      return Promise.reject(new ServerError(message, status))
    }

    return Promise.reject(error)
  }
)

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return "No internet connection. Please check your network and try again."
  }
  if (error instanceof ServerUnavailableError) {
    return "Server is temporarily unavailable. Please try again later."
  }
  if (error instanceof TimeoutError) {
    return "Request timed out. Please try again."
  }
  if (error instanceof ServerError) {
    if (error.statusCode === 401) {
      return "Your session has expired. Please log in again."
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Something went wrong. Please try again."
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError
}

export function isServerUnavailableError(error: unknown): boolean {
  return error instanceof ServerUnavailableError
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof TimeoutError
}

export function isConnectivityError(error: unknown): boolean {
  return (
    error instanceof NetworkError ||
    error instanceof ServerUnavailableError ||
    error instanceof TimeoutError
  )
}

export default api
