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
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { getRefundByOrderNumber, submitRefundRequest } from "@/src/api/refund"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { CreateRefundRequestParams, RefundReason } from "@/src/types/refund"

// Refund reasons
const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: "damaged_product", label: "Product was damaged" },
  { value: "wrong_product", label: "Received wrong product" },
  { value: "quality_issue", label: "Quality not as expected" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "late_delivery", label: "Delivery was too late" },
  { value: "other", label: "Other reason" },
]

// Questions based on reason
const QUESTIONS_BY_REASON: Record<RefundReason, string[]> = {
  damaged_product: [
    "Please describe the damage",
    "When did you notice the damage?",
  ],
  wrong_product: [
    "What product did you receive?",
    "What product did you order?",
  ],
  quality_issue: [
    "What quality issues did you experience?",
    "Was the product expired or close to expiry?",
  ],
  changed_mind: [],
  late_delivery: [
    "How many days late was the delivery?",
    "Did late delivery cause any issues?",
  ],
  other: [],
}

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
  answers: Record<string, string>
}

interface FormErrors {
  fName?: string
  lName?: string
  email?: string
  orderNumber?: string
  reason?: string
  otherReason?: string
  requestedAmount?: string
  refundAccountAgreement?: string
  purchaseDate?: string
  answers?: Record<string, string>
}

export default function RefundRequestScreen() {
  const router = useRouter()
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
    answers: {},
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isCheckingOrder, setIsCheckingOrder] = useState(false)
  const [existingRequest, setExistingRequest] = useState<boolean>(false)

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
          }
        } catch (error) {
          // Ignore error
        } finally {
          setIsCheckingOrder(false)
        }
      }
    }

    const debounce = setTimeout(checkExistingRefund, 500)
    return () => clearTimeout(debounce)
  }, [formData.orderNumber])

  // Get questions for selected reason
  const questions = formData.reason ? QUESTIONS_BY_REASON[formData.reason] : []

  // Update field
  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Update answer
  const updateAnswer = (question: string, answer: string) => {
    setFormData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [question]: answer },
    }))
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

    if (formData.reason === "other" && !formData.otherReason.trim()) {
      newErrors.otherReason = "Please specify the reason"
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

    // Validate answers
    const answerErrors: Record<string, string> = {}
    questions.forEach((q) => {
      if (!formData.answers[q]?.trim()) {
        answerErrors[q] = "This field is required"
      }
    })
    if (Object.keys(answerErrors).length > 0) {
      newErrors.answers = answerErrors
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
      // Build questions array
      const questionsArray = questions.map((q) => ({
        question: q,
        answer: formData.answers[q] || "",
      }))

      const params: CreateRefundRequestParams = {
        fName: formData.fName.trim(),
        lName: formData.lName.trim(),
        email: formData.email.toLowerCase().trim(),
        order_number: formData.orderNumber.trim(),
        reason: formData.reason!,
        other_reason:
          formData.reason === "other" ? formData.otherReason.trim() : undefined,
        requested_amount: parseFloat(formData.requestedAmount),
        additional_notes: formData.additionalNotes.trim() || undefined,
        refund_account_agreement: formData.refundAccountAgreement,
        questions: questionsArray.length > 0 ? questionsArray : undefined,
        purchase_date: formData.purchaseDate.toISOString().split("T")[0],
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

  return (
    <Wrapper style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle"
              size={20}
              color={AppColors.primary[600]}
            />
            <Text style={styles.infoText}>
              Please provide accurate information to help us process your refund
              request quickly.
            </Text>
          </View>

          {/* Personal Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {/* Name Row */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={[styles.input, errors.fName && styles.inputError]}
                  placeholder="First name"
                  placeholderTextColor={AppColors.gray[400]}
                  value={formData.fName}
                  onChangeText={(text) => updateField("fName", text)}
                  editable={!isSubmitting}
                />
                {errors.fName && (
                  <Text style={styles.errorText}>{errors.fName}</Text>
                )}
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={[styles.input, errors.lName && styles.inputError]}
                  placeholder="Last name"
                  placeholderTextColor={AppColors.gray[400]}
                  value={formData.lName}
                  onChangeText={(text) => updateField("lName", text)}
                  editable={!isSubmitting}
                />
                {errors.lName && (
                  <Text style={styles.errorText}>{errors.lName}</Text>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="your@email.com"
                placeholderTextColor={AppColors.gray[400]}
                value={formData.email}
                onChangeText={(text) => updateField("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
          </View>

          {/* Order Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Information</Text>

            {/* Order Number */}
            <View style={styles.field}>
              <Text style={styles.label}>Order Number *</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    errors.orderNumber && styles.inputError,
                  ]}
                  placeholder="e.g., ORD-12345"
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
                    style={styles.inputIcon}
                  />
                )}
              </View>
              {errors.orderNumber && (
                <Text style={styles.errorText}>{errors.orderNumber}</Text>
              )}
            </View>

            {/* Purchase Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Purchase Date *</Text>
              <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                onPress={() => setShowDatePicker(true)}
                disabled={isSubmitting}
              >
                <Text style={styles.dateText}>
                  {formatDate(formData.purchaseDate)}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={AppColors.gray[400]}
                />
              </TouchableOpacity>
            </View>

            {showDatePicker && Platform.OS === "ios" && (
              <Modal
                transparent
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.datePickerOverlay}>
                  <TouchableOpacity
                    style={styles.datePickerBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowDatePicker(false)}
                  />
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.datePickerCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>Purchase Date</Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.datePickerDone}>Done</Text>
                      </TouchableOpacity>
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

            {/* Requested Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Requested Refund Amount *</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    styles.amountField,
                    errors.requestedAmount && styles.inputError,
                    { paddingLeft: 10 },
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
                <Text style={styles.errorText}>{errors.requestedAmount}</Text>
              )}
            </View>
          </View>

          {/* Reason Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Refund</Text>

            {/* Reason Selection */}
            <View style={styles.reasonsContainer}>
              {REFUND_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonOption,
                    formData.reason === reason.value &&
                      styles.reasonOptionSelected,
                  ]}
                  onPress={() => {
                    updateField("reason", reason.value)
                    updateField("answers", {})
                  }}
                  disabled={isSubmitting}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      formData.reason === reason.value &&
                        styles.radioOuterSelected,
                    ]}
                  >
                    {formData.reason === reason.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.reasonLabel,
                      formData.reason === reason.value &&
                        styles.reasonLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.reason && (
              <Text style={styles.errorText}>{errors.reason}</Text>
            )}

            {/* Other Reason */}
            {formData.reason === "other" && (
              <View style={styles.field}>
                <Text style={styles.label}>Please specify *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    errors.otherReason && styles.inputError,
                  ]}
                  placeholder="Describe your reason..."
                  placeholderTextColor={AppColors.gray[400]}
                  value={formData.otherReason}
                  onChangeText={(text) => updateField("otherReason", text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                {errors.otherReason && (
                  <Text style={styles.errorText}>{errors.otherReason}</Text>
                )}
              </View>
            )}

            {/* Dynamic Questions */}
            {questions.length > 0 && (
              <View style={styles.questionsContainer}>
                <Text style={styles.questionsTitle}>
                  Please answer the following:
                </Text>
                {questions.map((question, index) => (
                  <View key={index} style={styles.field}>
                    <Text style={styles.label}>{question} *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        errors.answers?.[question] && styles.inputError,
                      ]}
                      placeholder="Your answer..."
                      placeholderTextColor={AppColors.gray[400]}
                      value={formData.answers[question] || ""}
                      onChangeText={(text) => updateAnswer(question, text)}
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                      editable={!isSubmitting}
                    />
                    {errors.answers?.[question] && (
                      <Text style={styles.errorText}>
                        {errors.answers[question]}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any other details that might help us process your request..."
                placeholderTextColor={AppColors.gray[400]}
                value={formData.additionalNotes}
                onChangeText={(text) => updateField("additionalNotes", text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Agreement */}
          <TouchableOpacity
            style={styles.agreementContainer}
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
                formData.refundAccountAgreement && styles.checkboxChecked,
                errors.refundAccountAgreement && styles.checkboxError,
              ]}
            >
              {formData.refundAccountAgreement && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.agreementText}>
              I agree to receive the refund to my original payment method.*
            </Text>
          </TouchableOpacity>
          {errors.refundAccountAgreement && (
            <Text style={[styles.errorText, styles.agreementError]}>
              {errors.refundAccountAgreement}
            </Text>
          )}

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isSubmitting ? "Submitting..." : "Submit Refund Request"}
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              containerStyles="w-full"
            />
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons
              name="time-outline"
              size={18}
              color={AppColors.text.tertiary}
            />
            <Text style={styles.helpText}>
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
  container: {
    paddingTop: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: AppColors.primary[50],
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.primary[700],
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppColors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.primary,
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
    right: 14,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.text.primary,
    marginRight: 8,
  },
  amountField: {
    paddingLeft: 0,
  },
  reasonsContainer: {
    gap: 10,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: AppColors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  reasonOptionSelected: {
    backgroundColor: AppColors.primary[50],
    borderColor: AppColors.primary[500],
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: AppColors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary[500],
  },
  reasonLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  reasonLabelSelected: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[700],
  },
  questionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  questionsTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginBottom: 12,
  },
  agreementContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
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
    fontSize: 13,
    color: AppColors.text.secondary,
    lineHeight: 18,
  },
  agreementError: {
    marginLeft: 34,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
  },
  helpText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    lineHeight: 18,
  },

  // datepicker
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
    backgroundColor: "#ffffff",
  },
  datePickerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  datePickerCancel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    paddingVertical: 4,
  },
  datePickerDone: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
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
