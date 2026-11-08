import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import React, { memo, useCallback, useEffect, useRef, useState } from "react"
import {
  AppState,
  FlatList,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

interface CarouselSlide {
  id: string
  title: string
  subtitle: string
  tagline: string
  backgroundColor: string
  accentColor: string
  image: ImageSourcePropType
  brandParam: string
}

const SLIDES: CarouselSlide[] = [
  {
    id: "pickle-collection",
    title: "Aama ko Achar",
    subtitle: "Pickle Collection",
    tagline: "From $5.49 ~",
    backgroundColor: "#FCDFD7",
    accentColor: "#9A3412",
    image: require("@/assets/images/home-banner/pickle_collection.webp"),
    brandParam: "aama ko achar",
  },
  {
    id: "spice-collection",
    title: "Century",
    subtitle: "Spice Collection",
    tagline: "$1.50 / each",
    backgroundColor: "#FFF4E6",
    accentColor: "#B45309",
    image: require("@/assets/images/home-banner/spice_collection.webp"),
    brandParam: "century",
  },
  {
    id: "84-cuisines",
    title: "84 Cuisines",
    subtitle: "Seasonings & Pastes",
    tagline: "Taste of Nepal",
    backgroundColor: "#D0EEDE",
    accentColor: "#065F46",
    image: require("@/assets/images/home-banner/84.webp"),
    brandParam: "84 cuisines",
  },
  {
    id: "haldiram",
    title: "Haldiram",
    subtitle: "Snacks & Sweets",
    tagline: "Authentic Indian Classics",
    backgroundColor: "#FFF8AD",
    accentColor: "#854D0E",
    image: require("@/assets/images/home-banner/haldiram.webp"),
    brandParam: "haldiram",
  },
]

const AUTO_PLAY_INTERVAL = 3500
const BORDER_RADIUS = 18

const HomeCarousel = memo(() => {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const { config, isTablet } = useResponsive()

  const carouselWidth = Math.max(width - config.horizontalPadding * 2, 280)
  const slideHeight = isTablet ? 210 : 165

  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList<CarouselSlide>>(null)

  const activeIndexRef = useRef(0)
  const isPausedRef = useRef(false)

  const scrollToPage = useCallback(
    (index: number, animated = true) => {
      flatListRef.current?.scrollToOffset({
        offset: index * carouselWidth,
        animated,
      })
    },
    [carouselWidth]
  )

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPausedRef.current) return

      const nextIndex = (activeIndexRef.current + 1) % SLIDES.length
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
      scrollToPage(nextIndex)
    }, AUTO_PLAY_INTERVAL)

    return () => clearInterval(timer)
  }, [carouselWidth, scrollToPage])

  const handleDragStart = useCallback(() => {
    isPausedRef.current = true
  }, [])

  const handleDragEnd = useCallback(() => {
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      isPausedRef.current = next !== "active"
    })
    return () => sub.remove()
  }, [])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x
      const index = Math.round(scrollPosition / carouselWidth)
      if (
        index >= 0 &&
        index < SLIDES.length &&
        index !== activeIndexRef.current
      ) {
        activeIndexRef.current = index
        setActiveIndex(index)
      }
    },
    [carouselWidth]
  )

  const handleSlidePress = useCallback(
    (slide: CarouselSlide) => {
      router.push({
        pathname: "/shop",
        params: { brand: slide.brandParam },
      })
    },
    [router]
  )

  const renderSlide = useCallback(
    ({ item }: { item: CarouselSlide }) => (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => handleSlidePress(item)}
        style={[
          styles.slideCard,
          {
            width: carouselWidth,
            height: slideHeight,
            backgroundColor: item.backgroundColor,
            borderRadius: BORDER_RADIUS,
          },
        ]}
      >
        {/* Left text column */}
        <View style={styles.textColumn}>
          <View>
            <View
              style={[
                styles.badge,
                { backgroundColor: "rgba(255, 255, 255, 0.7)" },
              ]}
            >
              <Text style={[styles.badgeText, { color: item.accentColor }]}>
                FEATURED BRAND
              </Text>
            </View>
            <Text
              style={[
                styles.title,
                { fontSize: isTablet ? 24 : 20, color: "#111827" },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: isTablet ? 15 : 13, color: "#374151" },
              ]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text
              style={[
                styles.tagline,
                { fontSize: isTablet ? 17 : 15, color: item.accentColor },
              ]}
              numberOfLines={1}
            >
              {item.tagline}
            </Text>
            <View style={[styles.ctaPill, { backgroundColor: item.accentColor }]}>
              <Text style={styles.ctaText}>Shop Now</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Right product cutout image */}
        <View
          style={[
            styles.imageWrapper,
            {
              width: carouselWidth * 0.46,
              height: slideHeight - 16,
            },
          ]}
        >
          <Image
            source={item.image}
            style={styles.slideImage}
            contentFit="contain"
            transition={200}
          />
        </View>
      </TouchableOpacity>
    ),
    [carouselWidth, slideHeight, isTablet, handleSlidePress]
  )

  const keyExtractor = useCallback((item: CarouselSlide) => item.id, [])

  return (
    <View style={[styles.wrapper, { marginBottom: config.sectionSpacing }]}>
      <View
        style={[
          styles.clipContainer,
          {
            width: carouselWidth,
            height: slideHeight,
            borderRadius: BORDER_RADIUS,
          },
        ]}
      >
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          onScrollBeginDrag={handleDragStart}
          onScrollEndDrag={handleDragEnd}
          onMomentumScrollEnd={handleDragEnd}
          nestedScrollEnabled
          removeClippedSubviews={false}
          getItemLayout={(_, index) => ({
            length: carouselWidth,
            offset: carouselWidth * index,
            index,
          })}
          style={{ flex: 1 }}
        />
      </View>

      {/* Pagination Dot Indicators */}
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, index) => {
          const isActive = index === activeIndex
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          )
        })}
      </View>
    </View>
  )
})

HomeCarousel.displayName = "HomeCarousel"

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
  },
  clipContainer: {
    overflow: "hidden",
  },
  slideCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: "hidden",
  },
  textColumn: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    paddingRight: 8,
    zIndex: 2,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  bottomRow: {
    gap: 6,
  },
  tagline: {
    fontFamily: "Poppins_600SemiBold",
  },
  ctaPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  slideImage: {
    width: "100%",
    height: "100%",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 22,
    backgroundColor: AppColors.primary[500],
  },
  inactiveDot: {
    width: 6,
    backgroundColor: "#D4D4D8",
  },
})

export default HomeCarousel
