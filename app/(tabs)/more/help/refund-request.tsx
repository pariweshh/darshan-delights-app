// app/(tabs)/more/help/refund-request.tsx

import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { getRefundByOrderNumber, submitRefundRequest } from "@/src/api/refund"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { CreateRefundRequestParams, RefundReason } from "@/src/types/refund"

// Refund reasons - MUST match Strapi backend enum values exactly
const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: "Wrong product", label: "Wrong product" },
  { value: "Quality issue", label: "Quality issue" },
  { value: "Damaged", label: "Damaged" },
  { value: "Never received", label: "Never received" },
  { value: "Other", label: "Other" },
]

// Configuration for notes field based on reason
const NOTES_CONFIG: Record<
  RefundReason,
  {
    required: boolean
    label: string
    placeholder: string
    maxLength: number
  }
> = {
  "Wrong product": {
    required: true,
    label: "What product did you receive instead? *",
    placeholder: "Please describe what product you received...",
    maxLength: 300,
  },
  "Quality issue": {
    required: true,
    label: "Please describe the quality issue *",
    placeholder: "Describe the quality issues you experienced...",
    maxLength: 300,
  },
  Damaged: {
    required: true,
    label: "Please describe the damage *",
    placeholder: "Describe the damage to the product...",
    maxLength: 300,
  },
  "Never received": {
    required: false,
    label: "Additional notes (optional)",
    placeholder: "Any additional information that might help us...",
    maxLength: 500,
  },
  Other: {
    required: false,
    label: "Additional notes (optional)",
    placeholder: "Any additional information that might help us...",
    maxLength: 500,
  },
}

// Yes/No questions matching web app
const QUESTIONS = [
  {
    key: "proof",
    question: "Do you have a proof of purchase / receipt?",
  },
  {
    key: "policy",
    question: "Have you read the refund policy?",
  },
  {
    key: "eligibility",
    question: "Based on the refund policy, are you eligible for a refund?",
  },
]

interface FormData {
  fName: string
  lName: string
  email: string
  orderNumber: string
  reason: RefundReason | null
  otherReason: string
  requestedAmount: string
  additionalNotes: string
  refundAccountAgreement: boolean
  purchaseDate: Date
  // Yes/No questions
  proof: "Yes" | "No" | null
  policy: "Yes" | "No" | null
  eligibility: "Yes" | "No" | null
}

interface FormErrors {
  fName?: string
  lName?: string
  email?: string
  orderNumber?: string
  reason?: string
  otherReason?: string
  additionalNotes?: string
  requestedAmount?: string
  refundAccountAgreement?: string
  purchaseDate?: string
  questions?: string
}

export default function RefundRequestScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const { user } = useAuthStore()
  const { orderNumber: prefillOrderNumber } = useLocalSearchParams<{
    orderNumber?: string
  }>()

  const [formData, setFormData] = useState<FormData>({
    fName: user?.fName || "",
    lName: user?.lName || "",
    email: user?.email || "",
    orderNumber: prefillOrderNumber || "",
    reason: null,
    otherReason: "",
    requestedAmount: "",
    additionalNotes: "",
    refundAccountAgreement: false,
    purchaseDate: new Date(),
    proof: null,
    policy: null,
    eligibility: null,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isCheckingOrder, setIsCheckingOrder] = useState(false)
  const [existingRequest, setExistingRequest] = useState<boolean>(false)

  // Layout configuration
  const contentMaxWidth = isTablet ? (isLandscape ? 600 : 550) : undefined

  // Responsive sizes
  const inputPaddingH = isTablet ? 16 : 14
  const inputPaddingV = isTablet ? 14 : 12
  const inputFontSize = isTablet ? 15 : 14
  const inputBorderRadius = isTablet ? 12 : 10
  const radioOuterSize = isTablet ? 22 : 20
  const radioInnerSize = isTablet ? 12 : 10
  const checkboxSize = isTablet ? 24 : 22

  // Get notes config for selected reason
  const notesConfig = formData.reason ? NOTES_CONFIG[formData.reason] : null

  // Check if refund already exists for this order
  useEffect(() => {
    const checkExistingRefund = async () => {
      if (formData.orderNumber.length >= 5) {
        setIsCheckingOrder(true)
        try {
          const existing = await getRefundByOrderNumber(formData.orderNumber)
          setExistingRequest(!!existing)
          if (existing) {
            setErrors((prev) => ({
              ...prev,
              orderNumber: "A refund request already exists for this order",
            }))
          } else {
            setErrors((prev) => ({
              ...prev,
              orderNumber: undefined,
            }))
          }
        } catch (error) {
          // Ignore error - order might not exist yet
          setExistingRequest(false)
        } finally {
          setIsCheckingOrder(false)
        }
      }
    }

    const debounce = setTimeout(checkExistingRefund, 500)
    return () => clearTimeout(debounce)
  }, [formData.orderNumber])

  // Update field
  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fName.trim()) {
      newErrors.fName = "First name is required"
    }

    if (!formData.lName.trim()) {
      newErrors.lName = "Last name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.orderNumber.trim()) {
      newErrors.orderNumber = "Order number is required"
    }

    if (existingRequest) {
      newErrors.orderNumber = "A refund request already exists for this order"
    }

    if (!formData.reason) {
      newErrors.reason = "Please select a reason"
    }

    if (formData.reason === "Other" && !formData.otherReason.trim()) {
      newErrors.otherReason = "Please specify the reason"
    }

    // Validate notes based on reason config
    if (notesConfig?.required && !formData.additionalNotes.trim()) {
      newErrors.additionalNotes = "This field is required"
    }

    if (!formData.requestedAmount.trim()) {
      newErrors.requestedAmount = "Requested amount is required"
    } else if (
      isNaN(parseFloat(formData.requestedAmount)) ||
      parseFloat(formData.requestedAmount) <= 0
    ) {
      newErrors.requestedAmount = "Please enter a valid amount"
    }

    if (!formData.refundAccountAgreement) {
      newErrors.refundAccountAgreement =
        "You must agree to receive the refund to your account"
    }

    // Validate questions are answered
    if (!formData.proof || !formData.policy || !formData.eligibility) {
      newErrors.questions = "Please answer all the questions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Please fix the errors",
        text2: "Some required fields are missing or invalid",
      })
      return
    }

    Keyboard.dismiss()
    setIsSubmitting(true)

    try {
      // Build questions JSON matching web app format
      const questionsJson = {
        proof: formData.proof,
        policy: formData.policy,
        eligibility: formData.eligibility,
      }

      const params: CreateRefundRequestParams = {
        fName: formData.fName.trim(),
        lName: formData.lName.trim(),
        email: formData.email.toLowerCase().trim(),
        order_number: formData.orderNumber.trim(),
        reason: formData.reason!,
        other_reason:
          formData.reason === "Other" ? formData.otherReason.trim() : undefined,
        requested_amount: parseFloat(formData.requestedAmount),
        additional_notes: formData.additionalNotes.trim() || undefined,
        refund_account_agreement: formData.refundAccountAgreement,
        questions: questionsJson,
        purchase_date: formatDateForAPI(formData.purchaseDate),
      }

      await submitRefundRequest(params)

      Toast.show({
        type: "success",
        text1: "Request Submitted! 📝",
        text2: "We'll review your refund request and get back to you",
      })

      router.back()
    } catch (error: any) {
      console.error("Refund request error:", error)
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: error.response?.data?.error?.message || "Please try again later",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  return (
    <Wrapper
      style={[styles.container, { paddingTop: isTablet ? 24 : 20 }]}
      edges={[]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: config.horizontalPadding,
              paddingTop: config.horizontalPadding,
              paddingBottom: isTablet ? 60 : 40,
              maxWidth: contentMaxWidth,
              alignSelf: contentMaxWidth ? "center" : undefined,
              width: contentMaxWidth ? "100%" : undefined,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View
            style={[
              styles.infoBanner,
              {
                padding: isTablet ? 16 : 14,
                borderRadius: isTablet ? 14 : 12,
                marginBottom: isTablet ? 24 : 20,
                gap: isTablet ? 12 : 10,
              },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={isTablet ? 22 : 20}
              color={AppColors.primary[600]}
            />
            <Text
              style={[
                styles.infoText,
                {
                  fontSize: config.bodyFontSize - 1,
                  lineHeight: (config.bodyFontSize - 1) * 1.4,
                },
              ]}
            >
              Please provide accurate information to help us process your refund
              request quickly.
            </Text>
          </View>

          {/* Personal Information Section */}
          <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: isTablet ? 17 : 16,
                  marginBottom: isTablet ? 16 : 14,
                },
              ]}
            >
              Personal Information
            </Text>

            {/* Name Row */}
            <View style={[styles.row, { gap: isTablet ? 14 : 12 }]}>
              <View style={styles.halfField}>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize - 1,
                      marginBottom: isTablet ? 8 : 6,
                    },
                  ]}
                >
                  First Name *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputReadOnly,
                    {
                      paddingHorizontal: inputPaddingH,
                      paddingVertical: inputPaddingV,
                      borderRadius: inputBorderRadius,
                      fontSize: inputFontSize,
                    },
                    errors.fName && styles.inputError,
                  ]}
                  placeholder="First name"
                  placeholderTextColor={AppColors.gray[400]}
                  value={formData.fName}
                  editable={false}
                />
                {errors.fName && (
                  <Text
                    style={[
                      styles.errorText,
                      { fontSize: config.smallFontSize },
                    ]}
                  >
                    {errors.fName}
                  </Text>
                )}
              </View>

              <View style={styles.halfField}>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize - 1,
                      marginBottom: isTablet ? 8 : 6,
                    },
                  ]}
                >
                  Last Name *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputReadOnly,
                    {
                      paddingHorizontal: inputPaddingH,
                      paddingVertical: inputPaddingV,
                      borderRadius: inputBorderRadius,
                      fontSize: inputFontSize,
                    },
                    errors.lName && styles.inputError,
                  ]}
                  placeholder="Last name"
                  placeholderTextColor={AppColors.gray[400]}
                  value={formData.lName}
                  editable={false}
                />
                {errors.lName && (
                  <Text
                    style={[
                      styles.errorText,
                      { fontSize: config.smallFontSize },
                    ]}
                  >
                    {errors.lName}
                  </Text>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: config.bodyFontSize - 1,
                    marginBottom: isTablet ? 8 : 6,
                  },
                ]}
              >
                Email Address *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputReadOnly,
                  {
                    paddingHorizontal: inputPaddingH,
                    paddingVertical: inputPaddingV,
                    borderRadius: inputBorderRadius,
                    fontSize: inputFontSize,
                  },
                  errors.email && styles.inputError,
                ]}
                placeholder="your@email.com"
                placeholderTextColor={AppColors.gray[400]}
                value={formData.email}
                editable={false}
              />
              {errors.email && (
                <Text
                  style={[styles.errorText, { fontSize: config.smallFontSize }]}
                >
                  {errors.email}
                </Text>
              )}
            </View>
          </View>

          {/* Reason Section */}
          <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: isTablet ? 17 : 16,
                  marginBottom: isTablet ? 16 : 14,
                },
              ]}
            >
              Reason for Refund
            </Text>

            {/* Reason Selection */}
            <View
              style={[styles.reasonsContainer, { gap: isTablet ? 12 : 10 }]}
            >
              {REFUND_REASONS.map((reason) => (
                <DebouncedTouchable
                  key={reason.value}
                  style={[
                    styles.reasonOption,
                    {
                      paddingVertical: isTablet ? 14 : 12,
                      paddingHorizontal: isTablet ? 16 : 14,
                      borderRadius: isTablet ? 12 : 10,
                      gap: isTablet ? 14 : 12,
                    },
                    formData.reason === reason.value &&
                      styles.reasonOptionSelected,
                  ]}
                  onPress={() => {
                    updateField("reason", reason.value)
                    if (reason.value !== "Other") {
                      updateField("otherReason", "")
                    }
                    // Clear notes when reason changes
                    updateField("additionalNotes", "")
                    setErrors((prev) => ({
                      ...prev,
                      additionalNotes: undefined,
                    }))
                  }}
                  disabled={isSubmitting}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        width: radioOuterSize,
                        height: radioOuterSize,
                        borderRadius: radioOuterSize / 2,
                      },
                      formData.reason === reason.value &&
                        styles.radioOuterSelected,
                    ]}
                  >
                    {formData.reason === reason.value && (
                      <View
                        style={[
                          styles.radioInner,
                          {
                            width: radioInnerSize,
                            height: radioInnerSize,
                            borderRadius: radioInnerSize / 2,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.reasonLabel,
                      { fontSize: inputFontSize },
                      formData.reason === reason.value &&
                        styles.reasonLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </DebouncedTouchable>
              ))}
            </View>
            {errors.reason && (
              <Text
                style={[
                  styles.errorText,
                  {
                    fontSize: config.smallFontSize,
                    marginTop: isTablet ? 8 : 6,
                  },
                ]}
              >
                {errors.reason}
              </Text>
            )}

            {/* Other Reason - Only shown when "Other" is selected */}
            {formData.reason === "Other" && (
              <View style={[styles.field, { marginTop: isTablet ? 18 : 16 }]}>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize - 1,
                      marginBottom: isTablet ? 8 : 6,
                    },
                  ]}
                >
                  Please specify the reason *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      paddingHorizontal: inputPaddingH,
                      paddingVertical: inputPaddingV,
                      borderRadius: inputBorderRadius,
                      fontSize: inputFontSize,
                      minHeight: isTablet ? 80 : 70,
                    },
                    errors.otherReason && styles.inputError,
                  ]}
                  placeholder="Please specify the reason..."
                  placeholderTextColor={AppColors.gray[400]}
                  value={formData.otherReason}
                  onChangeText={(text) => updateField("otherReason", text)}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  maxLength={100}
                  editable={!isSubmitting}
                />
                <Text
                  style={[styles.charCount, { fontSize: config.smallFontSize }]}
                >
                  {100 - formData.otherReason.length} characters remaining
                </Text>
                {errors.otherReason && (
                  <Text
                    style={[
                      styles.errorText,
                      { fontSize: config.smallFontSize },
                    ]}
                  >
                    {errors.otherReason}
                  </Text>
                )}
              </View>
            )}

            {/* Notes/Description Field - Shown after reason is selected */}
            {formData.reason && notesConfig && (
              <View style={[styles.field, { marginTop: isTablet ? 18 : 16 }]}>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize - 1,
                      marginBottom: isTablet ? 8 : 6,
                    },
                  ]}
                >
                  {notesConfig.label}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      paddingHorizontal: inputPaddingH,
                      paddingVertical: inputPaddingV,
                      borderRadius: inputBorderRadius,
                      fontSize: inputFontSize,
                      minHeight: isTablet ? 110 : 100,
                    },
                    errors.additionalNotes && styles.inputError,
                  ]}
                  placeholder={notesConfig.placeholder}
                  placeholderTextColor={AppColors.gray[400]}
                  value={formData.additionalNotes}
                  onChangeText={(text) => updateField("additionalNotes", text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={notesConfig.maxLength}
                  editable={!isSubmitting}
                />
                <Text
                  style={[styles.charCount, { fontSize: config.smallFontSize }]}
                >
                  {notesConfig.maxLength - formData.additionalNotes.length}{" "}
                  characters remaining
                </Text>
                {errors.additionalNotes && (
                  <Text
                    style={[
                      styles.errorText,
                      { fontSize: config.smallFontSize },
                    ]}
                  >
                    {errors.additionalNotes}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Purchase Date Section */}
          <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: isTablet ? 17 : 16,
                  marginBottom: isTablet ? 16 : 14,
                },
              ]}
            >
              When did you buy the product?
            </Text>

            <DebouncedTouchable
              style={[
                styles.input,
                styles.dateInput,
                {
                  paddingHorizontal: inputPaddingH,
                  paddingVertical: inputPaddingV,
                  borderRadius: inputBorderRadius,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              disabled={isSubmitting}
            >
              <Text style={[styles.dateText, { fontSize: inputFontSize }]}>
                {formatDate(formData.purchaseDate)}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={isTablet ? 22 : 20}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>

            {/* Date Picker Modal - iOS */}
            {showDatePicker && Platform.OS === "ios" && (
              <Modal
                transparent
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.datePickerOverlay}>
                  <DebouncedTouchable
                    style={styles.datePickerBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowDatePicker(false)}
                  />
                  <View
                    style={[
                      styles.datePickerContainer,
                      {
                        maxWidth: isTablet ? 500 : undefined,
                        alignSelf: isTablet ? "center" : undefined,
                        width: isTablet ? "90%" : undefined,
                        borderTopLeftRadius: isTablet ? 24 : 20,
                        borderTopRightRadius: isTablet ? 24 : 20,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.datePickerHeader,
                        {
                          paddingHorizontal: isTablet ? 18 : 16,
                          paddingVertical: isTablet ? 16 : 14,
                        },
                      ]}
                    >
                      <DebouncedTouchable
                        onPress={() => setShowDatePicker(false)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text
                          style={[
                            styles.datePickerCancel,
                            { fontSize: config.bodyFontSize },
                          ]}
                        >
                          Cancel
                        </Text>
                      </DebouncedTouchable>
                      <Text
                        style={[
                          styles.datePickerTitle,
                          { fontSize: isTablet ? 17 : 16 },
                        ]}
                      >
                        Purchase Date
                      </Text>
                      <DebouncedTouchable
                        onPress={() => setShowDatePicker(false)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text
                          style={[
                            styles.datePickerDone,
                            { fontSize: config.bodyFontSize },
                          ]}
                        >
                          Done
                        </Text>
                      </DebouncedTouchable>
                    </View>
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        value={formData.purchaseDate}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        themeVariant="light"
                        textColor="#000000"
                        accentColor={AppColors.primary[500]}
                        onChange={(event, date) => {
                          if (date) {
                            updateField("purchaseDate", date)
                          }
                        }}
                        style={styles.datePicker}
                      />
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {/* Date Picker - Android */}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={formData.purchaseDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false)
                  if (event.type === "set" && date) {
                    updateField("purchaseDate", date)
                  }
                }}
              />
            )}
          </View>

          {/* Order Number Section */}
          <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: isTablet ? 17 : 16,
                  marginBottom: isTablet ? 16 : 14,
                },
              ]}
            >
              Order Number
            </Text>

            <View style={styles.inputWithIcon}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputFlex,
                  {
                    paddingHorizontal: inputPaddingH,
                    paddingVertical: inputPaddingV,
                    borderRadius: inputBorderRadius,
                    fontSize: inputFontSize,
                  },
                  errors.orderNumber && styles.inputError,
                ]}
                placeholder="Enter your order number"
                placeholderTextColor={AppColors.gray[400]}
                value={formData.orderNumber}
                onChangeText={(text) => {
                  updateField("orderNumber", text)
                  setExistingRequest(false)
                }}
                autoCapitalize="characters"
                editable={!isSubmitting}
              />
              {isCheckingOrder && (
                <ActivityIndicator
                  size="small"
                  color={AppColors.primary[500]}
                  style={[styles.inputIcon, { right: isTablet ? 16 : 14 }]}
                />
              )}
            </View>
            {errors.orderNumber && (
              <Text
                style={[styles.errorText, { fontSize: config.smallFontSize }]}
              >
                {errors.orderNumber}
              </Text>
            )}
            <Text
              style={[
                styles.helperText,
                {
                  fontSize: config.smallFontSize,
                  marginTop: isTablet ? 8 : 6,
                },
              ]}
            >
              You can find your order number in your order history page under
              the specific order.
            </Text>
          </View>

          {/* Questions Section - Yes/No Table */}
          <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: isTablet ? 17 : 16,
                  marginBottom: isTablet ? 16 : 14,
                },
              ]}
            >
              Please answer the following
            </Text>

            {/* Table Header */}
            <View
              style={[styles.tableHeader, { borderRadius: isTablet ? 10 : 8 }]}
            >
              <View style={styles.tableQuestionCell}>
                <Text
                  style={[styles.tableHeaderText, { fontSize: inputFontSize }]}
                >
                  Question
                </Text>
              </View>
              <View style={styles.tableAnswerCell}>
                <Text
                  style={[styles.tableHeaderText, { fontSize: inputFontSize }]}
                >
                  Yes
                </Text>
              </View>
              <View style={styles.tableAnswerCell}>
                <Text
                  style={[styles.tableHeaderText, { fontSize: inputFontSize }]}
                >
                  No
                </Text>
              </View>
            </View>

            {/* Table Rows */}
            {QUESTIONS.map((q, index) => (
              <View
                key={q.key}
                style={[
                  styles.tableRow,
                  index === QUESTIONS.length - 1 && styles.tableRowLast,
                ]}
              >
                <View style={styles.tableQuestionCell}>
                  <Text
                    style={[
                      styles.tableQuestionText,
                      { fontSize: inputFontSize - 1 },
                    ]}
                  >
                    {q.question}
                  </Text>
                </View>
                <View style={styles.tableAnswerCell}>
                  <DebouncedTouchable
                    style={[
                      styles.radioButton,
                      {
                        width: radioOuterSize,
                        height: radioOuterSize,
                        borderRadius: radioOuterSize / 2,
                      },
                      formData[q.key as keyof FormData] === "Yes" &&
                        styles.radioButtonSelected,
                    ]}
                    onPress={() =>
                      updateField(q.key as keyof FormData, "Yes" as any)
                    }
                    disabled={isSubmitting}
                  >
                    {formData[q.key as keyof FormData] === "Yes" && (
                      <View
                        style={[
                          styles.radioInner,
                          {
                            width: radioInnerSize,
                            height: radioInnerSize,
                            borderRadius: radioInnerSize / 2,
                          },
                        ]}
                      />
                    )}
                  </DebouncedTouchable>
                </View>
                <View style={styles.tableAnswerCell}>
                  <DebouncedTouchable
                    style={[
                      styles.radioButton,
                      {
                        width: radioOuterSize,
                        height: radioOuterSize,
                        borderRadius: radioOuterSize / 2,
                      },
                      formData[q.key as keyof FormData] === "No" &&
                        styles.radioButtonSelected,
                    ]}
                    onPress={() =>
                      updateField(q.key as keyof FormData, "No" as any)
                    }
                    disabled={isSubmitting}
                  >
                    {formData[q.key as keyof FormData] === "No" && (
                      <View
                        style={[
                          styles.radioInner,
                          {
                            width: radioInnerSize,
                            height: radioInnerSize,
                            borderRadius: radioInnerSize / 2,
                          },
                        ]}
                      />
                    )}
                  </DebouncedTouchable>
                </View>
              </View>
            ))}

            {errors.questions && (
              <Text
                style={[
                  styles.errorText,
                  {
                    fontSize: config.smallFontSize,
                    marginTop: isTablet ? 8 : 6,
                  },
                ]}
              >
                {errors.questions}
              </Text>
            )}
          </View>

          {/* Requested Amount Section */}
          <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: isTablet ? 17 : 16,
                  marginBottom: isTablet ? 16 : 14,
                },
              ]}
            >
              Requested Amount
            </Text>

            <View style={styles.amountInput}>
              <Text
                style={[
                  styles.currencySymbol,
                  {
                    fontSize: isTablet ? 17 : 16,
                    marginRight: isTablet ? 10 : 8,
                  },
                ]}
              >
                $
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputFlex,
                  {
                    paddingHorizontal: inputPaddingH,
                    paddingVertical: inputPaddingV,
                    borderRadius: inputBorderRadius,
                    fontSize: inputFontSize,
                  },
                  errors.requestedAmount && styles.inputError,
                ]}
                placeholder="0.00"
                placeholderTextColor={AppColors.gray[400]}
                value={formData.requestedAmount}
                onChangeText={(text) => updateField("requestedAmount", text)}
                keyboardType="decimal-pad"
                editable={!isSubmitting}
              />
            </View>
            {errors.requestedAmount && (
              <Text
                style={[styles.errorText, { fontSize: config.smallFontSize }]}
              >
                {errors.requestedAmount}
              </Text>
            )}
          </View>

          {/* Agreement */}
          <DebouncedTouchable
            style={[
              styles.agreementContainer,
              { gap: isTablet ? 14 : 12, marginBottom: isTablet ? 10 : 8 },
            ]}
            onPress={() =>
              updateField(
                "refundAccountAgreement",
                !formData.refundAccountAgreement
              )
            }
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                {
                  width: checkboxSize,
                  height: checkboxSize,
                  borderRadius: isTablet ? 7 : 6,
                  marginTop: isTablet ? 3 : 2,
                },
                formData.refundAccountAgreement && styles.checkboxChecked,
                errors.refundAccountAgreement && styles.checkboxError,
              ]}
            >
              {formData.refundAccountAgreement && (
                <Ionicons
                  name="checkmark"
                  size={isTablet ? 18 : 16}
                  color="#fff"
                />
              )}
            </View>
            <Text
              style={[
                styles.agreementText,
                {
                  fontSize: config.bodyFontSize - 1,
                  lineHeight: (config.bodyFontSize - 1) * 1.4,
                },
              ]}
            >
              I agree the refunded money to be sent back to the account that I
              made the initial payment from. *
            </Text>
          </DebouncedTouchable>
          {errors.refundAccountAgreement && (
            <Text
              style={[
                styles.errorText,
                styles.agreementError,
                {
                  fontSize: config.smallFontSize,
                  marginLeft: checkboxSize + (isTablet ? 14 : 12),
                },
              ]}
            >
              {errors.refundAccountAgreement}
            </Text>
          )}

          {/* Submit Button */}
          <View
            style={[styles.buttonContainer, { marginTop: isTablet ? 28 : 24 }]}
          >
            <Button
              title={isSubmitting ? "Submitting..." : "Submit"}
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              containerStyles="w-full"
            />
          </View>

          {/* Help Text */}
          <View
            style={[
              styles.helpContainer,
              {
                marginTop: isTablet ? 24 : 20,
                paddingHorizontal: isTablet ? 14 : 12,
                paddingVertical: isTablet ? 16 : 14,
                borderRadius: isTablet ? 12 : 10,
                gap: isTablet ? 12 : 10,
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={isTablet ? 20 : 18}
              color={AppColors.text.tertiary}
            />
            <Text
              style={[
                styles.helpText,
                {
                  fontSize: config.smallFontSize,
                  lineHeight: config.smallFontSize * 1.5,
                },
              ]}
            >
              Refund requests are typically reviewed within 2-3 business days.
              You'll receive an email notification once your request has been
              processed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {},
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  // Info Banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.primary[50],
  },
  infoText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[700],
  },
  // Section
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  // Row
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  field: {},
  // Label
  label: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  // Input
  input: {
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  inputReadOnly: {
    backgroundColor: AppColors.gray[100],
    color: AppColors.gray[500],
  },
  inputFlex: {
    flex: 1,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
  },
  textArea: {
    paddingTop: 12,
  },
  // Helper text
  helperText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.gray[400],
    fontStyle: "italic",
  },
  charCount: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.gray[500],
    marginTop: 4,
  },
  // Date Input
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  // Amount Input
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  // Reasons
  reasonsContainer: {},
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  reasonOptionSelected: {
    backgroundColor: AppColors.primary[50],
    borderColor: AppColors.primary[500],
  },
  radioOuter: {
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: AppColors.primary[500],
  },
  radioInner: {
    backgroundColor: AppColors.primary[500],
  },
  reasonLabel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  reasonLabelSelected: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[700],
  },
  // Table styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: AppColors.gray[200],
    overflow: "hidden",
  },
  tableHeaderText: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: AppColors.gray[200],
    backgroundColor: AppColors.background.primary,
  },
  tableRowLast: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
  },
  tableQuestionCell: {
    flex: 3,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: AppColors.gray[100],
    justifyContent: "center",
  },
  tableQuestionText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  tableAnswerCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderColor: AppColors.gray[200],
  },
  radioButton: {
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: AppColors.primary[500],
  },
  // Agreement
  agreementContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: AppColors.primary[500],
    borderColor: AppColors.primary[500],
  },
  checkboxError: {
    borderColor: AppColors.error,
  },
  agreementText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  agreementError: {
    marginBottom: 16,
  },
  // Error
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: 4,
  },
  // Button
  buttonContainer: {},
  // Help
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.gray[50],
  },
  helpText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
  // Date Picker
  datePickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  datePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  datePickerContainer: {
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
    backgroundColor: "#ffffff",
  },
  datePickerTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  datePickerCancel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    paddingVertical: 4,
  },
  datePickerDone: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[500],
    paddingVertical: 4,
  },
  datePickerWrapper: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingBottom: 20,
  },
  datePicker: {
    width: "100%",
    height: 216,
    backgroundColor: "#ffffff",
  },
})
