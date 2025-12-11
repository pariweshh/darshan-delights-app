import { IsIPAD } from "@/src/themes/app.constants"
import { Dimensions, Image } from "react-native"
import { verticalScale } from "react-native-size-matters"
import { LandingSlide } from "../types"

// Screen dimensions
export const { width: WIDTH, height: HEIGHT } = Dimensions.get("screen")

// Landing screen constants
export const MIN_LEDGE = 25
export const MARGIN_WIDTH = MIN_LEDGE + 50
export const PREV = WIDTH
export const NEXT = 0
export const LEFT_SNAP_POINTS = [MARGIN_WIDTH, PREV]
export const RIGHT_SNAP_POINTS = [WIDTH - MARGIN_WIDTH, NEXT]

export enum Side {
  LEFT,
  RIGHT,
  NONE,
}

// Landing screen slides - images will be added once you provide the assets
export const landingScreenSlides: LandingSlide[] = [
  {
    color: "#40e0d0",
    title: "Welcome to Darshan Delights",
    subTitle: "Shop for Authentic Nepali & Indian groceries",
    image: (
      <Image
        source={require("@/assets/images/landing/1.png")}
        style={{
          width: IsIPAD ? verticalScale(285) : verticalScale(320),
          height: IsIPAD ? verticalScale(345) : verticalScale(330),
        }}
        resizeMode="contain"
      />
    ),
  },
  {
    color: "#A7F893",
    title: "Save your favorites",
    subTitle: "Find the best products for you and create your wish lists",
    image: (
      <Image
        source={require("@/assets/images/landing/2.png")}
        style={{
          width: IsIPAD ? verticalScale(285) : verticalScale(320),
          height: IsIPAD ? verticalScale(345) : verticalScale(330),
        }}
        resizeMode="contain"
      />
    ),
  },
  {
    color: "#f1c88676",
    title: "Fast delivery",
    subTitle: "Get your order delivered to your doorstep",
    image: (
      <Image
        source={require("@/assets/images/landing/3.png")}
        style={{
          width: IsIPAD ? verticalScale(285) : verticalScale(320),
          height: IsIPAD ? verticalScale(345) : verticalScale(300),
          marginBottom: verticalScale(30),
        }}
        resizeMode="contain"
      />
    ),
  },
]

// API Configuration
export const API_CONFIG = {
  BASE_URL:
    process.env.EXPO_PUBLIC_ENV === "production"
      ? process.env.EXPO_PUBLIC_API_URL_PROD
      : process.env.EXPO_PUBLIC_API_URL_DEV,
  TIMEOUT: 10000,
} as const

// Secure storage keys
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: "token",
  USER_DATA: "user_data",

  // Biometrics
  BIOMETRIC_ENABLED: "biometric_auth_enabled",
  BIOMETRIC_CREDENTIALS: "biometric_credentials",

  // Onborading
  ONBOARDING_COMPLETED: "onboarding_completed",

  // Search
  RECENT_SEARCHES: "researches_searches",

  // Notifications
  PUSH_TOKEN: "push_token",
  NOTIFICATION_PREFERENCES: "notification_preferences",

  STORED_CREDENTIALS: "stored_credentials",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
