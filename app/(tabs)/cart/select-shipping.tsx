import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { getUserAddresses } from "@/src/api/addresses"
import { calculateShippingCosts } from "@/src/api/shipping"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import {
  getFreeShippingOptions,
  qualifiesForFreeShipping,
  SHIPPING_CONFIG,
} from "@/src/constants/shipping"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Address, AUSTRALIAN_STATES } from "@/src/types/address"

interface ShippingOption {
  serviceCode: string
  serviceName: string
  cost: number
  deliveryTime: string
}

const normalizeCountry = (country?: string): string => {
  if (!country) return "AU"
  const normalized = country.toLowerCase().trim()
  if (normalized === "australia" || normalized === "au") return "AU"
  return "AU"
}

export default function SelectShippingScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width, height } = useResponsive()
  const { orderData } = useLocalSearchParams()
  const parsedOrderData = useMemo(
    () => JSON.parse(orderData as string),
    [orderData]
  )
  const { token, user } = useAuthStore()

  // Memoized values
  const hasFreeShipping = useMemo(
    () => qualifiesForFreeShipping(parsedOrderData?.subtotal || 0),
    [parsedOrderData?.subtotal]
  )
  const freeShippingOptions = useMemo(() => getFreeShippingOptions(), [])
  const coupon = parsedOrderData?.coupon
  const discountAmount = coupon?.discountAmount || 0

  // Layout configuration
  const useHorizontalLayout = isTablet && isLandscape
  const formMaxWidth = isTablet && !isLandscape ? 600 : undefined

  // Delivery option
  const [deliveryOption, setDeliveryOption] = useState<"delivery" | "pickup">(
    "delivery"
  )

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddressSelector, setShowAddressSelector] = useState(false)
  const [addressSelectorType, setAddressSelectorType] = useState<
    "shipping" | "billing"
  >("shipping")
  const [selectedShippingAddress, setSelectedShippingAddress] =
    useState<Address | null>(null)
  const [selectedBillingAddress, setSelectedBillingAddress] =
    useState<Address | null>(null)

  // Shipping details
  const [shippingDetails, setShippingDetails] = useState({
    name: parsedOrderData?.user?.user_name || "",
    email: parsedOrderData?.user?.email || "",
    phone: parsedOrderData?.user?.phone || "",
    address: {
      line1: parsedOrderData?.user?.shipping_address?.addressLine1 || "",
      line2: parsedOrderData?.user?.shipping_address?.addressLine2 || "",
      city: parsedOrderData?.user?.shipping_address?.city || "",
      state: parsedOrderData?.user?.shipping_address?.state || "",
      country: "AU",
      postal_code: parsedOrderData?.user?.shipping_address?.postCode || "",
    },
  })

  // Billing details
  const [billingDetails, setBillingDetails] = useState({
    name: parsedOrderData?.user?.user_name || "",
    email: parsedOrderData?.user?.email || "",
    phone: parsedOrderData?.user?.phone || "",
    address: {
      line1: parsedOrderData?.user?.shipping_address?.addressLine1 || "",
      line2: parsedOrderData?.user?.shipping_address?.addressLine2 || "",
      city: parsedOrderData?.user?.shipping_address?.city || "",
      state: parsedOrderData?.user?.shipping_address?.state || "",
      country: "AU",
      postal_code: parsedOrderData?.user?.shipping_address?.postCode || "",
    },
  })

  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showStateModal, setShowStateModal] = useState(false)
  const [stateFieldType, setStateFieldType] = useState<"shipping" | "billing">(
    "shipping"
  )

  // Shipping calculator
  const [postcode, setPostcode] = useState(
    parsedOrderData?.user?.shipping_address?.postCode || ""
  )
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [shippingCalculated, setShippingCalculated] = useState(false)

  const includesHeavyItems = useMemo(() => {
    return parsedOrderData?.cart?.some((item: any) => {
      const name = (item?.name || "").toString().toLowerCase()
      const weight = Number(item?.weight) || 0

      return (
        weight >= 5000 &&
        (name.includes("basmati rice") ||
          name.includes("5kg") ||
          name.includes("10kg") ||
          name.includes("20kg"))
      )
    })
  }, [orderData])

  // Calculate total
  const shippingCost =
    deliveryOption === "pickup" ? 0 : selectedShipping?.cost || 0
  const subtotalAfterDiscount = parsedOrderData?.subtotal - discountAmount
  const total = +(subtotalAfterDiscount + shippingCost).toFixed(2)

  useEffect(() => {
    if (hasFreeShipping && deliveryOption === "delivery") {
      setShippingOptions(freeShippingOptions)
      setSelectedShipping(freeShippingOptions[0])
      setShippingCalculated(true)
    }
  }, [hasFreeShipping, deliveryOption, freeShippingOptions])

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!token) {
        setLoadingAddresses(false)
        return
      }

      try {
        const addresses = await getUserAddresses(token)
        setSavedAddresses(addresses)

        const defaultAddress = await addresses.find((a) => a.is_default)
        if (defaultAddress && !shippingDetails.address.line1) {
          applyAddressToShipping(defaultAddress)
          setSelectedShippingAddress(defaultAddress)
        }
      } catch (error) {
        console.error("Error fetching addresses:", error)
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchSavedAddresses()
  }, [token])

  const applyAddressToShipping = useCallback(
    (address: Address) => {
      setShippingDetails({
        name: address.full_name,
        email: address.email || shippingDetails.email || user?.email || "",
        phone: address.phone,
        address: {
          line1: address.line1,
          line2: address.line2 || "",
          city: address.city,
          state: address.state,
          country: "AU",
          postal_code: address.postal_code,
        },
      })
      setSelectedShippingAddress(address)

      if (address.postal_code) {
        setPostcode(address.postal_code)
        setShippingCalculated(false)
        setSelectedShipping(null)
      }

      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.name
        delete newErrors.email
        delete newErrors.phone
        delete newErrors.address_line1
        delete newErrors.city
        delete newErrors.postal_code
        return newErrors
      })
    },
    [shippingDetails.email, user?.email, hasFreeShipping]
  )

  const applyAddressToBilling = useCallback(
    (address: Address) => {
      setBillingDetails({
        name: address.full_name,
        email: address.email || billingDetails.email || user?.email || "",
        phone: address.phone,
        address: {
          line1: address.line1,
          line2: address.line2 || "",
          city: address.city,
          state: address.state,
          country: "AU",
          postal_code: address.postal_code,
        },
      })
      setSelectedBillingAddress(address)
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.billing_name
        delete newErrors.billing_email
        delete newErrors.billing_phone
        delete newErrors.billing_address
        delete newErrors.billing_city
        delete newErrors.billing_postal_code
        return newErrors
      })
    },
    [billingDetails.email, user?.email]
  )

  const openAddressSelector = (type: "shipping" | "billing") => {
    setAddressSelectorType(type)
    setShowAddressSelector(true)
  }

  const handleAddressSelect = (address: Address) => {
    if (addressSelectorType === "shipping") {
      applyAddressToShipping(address)
      Toast.show({
        type: "success",
        text1: "Address Applied",
        text2: `Using ${address.label || "saved"} address for shipping`,
        visibilityTime: 2000,
      })
    } else {
      applyAddressToBilling(address)
      setSameAsShipping(false)
      Toast.show({
        type: "success",
        text1: "Address Applied",
        text2: `Using ${address.label || "saved"} address for billing`,
        visibilityTime: 2000,
      })
    }
    setShowAddressSelector(false)
  }

  const handleAddNewAddress = () => {
    setShowAddressSelector(false)
    router.push("/(tabs)/more/address/add")
  }

  const handleShippingFieldChange = useCallback(
    (field: string, value: string) => {
      setSelectedShippingAddress(null)

      if (field.startsWith("address.")) {
        const addressField = field.replace("address.", "")
        setShippingDetails((prev) => ({
          ...prev,
          address: { ...prev.address, [addressField]: value, country: "AU" },
        }))

        if (addressField === "postal_code") {
          setPostcode(value)
          if (!hasFreeShipping) {
            setShippingCalculated(false)
            setSelectedShipping(null)
          }
        }
      } else {
        setShippingDetails((prev) => ({ ...prev, [field]: value }))
      }
    },
    [hasFreeShipping]
  )

  const handleBillingFieldChange = useCallback(
    (field: string, value: string) => {
      setSelectedBillingAddress(null)

      if (field.startsWith("address.")) {
        const addressField = field.replace("address.", "")
        setBillingDetails((prev) => ({
          ...prev,
          address: { ...prev.address, [addressField]: value, country: "AU" },
        }))
      } else {
        setBillingDetails((prev) => ({ ...prev, [field]: value }))
      }
    },
    []
  )

  const calculateShipping = async () => {
    if (!postcode || !/^\d{4}$/.test(postcode)) {
      Alert.alert(
        "Invalid Postcode",
        "Please enter a valid 4-digit Australian postcode"
      )
      return
    }

    setLoadingShipping(true)
    try {
      const { data } = await calculateShippingCosts({
        toPostcode: postcode,
        basketItems: parsedOrderData.cart,
      })

      const options = data?.shippingOptions || []

      setShippingOptions(options)
      setShippingCalculated(true)
    } catch (error) {
      console.error("Shipping calculation error:", error)
      Alert.alert("Error", "Unable to calculate shipping. Please try again.")
    } finally {
      setLoadingShipping(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!shippingDetails.name.trim()) newErrors.name = "Name is required"
    if (!shippingDetails.email.trim()) newErrors.email = "Email is required"
    if (!shippingDetails.phone.trim()) newErrors.phone = "Phone is required"

    if (deliveryOption === "delivery") {
      if (!shippingDetails.address.line1.trim()) {
        newErrors.address_line1 = "Address is required"
      }
      if (!shippingDetails.address.city.trim()) {
        newErrors.city = "City is required"
      }
      if (!shippingDetails.address.postal_code.trim()) {
        newErrors.postal_code = "Postal code is required"
      }
      if (!selectedShipping) {
        newErrors.shipping = "Please select a shipping option"
      }

      if (!sameAsShipping) {
        if (!billingDetails.name.trim()) {
          newErrors.billing_name = "Billing name is required"
        }
        if (!billingDetails.email.trim()) {
          newErrors.billing_email = "Billing email is required"
        }
        if (!billingDetails.phone.trim()) {
          newErrors.billing_phone = "Billing phone is required"
        }
        if (!billingDetails.address.line1.trim()) {
          newErrors.billing_address = "Billing address is required"
        }
        if (!billingDetails.address.city.trim()) {
          newErrors.billing_city = "Billing city is required"
        }
        if (!billingDetails.address.postal_code.trim()) {
          newErrors.billing_postal_code = "Billing postal code is required"
        }
      }
    }

    if (deliveryOption === "pickup") {
      if (!billingDetails.name.trim()) {
        newErrors.billing_name = "Billing name is required"
      }
      if (!billingDetails.email.trim()) {
        newErrors.billing_email = "Billing email is required"
      }
      if (!billingDetails.phone.trim()) {
        newErrors.billing_phone = "Billing phone is required"
      }
      if (!billingDetails.address.line1.trim()) {
        newErrors.billing_address = "Billing address is required"
      }
      if (!billingDetails.address.city.trim()) {
        newErrors.billing_city = "Billing city is required"
      }
      if (!billingDetails.address.postal_code.trim()) {
        newErrors.billing_postal_code = "Billing postal code is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const proceedToPayment = () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill in all required fields")
      return
    }

    const normalizedShippingDetails =
      deliveryOption === "delivery"
        ? {
            ...shippingDetails,
            address: {
              ...shippingDetails.address,
              country: "AU",
            },
          }
        : null

    const normalizedBillingDetails =
      deliveryOption === "delivery" && sameAsShipping
        ? normalizedShippingDetails
        : {
            ...billingDetails,
            address: {
              ...billingDetails.address,
              country: "AU",
            },
          }

    const finalOrderData = {
      ...parsedOrderData,
      selectedShipping,
      localPickup: deliveryOption === "pickup",
      shippingCost,
      coupon,
      discountAmount,
      totalAmount: total,
      customerName: shippingDetails.name,
      customerEmail: shippingDetails.email,
      customerPhone: shippingDetails.phone,
      shippingDetails: normalizedShippingDetails,
      billingDetails: normalizedBillingDetails,
    }

    router.push({
      pathname: "/(tabs)/cart/payment",
      params: { orderData: JSON.stringify(finalOrderData) },
    })
  }

  const handleStateSelect = (stateValue: string) => {
    if (stateFieldType === "shipping") {
      handleShippingFieldChange("address.state", stateValue)
    } else {
      handleBillingFieldChange("address.state", stateValue)
    }
    setShowStateModal(false)
  }

  const openStateModal = (type: "shipping" | "billing") => {
    setStateFieldType(type)
    setShowStateModal(true)
  }

  const formatAddressDisplay = (address: Address): string => {
    return [address.line1, address.city, address.state, address.postal_code]
      .filter(Boolean)
      .join(", ")
  }

  const getLabelIcon = (label?: string): keyof typeof Ionicons.glyphMap => {
    switch (label?.toLowerCase()) {
      case "home":
        return "home-outline"
      case "work":
        return "briefcase-outline"
      case "office":
        return "business-outline"
      default:
        return "location-outline"
    }
  }

  const getFilteredAddresses = (type: "shipping" | "billing"): Address[] => {
    return savedAddresses.filter(
      (addr) => addr.type === type || addr.type === "both"
    )
  }

  // Modal sizing for tablet
  const modalMaxWidth = isTablet ? (isLandscape ? 500 : 450) : undefined
  const modalMaxHeight = isTablet ? height * 0.7 : undefined

  // Reusable input style
  const getInputStyle = (hasError?: boolean) => [
    styles.input,
    {
      paddingHorizontal: isTablet ? 16 : 14,
      paddingVertical: isTablet ? 16 : 14,
      borderRadius: config.cardBorderRadius,
      fontSize: config.bodyFontSize,
      marginBottom: isTablet ? 14 : 12,
    },
    hasError && styles.inputError,
  ]

  // Render billing form
  const renderBillingForm = () => (
    <>
      {savedAddresses.length > 0 && (
        <DebouncedTouchable
          style={[
            styles.savedAddressButton,
            {
              padding: isTablet ? 16 : 14,
              borderRadius: config.cardBorderRadius,
              marginBottom: isTablet ? 18 : 16,
            },
          ]}
          onPress={() => openAddressSelector("billing")}
          activeOpacity={0.7}
        >
          <View style={styles.savedAddressLeft}>
            <View
              style={[
                styles.savedAddressIcon,
                {
                  width: isTablet ? 44 : 40,
                  height: isTablet ? 44 : 40,
                  borderRadius: isTablet ? 12 : 10,
                },
              ]}
            >
              <Ionicons
                name={
                  selectedBillingAddress
                    ? getLabelIcon(selectedBillingAddress.label)
                    : "bookmark-outline"
                }
                size={config.iconSize}
                color={AppColors.primary[600]}
              />
            </View>
            <View style={styles.savedAddressTextContainer}>
              <Text
                style={[
                  styles.savedAddressTitle,
                  { fontSize: config.bodyFontSize },
                ]}
              >
                {selectedBillingAddress
                  ? `${selectedBillingAddress.label || "Saved Address"}`
                  : "Use Saved Address"}
              </Text>
              <Text
                style={[
                  styles.savedAddressSubtitle,
                  { fontSize: config.smallFontSize },
                ]}
                numberOfLines={1}
              >
                {selectedBillingAddress
                  ? formatAddressDisplay(selectedBillingAddress)
                  : "Select from your saved addresses"}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={config.iconSize}
            color={AppColors.gray[400]}
          />
        </DebouncedTouchable>
      )}

      <TextInput
        style={getInputStyle(!!errors.billing_name)}
        placeholder="Full Name *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.name}
        onChangeText={(text) => handleBillingFieldChange("name", text)}
      />
      {errors.billing_name && (
        <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
          {errors.billing_name}
        </Text>
      )}

      <TextInput
        style={getInputStyle(!!errors.billing_email)}
        placeholder="Email *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.email}
        onChangeText={(text) => handleBillingFieldChange("email", text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.billing_email && (
        <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
          {errors.billing_email}
        </Text>
      )}

      <TextInput
        style={getInputStyle(!!errors.billing_phone)}
        placeholder="Phone *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.phone}
        onChangeText={(text) => handleBillingFieldChange("phone", text)}
        keyboardType="phone-pad"
      />
      {errors.billing_phone && (
        <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
          {errors.billing_phone}
        </Text>
      )}

      <TextInput
        style={getInputStyle(!!errors.billing_address)}
        placeholder="Street Address *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.address.line1}
        onChangeText={(text) => handleBillingFieldChange("address.line1", text)}
      />
      {errors.billing_address && (
        <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
          {errors.billing_address}
        </Text>
      )}

      <TextInput
        style={getInputStyle()}
        placeholder="Apartment, suite, etc. (optional)"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.address.line2}
        onChangeText={(text) => handleBillingFieldChange("address.line2", text)}
      />

      <View style={[styles.row, { gap: isTablet ? 14 : 12 }]}>
        <TextInput
          style={[getInputStyle(!!errors.billing_city), styles.halfInput]}
          placeholder="City *"
          placeholderTextColor={AppColors.gray[400]}
          value={billingDetails.address.city}
          onChangeText={(text) =>
            handleBillingFieldChange("address.city", text)
          }
        />
        <DebouncedTouchable
          style={[getInputStyle(), styles.halfInput, styles.selectInput]}
          onPress={() => openStateModal("billing")}
        >
          <Text
            style={[
              styles.selectText,
              { fontSize: config.bodyFontSize },
              !billingDetails.address.state && styles.selectPlaceholder,
            ]}
          >
            {billingDetails.address.state || "State"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={config.iconSize}
            color={AppColors.gray[400]}
          />
        </DebouncedTouchable>
      </View>
      {errors.billing_city && (
        <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
          {errors.billing_city}
        </Text>
      )}

      <TextInput
        style={getInputStyle(!!errors.billing_postal_code)}
        placeholder="Postal Code *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.address.postal_code}
        onChangeText={(text) =>
          handleBillingFieldChange("address.postal_code", text)
        }
        keyboardType="numeric"
        maxLength={4}
      />
      {errors.billing_postal_code && (
        <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
          {errors.billing_postal_code}
        </Text>
      )}
    </>
  )

  // Render order summary
  const renderOrderSummary = () => (
    <View style={[styles.section, { marginBottom: isTablet ? 20 : 16 }]}>
      <Text style={[styles.sectionTitle, { fontSize: config.titleFontSize }]}>
        Order Summary
      </Text>
      <View
        style={[
          styles.summaryCard,
          {
            padding: isTablet ? 20 : 16,
            borderRadius: config.cardBorderRadius,
          },
        ]}
      >
        <View style={[styles.summaryRow, { marginBottom: isTablet ? 10 : 8 }]}>
          <Text
            style={[styles.summaryLabel, { fontSize: config.bodyFontSize }]}
          >
            Subtotal ({parsedOrderData?.cart?.length} items)
          </Text>
          <Text
            style={[styles.summaryValue, { fontSize: config.bodyFontSize }]}
          >
            ${parsedOrderData?.subtotal?.toFixed(2)}
          </Text>
        </View>

        {coupon && discountAmount > 0 && (
          <View
            style={[styles.summaryRow, { marginBottom: isTablet ? 10 : 8 }]}
          >
            <View style={styles.discountLabelRow}>
              <Ionicons
                name="pricetag"
                size={config.iconSizeSmall}
                color="#16A34A"
              />
              <Text
                style={[
                  styles.discountLabel,
                  { fontSize: config.bodyFontSize },
                ]}
              >
                Discount ({coupon.code})
              </Text>
            </View>
            <Text
              style={[styles.discountValue, { fontSize: config.bodyFontSize }]}
            >
              -${discountAmount.toFixed(2)}
            </Text>
          </View>
        )}

        {shippingCalculated &&
          selectedShipping &&
          deliveryOption !== "pickup" && (
            <View
              style={[styles.summaryRow, { marginBottom: isTablet ? 10 : 8 }]}
            >
              <Text
                style={[styles.summaryLabel, { fontSize: config.bodyFontSize }]}
              >
                Shipping
              </Text>
              <Text
                style={[styles.summaryValue, { fontSize: config.bodyFontSize }]}
              >
                {selectedShipping?.cost > 0
                  ? `$${selectedShipping.cost.toFixed(2)}`
                  : "FREE"}
              </Text>
            </View>
          )}

        <View
          style={[styles.divider, { marginVertical: isTablet ? 16 : 12 }]}
        />

        <View style={styles.summaryRow}>
          <Text style={[styles.totalLabel, { fontSize: isTablet ? 18 : 16 }]}>
            Total
          </Text>
          <Text style={[styles.totalValue, { fontSize: isTablet ? 24 : 20 }]}>
            ${total.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  )

  // Main form content
  const renderFormContent = () => (
    <>
      {/* Delivery Options */}
      <View style={[styles.section, { marginBottom: isTablet ? 20 : 16 }]}>
        <Text style={[styles.sectionTitle, { fontSize: config.titleFontSize }]}>
          Delivery Method
        </Text>

        {/* Home Delivery */}
        <DebouncedTouchable
          style={[
            styles.optionCard,
            {
              padding: isTablet ? 18 : 16,
              borderRadius: config.cardBorderRadius,
              marginBottom: isTablet ? 12 : 10,
            },
            deliveryOption === "delivery" && styles.optionCardSelected,
          ]}
          onPress={() => setDeliveryOption("delivery")}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <Ionicons
              name="car-outline"
              size={config.iconSizeLarge}
              color={AppColors.primary[500]}
            />
            <View
              style={[styles.optionText, { marginLeft: isTablet ? 14 : 12 }]}
            >
              <Text
                style={[styles.optionTitle, { fontSize: config.bodyFontSize }]}
              >
                Home Delivery
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  { fontSize: config.bodyFontSize - 1 },
                ]}
              >
                1-5 business days
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.radio,
              { width: isTablet ? 24 : 22, height: isTablet ? 24 : 22 },
              deliveryOption === "delivery" && styles.radioSelected,
            ]}
          >
            {deliveryOption === "delivery" && (
              <View
                style={[
                  styles.radioInner,
                  { width: isTablet ? 14 : 12, height: isTablet ? 14 : 12 },
                ]}
              />
            )}
          </View>
        </DebouncedTouchable>

        {/* Local Pickup */}
        <DebouncedTouchable
          style={[
            styles.optionCard,
            {
              padding: isTablet ? 18 : 16,
              borderRadius: config.cardBorderRadius,
            },
            deliveryOption === "pickup" && styles.optionCardSelected,
          ]}
          onPress={() => setDeliveryOption("pickup")}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <Ionicons
              name="storefront-outline"
              size={config.iconSizeLarge}
              color={AppColors.primary[500]}
            />
            <View
              style={[styles.optionText, { marginLeft: isTablet ? 14 : 12 }]}
            >
              <Text
                style={[styles.optionTitle, { fontSize: config.bodyFontSize }]}
              >
                Local Pickup
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  { fontSize: config.bodyFontSize - 1 },
                ]}
              >
                8 Lethbridge Road, Austral, NSW 2179
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.radio,
              { width: isTablet ? 24 : 22, height: isTablet ? 24 : 22 },
              deliveryOption === "pickup" && styles.radioSelected,
            ]}
          >
            {deliveryOption === "pickup" && (
              <View
                style={[
                  styles.radioInner,
                  { width: isTablet ? 14 : 12, height: isTablet ? 14 : 12 },
                ]}
              />
            )}
          </View>
        </DebouncedTouchable>
      </View>

      {/* Heavy items warning */}
      {includesHeavyItems && (
        <View
          style={[
            styles.warningContainer,
            {
              padding: isTablet ? 14 : 12,
              borderRadius: isTablet ? 10 : 8,
              marginBottom: isTablet ? 20 : 16,
            },
          ]}
        >
          <Ionicons
            name="warning-outline"
            size={config.iconSize}
            color={AppColors.error}
          />
          <Text
            style={[styles.warningText, { fontSize: config.bodyFontSize - 1 }]}
          >
            You have item(s) in your basket that are not available for delivery!
          </Text>
        </View>
      )}

      {/* Shipping Calculator */}
      {deliveryOption === "delivery" && !includesHeavyItems && (
        <View style={[styles.section, { marginBottom: isTablet ? 20 : 16 }]}>
          <Text
            style={[styles.sectionTitle, { fontSize: config.titleFontSize }]}
          >
            Shipping
          </Text>

          {hasFreeShipping ? (
            <View
              style={[
                styles.freeShippingCard,
                {
                  padding: isTablet ? 18 : 16,
                  borderRadius: config.cardBorderRadius,
                },
              ]}
            >
              <View style={styles.freeShippingHeader}>
                <View
                  style={[
                    styles.freeShippingIconContainer,
                    {
                      width: isTablet ? 56 : 48,
                      height: isTablet ? 56 : 48,
                      borderRadius: isTablet ? 28 : 24,
                    },
                  ]}
                >
                  <Ionicons
                    name="gift"
                    size={config.iconSizeLarge}
                    color="#16A34A"
                  />
                </View>
                <View style={styles.freeShippingTextContainer}>
                  <Text
                    style={[
                      styles.freeShippingTitle,
                      { fontSize: isTablet ? 18 : 16 },
                    ]}
                  >
                    🎉 Free Standard Shipping Unlocked!
                  </Text>
                  <Text
                    style={[
                      styles.freeShippingSubtitle,
                      { fontSize: config.bodyFontSize - 1 },
                    ]}
                  >
                    Orders over ${SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD}{" "}
                    qualify for free standard shipping
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.shippingOptionsContainer,
                  { marginTop: isTablet ? 18 : 16, gap: isTablet ? 12 : 10 },
                ]}
              >
                {freeShippingOptions.map((option) => (
                  <DebouncedTouchable
                    key={option.serviceCode}
                    style={[
                      styles.shippingOption,
                      {
                        padding: isTablet ? 16 : 14,
                        borderRadius: isTablet ? 12 : 10,
                      },
                      selectedShipping?.serviceCode === option.serviceCode &&
                        styles.shippingOptionSelected,
                      option.cost === 0 && styles.shippingOptionFree,
                    ]}
                    onPress={() => setSelectedShipping(option)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.shippingOptionLeft,
                        { gap: isTablet ? 14 : 12 },
                      ]}
                    >
                      <View
                        style={[
                          styles.radio,
                          {
                            width: isTablet ? 24 : 22,
                            height: isTablet ? 24 : 22,
                          },
                          selectedShipping?.serviceCode ===
                            option.serviceCode && styles.radioSelected,
                        ]}
                      >
                        {selectedShipping?.serviceCode ===
                          option.serviceCode && (
                          <View
                            style={[
                              styles.radioInner,
                              {
                                width: isTablet ? 14 : 12,
                                height: isTablet ? 14 : 12,
                              },
                            ]}
                          />
                        )}
                      </View>
                      <View style={styles.shippingOptionInfo}>
                        <View
                          style={[
                            styles.shippingOptionNameRow,
                            { gap: isTablet ? 10 : 8 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.shippingOptionName,
                              { fontSize: config.bodyFontSize },
                            ]}
                          >
                            {option.serviceName}
                          </Text>
                          {option.cost === 0 && (
                            <View style={styles.freeBadge}>
                              <Text
                                style={[
                                  styles.freeBadgeText,
                                  { fontSize: isTablet ? 11 : 10 },
                                ]}
                              >
                                FREE
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.shippingOptionDelivery,
                            { fontSize: config.smallFontSize },
                          ]}
                        >
                          {option.deliveryTime}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.shippingOptionPrice,
                        { fontSize: isTablet ? 18 : 16 },
                        option.cost === 0 && styles.shippingOptionPriceFree,
                      ]}
                    >
                      {option.cost === 0
                        ? "FREE"
                        : `$${option.cost.toFixed(2)}`}
                    </Text>
                  </DebouncedTouchable>
                ))}
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.calculatorCard,
                {
                  padding: isTablet ? 18 : 16,
                  borderRadius: config.cardBorderRadius,
                },
              ]}
            >
              <Text
                style={[
                  styles.calculatorDescription,
                  { fontSize: config.bodyFontSize },
                ]}
              >
                Enter your postcode to see available delivery options
              </Text>
              <View style={styles.calculatorRow}>
                <TextInput
                  style={[
                    styles.postcodeInput,
                    {
                      paddingHorizontal: isTablet ? 16 : 14,
                      paddingVertical: isTablet ? 14 : 12,
                      borderRadius: isTablet ? 10 : 8,
                      fontSize: config.bodyFontSize,
                    },
                  ]}
                  placeholder="Enter Postcode"
                  placeholderTextColor={AppColors.gray[400]}
                  value={postcode}
                  onChangeText={(text) => {
                    setPostcode(text)
                    setShippingCalculated(false)
                    setSelectedShipping(null)
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Button
                  title={loadingShipping ? "..." : "Calculate"}
                  onPress={calculateShipping}
                  disabled={loadingShipping}
                  size="small"
                  containerStyles="ml-2"
                />
              </View>

              {loadingShipping && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={AppColors.primary[500]} />
                  <Text
                    style={[
                      styles.loadingText,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    Calculating...
                  </Text>
                </View>
              )}

              {shippingCalculated && shippingOptions.length > 0 && (
                <View
                  style={[
                    styles.shippingOptionsContainer,
                    { marginTop: isTablet ? 18 : 16, gap: isTablet ? 12 : 10 },
                  ]}
                >
                  {shippingOptions.map((option) => (
                    <DebouncedTouchable
                      key={option.serviceCode}
                      style={[
                        styles.shippingOption,
                        {
                          padding: isTablet ? 16 : 14,
                          borderRadius: isTablet ? 12 : 10,
                        },
                        selectedShipping?.serviceCode === option.serviceCode &&
                          styles.shippingOptionSelected,
                      ]}
                      onPress={() => setSelectedShipping(option)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.shippingOptionInfo}>
                        <Text
                          style={[
                            styles.shippingOptionName,
                            { fontSize: config.bodyFontSize },
                          ]}
                        >
                          {option.serviceName}
                        </Text>
                        <Text
                          style={[
                            styles.shippingOptionDelivery,
                            { fontSize: config.smallFontSize },
                          ]}
                        >
                          {option.deliveryTime}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.shippingOptionRight,
                          { gap: isTablet ? 10 : 8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.shippingOptionPrice,
                            { fontSize: isTablet ? 18 : 16 },
                          ]}
                        >
                          ${option.cost.toFixed(2)}
                        </Text>
                        <View
                          style={[
                            styles.radio,
                            {
                              width: isTablet ? 24 : 22,
                              height: isTablet ? 24 : 22,
                            },
                            selectedShipping?.serviceCode ===
                              option.serviceCode && styles.radioSelected,
                          ]}
                        >
                          {selectedShipping?.serviceCode ===
                            option.serviceCode && (
                            <View
                              style={[
                                styles.radioInner,
                                {
                                  width: isTablet ? 14 : 12,
                                  height: isTablet ? 14 : 12,
                                },
                              ]}
                            />
                          )}
                        </View>
                      </View>
                    </DebouncedTouchable>
                  ))}
                </View>
              )}
              {errors.shipping && (
                <Text
                  style={[
                    styles.errorText,
                    { fontSize: config.smallFontSize, marginTop: 8 },
                  ]}
                >
                  {errors.shipping}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Contact Information */}
      <View style={[styles.section, { marginBottom: isTablet ? 20 : 16 }]}>
        <Text style={[styles.sectionTitle, { fontSize: config.titleFontSize }]}>
          Contact Information
        </Text>
        <TextInput
          style={getInputStyle(!!errors.name)}
          placeholder="Full Name *"
          placeholderTextColor={AppColors.gray[400]}
          value={shippingDetails.name}
          onChangeText={(text) => handleShippingFieldChange("name", text)}
        />
        {errors.name && (
          <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
            {errors.name}
          </Text>
        )}

        <TextInput
          style={getInputStyle(!!errors.email)}
          placeholder="Email *"
          placeholderTextColor={AppColors.gray[400]}
          value={shippingDetails.email}
          onChangeText={(text) => handleShippingFieldChange("email", text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && (
          <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
            {errors.email}
          </Text>
        )}

        <TextInput
          style={getInputStyle(!!errors.phone)}
          placeholder="Phone *"
          placeholderTextColor={AppColors.gray[400]}
          value={shippingDetails.phone}
          onChangeText={(text) => handleShippingFieldChange("phone", text)}
          keyboardType="phone-pad"
        />
        {errors.phone && (
          <Text style={[styles.errorText, { fontSize: config.smallFontSize }]}>
            {errors.phone}
          </Text>
        )}
      </View>

      {/* Billing Address for Pickup */}
      {deliveryOption === "pickup" && (
        <View style={[styles.section, { marginBottom: isTablet ? 20 : 16 }]}>
          <Text
            style={[styles.sectionTitle, { fontSize: config.titleFontSize }]}
          >
            Billing Information
          </Text>
          {renderBillingForm()}
        </View>
      )}

      {/* Shipping Address */}
      {deliveryOption === "delivery" && (
        <View style={[styles.section, { marginBottom: isTablet ? 20 : 16 }]}>
          <Text
            style={[styles.sectionTitle, { fontSize: config.titleFontSize }]}
          >
            Shipping Address
          </Text>

          {savedAddresses.length > 0 && (
            <DebouncedTouchable
              style={[
                styles.savedAddressButton,
                {
                  padding: isTablet ? 16 : 14,
                  borderRadius: config.cardBorderRadius,
                  marginBottom: isTablet ? 18 : 16,
                },
              ]}
              onPress={() => openAddressSelector("shipping")}
              activeOpacity={0.7}
            >
              <View style={styles.savedAddressLeft}>
                <View
                  style={[
                    styles.savedAddressIcon,
                    {
                      width: isTablet ? 44 : 40,
                      height: isTablet ? 44 : 40,
                      borderRadius: isTablet ? 12 : 10,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      selectedShippingAddress
                        ? getLabelIcon(selectedShippingAddress.label)
                        : "bookmark-outline"
                    }
                    size={config.iconSize}
                    color={AppColors.primary[600]}
                  />
                </View>
                <View style={styles.savedAddressTextContainer}>
                  <Text
                    style={[
                      styles.savedAddressTitle,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    {selectedShippingAddress
                      ? `${selectedShippingAddress.label || "Saved Address"}`
                      : "Use Saved Address"}
                  </Text>
                  <Text
                    style={[
                      styles.savedAddressSubtitle,
                      { fontSize: config.smallFontSize },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedShippingAddress
                      ? formatAddressDisplay(selectedShippingAddress)
                      : "Select from your saved addresses"}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={config.iconSize}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>
          )}

          <TextInput
            style={getInputStyle(!!errors.address_line1)}
            placeholder="Street Address *"
            placeholderTextColor={AppColors.gray[400]}
            value={shippingDetails.address.line1}
            onChangeText={(text) =>
              handleShippingFieldChange("address.line1", text)
            }
          />
          {errors.address_line1 && (
            <Text
              style={[styles.errorText, { fontSize: config.smallFontSize }]}
            >
              {errors.address_line1}
            </Text>
          )}

          <TextInput
            style={getInputStyle()}
            placeholder="Apartment, suite, etc. (optional)"
            placeholderTextColor={AppColors.gray[400]}
            value={shippingDetails.address.line2}
            onChangeText={(text) =>
              handleShippingFieldChange("address.line2", text)
            }
          />

          <View style={[styles.row, { gap: isTablet ? 14 : 12 }]}>
            <TextInput
              style={[getInputStyle(!!errors.city), styles.halfInput]}
              placeholder="City *"
              placeholderTextColor={AppColors.gray[400]}
              value={shippingDetails.address.city}
              onChangeText={(text) =>
                handleShippingFieldChange("address.city", text)
              }
            />
            <DebouncedTouchable
              style={[getInputStyle(), styles.halfInput, styles.selectInput]}
              onPress={() => openStateModal("shipping")}
            >
              <Text
                style={[
                  styles.selectText,
                  { fontSize: config.bodyFontSize },
                  !shippingDetails.address.state && styles.selectPlaceholder,
                ]}
              >
                {shippingDetails.address.state || "State"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={config.iconSize}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>
          </View>

          <TextInput
            style={getInputStyle(!!errors.postal_code)}
            placeholder="Postal Code *"
            placeholderTextColor={AppColors.gray[400]}
            value={shippingDetails.address.postal_code}
            onChangeText={(text) =>
              handleShippingFieldChange("address.postal_code", text)
            }
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Same as shipping checkbox */}
      {deliveryOption === "delivery" && (
        <DebouncedTouchable
          style={[styles.checkboxRow, { marginBottom: isTablet ? 28 : 24 }]}
          onPress={() => setSameAsShipping(!sameAsShipping)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {
                width: isTablet ? 24 : 22,
                height: isTablet ? 24 : 22,
                borderRadius: isTablet ? 7 : 6,
              },
              sameAsShipping && styles.checkboxChecked,
            ]}
          >
            {sameAsShipping && (
              <Ionicons
                name="checkmark"
                size={isTablet ? 16 : 14}
                color="white"
              />
            )}
          </View>
          <Text
            style={[styles.checkboxLabel, { fontSize: config.bodyFontSize }]}
          >
            Billing address same as shipping
          </Text>
        </DebouncedTouchable>
      )}

      {/* Billing Address Form */}
      {deliveryOption === "delivery" && !sameAsShipping && (
        <View style={[styles.section, { marginBottom: isTablet ? 20 : 16 }]}>
          <Text
            style={[styles.sectionTitle, { fontSize: config.titleFontSize }]}
          >
            Billing Address
          </Text>
          {renderBillingForm()}
        </View>
      )}

      {/* Order Summary - Only in vertical layout */}
      {!useHorizontalLayout && renderOrderSummary()}
    </>
  )

  return (
    <Wrapper style={styles.container}>
      {useHorizontalLayout ? (
        // Tablet Landscape: Side-by-side layout
        <View style={styles.horizontalContainer}>
          <ScrollView
            style={styles.formColumn}
            contentContainerStyle={[
              styles.scrollContent,
              { padding: config.horizontalPadding + 4 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderFormContent()}
          </ScrollView>

          <View style={styles.summaryColumn}>
            <ScrollView
              contentContainerStyle={{
                padding: config.horizontalPadding,
              }}
              showsVerticalScrollIndicator={false}
            >
              {renderOrderSummary()}
            </ScrollView>

            <View
              style={[
                styles.footer,
                {
                  padding: config.horizontalPadding,
                  paddingBottom: Platform.OS === "ios" ? 24 : 20,
                },
              ]}
            >
              <Button
                disabled={deliveryOption === "delivery" && includesHeavyItems}
                title="Continue to Payment"
                onPress={proceedToPayment}
                icon={
                  <Ionicons
                    name="arrow-forward"
                    size={config.iconSize}
                    color="white"
                  />
                }
              />
            </View>
          </View>
        </View>
      ) : (
        // Phone & Tablet Portrait: Vertical layout
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                padding: config.horizontalPadding + 4,
                maxWidth: formMaxWidth,
                alignSelf: formMaxWidth ? "center" : undefined,
                width: formMaxWidth ? "100%" : undefined,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderFormContent()}
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                padding: config.horizontalPadding + 4,
                paddingBottom:
                  Platform.OS === "ios"
                    ? isTablet
                      ? 20
                      : 24
                    : isTablet
                    ? 20
                    : 16,
              },
            ]}
          >
            <Button
              disabled={deliveryOption === "delivery" && includesHeavyItems}
              title="Continue to Payment"
              onPress={proceedToPayment}
              icon={
                <Ionicons
                  name="arrow-forward"
                  size={config.iconSize}
                  color="white"
                />
              }
            />
          </View>
        </>
      )}

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                maxWidth: modalMaxWidth,
                alignSelf: modalMaxWidth ? "center" : undefined,
                width: modalMaxWidth ? "100%" : undefined,
                maxHeight: isTablet ? "60%" : "60%",
                borderRadius: isTablet ? 20 : 20,
                ...(isTablet && {
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                  marginBottom: 40,
                }),
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { padding: config.horizontalPadding },
              ]}
            >
              <Text
                style={[styles.modalTitle, { fontSize: config.titleFontSize }]}
              >
                Select State
              </Text>
              <DebouncedTouchable onPress={() => setShowStateModal(false)}>
                <Ionicons
                  name="close"
                  size={config.iconSizeLarge}
                  color={AppColors.text.primary}
                />
              </DebouncedTouchable>
            </View>
            <ScrollView>
              {AUSTRALIAN_STATES.map((state) => (
                <DebouncedTouchable
                  key={state.value}
                  style={[styles.stateOption, { padding: isTablet ? 18 : 16 }]}
                  onPress={() => handleStateSelect(state.value)}
                >
                  <Text
                    style={[
                      styles.stateLabel,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    {state.label}
                  </Text>
                  <Text
                    style={[
                      styles.stateValue,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    {state.value}
                  </Text>
                </DebouncedTouchable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Address Selector Modal */}
      <Modal
        visible={showAddressSelector}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddressSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.addressModalContent,
              {
                maxWidth: modalMaxWidth,
                alignSelf: modalMaxWidth ? "center" : undefined,
                width: modalMaxWidth ? "100%" : undefined,
                maxHeight: isTablet ? "80%" : "80%",
                borderRadius: isTablet ? 20 : 20,
                ...(isTablet && {
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                  marginBottom: 40,
                }),
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { padding: config.horizontalPadding },
              ]}
            >
              <Text
                style={[styles.modalTitle, { fontSize: config.titleFontSize }]}
              >
                Select{" "}
                {addressSelectorType === "shipping" ? "Shipping" : "Billing"}{" "}
                Address
              </Text>
              <DebouncedTouchable onPress={() => setShowAddressSelector(false)}>
                <Ionicons
                  name="close"
                  size={config.iconSizeLarge}
                  color={AppColors.text.primary}
                />
              </DebouncedTouchable>
            </View>

            {loadingAddresses ? (
              <View style={styles.addressLoadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={AppColors.primary[500]}
                />
                <Text
                  style={[
                    styles.loadingText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  Loading addresses...
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.addressList}
                contentContainerStyle={{ padding: config.horizontalPadding }}
              >
                {getFilteredAddresses(addressSelectorType).map((address) => (
                  <DebouncedTouchable
                    key={address.id}
                    style={[
                      styles.addressCard,
                      {
                        padding: isTablet ? 16 : 14,
                        borderRadius: config.cardBorderRadius,
                        marginBottom: isTablet ? 14 : 12,
                      },
                      (addressSelectorType === "shipping"
                        ? selectedShippingAddress?.id === address.id
                        : selectedBillingAddress?.id === address.id) &&
                        styles.addressCardSelected,
                    ]}
                    onPress={() => handleAddressSelect(address)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addressCardHeader}>
                      <View
                        style={[
                          styles.addressLabelContainer,
                          { gap: isTablet ? 8 : 6 },
                        ]}
                      >
                        <Ionicons
                          name={getLabelIcon(address.label)}
                          size={config.iconSizeSmall}
                          color={AppColors.primary[600]}
                        />
                        <Text
                          style={[
                            styles.addressLabel,
                            { fontSize: config.bodyFontSize },
                          ]}
                        >
                          {address.label || "Address"}
                        </Text>
                        {address.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text
                              style={[
                                styles.defaultBadgeText,
                                { fontSize: isTablet ? 11 : 10 },
                              ]}
                            >
                              Default
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.addressName,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      {address.full_name}
                    </Text>
                    <Text
                      style={[
                        styles.addressPhone,
                        { fontSize: config.bodyFontSize - 1 },
                      ]}
                    >
                      {address.phone}
                    </Text>
                    <Text
                      style={[
                        styles.addressText,
                        {
                          fontSize: config.bodyFontSize - 1,
                          lineHeight: (config.bodyFontSize - 1) * 1.4,
                        },
                      ]}
                    >
                      {formatAddressDisplay(address)}
                    </Text>
                  </DebouncedTouchable>
                ))}

                <DebouncedTouchable
                  style={[
                    styles.addNewAddressCard,
                    {
                      padding: isTablet ? 16 : 14,
                      borderRadius: config.cardBorderRadius,
                    },
                  ]}
                  onPress={handleAddNewAddress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.addNewAddressIcon,
                      {
                        width: isTablet ? 44 : 40,
                        height: isTablet ? 44 : 40,
                        borderRadius: isTablet ? 22 : 20,
                      },
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={config.iconSizeLarge}
                      color={AppColors.primary[600]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.addNewAddressText,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    Add New Address
                  </Text>
                </DebouncedTouchable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  horizontalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  formColumn: {
    flex: 1,
  },
  summaryColumn: {
    width: "40%",
    backgroundColor: AppColors.background.secondary,
    borderLeftWidth: 1,
    borderLeftColor: AppColors.gray[200],
  },
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  savedAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary[50],
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  savedAddressLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  savedAddressIcon: {
    backgroundColor: AppColors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  savedAddressTextContainer: {
    flex: 1,
  },
  savedAddressTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[700],
  },
  savedAddressSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[600],
    marginTop: 2,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.background.primary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  optionCardSelected: {
    borderColor: AppColors.primary[500],
    backgroundColor: AppColors.primary[50],
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  optionSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  radio: {
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: AppColors.primary[500],
  },
  radioInner: {
    borderRadius: 6,
    backgroundColor: AppColors.primary[500],
  },
  calculatorCard: {
    backgroundColor: AppColors.primary[50],
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  calculatorDescription: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginBottom: 12,
  },
  calculatorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  warningText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
  },
  postcodeInput: {
    flex: 1,
    backgroundColor: "white",
    fontFamily: "Poppins_400Regular",
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  shippingOptionsContainer: {},
  shippingOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  shippingOptionSelected: {
    borderColor: AppColors.primary[500],
    backgroundColor: AppColors.primary[50],
  },
  shippingOptionInfo: {
    flex: 1,
  },
  shippingOptionName: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  shippingOptionDelivery: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  shippingOptionRight: {
    alignItems: "flex-end",
  },
  shippingOptionPrice: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.primary[600],
  },
  freeShippingCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  freeShippingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  freeShippingIconContainer: {
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  freeShippingTextContainer: {
    flex: 1,
  },
  freeShippingTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: "#166534",
  },
  freeShippingSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: "#15803D",
    marginTop: 2,
  },
  shippingOptionFree: {
    borderColor: "#BBF7D0",
  },
  shippingOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  shippingOptionNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  shippingOptionPriceFree: {
    color: "#16A34A",
  },
  freeBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#16A34A",
  },
  input: {
    backgroundColor: AppColors.background.secondary,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  inputError: {
    borderColor: AppColors.error,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: -6,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
  },
  halfInput: {
    flex: 1,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  selectPlaceholder: {
    color: AppColors.gray[400],
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: AppColors.primary[500],
    borderColor: AppColors.primary[500],
  },
  checkboxLabel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  summaryCard: {
    backgroundColor: AppColors.background.secondary,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  summaryValue: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[300],
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.primary[600],
  },
  footer: {
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  stateOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  stateLabel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  stateValue: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  addressModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addressLoadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  addressList: {},
  addressCard: {
    backgroundColor: AppColors.background.secondary,
    borderWidth: 2,
    borderColor: "transparent",
  },
  addressCardSelected: {
    borderColor: AppColors.primary[500],
    backgroundColor: AppColors.primary[50],
  },
  addressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addressLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressLabel: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  defaultBadge: {
    backgroundColor: AppColors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontFamily: "Poppins_500Medium",
    color: "white",
    textTransform: "uppercase",
  },
  addressName: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  addressPhone: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  addressText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 4,
  },
  addNewAddressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderWidth: 2,
    borderColor: AppColors.gray[200],
    borderStyle: "dashed",
  },
  addNewAddressIcon: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addNewAddressText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  discountLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountLabel: {
    fontFamily: "Poppins_400Regular",
    color: "#16A34A",
  },
  discountValue: {
    fontFamily: "Poppins_600SemiBold",
    color: "#16A34A",
  },
})
