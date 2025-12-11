import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, STORAGE_KEYS } from "../config/constants"

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
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN)
        await SecureStore.deleteItemAsync(STORAGE_KEYS.STORED_CREDENTIALS)
      } catch (error) {
        console.error("Error clearing auth data:", error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
