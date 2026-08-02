# Featured Flip Book — Design Spec
**Date:** 2026-04-21

## Overview
An animated interactive flip book section added to the home screen directly below the `AppExclusiveBanner`. Displays up to 8 featured products (4 popular + 4 on-sale) as "pages" in a vertically-standing partially-open book. Users tap page edges to flip them open and reveal product info.

---

## Location
- **File created:** `src/components/home/FeaturedFlipBook.tsx`
- **Inserted in:** `app/(tabs)/home/index.tsx`, immediately after `<AppExclusiveBanner />`

---

## Data Source
- 4 products from `popularProducts` (already in `useProductsStore`, no extra API call)
- 4 products from `onSaleProducts` (already in `useProductsStore`, no extra API call)
- De-duped by `product.id` before rendering
- If combined total < 2, section is hidden entirely
- If one list has fewer than 4, fill remaining slots from the other list, capped at 8

---

## Layout

### Section Header
- Reuses existing `SectionHeader` component
- Title: `"✨ Featured Picks"`
- No "View All" link

### BookContainer
- Height: `240px` (phone), scales slightly on tablet
- Width: full width minus horizontal padding
- Tablet: capped at `500px`, centered (matches `AppExclusiveBanner` pattern)
- `overflow: hidden`
- Contains **Spine** + **PagesArea** side by side

### Spine
- Width: `24px` (phone), `30px` (tablet)
- Color: warm brown `#6B3F1A` simulated via `LinearGradient` (light-to-dark brown for grain texture)
- Full height of BookContainer

### PagesArea
- Fills remaining width after spine
- Contains all 8 page strips absolutely positioned

---

## Resting State (Pages Closed)

Each of the 8 pages is an absolutely positioned strip:
- Width: `18px` (phone), `22px` (tablet)
- Height: full PagesArea height
- Horizontal offset between pages: `14px` (phone), `18px` (tablet)
- Color: cream/parchment `#F5F0E8`
- Right border: `1px` solid `#D4C9A8`
- Drop shadow for depth illusion
- Page number (1–8) rotated 90°, color `#8B7355`, small font, centered on strip
- Page 8 (last index) is RIGHTMOST and FRONTMOST (highest z-index at rest, most visible); page 1 is leftmost and closest to the spine (deepest in the stack). Tapping proceeds right-to-left as the user "peels" pages.

---

## Flip Interaction

### Trigger
- Each strip wrapped in `DebouncedTouchable`
- Only one page open at a time; new page flips on top of whatever is currently open (no close animation)

### Animation (Reanimated 4)
- `useSharedValue` per page tracking flip progress (0 = closed, 1 = open)
- On tap: `withSpring` animates the value from 0 → 1
- `rotateY` interpolated: `85deg` (closed/edge-on) → `0deg` (open/flat)
- Page width interpolated: `18px` → computed pixel value of `PagesArea width × 0.85` simultaneously (resolved at render time, not a percentage string)
- `zIndex` set to high value (e.g. `100`) when open so it renders above all other strips

---

## Flipped Page Face (Product Content)

Background: `#FAF7F0` (slightly warmer cream)

Layout top-to-bottom:
1. **Badge** — top-right corner: `"POPULAR"` (green) or `"SALE"` (red) depending on source list
2. **Product image** — expo-image, `contentFit: "contain"`, takes ~45% of page height, `cachePolicy: "memory-disk"`
3. **Product name** — `Poppins_600SemiBold`, 1 line, truncated, `AppColors.text.primary`
4. **Price** — `sale_price` if present, else `rrp`, `AppColors.primary[600]`, `Poppins_700Bold`
5. **"View →" button** — existing `Button` component, `size: "small"`, `variant: "primary"`, navigates to `/product/[id]`

---

## Loading State
- While `popularLoading || saleLoading`, render a `SkeletonBase` block matching BookContainer dimensions (240px tall, full width, same border radius)
- No new loading state — uses existing store loading flags

---

## Responsiveness
| Property | Phone | Tablet |
|---|---|---|
| BookContainer height | 240px | 270px |
| BookContainer maxWidth | none | 500px (centered) |
| Spine width | 24px | 30px |
| Strip width | 18px | 22px |
| Strip offset | 14px | 18px |

---

## Files Changed
| File | Change |
|---|---|
| `src/components/home/FeaturedFlipBook.tsx` | **New file** |
| `app/(tabs)/home/index.tsx` | Import + insert `<FeaturedFlipBook />` after `<AppExclusiveBanner />` |
