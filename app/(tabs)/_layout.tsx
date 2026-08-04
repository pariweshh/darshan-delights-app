import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppColors from "@/src/constants/Colors";
import { useCart } from "@/src/hooks/queries/useCart";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useAuthStore } from "@/src/store/authStore";
import { useNotificationStore } from "@/src/store/notificationStore";

// ─── Dock geometry (per DESIGN.md § Navigation / Bottom Dock) ────────────────
const DOCK_HEIGHT = 64; // spec: 64px
// Curved rounded-rect, NOT a full pill. DESIGN.md dock spec: "Floating pill,
// 20px radius, 64px height". A full pill (radius = height/2 = 32) clashed
// with the curved selected-tab highlight, per user feedback 2026-08-04.
const DOCK_RADIUS = 20;
const BORDER_WIDTH = 1.5; // orange gradient border thickness
const DOCK_PADDING_H = 8; // spec: 0 6px
// Top/bottom gap between the whisper pill and the dock's edges — makes the
// active highlight read as a floating capsule instead of a full-height block.
const ITEM_PILL_INSET_V = 4;
const MAX_DOCK_WIDTH = 640; // tablets — cap + center the floating dock
const PHONE_DOCK_MARGIN = 18; // clear visible side gap so the dock reads as floating
const ICON_SIZE = 22;

// Warm saffron hairline — strong enough to be clearly visible on white.
const GRADIENT_COLORS: [string, string, string] = [
  "rgba(249, 115, 22, 0.30)",
  "rgba(249, 115, 22, 0.70)",
  "rgba(249, 115, 22, 0.30)",
];

// Label sizing — guarantees the longest label ("Products") fits its slot even
// at max font scale on Android, where adjustsFontSizeToFit is unavailable.
const DOCK_ITEM_PADDING_H = 6; // must match styles.dockItem paddingHorizontal
const DOCK_ITEM_MARGIN_H = 2; // must match styles.dockItem marginHorizontal
// v7's internal pressable uses `tabVerticalUiKit = { padding: 5 }`, so the
// DockItem is 10px narrower than the raw item width — account for it.
const DOCK_ITEM_PRESSABLE_PADDING_H = 10;
const LABEL_CHAR_WIDTH_FACTOR = 0.62; // conservative avg glyph width / fontSize
const LONGEST_LABEL_CHARS = 8; // "Products"
const MAX_FONT_SCALE = 1.15; // matches Text maxFontSizeMultiplier
const MIN_LABEL_FONT_SIZE = 9;

// ─── Dock Item ───────────────────────────────────────────────────────────────
// NOTE: @react-navigation/bottom-tabs v7 renders `tabBarIcon` TWICE per tab —
// one copy always `focused: true`, one always `focused: false` — stacked and
// cross-faded by the library. So each copy keeps a constant `focused` value:
// active styling must be static per copy (no per-copy animation) and the
// library's opacity cross-fade provides the transition.
interface DockItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  focusedIconName: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  badgeCount?: number;
  labelFontSize: number;
}

const DockItem = ({
  iconName,
  focusedIconName,
  label,
  focused,
  badgeCount,
  labelFontSize,
}: DockItemProps) => {
  return (
    <View style={styles.dockItem}>
      {/* Saffron Whisper highlight pill + saffron active capsule. The capsule is
          a child of the pill and centered with flexbox `alignItems` — the same
          mechanism that centers the icons. Percentage positioning
          (`left: 50%` + negative margin) was measurably off-center by ~8pt. */}
      {focused && (
        <View style={styles.itemPill}>
          <View style={styles.itemIndicator} />
        </View>
      )}

      <View style={styles.iconWrap}>
        <Ionicons
          name={focused ? focusedIconName : iconName}
          size={ICON_SIZE}
          color={focused ? AppColors.primary[600] : AppColors.gray[500]}
        />
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        )}
      </View>

      {/* No-truncation: cap accessibility scaling (Android + iOS), auto-shrink
          when overflowing (iOS), single line. The real horizontal fix is that
          the DockItem now fills the item width (see tabBarIconStyle). */}
      <Text
        style={[
          styles.dockLabel,
          { fontSize: labelFontSize },
          focused ? styles.dockLabelActive : styles.dockLabelInactive,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        maxFontSizeMultiplier={1.15}
      >
        {label}
      </Text>
    </View>
  );
};

// ─── Tab Layout ──────────────────────────────────────────────────────────────

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width, isTablet } = useResponsive();
  const token = useAuthStore((state) => state.token);
  const { data: cartItems } = useCart({ token, enabled: !!token });
  const itemCount = cartItems?.length ?? 0;
  const { unreadCount } = useNotificationStore();

  // Floating dock geometry. The dock stays in the navigator's column flow and
  // is inset with margins: v7's base tab-bar style sets logical `start`/`end`
  // which beat physical `left`/`right` in the merged style, so margin insets
  // are the reliable way to float the bar (bottom only works via margins here).
  const dockMargin = isTablet
    ? Math.max(48, (width - MAX_DOCK_WIDTH) / 2)
    : PHONE_DOCK_MARGIN;
  // Dock hugs the bottom edge: sit just above the home indicator instead of
  // floating high. `insets.bottom - 12` ≈ 20-22pt below the dock on modern
  // iPhones (vs 38pt before); floor keeps it clear on inset-less devices.
  const bottomGap = Math.max(10, insets.bottom - 12);

  // Cross-platform label size: base size for the device, capped so the longest
  // label fits its slot even at the max font-scale multiplier.
  const baseLabelFontSize = isTablet ? 11 : 10;
  const dockInnerWidth = Math.max(
    0,
    width - dockMargin * 2 - DOCK_PADDING_H * 2,
  );
  const itemTextWidth = Math.max(
    0,
    dockInnerWidth / 4 -
      DOCK_ITEM_PADDING_H * 2 -
      DOCK_ITEM_MARGIN_H * 2 -
      DOCK_ITEM_PRESSABLE_PADDING_H,
  );
  const fittingFontSize = Math.floor(
    itemTextWidth /
      (LONGEST_LABEL_CHARS * LABEL_CHAR_WIDTH_FACTOR * MAX_FONT_SCALE),
  );
  const finalLabelFontSize = Math.max(
    MIN_LABEL_FONT_SIZE,
    Math.min(baseLabelFontSize, fittingFontSize),
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: AppColors.primary[600],
        tabBarInactiveTintColor: AppColors.gray[500],
        tabBarBackground: () => (
          <View style={styles.dockOuter}>
            {/* Gradient border layer */}
            <LinearGradient
              colors={GRADIENT_COLORS}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.dockGradient}
            />
            {/* Warm white inner surface — 1.5px inset creates the border */}
            <View style={styles.dockInner} />
          </View>
        ),
        tabBarStyle: {
          // In-flow floating pill: horizontal margins create clear side gaps and
          // the bottom margin lifts it above the home indicator.
          marginHorizontal: dockMargin,
          marginBottom: bottomGap,
          height: DOCK_HEIGHT,
          // CRITICAL: v7 applies `paddingBottom: insets.bottom` (34px on iPhone
          // home-indicator devices) to the tab bar. That eats the content area
          // and clips the icon+label stack. Zero it so the full height is usable.
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: DOCK_RADIUS,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderWidth: 0,
          elevation: 8,
          shadowColor: "#1F2937",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: DOCK_PADDING_H,
          // position: "absolute",
        },
        tabBarItemStyle: {
          flex: 1,
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 0,
          paddingVertical: 0,
          marginVertical: 0,
        },
        tabBarIconStyle: {
          // CRITICAL: v7 wraps tabBarIcon in a fixed 52×32 box. Override both
          // dimensions so the DockItem spans the full item width — otherwise the
          // label slot is ~40px and "Products" truncates.
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <DockItem
              iconName="home-outline"
              focusedIconName="home"
              label="Home"
              focused={focused}
              labelFontSize={finalLabelFontSize}
            />
          ),
        }}
      />

      {/* Products Tab */}
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ focused }) => (
            <DockItem
              iconName="grid-outline"
              focusedIconName="grid"
              label="Products"
              focused={focused}
              labelFontSize={finalLabelFontSize}
            />
          ),
        }}
      />

      {/* Cart Tab */}
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ focused }) => (
            <DockItem
              iconName="cart-outline"
              focusedIconName="cart"
              label="Cart"
              focused={focused}
              badgeCount={itemCount}
              labelFontSize={finalLabelFontSize}
            />
          ),
        }}
      />

      {/* More Tab */}
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ focused }) => (
            <DockItem
              iconName="menu-outline"
              focusedIconName="menu"
              label="More"
              focused={focused}
              badgeCount={unreadCount}
              labelFontSize={finalLabelFontSize}
            />
          ),
        }}
      />

      {/* Hidden Tabs */}
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dockOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DOCK_RADIUS,
    overflow: "hidden",
  },
  dockGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DOCK_RADIUS,
  },
  dockInner: {
    ...StyleSheet.absoluteFillObject,
    top: BORDER_WIDTH,
    bottom: BORDER_WIDTH,
    left: BORDER_WIDTH,
    right: BORDER_WIDTH,
    borderRadius: DOCK_RADIUS - BORDER_WIDTH,
    backgroundColor: AppColors.background.primary, // #FEFEFE (no pure white)
  },
  dockItem: {
    flex: 1,
    // CRITICAL: v7's inner icon wrapper hardcodes `alignItems: "center"`,
    // which shrink-wraps this item to its content width — so the active pill
    // was narrow under "Home"/"Cart"/"More" and wide under "Products".
    // `alignSelf: "stretch"` overrides that and fills the full item slot,
    // giving every tab an identical pill width.
    alignSelf: "stretch",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: DOCK_ITEM_PADDING_H,
    marginHorizontal: DOCK_ITEM_MARGIN_H,
    borderRadius: 16,
    gap: 2,
    minWidth: 0,
  },
  itemPill: {
    // Inset vertically so the pill doesn't touch the dock's top/bottom edges.
    position: "absolute",
    top: ITEM_PILL_INSET_V,
    bottom: ITEM_PILL_INSET_V,
    left: 0,
    right: 0,
    borderRadius: 16,
    backgroundColor: AppColors.primary[50], // Saffron Whisper #FFF7ED
    alignItems: "center", // centers the active capsule indicator on the item
  },
  itemIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: AppColors.primary[500], // Saffron Flame
    marginTop: -1,
  },
  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  dockLabel: {
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  dockLabelActive: {
    color: AppColors.primary[600], // Saffron Deep
    fontFamily: "Poppins_600SemiBold",
  },
  dockLabelInactive: {
    color: AppColors.gray[500], // Slate-500
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: AppColors.primary[500], // Saffron Flame
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: AppColors.background.primary,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
