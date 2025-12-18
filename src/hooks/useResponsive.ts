// src/hooks/useResponsive.ts

import { useWindowDimensions } from "react-native"

export type DeviceType = "phone" | "tablet"

export interface ResponsiveConfig {
  // Layout
  horizontalPadding: number
  sectionSpacing: number

  // Typography
  headerFontSize: number
  titleFontSize: number
  subtitleFontSize: number
  bodyFontSize: number
  smallFontSize: number

  // Components
  iconSize: number
  iconSizeSmall: number
  iconSizeLarge: number
  buttonHeight: number
  badgeSize: number

  // Grid
  productCardWidth: number
  productGridColumns: number
  categoryItemWidth: number
  categoryIconSize: number

  // Cards
  cardBorderRadius: number
  imageHeight: number

  // Spacing
  gap: number
  gapSmall: number
  gapLarge: number
}

export interface ResponsiveInfo {
  width: number
  height: number
  deviceType: DeviceType
  isLandscape: boolean
  isTablet: boolean
  isPhone: boolean
  config: ResponsiveConfig
}

const getResponsiveConfig = (
  width: number,
  height: number,
  deviceType: DeviceType,
  isLandscape: boolean
): ResponsiveConfig => {
  if (deviceType === "tablet") {
    return {
      // Layout
      horizontalPadding: isLandscape ? 32 : 24,
      sectionSpacing: 32,

      // Typography
      headerFontSize: 22,
      titleFontSize: 20,
      subtitleFontSize: 16,
      bodyFontSize: 15,
      smallFontSize: 13,

      // Components
      iconSize: 24,
      iconSizeSmall: 20,
      iconSizeLarge: 28,
      buttonHeight: 48,
      badgeSize: 22,

      // Grid - more columns on tablet
      productCardWidth: isLandscape ? width / 5 - 20 : width / 3.5 - 20,
      productGridColumns: isLandscape ? 4 : 3,
      categoryItemWidth: 90,
      categoryIconSize: 64,

      // Cards
      cardBorderRadius: 16,
      imageHeight: 160,

      // Spacing
      gap: 16,
      gapSmall: 10,
      gapLarge: 24,
    }
  }

  // Phone (default)
  return {
    // Layout
    horizontalPadding: 16,
    sectionSpacing: 24,

    // Typography
    headerFontSize: 18,
    titleFontSize: 18,
    subtitleFontSize: 14,
    bodyFontSize: 14,
    smallFontSize: 12,

    // Components
    iconSize: 20,
    iconSizeSmall: 16,
    iconSizeLarge: 24,
    buttonHeight: 44,
    badgeSize: 18,

    // Grid
    productCardWidth: isLandscape ? width / 4 - 16 : 160,
    productGridColumns: isLandscape ? 3 : 2,
    categoryItemWidth: 75,
    categoryIconSize: 56,

    // Cards
    cardBorderRadius: 12,
    imageHeight: 140,

    // Spacing
    gap: 12,
    gapSmall: 8,
    gapLarge: 16,
  }
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions()

  const isLandscape = width > height
  const smallerDimension = Math.min(width, height)
  const deviceType: DeviceType = smallerDimension >= 600 ? "tablet" : "phone"

  const config = getResponsiveConfig(width, height, deviceType, isLandscape)

  return {
    width,
    height,
    deviceType,
    isLandscape,
    isTablet: deviceType === "tablet",
    isPhone: deviceType === "phone",
    config,
  }
}
