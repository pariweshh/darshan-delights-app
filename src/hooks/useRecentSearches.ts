import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"
import { STORAGE_KEYS } from "../config/constants"

const MAX_RECENT_SEARCHES = 10

/**
 * Hook to manage recent searches with AsyncStorage persistence
 * - Stores up to 10 recent searches
 * - Automatically removes duplicates
 * - Persists across app restarts
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load recent searches from storage on mount
  useEffect(() => {
    loadRecentSearches()
  }, [])

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading recent searches:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addRecentSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) return

    const trimmedQuery = query.trim().toLowerCase()

    setRecentSearches((prev) => {
      // Remove duplicate if exists, add to front, limit to max
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== trimmedQuery
      )
      const updated = [query.trim(), ...filtered].slice(0, MAX_RECENT_SEARCHES)

      // Persist to storage
      AsyncStorage.setItem(
        STORAGE_KEYS.RECENT_SEARCHES,
        JSON.stringify(updated)
      ).catch((error) => console.error("Error saving recent search:", error))

      return updated
    })
  }, [])

  const removeRecentSearch = useCallback(async (query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter(
        (item) => item.toLowerCase() !== query.toLowerCase()
      )

      AsyncStorage.setItem(
        STORAGE_KEYS.RECENT_SEARCHES,
        JSON.stringify(updated)
      ).catch((error) => console.error("Error removing recent search:", error))

      return updated
    })
  }, [])

  const clearRecentSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES)
      setRecentSearches([])
    } catch (error) {
      console.error("Error clearing recent searches:", error)
    }
  }, [])

  return {
    recentSearches,
    isLoading,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  }
}
