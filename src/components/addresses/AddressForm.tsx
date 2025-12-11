import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import {
  Address,
  ADDRESS_LABELS,
  AddressFormData,
  AddressType,
  AddressValidationErrors,
  AUSTRALIAN_STATES,
} from "@/src/types/address"

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

  // Update form field
  const updateField = (field: keyof AddressFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is updated
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

  // Get selected state label
  const getStateLabel = (): string => {
    const state = AUSTRALIAN_STATES.find((s) => s.value === formData.state)
    return state?.label || "Select State"
  }

  // Get selected label icon
  const getLabelIcon = (): keyof typeof Ionicons.glyphMap => {
    const label = ADDRESS_LABELS.find((l) => l.value === formData.label)
    return (label?.icon as keyof typeof Ionicons.glyphMap) || "location-outline"
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Label Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address Label</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowLabelModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectorLeft}>
            <Ionicons
              name={getLabelIcon()}
              size={20}
              color={AppColors.primary[600]}
            />
            <Text style={styles.selectorText}>
              {formData.label || "Select Label"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={AppColors.gray[400]} />
        </TouchableOpacity>
      </View>

      {/* Address Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address Type</Text>
        <View style={styles.typeContainer}>
          {(["both", "shipping", "billing"] as AddressType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                formData.type === type && styles.typeButtonActive,
              ]}
              onPress={() => updateField("type", type)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === type && styles.typeButtonTextActive,
                ]}
              >
                {type === "both"
                  ? "Both"
                  : type === "shipping"
                  ? "Shipping"
                  : "Billing"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={[styles.input, errors.full_name && styles.inputError]}
            value={formData.full_name}
            onChangeText={(text) => updateField("full_name", text)}
            placeholder="Enter full name"
            placeholderTextColor={AppColors.gray[400]}
            autoCapitalize="words"
          />
          {errors.full_name && (
            <Text style={styles.errorText}>{errors.full_name}</Text>
          )}
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={formData.phone}
            onChangeText={(text) => updateField("phone", text)}
            placeholder="Enter phone number"
            placeholderTextColor={AppColors.gray[400]}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Email (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email (Optional)</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={formData.email}
            onChangeText={(text) => updateField("email", text)}
            placeholder="Enter email address"
            placeholderTextColor={AppColors.gray[400]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>
      </View>

      {/* Address Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address Details</Text>

        {/* Street Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Street Address *</Text>
          <TextInput
            style={[styles.input, errors.line1 && styles.inputError]}
            value={formData.line1}
            onChangeText={(text) => updateField("line1", text)}
            placeholder="Enter street address"
            placeholderTextColor={AppColors.gray[400]}
          />
          {errors.line1 && <Text style={styles.errorText}>{errors.line1}</Text>}
        </View>

        {/* Apartment/Unit */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Apartment / Unit (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.line2}
            onChangeText={(text) => updateField("line2", text)}
            placeholder="Apartment, suite, unit, etc."
            placeholderTextColor={AppColors.gray[400]}
          />
        </View>

        {/* City */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City / Suburb *</Text>
          <TextInput
            style={[styles.input, errors.city && styles.inputError]}
            value={formData.city}
            onChangeText={(text) => updateField("city", text)}
            placeholder="Enter city or suburb"
            placeholderTextColor={AppColors.gray[400]}
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>

        {/* State & Postal Code Row */}
        <View style={styles.row}>
          {/* State */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>State *</Text>
            <TouchableOpacity
              style={[styles.selector, errors.state && styles.inputError]}
              onPress={() => setShowStateModal(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectorText,
                  !formData.state && styles.selectorPlaceholder,
                ]}
              >
                {formData.state || "Select"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={AppColors.gray[400]}
              />
            </TouchableOpacity>
            {errors.state && (
              <Text style={styles.errorText}>{errors.state}</Text>
            )}
          </View>

          {/* Postal Code */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Postal Code *</Text>
            <TextInput
              style={[styles.input, errors.postal_code && styles.inputError]}
              value={formData.postal_code}
              onChangeText={(text) => updateField("postal_code", text)}
              placeholder="0000"
              placeholderTextColor={AppColors.gray[400]}
              keyboardType="number-pad"
              maxLength={4}
            />
            {errors.postal_code && (
              <Text style={styles.errorText}>{errors.postal_code}</Text>
            )}
          </View>
        </View>

        {/* Country (Read-only) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Country</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>Australia</Text>
          </View>
        </View>
      </View>

      {/* Set as Default */}
      <TouchableOpacity
        style={styles.defaultToggle}
        onPress={() => updateField("is_default", !formData.is_default)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            formData.is_default && styles.checkboxChecked,
          ]}
        >
          {formData.is_default && (
            <Ionicons name="checkmark" size={14} color="white" />
          )}
        </View>
        <Text style={styles.defaultToggleText}>Set as default address</Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actions}>
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
            <ScrollView style={styles.modalList}>
              {AUSTRALIAN_STATES.map((state) => (
                <TouchableOpacity
                  key={state.value}
                  style={[
                    styles.modalItem,
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
                      formData.state === state.value &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {state.label}
                  </Text>
                  {formData.state === state.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={AppColors.primary[600]}
                    />
                  )}
                </TouchableOpacity>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Label</Text>
              <TouchableOpacity onPress={() => setShowLabelModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={AppColors.text.primary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {ADDRESS_LABELS.map((label) => (
                <TouchableOpacity
                  key={label.value}
                  style={[
                    styles.modalItem,
                    formData.label === label.value && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    updateField("label", label.value)
                    setShowLabelModal(false)
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemLeft}>
                    <Ionicons
                      name={label.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={
                        formData.label === label.value
                          ? AppColors.primary[600]
                          : AppColors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.modalItemText,
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
                      size={20}
                      color={AppColors.primary[600]}
                    />
                  )}
                </TouchableOpacity>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
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
    fontSize: 15,
    color: AppColors.text.secondary,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  // Selector
  selector: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  selectorPlaceholder: {
    color: AppColors.gray[400],
  },
  // Type Buttons
  typeContainer: {
    flexDirection: "row",
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: AppColors.primary[500],
  },
  typeButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  typeButtonTextActive: {
    color: "white",
  },
  // Default Toggle
  defaultToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
    fontSize: 15,
    color: AppColors.text.primary,
  },
  // Actions
  actions: {
    marginTop: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  modalList: {
    padding: 8,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalItemSelected: {
    backgroundColor: AppColors.primary[50],
  },
  modalItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalItemText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  modalItemTextSelected: {
    color: AppColors.primary[600],
  },
})
