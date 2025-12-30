import ConnectionStatusBanner from "@/src/components/common/ConnectionStatusBanner"
import ErrorBoundary from "@/src/components/common/ErrorBoundary"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import { HEIGHT, STORAGE_KEYS, WIDTH } from "@/src/config/constants"
import AppColors from "@/src/constants/Colors"
import { useDeepLinking } from "@/src/hooks/useDeepLinking"
import { useNetworkInit } from "@/src/hooks/useNetworkStatus"
import { usePushNotifications } from "@/src/hooks/usePushNotifications"
import { useAuthStore } from "@/src/store/authStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins"
import { Ionicons } from "@expo/vector-icons"
import { StripeProvider } from "@stripe/stripe-react-native"
import { LinearGradient } from "expo-linear-gradient"
import * as Notifications from "expo-notifications"
import { Stack, useRouter } from "expo-router"
import * as SecureStore from "expo-secure-store"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import "react-native-reanimated"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import "../global.css"

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

const logErrorToService = (error: Error, errorInfo: any) => {
  // In development, log to console
  if (__DEV__) {
    console.error("=== APP ERROR ===")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)
    console.error("Component Stack:", errorInfo.componentStack)
    console.error("=================")
  }

  // In production, send to error reporting service
  // Example Sentry integration:
  // Sentry.captureException(error, {
  //   extra: {
  //     componentStack: errorInfo.componentStack,
  //   },
  // })

  // Example Firebase Crashlytics:
  // crashlytics().recordError(error)
}

export default function RootLayout() {
  const router = useRouter()
  const [appIsReady, setAppIsReady] = useState(false)
  const [showCustomSplash, setShowCustomSplash] = useState(true)

  useNetworkInit()

  const {
    isLoading,
    checkSession,
    loginWithBiometrics,
    loadBiometricPreference,
    setInitialising,
    logout,
  } = useAuthStore()

  const { expoPushToken, error: pushError } = usePushNotifications()

  // initialise deep linking only after app is ready
  useDeepLinking(!showCustomSplash && !isLoading)

  const [fontsLoaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!

  const handleBiometricAuth = useCallback(async () => {
    try {
      const result = await loginWithBiometrics()

      if (result.success) {
        setShowCustomSplash(false)
        setInitialising(false)
      } else {
        Alert.alert(
          "Authentication Failed",
          result.error || "Please try again or sign in manually",
          [
            {
              text: "Try Again",
              onPress: () => {
                setTimeout(() => handleBiometricAuth(), 300)
              },
            },
            {
              text: "Sign In Manually",
              onPress: async () => {
                await logout()
                setInitialising(false)
                setShowCustomSplash(false)
                setTimeout(() => {
                  router.replace("/(auth)/login")
                }, 100)
              },
            },
          ]
        )
      }
    } catch (error) {
      console.error("Biometric auth error:", error)
      Alert.alert(
        "Authentication Error",
        "Something went wrong. Please sign in manually.",
        [
          {
            text: "Sign In Manually",
            onPress: async () => {
              await logout()
              setInitialising(false)
              setShowCustomSplash(false)
              setTimeout(() => {
                router.replace("/(auth)/login")
              }, 100)
            },
          },
        ]
      )
    }
  }, [loginWithBiometrics, logout, router, setInitialising])

  useEffect(() => {
    async function prepare() {
      try {
        if (fontsLoaded) {
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Hide native splash screen
          await SplashScreen.hideAsync()

          // Load biometric preference
          await loadBiometricPreference()

          const state = useAuthStore.getState()
          const storedCredentials = await SecureStore.getItemAsync(
            STORAGE_KEYS.STORED_CREDENTIALS
          )

          if (storedCredentials && state.biometricAuthEnabled) {
            // User has biometric enabled - attempt biometric login
            handleBiometricAuth()
            setInitialising(false)
          } else {
            // Check session normally
            await SecureStore.deleteItemAsync(STORAGE_KEYS.STORED_CREDENTIALS)
            await checkSession()

            // Show splash for a bit longer for branding
            setTimeout(() => {
              setShowCustomSplash(false)
            }, 2000)
          }

          setAppIsReady(true)
        }
      } catch (error) {
        console.warn("Error during app preparation:", error)
        setAppIsReady(true)
        setShowCustomSplash(false)
      }
    }

    prepare()
  }, [
    fontsLoaded,
    loadBiometricPreference,
    checkSession,
    setInitialising,
    handleBiometricAuth,
  ])

  useEffect(() => {
    if (expoPushToken) {
      console.log("Push token registered:", expoPushToken)
    }
    if (pushError) {
      console.log("Push notification error:", pushError)
    }
  }, [expoPushToken, pushError])

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          const { unreadCount } = useNotificationStore.getState()
          await Notifications.setBadgeCountAsync(unreadCount)
        }
      }
    )

    return () => subscription.remove()
  }, [])

  if (!fontsLoaded || !appIsReady) {
    return null
  }

  // Show custom splash screen while loading
  if (showCustomSplash) {
    return (
      <>
        <StatusBar hidden style="dark" />
        <LinearGradient
          colors={["#ff9300", "#ff9f3c", "#ffb378"]}
          style={styles.splashContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.splashContent}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <ActivityIndicator
              size="large"
              color="#ffffff"
              style={styles.loader}
            />
          </View>
        </LinearGradient>
      </>
    )
  }

  return (
    <ErrorBoundary onError={logErrorToService}>
      <StripeProvider
        publishableKey={publishableKey}
        merchantIdentifier="merchant.com.darshandelights"
      >
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ConnectionStatusBanner />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "white" },
                animation: "slide_from_right",
              }}
            >
              {/* Entry point - handles routing logic */}
              <Stack.Screen name="index" options={{ headerShown: false }} />

              {/* Auth group */}
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />

              {/* Main app tabs */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              <Stack.Screen
                name="notifications"
                options={{
                  headerShown: true,
                  presentation: "card",
                  title: "Notifications",
                  headerStyle: {
                    backgroundColor: AppColors.background.primary,
                  },
                  headerTitleStyle: {
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 20,
                    color: AppColors.text.primary,
                  },
                  headerTintColor: AppColors.primary[500],
                  headerShadowVisible: false,
                  headerLeft: () => (
                    <DebouncedTouchable
                      onPress={() => router.back()}
                      style={styles.backButton}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-1"
                    >
                      <Ionicons
                        name="arrow-back"
                        size={24}
                        color={AppColors.primary[500]}
                      />
                      <Text className="text-lg font-medium">Back</Text>
                    </DebouncedTouchable>
                  ),
                }}
              />
              <Stack.Screen
                name="favorites"
                options={{
                  headerShown: true,
                  presentation: "card",
                  title: "Favorites",
                  headerStyle: {
                    backgroundColor: AppColors.background.primary,
                  },
                  headerTitleStyle: {
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 20,
                    color: AppColors.text.primary,
                  },
                  headerTintColor: AppColors.primary[500],
                  headerShadowVisible: false,
                  headerLeft: () => (
                    <DebouncedTouchable
                      onPress={() => router.back()}
                      style={styles.backButton}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-1"
                    >
                      <Ionicons
                        name="arrow-back"
                        size={24}
                        color={AppColors.primary[500]}
                      />
                      <Text className="text-lg font-medium">Back</Text>
                    </DebouncedTouchable>
                  ),
                }}
              />

              {/* Product detail */}
              <Stack.Screen
                name="product/[id]"
                options={{
                  headerShown: false,
                  presentation: "card",
                }}
              />

              {/* Payment success */}
              <Stack.Screen
                name="payment-success"
                options={{
                  headerShown: false,
                  animation: "fade",
                  gestureEnabled: false,
                }}
              />

              {/* 404 */}
              <Stack.Screen name="+not-found" />
            </Stack>

            <StatusBar style="dark" />
            <Toast />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </StripeProvider>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    width: WIDTH,
    height: HEIGHT,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  splashContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 50,
  },
  loader: {
    transform: [{ scale: 1.2 }],
  },
})
