// src/components/home/FeaturedFlipBook.tsx

import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { memo, useCallback, useMemo, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"

import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import SectionHeader from "@/src/components/home/SectionHeader"
import { SkeletonBase } from "@/src/components/skeletons"
import AppColors from "@/src/constants/Colors"
import { useProducts } from "@/src/hooks/queries/useProducts"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Product } from "@/src/types"

// ─── Dimensions ──────────────────────────────────────────────────────────────

const SPINE_WIDTH = { phone: 28, tablet: 36 } as const
const STRIP_WIDTH = { phone: 20, tablet: 24 } as const
// Offset between strip right edges — controls how much of each strip is visible
const STRIP_OFFSET = { phone: 16, tablet: 20 } as const
const BOOK_HEIGHT = { phone: 220, tablet: 260 } as const
const OPEN_WIDTH_RATIO = 0.92
const SPRING_CONFIG = { damping: 16, stiffness: 110, mass: 0.9 }

// ─── Colour palette ───────────────────────────────────────────────────────────

const SPINE_COLORS = ["#A0622D", "#6B3F1A", "#3D1F08"] as const
const BOOK_INTERIOR = "#2C1A0E"
const PAGE_CREAM = "#F5F0E8"
const PAGE_OPEN_BG = "#FAF7F0"
const PAGE_BORDER = "#D4C9A8"
const PAGE_NUM_COLOR = "#8B7355"
const SPINE_ACCENT = "rgba(255,220,150,0.35)"

// ─── Data helper ─────────────────────────────────────────────────────────────

function buildFlipBookProducts(popular: Product[], onSale: Product[]): Product[] {
  const seen = new Set<number>()
  const result: Product[] = []
  for (const p of popular.slice(0, 4)) {
    if (!seen.has(p.id)) { seen.add(p.id); result.push(p) }
  }
  for (const p of onSale.slice(0, 4)) {
    if (result.length >= 8) break
    if (!seen.has(p.id)) { seen.add(p.id); result.push(p) }
  }
  return result
}

// ─── FlipPage ────────────────────────────────────────────────────────────────

interface FlipPageProps {
  product: Product
  index: number
  totalPages: number
  progress: SharedValue<number>
  pagesAreaWidth: SharedValue<number>
  isOpen: boolean
  stripWidth: number
  stripOffset: number
  onPress: () => void
  productType: "popular" | "sale"
}

const FlipPage = memo(function FlipPage({
  product,
  index,
  totalPages,
  progress,
  pagesAreaWidth,
  isOpen,
  stripWidth,
  stripOffset,
  onPress,
  productType,
}: FlipPageProps) {
  const router = useRouter()

  const pageAnimStyle = useAnimatedStyle(() => {
    const totalW = pagesAreaWidth.value
    if (totalW === 0) return { width: stripWidth, left: 0, opacity: 0 }

    const openWidth = totalW * OPEN_WIDTH_RATIO

    // Strips fan on the RIGHT side of the pages area.
    // Highest index = frontmost = rightmost.
    // restingLeft for page i = totalW - stripWidth - (totalPages-1-i) * stripOffset
    // e.g. page (totalPages-1): totalW - stripWidth        (far right)
    //      page 0:              totalW - stripWidth - (totalPages-1)*stripOffset
    const restingLeft = totalW - stripWidth - (totalPages - 1 - index) * stripOffset

    const left = interpolate(progress.value, [0, 1], [restingLeft, 0])
    const width = interpolate(progress.value, [0, 1], [stripWidth, openWidth])
    // Subtle rotateY wobble peaks at mid-transition — gives the "page turning" feel
    const rotateY = interpolate(progress.value, [0, 0.4, 1], [0, -20, 0])

    return {
      left,
      width,
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
    }
  })

  // Product content fades in during the second half of the flip
  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.55, 1], [0, 0, 1]),
  }))

  // Shadow overlay peaks at mid-flip — simulates page edge catching shadow
  const flipOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.45, 0]),
  }))

  const price = product.sale_price ?? product.rrp ?? 0

  return (
    <Animated.View
      style={[
        styles.page,
        // isOpen pages sit on top; resting zIndex = index (highest index = frontmost)
        { zIndex: isOpen ? 50 : index },
        pageAnimStyle,
      ]}
    >
      {/* Tappable strip — visible in resting state */}
      <DebouncedTouchable
        style={StyleSheet.absoluteFillObject}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {/* Left-edge gradient simulates the page being at an angle in the open book */}
        <LinearGradient
          colors={["rgba(0,0,0,0.28)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.stripContent}>
          <Text style={styles.pageNumber}>{index + 1}</Text>
        </View>
      </DebouncedTouchable>

      {/* Dark overlay during the flip midpoint */}
      <Animated.View
        style={[styles.flipOverlay, flipOverlayStyle, { pointerEvents: "none" }]}
      />

      {/* Product face — fades in as page reaches fully open */}
      <Animated.View
        style={[
          styles.productFace,
          contentAnimStyle,
          { pointerEvents: isOpen ? "auto" : "none" },
        ]}
      >
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                productType === "popular" ? AppColors.success : AppColors.error,
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {productType === "popular" ? "POPULAR" : "SALE"}
          </Text>
        </View>

        <Image
          source={{ uri: product.cover?.url }}
          style={styles.productImage}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={`flipbook-${product.id}`}
        />

        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.productPrice}>${price.toFixed(2)}</Text>

        <Button
          title="View →"
          size="small"
          variant="primary"
          onPress={() => router.push(`/product/${product.id}`)}
        />
      </Animated.View>
    </Animated.View>
  )
})

// ─── FeaturedFlipBook ────────────────────────────────────────────────────────

export default function FeaturedFlipBook() {
  const { config, isTablet } = useResponsive()
  const { data: popularData, isLoading: popularLoading } = useProducts({ popular: true, limit: 4 })
  const { data: saleData, isLoading: saleLoading } = useProducts({ onSale: true, limit: 4 })

  const products = useMemo(
    () => buildFlipBookProducts(popularData?.products ?? [], saleData?.products ?? []),
    [popularData, saleData]
  )

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const openIndexRef = useRef<number | null>(null)

  const pagesAreaWidth = useSharedValue(0)

  // All 8 declared unconditionally — Rules of Hooks prohibits conditional calls
  const p0 = useSharedValue(0)
  const p1 = useSharedValue(0)
  const p2 = useSharedValue(0)
  const p3 = useSharedValue(0)
  const p4 = useSharedValue(0)
  const p5 = useSharedValue(0)
  const p6 = useSharedValue(0)
  const p7 = useSharedValue(0)
  const progressValues = [p0, p1, p2, p3, p4, p5, p6, p7]

  const spineWidth = isTablet ? SPINE_WIDTH.tablet : SPINE_WIDTH.phone
  const stripWidth = isTablet ? STRIP_WIDTH.tablet : STRIP_WIDTH.phone
  const stripOffset = isTablet ? STRIP_OFFSET.tablet : STRIP_OFFSET.phone
  const bookHeight = isTablet ? BOOK_HEIGHT.tablet : BOOK_HEIGHT.phone
  const maxWidth = isTablet ? 500 : undefined

  // New page flips on top — no close animation on the previously open page
  const handlePagePress = useCallback(
    (i: number) => {
      progressValues[i].value = withSpring(1, SPRING_CONFIG)
      openIndexRef.current = i
      setOpenIndex(i)
    },
    [p0, p1, p2, p3, p4, p5, p6, p7]
  )

  const pageCallbacks = useMemo(
    () => Array.from({ length: 8 }, (_, i) => () => handlePagePress(i)),
    [handlePagePress]
  )

  if (popularLoading || saleLoading) {
    return (
      <View style={{ marginBottom: config.sectionSpacing }}>
        <SectionHeader title="✨ Featured Picks" showViewAll={false} />
        <SkeletonBase
          width="100%"
          height={bookHeight}
          borderRadius={config.cardBorderRadius + 4}
        />
      </View>
    )
  }

  if (products.length < 2) return null

  return (
    <View
      style={[
        { marginBottom: config.sectionSpacing },
        isTablet && { alignItems: "center" },
      ]}
    >
      <SectionHeader title="✨ Featured Picks" showViewAll={false} />

      <View
        style={[
          styles.bookOuter,
          {
            height: bookHeight,
            borderRadius: config.cardBorderRadius + 4,
            maxWidth,
            width: maxWidth ? "100%" : undefined,
          },
        ]}
      >
        {/* Spine — warm brown gradient with binding marks */}
        <LinearGradient
          colors={SPINE_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.spine, { width: spineWidth }]}
        >
          <View style={[styles.spineAccentLine, { top: 14 }]} />
          <View style={[styles.spineAccentLine, { bottom: 14 }]} />
          <Text style={styles.spineLabel}>Featured</Text>
        </LinearGradient>

        {/* Pages area — dark book interior, cream strips fan from the right */}
        <View
          style={styles.pagesArea}
          onLayout={(e) => {
            pagesAreaWidth.value = e.nativeEvent.layout.width
          }}
        >
          {products.map((product, i) => (
            <FlipPage
              key={product.id}
              product={product}
              index={i}
              totalPages={products.length}
              progress={progressValues[i]}
              pagesAreaWidth={pagesAreaWidth}
              isOpen={openIndex === i}
              stripWidth={stripWidth}
              stripOffset={stripOffset}
              onPress={pageCallbacks[i]}
              productType={i < 4 ? "popular" : "sale"}
            />
          ))}

          {/* Hint visible over the dark interior before any page is opened */}
          {openIndex === null && (
            <View style={[styles.hintWrap, { pointerEvents: "none" }]}>
              <Text style={styles.hintText}>Tap a page to explore ›</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bookOuter: {
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: BOOK_INTERIOR,
    // Pronounced bottom shadow simulates the book standing on a surface
    shadowColor: "#1a0a00",
    shadowOffset: { width: 4, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    marginHorizontal: 2,
  },
  spine: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  spineAccentLine: {
    position: "absolute",
    left: 5,
    right: 5,
    height: 1,
    backgroundColor: SPINE_ACCENT,
  },
  spineLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 9,
    color: "rgba(255,220,150,0.75)",
    letterSpacing: 2.5,
    transform: [{ rotate: "90deg" }],
  },
  pagesArea: {
    flex: 1,
    position: "relative",
    backgroundColor: BOOK_INTERIOR,
  },
  page: {
    position: "absolute",
    top: 0,
    height: "100%",
    backgroundColor: PAGE_CREAM,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: PAGE_BORDER,
    borderBottomColor: PAGE_BORDER,
    // Left-edge shadow gives depth between stacked page strips
    shadowColor: "#000",
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
  },
  stripContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageNumber: {
    fontFamily: "Poppins_500Medium",
    fontSize: 9,
    color: PAGE_NUM_COLOR,
    letterSpacing: 0.5,
    transform: [{ rotate: "90deg" }],
  },
  flipOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  productFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PAGE_OPEN_BG,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.5,
  },
  productImage: {
    width: "80%",
    height: "42%",
    marginTop: 10,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: AppColors.text.primary,
    textAlign: "center",
    lineHeight: 17,
  },
  productPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: AppColors.primary[600],
  },
  hintWrap: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.3,
  },
})
