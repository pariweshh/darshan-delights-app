---
name: Darshan Delights
description: A warm, vibrant specialty grocery shopping experience rooted in South Asian culinary culture
colors:
  saffron-flame: "#F97316"
  saffron-deep: "#EA580C"
  saffron-glow: "#FB923C"
  saffron-light: "#FDBA74"
  saffron-wash: "#FED7AA"
  saffron-whisper: "#FFF7ED"
  turmeric-gold: "#F59E0B"
  chili-red: "#EF4444"
  herb-green: "#10B981"
  spice-dark: "#1F2937"
  spice-mid: "#6B7280"
  spice-light: "#9CA3AF"
  cream: "#FEFEFE"
  warm-ash: "#F5F5F7"
  cloud: "#EEEEEE"
  slate-50: "#FAFAFA"
  slate-100: "#F4F4F5"
  slate-200: "#E4E4E7"
  slate-300: "#D4D4D8"
  slate-400: "#A1A1AA"
  slate-500: "#71717A"
  slate-600: "#52525B"
  slate-700: "#3F3F46"
  slate-800: "#27272A"
  slate-900: "#18181B"
typography:
  display:
    fontFamily: "White-Star, sans-serif"
    fontWeight: 400
  body:
    fontFamily: "Poppins, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Poppins, sans-serif"
    fontWeight: 600
    fontSize: "12px"
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.saffron-flame}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    typography: "{typography.label}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.saffron-deep}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  chip:
    backgroundColor: "{colors.saffron-whisper}"
    textColor: "{colors.saffron-deep}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  input:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  dock:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.xl}"
    height: "64px"
    border: "1.5px gradient saffron hairline"
---

# Design System: Darshan Delights

## 1. Overview

**Creative North Star: "The Spice Market"**

Walking into a well-stocked South Asian grocery store: warm light catching rows of colorful spice jars, vibrant packaging stacked floor to ceiling, the visual richness of turmeric gold, chili red, and saffron orange against warm neutral shelves. The interface should feel appetizing, culturally rooted, and alive with color, never sterile or clinical.

This system rejects the cold utility of generic grocery apps (Woolworths, Coles, Instacart) and the cramped, low-quality feel of typical ethnic food apps. It aims for the visual confidence of premium food brands while maintaining the warmth and approachability of a neighborhood specialty store.

**Key Characteristics:**
- **Warmth over minimalism**: color is used generously, not rationed. The palette is rich but controlled.
- **Appetizing imagery first**: product photography and food visuals drive engagement. Every screen should make the user hungry.
- **Lifted surfaces**: cards, buttons, and interactive elements float with visible shadows. Depth is structural, not ambient.
- **Cultural vibrancy**: the visual language draws from South Asian design sensibilities without resorting to stereotypes or kitsch.

## 2. Colors

A warm, vibrant palette anchored by saffron orange, with supporting warm tones and a neutral foundation that keeps the richness from overwhelming.

### Primary
- **Saffron Flame** (#F97316): The hero accent. Used on primary CTAs, active tab indicators, price highlights, and key interactive elements. This is the color users associate with Darshan Delights.
- **Saffron Deep** (#EA580C): Hover and pressed states for primary elements. Also used for emphasis text and badges.

### Secondary
- **Turmeric Gold** (#F59E0B): Warning states, sale badges, and secondary highlights. Complements the saffron without competing.
- **Herb Green** (#10B981): Success states, in-stock indicators, and positive feedback. A warm green that fits the palette.
- **Chili Red** (#EF4444): Error states, out-of-stock indicators, and urgent notifications.

### Neutral
- **Spice Dark** (#1F2937): Primary text. A warm near-black that avoids the harshness of pure #000.
- **Spice Mid** (#6B7280): Secondary text, subtitles, and descriptions.
- **Spice Light** (#9CA3AF): Placeholder text, disabled states, and tertiary information.
- **Cream** (#FEFEFE): Primary background. A warm off-white that feels inviting.
- **Warm Ash** (#F5F5F7): Secondary background, card backgrounds, and section dividers.
- **Cloud** (#EEEEEE): Tertiary background, input backgrounds, and subtle separators.

### Named Rules

**The Generosity Rule.** Orange is used generously across the interface, not rationed as a rare accent. It appears on CTAs, active states, badges, highlights, and decorative elements. Its abundance is the point; it's what makes the app feel like Darshan Delights and not a generic store.

**The Warm Neutrals Rule.** Never use pure #000 or pure #fff. All neutrals are tinted warm (toward orange/amber). The background is #FEFEFE, not #FFFFFF. Text is #1F2937, not #000000. This subtle warmth pervades the entire interface.

## 3. Typography

**Display Font:** White-Star (custom)
**Body Font:** Poppins (Google Fonts, weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold)

**Character:** Poppins is a geometric sans-serif with rounded terminals and friendly proportions. It feels approachable and modern without being clinical. Paired with the custom White-Star display font for distinctive headings.

### Hierarchy
- **Display** (White-Star, 400, 28-32px): Hero section titles, onboarding headlines. Used sparingly for maximum impact.
- **Title** (Poppins 800, 18-20px, line-height 1.3): Section headers, card titles, screen titles. Bold and commanding.
- **Subtitle** (Poppins 600, 14-16px, line-height 1.4): Card subtitles, category names, secondary headings.
- **Body** (Poppins 400, 14px, line-height 1.5): Product descriptions, paragraph text, general content. Max line length 65ch.
- **Label** (Poppins 600, 10-12px, letter-spacing 0.02em): Buttons, badges, tab labels, metadata. Uppercase when emphasis is needed.

### Named Rules

**The Weight Contrast Rule.** Hierarchy comes from weight contrast, not size alone. A 14px Poppins 800 title stands clearly above a 14px Poppins 400 body line. Never use two weights at the same size for the same role.

**The Poppins-Only Rule.** All UI text uses Poppins or its weight variants. White-Star is reserved for display/hero use only. No mixing of additional sans-serif families.

## 4. Elevation

This system uses **lifted surfaces**: cards, buttons, and interactive elements have visible shadows that create a clear sense of depth. The interface feels like objects resting on a surface, not flat layers.

### Shadow Vocabulary
- **Subtle lift** (`shadowOffset: {0, 2}, shadowOpacity: 0.06, shadowRadius: 8`): Default card state. A gentle lift that suggests interactivity.
- **Medium lift** (`shadowOffset: {0, 4}, shadowOpacity: 0.1, shadowRadius: 12`): Pressed cards, focused inputs, dropdown menus. More pronounced lift for active/selected states.
- **Strong lift** (`shadowOffset: {0, 8}, shadowOpacity: 0.12, shadowRadius: 24`): Floating dock, modals, bottom sheets. Maximum elevation for elements that float above all content.
- **No shadow** (`elevation: 0`): Flat elements like dividers, badges, and inline chips. These sit within their parent surface.

### Named Rules

**The Lifted-By-Default Rule.** Cards and interactive surfaces have shadows at rest. They don't wait for hover or press to gain depth. The interface feels like a collection of floating objects, not a flat page.

**The Shadow-Not-Elevation Rule.** On Android, use `elevation` sparingly (max 8). Prefer `shadowOffset`/`shadowOpacity`/`shadowRadius` for consistent cross-platform behavior. Android elevation adds opaque backgrounds that fight translucent glass effects.

## 5. Components

### Buttons
- **Shape:** Gently rounded (12px radius). Not pill-shaped, not sharp.
- **Primary:** Saffron Flame (#F97316) background, white text, Poppins 600 at 14px. Padding: 12px vertical, 24px horizontal. Shadow: medium lift on press.
- **Secondary:** Transparent background, Saffron Deep (#EA580C) text, 1.5px border in Saffron Light (#FDBA74). Same padding and radius.
- **Ghost:** No background, no border, Saffron Flame text. Used for inline actions and text links.

### Cards
- **Corner Style:** 12px radius (phone), 16px radius (tablet). Gently curved, not circular.
- **Background:** Cream (#FEFEFE) or Warm Ash (#F5F5F7).
- **Shadow:** Subtle lift by default. Medium lift on press or selection.
- **Border:** None. Shadows define edges, not borders.
- **Internal Padding:** 16px (phone), 24px (tablet).

### Chips / Tags
- **Style:** Pill-shaped (9999px radius). Saffron Whisper (#FFF7ED) background, Saffron Deep (#EA580C) text.
- **State:** Selected chips get Saffron Flame background with white text. Unselected chips use the whisper background.
- **Padding:** 6px vertical, 14px horizontal.

### Inputs / Fields
- **Style:** 12px radius, Cream (#FEFEFE) background, 1px border in Cloud (#EEEEEE).
- **Focus:** Border shifts to Saffron Flame (#F97316). No glow, no shadow change.
- **Error:** Border shifts to Chili Red (#EF4444). Error text appears below in Chili Red.
- **Padding:** 12px vertical, 16px horizontal.

### Navigation (Bottom Dock)
- **Style:** Floating curved bar, 20px radius (`rounded.xl`), 64px height. **Opaque cream (#FEFEFE) surface** — NOT frosted glass (ADR-007; frosted glass was rejected on device, the app crashes on web anyway). Wrapped in a **1.5px saffron gradient hairline** (Saffron Flame at 30%/70%/30% opacity) for a warm edge. Strong-lift shadow (`0 8px 24px rgba(31,41,55,0.15)`).
- **Float:** margin-inset floating (phone: 18px side gap; tablet: capped at 640px, centered). Bottom gap `max(10, insets.bottom − 12)` so it hugs above the home indicator. Fully-rounded pill rejected by user 2026-08-04 — the dock stays curved.
- **Active tab:** Saffron Whisper (#FFF7ED) pill inset 4px from the dock's top/bottom edges **plus a 3px Saffron Flame capsule** at the pill's top as an unmistakable marker; icon + label in Saffron Deep (#EA580C). Pill and capsule are centered with flexbox `alignItems` (percentage positioning was measurably off-center).
- **Inactive tab:** Slate-500 (#71717A) icon and label. No background.
- **Badge:** Saffron Flame circle with white text, positioned at top-right of icon.
- **Label sizing:** cross-platform no-truncation — width-derived fontSize clamped so "Products" always fits, plus `maxFontSizeMultiplier` (caps accessibility scaling at 1.15× on this chrome) and `adjustsFontSizeToFit` on iOS.

### Product Cards
- **Image:** Full-width, `contentFit="contain"`, with memory-disk caching.
- **Info:** Product name (Poppins 600, 14px), price (Poppins 700, Saffron Deep), optional sale price in Chili Red.
- **Actions:** Heart icon for favorites (top-right overlay), add-to-cart button at bottom.

## 6. Do's and Don'ts

### Do:
- **Do** use orange generously across the interface. It's the brand's signature color, not a rare accent.
- **Do** keep all neutrals warm-tinted. Backgrounds are #FEFEFE, not #FFFFFF. Text is #1F2937, not #000000.
- **Do** use visible shadows on cards and interactive surfaces. The interface should feel lifted and tactile.
- **Do** prioritize product imagery. Every screen should feature food photography prominently.
- **Do** use Poppins for all UI text. Reserve White-Star for hero/display use only.
- **Do** maintain 44pt minimum touch targets for all interactive elements.

### Don't:
- **Don't** use pure #000 or #fff anywhere. Always tint warm.
- **Don't** create a cold, utilitarian, blue/white corporate palette. That's the generic grocery app this brand rejects.
- **Don't** use cramped layouts, low-quality imagery, or cluttered navigation. That's the typical ethnic food app this brand rejects.
- **Don't** use side-stripe borders (border-left/right > 1px as colored accent). Use full borders, background tints, or leading icons instead.
- **Don't** use gradient text (background-clip: text with gradients). Use solid colors with weight/size emphasis.
- **Don't** use glassmorphism anywhere. The dock is opaque cream with a saffron gradient hairline — blur/translucency was rejected on device (ADR-007).
- **Don't** nest cards inside cards. One surface per container.
- **Don't** animate layout properties (width, height, padding). Animate transforms and opacity only.
