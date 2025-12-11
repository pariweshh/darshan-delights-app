import * as Linking from "expo-linking"
import { useRouter, useSegments } from "expo-router"
import { useEffect, useRef } from "react"
import { useAuthStore } from "../store/authStore"

const WEB_DOMAINS = ["darshandelights.com.au", "www.darshandelights.com.au"]

// URLs to ignore (development/system URLs)
const IGNORED_URL_PATTERNS = [
  "exp://", // Expo Go development URLs
  "exp+", // Expo Go URLs
  "localhost", // Local development
  "127.0.0.1", // Local development
]

/**
 * Check if URL should be ignored
 */
function shouldIgnoreUrl(url: string): boolean {
  return IGNORED_URL_PATTERNS.some((pattern) => url.includes(pattern))
}

/**
 * Hook to handle deep linking throughout the app
 */
export function useDeepLinking(isAppReady: boolean = true): void {
  const router = useRouter()
  const segments = useSegments()
  const { token } = useAuthStore()
  const processedUrls = useRef<Set<string>>(new Set())

  /**
   * Parse URL and extract path
   */
  const parseUrl = (
    url: string
  ): { path: string; params: Record<string, string> } | null => {
    try {
      // Handle web URLs (Universal Links)
      if (url.startsWith("https://") || url.startsWith("http://")) {
        const urlObj = new URL(url)

        // Check if it's our domain
        const hostname = urlObj.hostname.replace("www.", "")
        if (!WEB_DOMAINS.some((domain) => domain.includes(hostname))) {
          return null
        }

        // Extract path without leading slash
        const path = urlObj.pathname.replace(/^\//, "")

        // Extract query params
        const params: Record<string, string> = {}
        urlObj.searchParams.forEach((value, key) => {
          params[key] = value
        })

        return { path, params }
      }

      // Handle custom scheme (darshandelights://)
      const parsed = Linking.parse(url)
      return {
        path: parsed.path || "",
        params: (parsed.queryParams as Record<string, string>) || {},
      }
    } catch (error) {
      console.error("Error parsing URL:", error)
      return null
    }
  }

  /**
   * Handle incoming deep link URL
   */
  const handleDeepLink = (url: string | null) => {
    if (!url || !isAppReady) return

    // Ignore development/system URLs
    if (shouldIgnoreUrl(url)) {
      console.log("Ignoring development URL:", url)
      return
    }

    // prevent processing the same url multiple times
    if (processedUrls.current.has(url)) return
    processedUrls.current.add(url)

    // clear processed urls after 5 seconds to allow re-processing
    setTimeout(() => {
      processedUrls.current.delete(url)
    }, 5000)

    console.log("Deep link received:", url)

    try {
      const parsed = parseUrl(url)
      if (!parsed) {
        console.log("Could not parse URL or not our domain:", url)
        return
      }

      const { path, params } = parsed
      console.log("Parsed deep link:", { path, params })

      // Don't navigate if path is empty (app just opened normally)
      if (!path) {
        console.log("Empty path, skipping navigation")
        return
      }

      //   handle different deep link paths
      handleRoute(path, params)
    } catch (error) {
      console.error("Error handling deep link:", error)
    }
  }

  /**
   * Route to appropriate screen based on path
   */
  const handleRoute = (path: string, params: Record<string, string>) => {
    // ============================================
    // Website URL patterns (Universal Links)
    // ============================================

    // Product detail": /shop/products/{slug}
    if (path.startsWith("shop/products/")) {
      const productSlug = path.replace("shop/products/", "")
      router.push({
        pathname: "/product/[id]",
        params: { id: productSlug, isSlug: "true" },
      })
      return
    }

    // Category
    if (path.startsWith("shop/")) {
      const categorySlug = path.replace("shop/", "")
      router.push({
        pathname: "/shop",
        params: { category: categorySlug },
      })
      return
    }

    // Shop page: /shop
    if (path === "shop") {
      router.push({
        pathname: "/shop",
        params,
      })
      return
    }

    // Cart
    if (path === "basket" || path === "cart") {
      router.push("/(tabs)/cart")
      return
    }

    // Contact Us: /contact-us
    if (path === "contact-us") {
      router.push("/(tabs)/more/help/contact")
      return
    }

    // FAQ: /faq
    if (path === "faq") {
      router.push("/(tabs)/more/help/faqs")
      return
    }

    // Product Recalls: /product-recalls
    if (path === "product-recalls") {
      Linking.openURL("https://www.darshandelights.com.au/product-recalls")
      return
    }

    if (path === "confirm-email") {
      const confirmToken = params?.token
      if (confirmToken) {
        router.push({
          pathname: "/(auth)/confirm-email",
          params: { token: confirmToken },
        })
      }
      return
    }

    // Handle password reset deep link
    if (path === "reset-password") {
      const resetToken = params.token
      if (resetToken) {
        router.push({
          pathname: "/(auth)/reset-password",
          params: { token: resetToken },
        })
      }
      return
    }

    // ============================================
    // Custom scheme patterns (darshandelights://)
    // ============================================

    // Product detail: product/{id}
    if (path.startsWith("product/")) {
      const productId = path.replace("product/", "")
      router.push({
        pathname: "/product/[id]",
        params: { id: productId },
      })
      return
    }

    // Category: category/{slug}
    if (path.startsWith("category/")) {
      const categorySlug = path.replace("category/", "")
      router.push({
        pathname: "/shop",
        params: { category: categorySlug },
      })
      return
    }

    // ============================================
    // Common patterns (both schemes)
    // ============================================

    // Orders list (requires auth)
    if (path === "orders") {
      if (token) {
        router.push("/(tabs)/more/orders")
      } else {
        router.push("/(auth)/login")
      }
      return
    }

    // Specific order: orders/{id} or order/{id}
    if (path.startsWith("orders/") || path.startsWith("order/")) {
      const orderId = path.replace("orders/", "").replace("order/", "")
      if (token) {
        router.push({
          pathname: "/(tabs)/more/orders",
          params: { orderId },
        })
      } else {
        router.push("/(auth)/login")
      }
      return
    }

    // Notifications (requires auth)
    if (path === "notifications") {
      if (token) {
        router.push("/notifications")
      } else {
        router.push("/(auth)/login")
      }
      return
    }

    // Search
    if (path === "search") {
      router.push({
        pathname: "/search",
        params,
      })
      return
    }

    // Favorites (requires auth)
    if (path === "favorites") {
      if (token) {
        router.push("/favorites")
      } else {
        router.push("/(auth)/login")
      }
      return
    }

    // Home - use replace to avoid duplicate screens
    if (path === "home") {
      // Check if already on home
      const currentRoute = segments.join("/")
      if (currentRoute.includes("home") || currentRoute === "(tabs)") {
        console.log("Already on home, skipping navigation")
        return
      }
      router.replace("/(tabs)/home")
      return
    }

    // Auth routes
    if (path === "sign-in") {
      router.push("/(auth)/login")
      return
    }

    if (path === "create-account") {
      router.push("/(auth)/signup")
      return
    }

    // Profile/Account
    if (path === "profile" || path === "account") {
      if (token) {
        router.push("/(tabs)/more/profile")
      } else {
        router.push("/(auth)/login")
      }
      return
    }

    // Default: log unknown path
    console.log("Unknown deep link path:", path)
    router.push("/(tabs)/home")
  }

  useEffect(() => {
    if (!isAppReady) return

    const getInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL()
        if (initialUrl) {
          setTimeout(() => {
            handleDeepLink(initialUrl)
          }, 500)
        }
      } catch (error) {
        console.error("Error getting initial URL:", error)
      }
    }

    getInitialUrl()
  }, [isAppReady])

  //   hanlde urls while app is open
  useEffect(() => {
    if (!isAppReady) return

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url)
    })

    return () => {
      subscription.remove()
    }
  }, [isAppReady, token])
}
