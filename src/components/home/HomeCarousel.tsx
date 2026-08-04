import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import AppColors from "@/src/constants/Colors";
import { useResponsive } from "@/src/hooks/useResponsive";

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeBg?: string;
  imageUri: string;
  route: string;
}

const SLIDES: CarouselSlide[] = [
  {
    id: "highlighted-products",
    title: "Highlighted Products",
    subtitle: "Hand-picked premium sweets & delicacies",
    badge: "EXCLUSIVE",
    badgeBg: AppColors.primary[600],
    imageUri:
      "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=900&auto=format&fit=crop&q=80",
    route: "/highlighted-products",
  },
  {
    id: "momo-brand",
    title: "8848 Momo Brand",
    subtitle: "Steaming hot authentic Nepalese dumplings",
    badge: "FEATURED BRAND",
    badgeBg: "#D97706",
    imageUri:
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=900&auto=format&fit=crop&q=80",
    route: "/shop?brand=8848-momo",
  },
  {
    id: "short-dated",
    title: "60% OFF Clearance",
    subtitle: "Huge savings on short-dated snacks & spices",
    badge: "60% OFF",
    badgeBg: "#DC2626",
    imageUri:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&auto=format&fit=crop&q=80",
    route: "/short-dated",
  },
  {
    id: "bulk-orders",
    title: "Catering & Bulk Orders",
    subtitle: "Party platters & bulk feast packages",
    badge: "BULK SPECIAL",
    badgeBg: "#059669",
    imageUri:
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=900&auto=format&fit=crop&q=80",
    route: "/bulk-orders",
  },
  {
    id: "popular-products",
    title: "Popular Snack Classics",
    subtitle: "Customer top-rated savory favorites",
    badge: "BEST SELLERS",
    badgeBg: "#7C3AED",
    imageUri:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&auto=format&fit=crop&q=80",
    route: "/popular-products",
  },
];

const AUTO_PLAY_INTERVAL = 3500;
const BORDER_RADIUS = 18;

const HomeCarousel = memo(() => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { config } = useResponsive();
  // Match the home screen's padded content area exactly — the carousel sits
  // inside a ScrollView with config.horizontalPadding (16 phone / 24 tablet).
  // The old hardcoded width - 32 overflowed on tablet.
  const carouselWidth = Math.max(width - config.horizontalPadding * 2, 280);
  const slideHeight = Math.round(carouselWidth * (9 / 16));

  const [activeIndex, setActiveIndex] = useState(0);
  const [failedSlides, setFailedSlides] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // Refs to avoid stale closures in setInterval
  const activeIndexRef = useRef(0);
  const isPausedRef = useRef(false);

  // ── Scroll to a specific page by offset (more reliable than scrollToIndex) ──
  const scrollToPage = useCallback(
    (index: number, animated = true) => {
      flatListRef.current?.scrollToOffset({
        offset: index * carouselWidth,
        animated,
      });
    },
    [carouselWidth],
  );

  // ── Auto-play timer ──────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      // Never advance while the user is dragging or the app is backgrounded —
      // scrollToOffset mid-gesture hijacks manual swiping on Android.
      if (isPausedRef.current) return;

      const nextIndex = (activeIndexRef.current + 1) % SLIDES.length;

      // Keep ref and state in sync
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);

      scrollToPage(nextIndex);
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [carouselWidth, scrollToPage]);

  // ── Pause auto-play while the user is touching the carousel ──
  const handleDragStart = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  // ── Pause auto-play when the app is backgrounded (like FlashSaleBanner) ──
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      isPausedRef.current = next !== "active";
    });
    return () => sub.remove();
  }, []);

  // ── Preload images for instant display ───────────────────
  useEffect(() => {
    const urls = SLIDES.map((s) => s.imageUri);
    Image.prefetch(urls, "memory-disk");
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const updateActiveIndex = useCallback((index: number) => {
    if (index >= 0 && index < SLIDES.length) {
      activeIndexRef.current = index;
      setActiveIndex(index);
    }
  }, []);

  // Track scroll position for index sync
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / carouselWidth);
      if (index !== activeIndexRef.current) {
        updateActiveIndex(index);
      }
    },
    [carouselWidth, updateActiveIndex],
  );

  const handleSlidePress = useCallback(
    (slide: CarouselSlide) => {
      if (slide.route) {
        router.push(slide.route as any);
      }
    },
    [router],
  );

  const handleImageError = useCallback((slideId: string) => {
    setFailedSlides((prev) => {
      if (prev.has(slideId)) return prev;
      const next = new Set(prev);
      next.add(slideId);
      return next;
    });
  }, []);

  // ── Render ───────────────────────────────────────────────
  const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

  const renderSlide = useCallback(
    ({ item }: { item: CarouselSlide }) => {
      const imageFailed = failedSlides.has(item.id);
      return (
        <TouchableOpacity
          activeOpacity={0.94}
          delayPressIn={100}
          onPress={() => handleSlidePress(item)}
          style={[
            styles.slideCard,
            {
              width: carouselWidth,
              height: slideHeight,
              borderRadius: BORDER_RADIUS,
            },
          ]}
        >
          {/* Background Image — with branded gradient fallback on error */}
          <View
            style={[
              styles.imageContainer,
              {
                width: carouselWidth,
                height: slideHeight,
                borderRadius: BORDER_RADIUS,
              },
            ]}
          >
            {imageFailed ? (
              <LinearGradient
                colors={[
                  item.badgeBg || AppColors.primary[600],
                  "#0F172A",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.slideImage}
              />
            ) : (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.slideImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                placeholder={{ blurhash: BLURHASH }}
                transition={200}
                recyclingKey={`home-carousel-${item.id}`}
                onError={() => handleImageError(item.id)}
              />
            )}
          </View>

          {/* Dark Overlay for Text Legibility */}
          <View style={[styles.overlay, { borderRadius: BORDER_RADIUS }]}>
            {item.badge ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: item.badgeBg || AppColors.primary[600],
                  },
                ]}
              >
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}

            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>

            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Explore Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [carouselWidth, slideHeight, handleSlidePress, handleImageError, failedSlides],
  );

  const keyExtractor = useCallback((item: CarouselSlide) => item.id, []);

  return (
    <View style={styles.wrapper}>
      {/* Clip container — hides adjacent slide overflow */}
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
          // BUG FIX (2026-08-04): removeClippedSubviews defaults to true on
          // Android, and when a horizontal FlatList is nested inside the home's
          // vertical ScrollView it clips/blankes out cells (and their images).
          // This was the "images not loading on device" cause.
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
          const isActive = index === activeIndex;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
});
HomeCarousel.displayName = "HomeCarousel";

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
    marginBottom: 24,
    width: "100%",
    alignItems: "center",
  },
  clipContainer: {
    overflow: "hidden",
    backgroundColor: "#1E293B",
  },
  slideCard: {
    overflow: "hidden",
    backgroundColor: "#1E293B",
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  slideImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    padding: 16,
    justifyContent: "flex-end",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
});

export default HomeCarousel;
