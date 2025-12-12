import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import { getUserAddresses } from "@/src/api/addresses"
import { calculateShippingCosts } from "@/src/api/shipping"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import {
  getFreeShippingOptions,
  qualifiesForFreeShipping,
  SHIPPING_CONFIG,
} from "@/src/constants/shipping"
import { useAuthStore } from "@/src/store/authStore"
import { Address, AUSTRALIAN_STATES } from "@/src/types/address"
import Toast from "react-native-toast-message"

interface ShippingOption {
  serviceCode: string
  serviceName: string
  cost: number
  deliveryTime: string
}

// Helper to normalize country to AU ISO code
const normalizeCountry = (country?: string): string => {
  if (!country) return "AU"
  const normalized = country.toLowerCase().trim()
  if (normalized === "australia" || normalized === "au") return "AU"
  return "AU" // Default to AU for Australian-only shipping
}

export default function SelectShippingScreen() {
  const router = useRouter()
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

  // Update useEffect to auto-set shipping options when free shipping is unlocked:
  useEffect(() => {
    if (hasFreeShipping && deliveryOption === "delivery") {
      // Auto-populate shipping options and select standard (free) by default
      setShippingOptions(freeShippingOptions)
      setSelectedShipping(freeShippingOptions[0]) // Select standard (free) by default
      setShippingCalculated(true)
    }
  }, [hasFreeShipping, deliveryOption, freeShippingOptions])

  // fetch saved addresses
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!token) {
        setLoadingAddresses(false)
        return
      }

      try {
        const addresses = await getUserAddresses(token)
        setSavedAddresses(addresses)

        // auto apply default address if available and no address is set
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

        // Reset shipping calculation when postal code changes
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

  // Calculate shipping
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

  // Validation
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

      // Billing address validation (only if not same as shipping)
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

    // For pickup, require billing info
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

  // Proceed to payment
  const proceedToPayment = () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill in all required fields")
      return
    }

    // Normalize shipping details with AU country
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

    // Normalize billing details with AU country
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

  // State modal
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

  // ===========================================
  // REUSABLE BILLING FORM COMPONENT
  // ===========================================

  const renderBillingForm = () => (
    <>
      {/* Saved Address Button for Billing */}
      {savedAddresses.length > 0 && (
        <TouchableOpacity
          style={styles.savedAddressButton}
          onPress={() => openAddressSelector("billing")}
          activeOpacity={0.7}
        >
          <View style={styles.savedAddressLeft}>
            <View style={styles.savedAddressIcon}>
              <Ionicons
                name={
                  selectedBillingAddress
                    ? getLabelIcon(selectedBillingAddress.label)
                    : "bookmark-outline"
                }
                size={20}
                color={AppColors.primary[600]}
              />
            </View>
            <View style={styles.savedAddressTextContainer}>
              <Text style={styles.savedAddressTitle}>
                {selectedBillingAddress
                  ? `${selectedBillingAddress.label || "Saved Address"}`
                  : "Use Saved Address"}
              </Text>
              <Text style={styles.savedAddressSubtitle} numberOfLines={1}>
                {selectedBillingAddress
                  ? formatAddressDisplay(selectedBillingAddress)
                  : "Select from your saved addresses"}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={AppColors.gray[400]}
          />
        </TouchableOpacity>
      )}

      <TextInput
        style={[styles.input, errors.billing_name && styles.inputError]}
        placeholder="Full Name *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.name}
        onChangeText={(text) => handleBillingFieldChange("name", text)}
      />
      {errors.billing_name && (
        <Text style={styles.errorText}>{errors.billing_name}</Text>
      )}

      <TextInput
        style={[styles.input, errors.billing_email && styles.inputError]}
        placeholder="Email *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.email}
        onChangeText={(text) => handleBillingFieldChange("email", text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.billing_email && (
        <Text style={styles.errorText}>{errors.billing_email}</Text>
      )}

      <TextInput
        style={[styles.input, errors.billing_phone && styles.inputError]}
        placeholder="Phone *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.phone}
        onChangeText={(text) => handleBillingFieldChange("phone", text)}
        keyboardType="phone-pad"
      />
      {errors.billing_phone && (
        <Text style={styles.errorText}>{errors.billing_phone}</Text>
      )}

      <TextInput
        style={[styles.input, errors.billing_address && styles.inputError]}
        placeholder="Street Address *"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.address.line1}
        onChangeText={(text) => handleBillingFieldChange("address.line1", text)}
      />
      {errors.billing_address && (
        <Text style={styles.errorText}>{errors.billing_address}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Apartment, suite, etc. (optional)"
        placeholderTextColor={AppColors.gray[400]}
        value={billingDetails.address.line2}
        onChangeText={(text) => handleBillingFieldChange("address.line2", text)}
      />

      <View style={styles.row}>
        <TextInput
          style={[
            styles.input,
            styles.halfInput,
            errors.billing_city && styles.inputError,
          ]}
          placeholder="City *"
          placeholderTextColor={AppColors.gray[400]}
          value={billingDetails.address.city}
          onChangeText={(text) =>
            handleBillingFieldChange("address.city", text)
          }
        />
        <TouchableOpacity
          style={[styles.input, styles.halfInput, styles.selectInput]}
          onPress={() => openStateModal("billing")}
        >
          <Text
            style={[
              styles.selectText,
              !billingDetails.address.state && styles.selectPlaceholder,
            ]}
          >
            {billingDetails.address.state || "State"}
          </Text>
          <Ionicons name="chevron-down" size={20} color={AppColors.gray[400]} />
        </TouchableOpacity>
      </View>
      {errors.billing_city && (
        <Text style={styles.errorText}>{errors.billing_city}</Text>
      )}

      <TextInput
        style={[styles.input, errors.billing_postal_code && styles.inputError]}
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
        <Text style={styles.errorText}>{errors.billing_postal_code}</Text>
      )}
    </>
  )

  return (
    <Wrapper style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Delivery Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>

          {/* Home Delivery */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              deliveryOption === "delivery" && styles.optionCardSelected,
            ]}
            onPress={() => setDeliveryOption("delivery")}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="car-outline"
                size={24}
                color={AppColors.primary[500]}
              />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Home Delivery</Text>
                <Text style={styles.optionSubtitle}>1-5 business days</Text>
              </View>
            </View>
            <View
              style={[
                styles.radio,
                deliveryOption === "delivery" && styles.radioSelected,
              ]}
            >
              {deliveryOption === "delivery" && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* Local Pickup */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              deliveryOption === "pickup" && styles.optionCardSelected,
            ]}
            onPress={() => setDeliveryOption("pickup")}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="storefront-outline"
                size={24}
                color={AppColors.primary[500]}
              />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Local Pickup</Text>
                <Text style={styles.optionSubtitle}>
                  8 Lethbridge Road, Austral, NSW 2179
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radio,
                deliveryOption === "pickup" && styles.radioSelected,
              ]}
            >
              {deliveryOption === "pickup" && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Heavy items warning */}
        {includesHeavyItems && (
          <View style={styles.warningContainer}>
            <Ionicons
              name="warning-outline"
              size={20}
              color={AppColors.error}
            />
            <Text style={styles.warningText}>
              You have item(s) in your basket that are not available for
              delivery!
            </Text>
          </View>
        )}

        {/* Shipping Calculator (only for delivery) */}
        {deliveryOption === "delivery" && !includesHeavyItems && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping</Text>

            {hasFreeShipping ? (
              /* Free Shipping Unlocked - Show fixed options */
              <View style={styles.freeShippingCard}>
                <View style={styles.freeShippingHeader}>
                  <View style={styles.freeShippingIconContainer}>
                    <Ionicons name="gift" size={24} color="#16A34A" />
                  </View>
                  <View style={styles.freeShippingTextContainer}>
                    <Text style={styles.freeShippingTitle}>
                      🎉 Free Standard Shipping Unlocked!
                    </Text>
                    <Text style={styles.freeShippingSubtitle}>
                      Orders over ${SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD}{" "}
                      qualify for free standard shipping
                    </Text>
                  </View>
                </View>

                {/* Shipping Options */}
                <View style={styles.shippingOptionsContainer}>
                  {freeShippingOptions.map((option) => (
                    <TouchableOpacity
                      key={option.serviceCode}
                      style={[
                        styles.shippingOption,
                        selectedShipping?.serviceCode === option.serviceCode &&
                          styles.shippingOptionSelected,
                        option.cost === 0 && styles.shippingOptionFree,
                      ]}
                      onPress={() => setSelectedShipping(option)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.shippingOptionLeft}>
                        <View
                          style={[
                            styles.radio,
                            selectedShipping?.serviceCode ===
                              option.serviceCode && styles.radioSelected,
                          ]}
                        >
                          {selectedShipping?.serviceCode ===
                            option.serviceCode && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <View style={styles.shippingOptionInfo}>
                          <View style={styles.shippingOptionNameRow}>
                            <Text style={styles.shippingOptionName}>
                              {option.serviceName}
                            </Text>
                            {option.cost === 0 && (
                              <View style={styles.freeBadge}>
                                <Text style={styles.freeBadgeText}>FREE</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.shippingOptionDelivery}>
                            {option.deliveryTime}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.shippingOptionPrice,
                          option.cost === 0 && styles.shippingOptionPriceFree,
                        ]}
                      >
                        {option.cost === 0
                          ? "FREE"
                          : `$${option.cost.toFixed(2)}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.calculatorCard}>
                <Text style={styles.calculatorDescription}>
                  Enter your postcode to see available delivery options
                </Text>
                <View style={styles.calculatorRow}>
                  <TextInput
                    className="placeholder:text-gray-400"
                    style={styles.postcodeInput}
                    placeholder="Enter Postcode"
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
                    <Text style={styles.loadingText}>Calculating...</Text>
                  </View>
                )}

                {shippingCalculated && shippingOptions.length > 0 && (
                  <View style={styles.shippingOptionsContainer}>
                    {shippingOptions.map((option) => (
                      <TouchableOpacity
                        key={option.serviceCode}
                        style={[
                          styles.shippingOption,
                          selectedShipping?.serviceCode ===
                            option.serviceCode && styles.shippingOptionSelected,
                        ]}
                        onPress={() => setSelectedShipping(option)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.shippingOptionInfo}>
                          <Text style={styles.shippingOptionName}>
                            {option.serviceName}
                          </Text>
                          <Text style={styles.shippingOptionDelivery}>
                            {option.deliveryTime}
                          </Text>
                        </View>
                        <View style={styles.shippingOptionRight}>
                          <Text style={styles.shippingOptionPrice}>
                            ${option.cost.toFixed(2)}
                          </Text>
                          <View
                            style={[
                              styles.radio,
                              selectedShipping?.serviceCode ===
                                option.serviceCode && styles.radioSelected,
                            ]}
                          >
                            {selectedShipping?.serviceCode ===
                              option.serviceCode && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {errors.shipping && (
                  <Text style={styles.errorText} className="!mt-2">
                    {errors.shipping}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Full Name *"
            placeholderTextColor={AppColors.gray[400]}
            value={shippingDetails.name}
            onChangeText={(text) => handleShippingFieldChange("name", text)}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email *"
            placeholderTextColor={AppColors.gray[400]}
            value={shippingDetails.email}
            onChangeText={(text) => handleShippingFieldChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            className="placeholder:text-gray-400"
            placeholder="Phone *"
            placeholderTextColor={AppColors.gray[400]}
            value={shippingDetails.phone}
            onChangeText={(text) => handleShippingFieldChange("phone", text)}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Billing Address for Pickup */}
        {deliveryOption === "pickup" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Information</Text>
            {renderBillingForm()}
          </View>
        )}

        {/* Shipping Address (only for delivery) */}
        {deliveryOption === "delivery" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>

            {/* Saved Address Button for Shipping */}
            {savedAddresses.length > 0 && (
              <TouchableOpacity
                style={styles.savedAddressButton}
                onPress={() => openAddressSelector("shipping")}
                activeOpacity={0.7}
              >
                <View style={styles.savedAddressLeft}>
                  <View style={styles.savedAddressIcon}>
                    <Ionicons
                      name={
                        selectedShippingAddress
                          ? getLabelIcon(selectedShippingAddress.label)
                          : "bookmark-outline"
                      }
                      size={20}
                      color={AppColors.primary[600]}
                    />
                  </View>
                  <View style={styles.savedAddressTextContainer}>
                    <Text style={styles.savedAddressTitle}>
                      {selectedShippingAddress
                        ? `${selectedShippingAddress.label || "Saved Address"}`
                        : "Use Saved Address"}
                    </Text>
                    <Text style={styles.savedAddressSubtitle} numberOfLines={1}>
                      {selectedShippingAddress
                        ? formatAddressDisplay(selectedShippingAddress)
                        : "Select from your saved addresses"}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={AppColors.gray[400]}
                />
              </TouchableOpacity>
            )}

            <TextInput
              style={[styles.input, errors.address_line1 && styles.inputError]}
              className="placeholder:text-gray-400"
              placeholder="Street Address *"
              value={shippingDetails.address.line1}
              onChangeText={(text) =>
                handleShippingFieldChange("address.line1", text)
              }
            />
            {errors.address_line1 && (
              <Text style={styles.errorText}>{errors.address_line1}</Text>
            )}

            <TextInput
              style={styles.input}
              className="placeholder:text-gray-400"
              placeholder="Apartment, suite, etc. (optional)"
              value={shippingDetails.address.line2}
              onChangeText={(text) =>
                handleShippingFieldChange("address.line2", text)
              }
            />

            <View style={styles.row}>
              <TextInput
                className="placeholder:text-gray-400"
                style={[
                  styles.input,
                  styles.halfInput,
                  errors.city && styles.inputError,
                ]}
                placeholder="City *"
                value={shippingDetails.address.city}
                onChangeText={(text) =>
                  handleShippingFieldChange("address.city", text)
                }
              />
              <TouchableOpacity
                style={[styles.input, styles.halfInput, styles.selectInput]}
                onPress={() => openStateModal("shipping")}
              >
                <Text
                  style={[
                    styles.selectText,
                    !shippingDetails.address.state && styles.selectPlaceholder,
                  ]}
                >
                  {shippingDetails.address.state || "State"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={AppColors.gray[400]}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              className="placeholder:text-gray-400"
              style={[styles.input, errors.postal_code && styles.inputError]}
              placeholder="Postal Code *"
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
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setSameAsShipping(!sameAsShipping)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                sameAsShipping && styles.checkboxChecked,
              ]}
            >
              {sameAsShipping && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Billing address same as shipping
            </Text>
          </TouchableOpacity>
        )}

        {/* Billing Address Form (only when not same as shipping) */}
        {deliveryOption === "delivery" && !sameAsShipping && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Address</Text>

            {renderBillingForm()}
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({parsedOrderData?.cart?.length} items)
              </Text>
              <Text style={styles.summaryValue}>
                ${parsedOrderData?.subtotal?.toFixed(2)}
              </Text>
            </View>

            {/* Discount Row */}
            {coupon && discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.discountLabelRow}>
                  <Ionicons name="pricetag" size={14} color="#16A34A" />
                  <Text style={styles.discountLabel}>
                    Discount ({coupon.code})
                  </Text>
                </View>
                <Text style={styles.discountValue}>
                  -${discountAmount.toFixed(2)}
                </Text>
              </View>
            )}

            {shippingCalculated &&
              selectedShipping &&
              deliveryOption !== "pickup" && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>

                  <Text style={styles.summaryValue}>
                    {selectedShipping?.cost > 0
                      ? `$${selectedShipping.cost.toFixed(2)}`
                      : "FREE"}
                  </Text>
                </View>
              )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          disabled={deliveryOption === "delivery" && includesHeavyItems}
          title="Continue to Payment"
          onPress={proceedToPayment}
          icon={<Ionicons name="arrow-forward" size={20} color="white" />}
        />
      </View>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={AppColors.text.primary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {AUSTRALIAN_STATES.map((state) => (
                <TouchableOpacity
                  key={state.value}
                  style={styles.stateOption}
                  onPress={() => handleStateSelect(state.value)}
                >
                  <Text style={styles.stateLabel}>{state.label}</Text>
                  <Text style={styles.stateValue}>{state.value}</Text>
                </TouchableOpacity>
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
          <View style={styles.addressModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select{" "}
                {addressSelectorType === "shipping" ? "Shipping" : "Billing"}{" "}
                Address
              </Text>
              <TouchableOpacity onPress={() => setShowAddressSelector(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={AppColors.text.primary}
                />
              </TouchableOpacity>
            </View>

            {loadingAddresses ? (
              <View style={styles.addressLoadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={AppColors.primary[500]}
                />
                <Text style={styles.loadingText}>Loading addresses...</Text>
              </View>
            ) : (
              <ScrollView style={styles.addressList}>
                {getFilteredAddresses(addressSelectorType).map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressCard,
                      (addressSelectorType === "shipping"
                        ? selectedShippingAddress?.id === address.id
                        : selectedBillingAddress?.id === address.id) &&
                        styles.addressCardSelected,
                    ]}
                    onPress={() => handleAddressSelect(address)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addressCardHeader}>
                      <View style={styles.addressLabelContainer}>
                        <Ionicons
                          name={getLabelIcon(address.label)}
                          size={16}
                          color={AppColors.primary[600]}
                        />
                        <Text style={styles.addressLabel}>
                          {address.label || "Address"}
                        </Text>
                        {address.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.addressName}>{address.full_name}</Text>
                    <Text style={styles.addressPhone}>{address.phone}</Text>
                    <Text style={styles.addressText}>
                      {formatAddressDisplay(address)}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Add New Address Button */}
                <TouchableOpacity
                  style={styles.addNewAddressCard}
                  onPress={handleAddNewAddress}
                  activeOpacity={0.7}
                >
                  <View style={styles.addNewAddressIcon}>
                    <Ionicons
                      name="add"
                      size={24}
                      color={AppColors.primary[600]}
                    />
                  </View>
                  <Text style={styles.addNewAddressText}>Add New Address</Text>
                </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  savedAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  savedAddressLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  savedAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    fontSize: 14,
    color: AppColors.primary[700],
  },
  savedAddressSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
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
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  optionSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primary[500],
  },
  calculatorCard: {
    backgroundColor: AppColors.primary[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  calculatorDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  warningText: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: AppColors.error,
  },
  recalculateWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  recalculateText: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#92400E",
  },
  postcodeInput: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
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
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  shippingOptionsContainer: {
    marginTop: 16,
    gap: 10,
  },
  shippingOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
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
    fontSize: 14,
    color: AppColors.text.primary,
  },
  shippingOptionDelivery: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  shippingOptionRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  shippingOptionPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: AppColors.primary[600],
  },
  // Free Shipping Card Styles
  freeShippingCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  freeShippingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  freeShippingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 16,
    color: "#166534",
  },
  freeShippingSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#15803D",
    marginTop: 2,
  },
  freeShippingHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.primary[100],
  },
  freeShippingHintText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.primary[700],
    flex: 1,
  },
  shippingOptionFree: {
    borderColor: "#BBF7D0",
  },
  shippingOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  shippingOptionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    fontSize: 10,
    color: "#16A34A",
  },
  input: {
    backgroundColor: AppColors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  inputError: {
    borderColor: AppColors.error,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: -6,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
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
    fontSize: 15,
    color: AppColors.text.primary,
  },
  selectPlaceholder: {
    color: AppColors.gray[400],
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  summaryCard: {
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  summaryValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[300],
    marginVertical: 12,
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: AppColors.primary[600],
  },
  footer: {
    padding: 20,
    paddingBottom: 24,
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
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  stateOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  stateLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  stateValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  addressModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  addressLoadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  addressList: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
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
    gap: 6,
  },
  addressLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
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
    fontSize: 10,
    color: "white",
    textTransform: "uppercase",
  },
  addressName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  addressPhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  addressText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  addNewAddressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: AppColors.gray[200],
    borderStyle: "dashed",
  },
  addNewAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addNewAddressText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  discountLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#16A34A",
  },
  discountValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#16A34A",
  },
})
