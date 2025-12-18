import { useAuthStore } from "@/src/store/authStore"
import { hasCompletedOnboarding } from "@/src/utils/storage"
import { useRouter } from "expo-router"
import { useEffect, useRef } from "react"

const Index = () => {
  const router = useRouter()
  const { user, token, isLoading } = useAuthStore()
  const hasRouted = useRef(false)

  useEffect(() => {
    const determineRoute = async () => {
      // Only run routing logic once
      if (hasRouted.current) return

      // Wait for auth to finish loading
      if (isLoading) return

      // Check if user has completed onboarding
      const onboardingCompleted = await hasCompletedOnboarding()

      if (!onboardingCompleted) {
        // First time user - show intro/landing slides
        router.replace("/(auth)/intro")
        return
      }

      // Mark as routed so we don't run this again
      hasRouted.current = true

      if (user && token) {
        // User is logged in - go to home
        router.replace("/(tabs)/home")
      } else {
        // User has seen onboarding but not logged in - go to home (can browse)
        router.replace("/(tabs)/home")
      }
    }

    // Small delay to ensure auth state is loaded
    const timer = setTimeout(determineRoute, 100)

    return () => clearTimeout(timer)
  }, [user, token, router])

  return null
}
export default Index
