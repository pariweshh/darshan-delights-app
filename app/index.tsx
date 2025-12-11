import { useAuthStore } from "@/src/store/authStore"
import { hasCompletedOnboarding } from "@/src/utils/storage"
import { useRouter } from "expo-router"
import { useEffect } from "react"

const Index = () => {
  const router = useRouter()
  const { user, token } = useAuthStore()

  useEffect(() => {
    const determineRoute = async () => {
      // Check if user has completed onboarding
      const onboardingCompleted = await hasCompletedOnboarding()

      if (!onboardingCompleted) {
        // First time user - show intro/landing slides
        router.replace("/(auth)/intro")
        return
      }

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
