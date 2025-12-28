import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import {
  Address,
  ADDRESS_LABELS,
  AddressFormData,
  AddressType,
  AddressValidationErrors,
  AUSTRALIAN_STATES,
} from "@/src/types/address"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface Props {
  initialData?: Address
  onSubmit: (data: AddressFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
}

const AddressForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Address",
}) => {
  const { config, isTablet, isLandscape } = useResponsive()

  // Form state
  const [formData, setFormData] = useState<AddressFormData>({
    label: initialData?.label || "Home",
    type: initialData?.type || "both",
    is_default: initialData?.is_default || false,
    full_name: initialData?.full_name || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    line1: initialData?.line1 || "",
    line2: initialData?.line2 || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    postal_code: initialData?.postal_code || "",
    country: initialData?.country || "Australia",
  })

  const [errors, setErrors] = useState<AddressValidationErrors>({})
  const [showStateModal, setShowStateModal] = useState(false)
  const [showLabelModal, setShowLabelModal] = useState(false)

  // Content max width for tablet
  const contentMaxWidth = isTablet ? (isLandscape ? 600 : 550) : undefined

  // Responsive sizes
  const inputPaddingH = isTablet ? 16 : 14
  const inputPaddingV = isTablet ? 16 : 14
  const inputFontSize = isTablet ? 16 : 15
  const inputBorderRadius = isTablet ? 14 : 12

  // Update form field
  const updateField = (field: keyof AddressFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof AddressValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: AddressValidationErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[\d\s+()-]{8,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.line1.trim()) {
      newErrors.line1 = "Street address is required"
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required"
    }

    if (!formData.state) {
      newErrors.state = "State is required"
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = "Postal code is required"
    } else if (!/^\d{4}$/.test(formData.postal_code)) {
      newErrors.postal_code = "Please enter a valid 4-digit postal code"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return
    await onSubmit(formData)
  }

  // Get selected label icon
  const getLabelIcon = (): keyof typeof Ionicons.glyphMap => {
    const label = ADDRESS_LABELS.find((l) => l.value === formData.label)
    return (label?.icon as keyof typeof Ionicons.glyphMap) || "location-outline"
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          padding: config.horizontalPadding,
          paddingBottom: isTablet ? 60 : 40,
          maxWidth: contentMaxWidth,
          alignSelf: contentMaxWidth ? "center" : undefined,
          width: contentMaxWidth ? "100%" : undefined,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Label Selector */}
      <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: isTablet ? 17 : 16, marginBottom: isTablet ? 14 : 12 },
          ]}
        >
          Address Label
        </Text>
        <DebouncedTouchable
          style={[
            styles.selector,
            {
              paddingHorizontal: inputPaddingH,
              paddingVertical: inputPaddingV,
              borderRadius: inputBorderRadius,
            },
          ]}
          onPress={() => setShowLabelModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.selectorLeft, { gap: isTablet ? 12 : 10 }]}>
            <Ionicons
              name={getLabelIcon()}
              size={isTablet ? 22 : 20}
              color={AppColors.primary[600]}
            />
            <Text style={[styles.selectorText, { fontSize: inputFontSize }]}>
              {formData.label || "Select Label"}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={isTablet ? 22 : 20}
            color={AppColors.gray[400]}
          />
        </DebouncedTouchable>
      </View>

      {/* Address Type */}
      <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: isTablet ? 17 : 16, marginBottom: isTablet ? 14 : 12 },
          ]}
        >
          Address Type
        </Text>
        <View style={[styles.typeContainer, { gap: isTablet ? 12 : 10 }]}>
          {(["both", "shipping", "billing"] as AddressType[]).map((type) => (
            <DebouncedTouchable
              key={type}
              style={[
                styles.typeButton,
                {
                  paddingVertical: isTablet ? 14 : 12,
                  borderRadius: isTablet ? 12 : 10,
                },
                formData.type === type && styles.typeButtonActive,
              ]}
              onPress={() => updateField("type", type)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { fontSize: config.bodyFontSize },
                  formData.type === type && styles.typeButtonTextActive,
                ]}
              >
                {type === "both"
                  ? "Both"
                  : type === "shipping"
                  ? "Shipping"
                  : "Billing"}
              </Text>
            </DebouncedTouchable>
          ))}
        </View>
      </View>

      {/* Contact Information */}
      <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: isTablet ? 17 : 16, marginBottom: isTablet ? 14 : 12 },
          ]}
        >
          Contact Information
        </Text>

        {/* Full Name */}
        <View style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}>
          <Text
            style={[
              styles.inputLabel,
              {
                fontSize: config.bodyFontSize - 1,
                marginBottom: isTablet ? 8 : 6,
              },
            ]}
          >
            Full Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                paddingHorizontal: inputPaddingH,
                paddingVertical: inputPaddingV,
                borderRadius: inputBorderRadius,
                fontSize: inputFontSize,
              },
              errors.full_name && styles.inputError,
            ]}
            value={formData.full_name}
            onChangeText={(text) => updateField("full_name", text)}
            placeholder="Enter full name"
            placeholderTextColor={AppColors.gray[400]}
            autoCapitalize="words"
          />
          {errors.full_name && (
            <Text
              style={[styles.errorText, { fontSize: config.smallFontSize }]}
            >
              {errors.full_name}
            </Text>
          )}
        </View>

        {/* Phone */}
        <View style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}>
          <Text
            style={[
              styles.inputLabel,
              {
                fontSize: config.bodyFontSize - 1,
                marginBottom: isTablet ? 8 : 6,
              },
            ]}
          >
            Phone Number *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                paddingHorizontal: inputPaddingH,
                paddingVertical: inputPaddingV,
                borderRadius: inputBorderRadius,
                fontSize: inputFontSize,
              },
              errors.phone && styles.inputError,
            ]}
            value={formData.phone}
            onChangeText={(text) => updateField("phone", text)}
            placeholder="Enter phone number"
            placeholderTextColor={AppColors.gray[400]}
            keyboardType="phone-pad"
          />
          {errors.phone && (
            <Text
              style={[styles.errorText, { fontSize: config.smallFontSize }]}
            >
              {errors.phone}
            </Text>
          )}
        </View>

        {/* Email (Optional) */}
        <View style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}>
          <Text
            style={[
              styles.inputLabel,
              {
                fontSize: config.bodyFontSize - 1,
                marginBottom: isTablet ? 8 : 6,
              },
            ]}
          >
            Email (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                paddingHorizontal: inputPaddingH,
                paddingVertical: inputPaddingV,
                borderRadius: inputBorderRadius,
                fontSize: inputFontSize,
              },
              errors.email && styles.inputError,
            ]}
            value={formData.email}
            onChangeText={(text) => updateField("email", text)}
            placeholder="Enter email address"
            placeholderTextColor={AppColors.gray[400]}
            keyboardType="email-address"
            autoCapitalize="none"
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

      {/* Address Details */}
      <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: isTablet ? 17 : 16, marginBottom: isTablet ? 14 : 12 },
          ]}
        >
          Address Details
        </Text>

        {/* Street Address */}
        <View style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}>
          <Text
            style={[
              styles.inputLabel,
              {
                fontSize: config.bodyFontSize - 1,
                marginBottom: isTablet ? 8 : 6,
              },
            ]}
          >
            Street Address *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                paddingHorizontal: inputPaddingH,
                paddingVertical: inputPaddingV,
                borderRadius: inputBorderRadius,
                fontSize: inputFontSize,
              },
              errors.line1 && styles.inputError,
            ]}
            value={formData.line1}
            onChangeText={(text) => updateField("line1", text)}
            placeholder="Enter street address"
            placeholderTextColor={AppColors.gray[400]}
          />
          {errors.line1 && (
            <Text
              style={[styles.errorText, { fontSize: config.smallFontSize }]}
            >
              {errors.line1}
            </Text>
          )}
        </View>

        {/* Apartment/Unit */}
        <View style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}>
          <Text
            style={[
              styles.inputLabel,
              {
                fontSize: config.bodyFontSize - 1,
                marginBottom: isTablet ? 8 : 6,
              },
            ]}
          >
            Apartment / Unit (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                paddingHorizontal: inputPaddingH,
                paddingVertical: inputPaddingV,
                borderRadius: inputBorderRadius,
                fontSize: inputFontSize,
              },
            ]}
            value={formData.line2}
            onChangeText={(text) => updateField("line2", text)}
            placeholder="Apartment, suite, unit, etc."
            placeholderTextColor={AppColors.gray[400]}
          />
        </View>

        {/* City */}
        <View style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}>
          <Text
            style={[
              styles.inputLabel,
              {
                fontSize: config.bodyFontSize - 1,
                marginBottom: isTablet ? 8 : 6,
              },
            ]}
          >
            City / Suburb *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                paddingHorizontal: inputPaddingH,
                paddingVertical: inputPaddingV,
                borderRadius: inputBorderRadius,
                fontSize: inputFontSize,
              },
              errors.city && styles.inputError,
            ]}
            value={formData.city}
            onChangeText={(text) => updateField("city", text)}
            placeholder="Enter city or suburb"
            placeholderTextColor={AppColors.gray[400]}
          />
          {errors.city && (
            <Text
              style={[styles.errorText, { fontSize: config.smallFontSize }]}
            >
              {errors.city}
            </Text>
          )}
        </View>

        {/* State & Postal Code Row */}
        <View style={[styles.row, { gap: isTablet ? 14 : 12 }]}>
          {/* State */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text
              style={[
                styles.inputLabel,
                {
                  fontSize: config.bodyFontSize - 1,
                  marginBottom: isTablet ? 8 : 6,
                },
              ]}
            >
              State *
            </Text>
            <DebouncedTouchable
              style={[
                styles.selector,
                {
                  paddingHorizontal: inputPaddingH,
                  paddingVertical: inputPaddingV,
                  borderRadius: inputBorderRadius,
                },
                errors.state && styles.inputError,
              ]}
              onPress={() => setShowStateModal(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectorText,
                  { fontSize: inputFontSize },
                  !formData.state && styles.selectorPlaceholder,
                ]}
              >
                {formData.state || "Select"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={isTablet ? 20 : 18}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>
            {errors.state && (
              <Text
                style={[styles.errorText, { fontSize: config.smallFontSize }]}
              >
                {errors.state}
              </Text>
            )}
          </View>

          {/* Postal Code */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text
              style={[
                styles.inputLabel,
                {
                  fontSize: config.bodyFontSize - 1,
                  marginBottom: isTablet ? 8 : 6,
                },
              ]}
            >
              Postal Code *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  paddingHorizontal: inputPaddingH,
                  paddingVertical: inputPaddingV,
                  borderRadius: inputBorderRadius,
                  fontSize: inputFontSize,
                },
                errors.postal_code && styles.inputError,
              ]}
              value={formData.postal_code}
              onChangeText={(text) => updateField("postal_code", text)}
              placeholder="0000"
              placeholderTextColor={AppColors.gray[400]}
              keyboardType="number-pad"
              maxLength={4}
            />
            {errors.postal_code && (
              <Text
                style={[styles.errorText, { fontSize: config.smallFontSize }]}
              >
                {errors.postal_code}
              </Text>
            )}
          </View>
        </View>

        {/* Country (Read-only) */}
        <View style={[styles.inputGroup, { marginTop: isTablet ? 18 : 16 }]}>
          <Text
            style={[
              styles.inputLabel,
              {
                fontSize: config.bodyFontSize - 1,
                marginBottom: isTablet ? 8 : 6,
              },
            ]}
          >
            Country
          </Text>
          <View
            style={[
              styles.input,
              styles.inputDisabled,
              {
                paddingHorizontal: inputPaddingH,
                paddingVertical: inputPaddingV,
                borderRadius: inputBorderRadius,
              },
            ]}
          >
            <Text
              style={[styles.inputDisabledText, { fontSize: inputFontSize }]}
            >
              Australia
            </Text>
          </View>
        </View>
      </View>

      {/* Set as Default */}
      <DebouncedTouchable
        style={[
          styles.defaultToggle,
          {
            gap: isTablet ? 14 : 12,
            paddingVertical: isTablet ? 18 : 16,
            marginBottom: isTablet ? 28 : 24,
          },
        ]}
        onPress={() => updateField("is_default", !formData.is_default)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            {
              width: isTablet ? 28 : 24,
              height: isTablet ? 28 : 24,
              borderRadius: isTablet ? 8 : 6,
            },
            formData.is_default && styles.checkboxChecked,
          ]}
        >
          {formData.is_default && (
            <Ionicons
              name="checkmark"
              size={isTablet ? 16 : 14}
              color="white"
            />
          )}
        </View>
        <Text
          style={[styles.defaultToggleText, { fontSize: config.bodyFontSize }]}
        >
          Set as default address
        </Text>
      </DebouncedTouchable>

      {/* Action Buttons */}
      <View style={[styles.actions, { marginTop: isTablet ? 12 : 8 }]}>
        <Button
          title={submitLabel}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
        />
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          disabled={isLoading}
          containerStyles="mt-3"
        />
      </View>

      {/* State Picker Modal */}
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
                maxWidth: isTablet ? 500 : undefined,
                alignSelf: isTablet ? "center" : undefined,
                width: isTablet ? "90%" : undefined,
                borderTopLeftRadius: isTablet ? 28 : 24,
                borderTopRightRadius: isTablet ? 28 : 24,
              },
            ]}
          >
            <View style={[styles.modalHeader, { padding: isTablet ? 24 : 20 }]}>
              <Text
                style={[styles.modalTitle, { fontSize: isTablet ? 20 : 18 }]}
              >
                Select State
              </Text>
              <DebouncedTouchable onPress={() => setShowStateModal(false)}>
                <Ionicons
                  name="close"
                  size={isTablet ? 26 : 24}
                  color={AppColors.text.primary}
                />
              </DebouncedTouchable>
            </View>
            <ScrollView
              style={[styles.modalList, { padding: isTablet ? 10 : 8 }]}
            >
              {AUSTRALIAN_STATES.map((state) => (
                <DebouncedTouchable
                  key={state.value}
                  style={[
                    styles.modalItem,
                    {
                      paddingVertical: isTablet ? 16 : 14,
                      paddingHorizontal: isTablet ? 18 : 16,
                      borderRadius: isTablet ? 12 : 10,
                    },
                    formData.state === state.value && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    updateField("state", state.value)
                    setShowStateModal(false)
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      { fontSize: config.bodyFontSize },
                      formData.state === state.value &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {state.label}
                  </Text>
                  {formData.state === state.value && (
                    <Ionicons
                      name="checkmark"
                      size={isTablet ? 22 : 20}
                      color={AppColors.primary[600]}
                    />
                  )}
                </DebouncedTouchable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Label Picker Modal */}
      <Modal
        visible={showLabelModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLabelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                maxWidth: isTablet ? 500 : undefined,
                alignSelf: isTablet ? "center" : undefined,
                width: isTablet ? "90%" : undefined,
                borderTopLeftRadius: isTablet ? 28 : 24,
                borderTopRightRadius: isTablet ? 28 : 24,
              },
            ]}
          >
            <View style={[styles.modalHeader, { padding: isTablet ? 24 : 20 }]}>
              <Text
                style={[styles.modalTitle, { fontSize: isTablet ? 20 : 18 }]}
              >
                Select Label
              </Text>
              <DebouncedTouchable onPress={() => setShowLabelModal(false)}>
                <Ionicons
                  name="close"
                  size={isTablet ? 26 : 24}
                  color={AppColors.text.primary}
                />
              </DebouncedTouchable>
            </View>
            <ScrollView
              style={[styles.modalList, { padding: isTablet ? 10 : 8 }]}
            >
              {ADDRESS_LABELS.map((label) => (
                <DebouncedTouchable
                  key={label.value}
                  style={[
                    styles.modalItem,
                    {
                      paddingVertical: isTablet ? 16 : 14,
                      paddingHorizontal: isTablet ? 18 : 16,
                      borderRadius: isTablet ? 12 : 10,
                    },
                    formData.label === label.value && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    updateField("label", label.value)
                    setShowLabelModal(false)
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.modalItemLeft, { gap: isTablet ? 14 : 12 }]}
                  >
                    <Ionicons
                      name={label.icon as keyof typeof Ionicons.glyphMap}
                      size={isTablet ? 22 : 20}
                      color={
                        formData.label === label.value
                          ? AppColors.primary[600]
                          : AppColors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.modalItemText,
                        { fontSize: config.bodyFontSize },
                        formData.label === label.value &&
                          styles.modalItemTextSelected,
                      ]}
                    >
                      {label.label}
                    </Text>
                  </View>
                  {formData.label === label.value && (
                    <Ionicons
                      name="checkmark"
                      size={isTablet ? 22 : 20}
                      color={AppColors.primary[600]}
                    />
                  )}
                </DebouncedTouchable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

export default AddressForm

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
  },
  content: {},
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  // Input
  inputGroup: {},
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  input: {
    backgroundColor: AppColors.background.primary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  inputDisabled: {
    backgroundColor: AppColors.gray[100],
    justifyContent: "center",
  },
  inputDisabledText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
  },
  // Selector
  selector: {
    backgroundColor: AppColors.background.primary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  selectorPlaceholder: {
    color: AppColors.gray[400],
  },
  // Type Buttons
  typeContainer: {
    flexDirection: "row",
  },
  typeButton: {
    flex: 1,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: AppColors.primary[500],
  },
  typeButtonText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  typeButtonTextActive: {
    color: "white",
  },
  // Default Toggle
  defaultToggle: {
    flexDirection: "row",
    alignItems: "center",
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
  defaultToggleText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  // Actions
  actions: {},
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.background.primary,
    maxHeight: "60%",
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
  modalList: {},
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalItemSelected: {
    backgroundColor: AppColors.primary[50],
  },
  modalItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalItemText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  modalItemTextSelected: {
    color: AppColors.primary[600],
  },
})
