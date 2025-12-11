import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { ValidatedCoupon, validateCoupon } from "@/src/api/coupon"
import AppColors from "@/src/constants/Colors"

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

  // Applied coupon display
  if (appliedCoupon) {
    return (
      <View style={styles.appliedContainer}>
        <View style={styles.appliedContent}>
          <View style={styles.appliedIconContainer}>
            <Ionicons name="pricetag" size={18} color="#16A34A" />
          </View>
          <View style={styles.appliedTextContainer}>
            <Text style={styles.appliedCode}>{appliedCoupon.code}</Text>
            <Text style={styles.appliedDiscount}>
              {appliedCoupon.discountType === "percentage"
                ? `${appliedCoupon.discountValue}% off`
                : `$${appliedCoupon.discountValue} off`}{" "}
              • Saving ${appliedCoupon.discountAmount.toFixed(2)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.removeButton}
        >
          <Ionicons name="close-circle" size={22} color={AppColors.gray[400]} />
        </TouchableOpacity>
      </View>
    )
  }

  // Collapsed state - just show "Add Coupon" button
  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={styles.addCouponButton}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.7}
      >
        <View style={styles.addCouponLeft}>
          <Ionicons
            name="pricetag-outline"
            size={20}
            color={AppColors.primary[600]}
          />
          <Text style={styles.addCouponText}>Add Promo Code</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={AppColors.gray[400]}
        />
      </TouchableOpacity>
    )
  }

  // Expanded input state
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Promo Code</Text>
        <TouchableOpacity
          onPress={() => {
            setIsExpanded(false)
            setError(null)
            setCode("")
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={AppColors.gray[400]} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, error && styles.inputError]}>
          <Ionicons
            name="pricetag-outline"
            size={18}
            color={error ? AppColors.error : AppColors.gray[400]}
          />
          <TextInput
            style={styles.input}
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
            <TouchableOpacity
              onPress={() => setCode("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={AppColors.gray[400]}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.applyButton,
            (!code.trim() || isValidating) && styles.applyButtonDisabled,
          ]}
          onPress={handleApply}
          disabled={!code.trim() || isValidating}
          activeOpacity={0.8}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* App exclusive hint */}
      <View style={styles.hintContainer}>
        <Ionicons
          name="phone-portrait-outline"
          size={14}
          color={AppColors.primary[500]}
        />
        <Text style={styles.hintText}>
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
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
    borderStyle: "dashed",
  },
  addCouponLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addCouponText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
  },

  // Expanded container
  container: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 12,
    gap: 8,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    paddingVertical: 12,
    letterSpacing: 1,
  },
  applyButton: {
    backgroundColor: AppColors.primary[500],
    borderRadius: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  applyButtonDisabled: {
    backgroundColor: AppColors.gray[300],
  },
  applyButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 8,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  hintText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  appliedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  appliedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  appliedTextContainer: {
    flex: 1,
  },
  appliedCode: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#166534",
    letterSpacing: 0.5,
  },
  appliedDiscount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#15803D",
    marginTop: 1,
  },
  removeButton: {
    padding: 4,
  },
})
