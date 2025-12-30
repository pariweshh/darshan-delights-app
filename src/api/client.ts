// src/api/client.ts

import NetInfo from "@react-native-community/netinfo"
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
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

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 500, 502, 503, 504], // Statuses worth retrying
}

// Track consecutive failures for smarter error handling
let consecutiveFailures = 0
const MAX_FAILURES_BEFORE_UNAVAILABLE = 5
const FAILURE_RESET_TIMEOUT = 30000
let failureResetTimer: NodeJS.Timeout | number | null = null

const resetFailureCounter = () => {
  consecutiveFailures = 0
  if (failureResetTimer) {
    clearTimeout(failureResetTimer)
    failureResetTimer = null
  }
}

const incrementFailureCounter = (): number => {
  consecutiveFailures++

  if (failureResetTimer) {
    clearTimeout(failureResetTimer)
  }
  failureResetTimer = setTimeout(resetFailureCounter, FAILURE_RESET_TIMEOUT)

  return consecutiveFailures
}

// Sleep helper for retry delay
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api`,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Add retry count to config if not present
    if (config.headers["x-retry-count"] === undefined) {
      config.headers["x-retry-count"] = "0"
    }

    // Only check network on first attempt
    if (config.headers["x-retry-count"] === "0") {
      try {
        const netInfo = await NetInfo.fetch()
        if (!netInfo.isConnected) {
          throw new NetworkError()
        }
      } catch (error) {
        if (error instanceof NetworkError) {
          useNetworkStore
            .getState()
            .setServerReachable(false, "No internet connection")
          throw error
        }
      }
    }

    // Add auth token
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

// Response interceptor with retry logic
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Success! Reset failure counter and mark server as reachable
    resetFailureCounter()

    const { isServerReachable } = useNetworkStore.getState()
    if (!isServerReachable) {
      useNetworkStore.getState().setServerReachable(true)
    }

    return response
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      headers: { "x-retry-count": string }
    }

    // Get current retry count
    const retryCount = parseInt(config?.headers?.["x-retry-count"] || "0", 10)

    // Determine if we should retry
    const shouldRetry = (): boolean => {
      if (!config || retryCount >= RETRY_CONFIG.maxRetries) {
        return false
      }

      // Retry on network errors (no response)
      if (!error.response) {
        if (
          error.message === "Network Error" ||
          error.code === "ERR_NETWORK" ||
          error.code === "ECONNABORTED"
        ) {
          return true
        }
      }

      // Retry on specific status codes
      if (
        error.response &&
        RETRY_CONFIG.retryableStatuses.includes(error.response.status)
      ) {
        return true
      }

      return false
    }

    // Attempt retry
    if (shouldRetry()) {
      // Increment retry count
      config.headers["x-retry-count"] = String(retryCount + 1)

      // Wait before retrying
      await sleep(RETRY_CONFIG.retryDelay * (retryCount + 1)) // Exponential backoff

      console.log(
        `[API] Retrying request (attempt ${retryCount + 2}/${
          RETRY_CONFIG.maxRetries + 1
        }): ${config.url}`
      )

      // Retry the request
      return api.request(config)
    }

    // No more retries - handle the error

    // Handle network errors (no response received)
    if (!error.response) {
      const netInfo = await NetInfo.fetch()

      if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
        useNetworkStore
          .getState()
          .setServerReachable(false, "No internet connection")
        return Promise.reject(new NetworkError())
      }

      if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
        const failures = incrementFailureCounter()

        // Only mark server as unavailable after multiple consecutive failures
        if (failures >= MAX_FAILURES_BEFORE_UNAVAILABLE) {
          useNetworkStore
            .getState()
            .setServerReachable(false, "Server unavailable")
        }

        return Promise.reject(new ServerUnavailableError())
      }

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        const failures = incrementFailureCounter()

        if (failures >= MAX_FAILURES_BEFORE_UNAVAILABLE) {
          useNetworkStore
            .getState()
            .setServerReachable(false, "Request timed out")
        }

        return Promise.reject(
          new TimeoutError("Request timed out. Please try again.")
        )
      }
    }

    // Server responded with an error status
    if (error.response) {
      const status = error.response.status

      // 5xx errors - server issues (already retried if configured)
      if (status >= 500) {
        const failures = incrementFailureCounter()

        if (failures >= MAX_FAILURES_BEFORE_UNAVAILABLE) {
          useNetworkStore.getState().setServerReachable(false, "Server error")
        }

        return Promise.reject(
          new ServerUnavailableError(
            "Server is experiencing issues. Please try again later."
          )
        )
      }

      // 4xx errors are NOT server failures - server responded!
      resetFailureCounter()

      const { isServerReachable } = useNetworkStore.getState()
      if (!isServerReachable) {
        useNetworkStore.getState().setServerReachable(true)
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

      // 404 - Not found
      if (status === 404) {
        const message =
          (error.response.data as any)?.error?.message || "Resource not found"
        return Promise.reject(new ServerError(message, 404))
      }

      // Other 4xx errors (including 400 - bad request, wrong credentials, etc.)
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

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError
}

export function isServerUnavailableError(error: unknown): boolean {
  return error instanceof ServerUnavailableError
}

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
