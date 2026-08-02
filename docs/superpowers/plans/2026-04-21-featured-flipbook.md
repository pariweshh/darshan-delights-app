# Featured Flip Book — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated interactive flip book section to the home screen, directly below AppExclusiveBanner, showing 8 featured products (4 popular + 4 on-sale) as flippable pages in a standing, partially-open book visual.

**Architecture:** Single new component `FeaturedFlipBook.tsx` containing a private `FlipPage` sub-component. The parent owns all 8 Reanimated `SharedValue`s (one per page progress) and a single `pagesAreaWidth` shared value resolved via `onLayout`. Tapping a page strip springs its progress 0→1 (rotateY 85°→0°, strip→full width), instantly resetting the previously open page.

**Tech Stack:** React Native 0.81 / React 19 / Expo 54, Reanimated 4.1, expo-linear-gradient, expo-image, Zustand (useProductsStore), existing DebouncedTouchable / SectionHeader / Button / SkeletonBase components.

---

## File Map

| File | Action |
|---|---|
| `src/components/home/FeaturedFlipBook.tsx` | **Create** — full component + FlipPage sub-component |
| `app/(tabs)/home/index.tsx` | **Modify** — import + insert `<FeaturedFlipBook />` after `<AppExclusiveBanner />` |

---

## Task 1: Create FeaturedFlipBook — static shell

**Files:**
- Create: `src/components/home/FeaturedFlipBook.tsx`

- [ ] **Step 1: Create the file with imports, constants, and the data helper**

```tsx
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
import { memo, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"

import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import SectionHeader from "@/src/components/home/SectionHeader"
import { SkeletonBase } from "@/src/components/skeletons"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useProductsStore } from "@/src/store/productStore"
import { Product } from "@/src/types"

const SPINE_WIDTH = { phone: 24, tablet: 30 } as const
const STRIP_WIDTH = { phone: 18, tablet: 22 } as const
const STRIP_OFFSET = { phone: 14, tablet: 18 } as const
const BOOK_HEIGHT = { phone: 240, tablet: 270 } as const
const OPEN_WIDTH_RATIO = 0.85
const SPRING_CONFIG = { damping: 15, stiffness: 100 }

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
```

- [ ] **Step 2: Add the FlipPage sub-component (full implementation)**

Paste this directly after the `buildFlipBookProducts` function:

```tsx
interface FlipPageProps {
  product: Product
  index: number
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
    const openWidth = pagesAreaWidth.value * OPEN_WIDTH_RATIO
    return {
      width: interpolate(progress.value, [0, 1], [stripWidth, openWidth]),
      transform: [
        { perspective: 1000 },
        { rotateY: `${interpolate(progress.value, [0, 1], [85, 0])}deg` },
      ],
    }
  })

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0, 1]),
  }))

  const price = product.sale_price || product.rrp

  return (
    <Animated.View
      style={[
        styles.page,
        { left: index * stripOffset, zIndex: isOpen ? 50 : index },
        pageAnimStyle,
      ]}
    >
      {/* Tappable strip layer */}
      <DebouncedTouchable
        style={StyleSheet.absoluteFillObject}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.stripContent}>
          <Text style={styles.pageNumber}>{index + 1}</Text>
        </View>
      </DebouncedTouchable>

      {/* Product face — fades in as page flips open */}
      <Animated.View
        style={[styles.productFace, contentAnimStyle, { pointerEvents: isOpen ? "auto" : "none" }]}
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

        <Text style={styles.productName} numberOfLines={1}>
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
```

- [ ] **Step 3: Add the main FeaturedFlipBook export**

Paste this after the FlipPage component:

```tsx
export default function FeaturedFlipBook() {
  const { config, isTablet } = useResponsive()
  const popularProducts = useProductsStore((s) => s.popularProducts)
  const onSaleProducts = useProductsStore((s) => s.onSaleProducts)
  const popularLoading = useProductsStore((s) => s.popularLoading)
  const saleLoading = useProductsStore((s) => s.saleLoading)

  const products = buildFlipBookProducts(popularProducts, onSaleProducts)
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

  const handlePagePress = (i: number) => {
    const prev = openIndexRef.current
    if (prev !== null && prev !== i) {
      progressValues[prev].value = 0 // instant reset, hidden by new page flipping on top
    }
    progressValues[i].value = withSpring(1, SPRING_CONFIG)
    openIndexRef.current = i
    setOpenIndex(i)
  }

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
          styles.bookContainer,
          {
            height: bookHeight,
            borderRadius: config.cardBorderRadius + 4,
            maxWidth,
            width: maxWidth ? "100%" : undefined,
          },
        ]}
      >
        {/* Spine */}
        <LinearGradient
          colors={["#8B5E3C", "#6B3F1A", "#4A2C12"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.spine, { width: spineWidth }]}
        />

        {/* Pages area */}
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
              progress={progressValues[i]}
              pagesAreaWidth={pagesAreaWidth}
              isOpen={openIndex === i}
              stripWidth={stripWidth}
              stripOffset={stripOffset}
              onPress={() => handlePagePress(i)}
              productType={i < 4 ? "popular" : "sale"}
            />
          ))}
        </View>
      </View>
    </View>
  )
}
```

- [ ] **Step 4: Add the StyleSheet at the bottom of the file**

```tsx
const styles = StyleSheet.create({
  bookContainer: {
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: "#F5F0E8",
    shadowColor: "#6B3F1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 2,
  },
  spine: {
    height: "100%",
  },
  pagesArea: {
    flex: 1,
    position: "relative",
  },
  page: {
    position: "absolute",
    top: 0,
    height: "100%",
    backgroundColor: "#F5F0E8",
    borderRightWidth: 1,
    borderRightColor: "#D4C9A8",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  stripContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageNumber: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: "#8B7355",
    transform: [{ rotate: "90deg" }],
  },
  productFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FAF7F0",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
  },
  productImage: {
    width: "100%",
    height: "40%",
    marginBottom: 8,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 4,
    width: "100%",
  },
  productPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: AppColors.primary[600],
    marginBottom: 10,
  },
})
```

- [ ] **Step 5: Commit**

```bash
git add src/components/home/FeaturedFlipBook.tsx
git commit -m "feat: add FeaturedFlipBook component with flip animation"
```

---

## Task 2: Wire FeaturedFlipBook into the home screen

**Files:**
- Modify: `app/(tabs)/home/index.tsx`

- [ ] **Step 1: Add the import**

In `app/(tabs)/home/index.tsx`, add this import alongside the other home component imports (around line 20):

```tsx
import FeaturedFlipBook from "@/src/components/home/FeaturedFlipBook"
```

- [ ] **Step 2: Insert the component after AppExclusiveBanner**

Find this block in the main return (around line 490):

```tsx
        <AppExclusiveBanner />

        {/* New Arrivals Section */}
```

Replace it with:

```tsx
        <AppExclusiveBanner />

        <FeaturedFlipBook />

        {/* New Arrivals Section */}
```

- [ ] **Step 3: Verify the app renders without errors**

Run:
```bash
expo start --ios
# or
expo start --android
```

Expected:
- Home screen loads normally
- "✨ Featured Picks" section header appears below the AppExclusiveBanner
- A book-shaped container with a dark brown spine on the left and cream page strips on the right is visible
- Page strip numbers 1–8 are visible (rotated 90°)
- Tapping a strip causes it to spring open with a rotateY flip, revealing the product image, name, price, badge, and "View →" button
- Tapping a second strip flips it on top of the first (no close animation on the first)
- "View →" button navigates to the correct product detail screen
- During initial load, a pulsing skeleton block appears in place of the book
- On tablet, the book is centered and capped at 500px wide

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/home/index.tsx
git commit -m "feat: integrate FeaturedFlipBook into home screen"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Section placed below AppExclusiveBanner ✓ (Task 2, Step 2)
- [x] Section header "✨ Featured Picks" ✓ (`SectionHeader` with `showViewAll={false}`)
- [x] 4 popular + 4 on-sale, de-duped, capped at 8 ✓ (`buildFlipBookProducts`)
- [x] Hidden if < 2 products ✓ (`if (products.length < 2) return null`)
- [x] Brown spine + cream pages visual ✓ (LinearGradient spine, `#F5F0E8` pages)
- [x] Page edge strips with page numbers ✓ (`stripContent` + `pageNumber`)
- [x] rotateY flip animation via Reanimated withSpring ✓ (`pageAnimStyle`)
- [x] One page open at a time, new page flips on top ✓ (`handlePagePress` instant resets prev)
- [x] Product face: image, name, price, badge, View button ✓ (`productFace`)
- [x] Content fades in after page is halfway flipped ✓ (`contentAnimStyle` with [0, 0.6, 1] input range)
- [x] "View →" navigates to `/product/[id]` ✓
- [x] Loading skeleton ✓
- [x] Tablet: centered, maxWidth 500, scaled dimensions ✓
- [x] No extra API call — reads from existing store state ✓
