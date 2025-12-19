import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { ValidatedCoupon, validateCoupon } from "@/src/api/coupon"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface CouponInputProps {
  subtotal: number
  appliedCoupon: ValidatedCoupon | null
  onApply: (coupon: ValidatedCoupon) => void
  onRemove: () => void
  token?: string | null
}

export default function CouponInput({
  subtotal,
  appliedCoupon,
  onApply,
  onRemove,
  token,
}: CouponInputProps) {
  const { config, isTablet } = useResponsive()

  const [code, setCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleApply = async () => {
    if (!code.trim()) {
      setError("Please enter a coupon code")
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const result = await validateCoupon(code.trim(), subtotal, token)

      if (result.valid && result.coupon) {
        onApply(result.coupon)
        setCode("")
        setIsExpanded(false)
        Toast.show({
          type: "success",
          text1: "Coupon Applied! 🎉",
          text2: `You saved $${result.coupon.discountAmount.toFixed(2)}`,
        })
      } else {
        setError(result.error || "Invalid coupon code")

        if (result.appExclusive) {
          Toast.show({
            type: "info",
            text1: "App Exclusive Code",
            text2: "This code only works in our mobile app!",
          })
        }
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message || "Failed to validate coupon"
      setError(message)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemove = () => {
    onRemove()
    setCode("")
    setError(null)
    setIsExpanded(false)
  }

  const iconContainerSize = isTablet ? 40 : 36

  // Applied coupon display
  if (appliedCoupon) {
    return (
      <View
        style={[
          styles.appliedContainer,
          {
            padding: isTablet ? 14 : 12,
          },
        ]}
      >
        <View style={[styles.appliedContent, { gap: isTablet ? 12 : 10 }]}>
          <View
            style={[
              styles.appliedIconContainer,
              {
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: isTablet ? 10 : 8,
              },
            ]}
          >
            <Ionicons name="pricetag" size={config.iconSize} color="#16A34A" />
          </View>
          <View style={styles.appliedTextContainer}>
            <Text
              style={[styles.appliedCode, { fontSize: config.bodyFontSize }]}
            >
              {appliedCoupon.code}
            </Text>
            <Text
              style={[
                styles.appliedDiscount,
                { fontSize: config.smallFontSize },
              ]}
            >
              {appliedCoupon.discountType === "percentage"
                ? `${appliedCoupon.discountValue}% off`
                : `$${appliedCoupon.discountValue} off`}{" "}
              • Saving ${appliedCoupon.discountAmount.toFixed(2)}
            </Text>
          </View>
        </View>
        <DebouncedTouchable
          onPress={handleRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.removeButton}
        >
          <Ionicons
            name="close-circle"
            size={isTablet ? 24 : 22}
            color={AppColors.gray[400]}
          />
        </DebouncedTouchable>
      </View>
    )
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <DebouncedTouchable
        style={[
          styles.addCouponButton,
          {
            padding: isTablet ? 16 : 14,
          },
        ]}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.7}
      >
        <View style={[styles.addCouponLeft, { gap: isTablet ? 12 : 10 }]}>
          <Ionicons
            name="pricetag-outline"
            size={config.iconSize}
            color={AppColors.primary[600]}
          />
          <Text
            style={[styles.addCouponText, { fontSize: config.bodyFontSize }]}
          >
            Add Promo Code
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={config.iconSize}
          color={AppColors.gray[400]}
        />
      </DebouncedTouchable>
    )
  }

  // Expanded input state
  return (
    <View
      style={[
        styles.container,
        {
          padding: isTablet ? 16 : 14,
          borderRadius: config.cardBorderRadius,
          marginHorizontal: config.horizontalPadding,
          marginTop: isTablet ? 20 : 16,
          marginBottom: isTablet ? 20 : 16,
        },
      ]}
    >
      <View style={[styles.header, { marginBottom: isTablet ? 14 : 12 }]}>
        <Text style={[styles.label, { fontSize: config.bodyFontSize }]}>
          Promo Code
        </Text>
        <DebouncedTouchable
          onPress={() => {
            setIsExpanded(false)
            setError(null)
            setCode("")
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close"
            size={config.iconSize}
            color={AppColors.gray[400]}
          />
        </DebouncedTouchable>
      </View>

      <View style={[styles.inputRow, { gap: isTablet ? 12 : 10 }]}>
        <View
          style={[
            styles.inputContainer,
            error && styles.inputError,
            {
              paddingHorizontal: isTablet ? 14 : 12,
              borderRadius: isTablet ? 12 : 10,
            },
          ]}
        >
          <Ionicons
            name="pricetag-outline"
            size={config.iconSize}
            color={error ? AppColors.error : AppColors.gray[400]}
          />
          <TextInput
            style={[
              styles.input,
              {
                fontSize: config.bodyFontSize,
                paddingVertical: isTablet ? 14 : 12,
              },
            ]}
            placeholder="Enter code"
            placeholderTextColor={AppColors.gray[400]}
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase())
              setError(null)
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isValidating}
            autoFocus
          />
          {code.length > 0 && !isValidating && (
            <DebouncedTouchable
              onPress={() => setCode("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={config.iconSize}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>
          )}
        </View>
        <DebouncedTouchable
          style={[
            styles.applyButton,
            (!code.trim() || isValidating) && styles.applyButtonDisabled,
            {
              paddingHorizontal: isTablet ? 24 : 20,
              borderRadius: isTablet ? 12 : 10,
              minWidth: isTablet ? 90 : 80,
            },
          ]}
          onPress={handleApply}
          disabled={!code.trim() || isValidating}
          activeOpacity={0.8}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={[
                styles.applyButtonText,
                { fontSize: config.bodyFontSize },
              ]}
            >
              Apply
            </Text>
          )}
        </DebouncedTouchable>
      </View>

      {error && (
        <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
          {error}
        </Text>
      )}

      {/* App exclusive hint */}
      <View
        style={[
          styles.hintContainer,
          { marginTop: isTablet ? 14 : 12, paddingTop: isTablet ? 14 : 12 },
        ]}
      >
        <Ionicons
          name="phone-portrait-outline"
          size={config.iconSizeSmall}
          color={AppColors.primary[500]}
        />
        <Text style={[styles.hintText, { fontSize: config.smallFontSize }]}>
          Use code <Text style={styles.hintCode}>APP10</Text> for 10% off app
          orders!
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Add Coupon Button (collapsed)
  addCouponButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary[50],
    borderWidth: 1,
    borderColor: AppColors.primary[100],
    borderStyle: "dashed",
  },
  addCouponLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  addCouponText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },

  // Expanded container
  container: {
    backgroundColor: AppColors.background.primary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  inputRow: {
    flexDirection: "row",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    gap: 8,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    letterSpacing: 1,
  },
  applyButton: {
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonDisabled: {
    backgroundColor: AppColors.gray[300],
  },
  applyButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: 8,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  hintText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
  hintCode: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.primary[600],
  },

  // Applied coupon
  appliedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  appliedContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedIconContainer: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  appliedTextContainer: {
    flex: 1,
  },
  appliedCode: {
    fontFamily: "Poppins_600SemiBold",
    color: "#166534",
    letterSpacing: 0.5,
  },
  appliedDiscount: {
    fontFamily: "Poppins_400Regular",
    color: "#15803D",
    marginTop: 1,
  },
  removeButton: {
    padding: 4,
  },
})
