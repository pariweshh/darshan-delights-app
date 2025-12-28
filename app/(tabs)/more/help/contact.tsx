import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import Toast from "react-native-toast-message"

import { sendMessage } from "@/src/api/contact"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"

const SUBJECTS = [
  "Order Inquiry",
  "Product Question",
  "Delivery Issue",
  "Account Help",
  "Refund Request",
  "Other",
]

export default function ContactScreen() {
  const { config, isTablet, isLandscape } = useResponsive()
  const { user } = useAuthStore()

  const [name, setName] = useState(
    user ? `${user.fName || ""} ${user.lName || ""}`.trim() : ""
  )
  const [email, setEmail] = useState(user?.email || "")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Layout configuration
  const contentMaxWidth = isTablet ? (isLandscape ? 600 : 550) : undefined

  // Responsive sizes
  const iconContainerSize = isTablet ? 44 : 40
  const iconSize = isTablet ? 22 : 20
  const inputPaddingH = isTablet ? 16 : 14
  const inputPaddingV = isTablet ? 14 : 12
  const inputFontSize = isTablet ? 16 : 15
  const inputBorderRadius = isTablet ? 12 : 10

  // Contact methods
  const contactMethods = [
    {
      icon: "call-outline" as const,
      title: "Call Us",
      subtitle: "+61 452 550 534",
      description: "Mon-Fri 5PM-8PM, Sat-Sun 9AM-5PM",
      action: "Call Now",
      onPress: () => Linking.openURL("tel:+61452550534"),
    },
    {
      icon: "mail-outline" as const,
      title: "Email Us",
      subtitle: "support@darshandelights.com.au",
      description: "We typically reply within 2-4 hours",
      action: "Send Email",
      onPress: () => Linking.openURL("mailto:support@darshandelights.com.au"),
    },
    {
      icon: "logo-whatsapp" as const,
      title: "WhatsApp",
      subtitle: "+61 452 550 534",
      description: "Quick responses via WhatsApp",
      action: "Chat Now",
      onPress: () => Linking.openURL("https://wa.me/61452550534"),
    },
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!selectedSubject) newErrors.subject = "Please select a subject"
    if (!message.trim()) {
      newErrors.message = "Message is required"
    } else if (message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in all required fields",
        visibilityTime: 2000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await sendMessage({
        name,
        email,
        subject: selectedSubject,
        message,
      })

      if (res?.status === "success") {
        Alert.alert(
          "Message Sent!",
          "Thank you for reaching out. We'll get back to you soon.",
          [
            {
              text: "OK",
              onPress: () => {
                setSelectedSubject("")
                setMessage("")
              },
            },
          ]
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
      Toast.show({
        type: "error",
        text1: "Failed to Send",
        text2: "Please try again later",
        visibilityTime: 2000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    if (field === "name") setName(value)
    if (field === "email") setEmail(value)
    if (field === "message") setMessage(value)
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Wrapper style={styles.container} edges={[]}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: config.horizontalPadding,
            paddingBottom: isTablet ? 60 : 40,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={250}
      >
        {/* Contact Methods */}
        <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isTablet ? 17 : 16,
                marginBottom: isTablet ? 14 : 12,
              },
            ]}
          >
            Get in Touch
          </Text>
          {contactMethods.map((method, index) => (
            <View
              key={index}
              style={[
                styles.contactCard,
                {
                  padding: isTablet ? 18 : 16,
                  borderRadius: isTablet ? 14 : 12,
                  marginBottom: isTablet ? 14 : 12,
                },
              ]}
            >
              <View
                style={[
                  styles.contactInfo,
                  { marginBottom: isTablet ? 14 : 12 },
                ]}
              >
                <View
                  style={[
                    styles.contactHeader,
                    { marginBottom: isTablet ? 10 : 8 },
                  ]}
                >
                  <View
                    style={[
                      styles.contactIcon,
                      {
                        width: iconContainerSize,
                        height: iconContainerSize,
                        borderRadius: isTablet ? 12 : 10,
                        marginRight: isTablet ? 14 : 12,
                      },
                    ]}
                  >
                    <Ionicons
                      name={method.icon}
                      size={iconSize}
                      color={AppColors.primary[600]}
                    />
                  </View>
                  <View style={styles.contactText}>
                    <Text
                      style={[
                        styles.contactTitle,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      {method.title}
                    </Text>
                    <Text
                      style={[
                        styles.contactSubtitle,
                        {
                          fontSize: config.bodyFontSize - 1,
                          marginTop: isTablet ? 4 : 2,
                        },
                      ]}
                    >
                      {method.subtitle}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.contactDescription,
                    {
                      fontSize: config.smallFontSize,
                      marginLeft: iconContainerSize + (isTablet ? 14 : 12),
                    },
                  ]}
                >
                  {method.description}
                </Text>
              </View>
              <DebouncedTouchable
                style={[
                  styles.contactAction,
                  {
                    paddingVertical: isTablet ? 12 : 10,
                    paddingHorizontal: isTablet ? 18 : 16,
                    borderRadius: isTablet ? 10 : 8,
                  },
                ]}
                onPress={method.onPress}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.contactActionText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  {method.action}
                </Text>
              </DebouncedTouchable>
            </View>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isTablet ? 17 : 16,
                marginBottom: isTablet ? 14 : 12,
              },
            ]}
          >
            Send us a Message
          </Text>
          <View
            style={[
              styles.formCard,
              {
                padding: isTablet ? 18 : 16,
                borderRadius: config.cardBorderRadius + 4,
              },
            ]}
          >
            <Text
              style={[
                styles.formSubtitle,
                {
                  fontSize: config.bodyFontSize - 1,
                  lineHeight: (config.bodyFontSize - 1) * 1.5,
                  marginBottom: isTablet ? 22 : 20,
                },
              ]}
            >
              We'd love to hear from you. Fill out the form below and we'll get
              back to you as soon as possible.
            </Text>

            {/* Name */}
            <View
              style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: config.bodyFontSize - 1,
                    marginBottom: isTablet ? 8 : 6,
                  },
                ]}
              >
                Your Name *
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
                  errors.name && styles.inputError,
                ]}
                value={name}
                onChangeText={(text) => updateField("name", text)}
                placeholder="Enter your full name"
                placeholderTextColor={AppColors.gray[400]}
                autoCapitalize="words"
              />
              {errors.name && (
                <Text
                  style={[styles.errorText, { fontSize: config.smallFontSize }]}
                >
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Email */}
            <View
              style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}
            >
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
                  {
                    paddingHorizontal: inputPaddingH,
                    paddingVertical: inputPaddingV,
                    borderRadius: inputBorderRadius,
                    fontSize: inputFontSize,
                  },
                  errors.email && styles.inputError,
                ]}
                value={email}
                onChangeText={(text) => updateField("email", text)}
                placeholder="Enter your email"
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

            {/* Subject */}
            <View
              style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: config.bodyFontSize - 1,
                    marginBottom: isTablet ? 8 : 6,
                  },
                ]}
              >
                Subject *
              </Text>
              <DebouncedTouchable
                style={[
                  styles.selector,
                  {
                    paddingHorizontal: inputPaddingH,
                    paddingVertical: inputPaddingV,
                    borderRadius: inputBorderRadius,
                  },
                  errors.subject && styles.inputError,
                ]}
                onPress={() => setShowSubjectModal(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { fontSize: inputFontSize },
                    !selectedSubject && styles.selectorPlaceholder,
                  ]}
                >
                  {selectedSubject || "Select a subject"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={isTablet ? 22 : 20}
                  color={AppColors.gray[400]}
                />
              </DebouncedTouchable>
              {errors.subject && (
                <Text
                  style={[styles.errorText, { fontSize: config.smallFontSize }]}
                >
                  {errors.subject}
                </Text>
              )}
            </View>

            {/* Message */}
            <View
              style={[styles.inputGroup, { marginBottom: isTablet ? 18 : 16 }]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: config.bodyFontSize - 1,
                    marginBottom: isTablet ? 8 : 6,
                  },
                ]}
              >
                Message *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    paddingHorizontal: inputPaddingH,
                    paddingVertical: inputPaddingV,
                    borderRadius: inputBorderRadius,
                    fontSize: inputFontSize,
                    minHeight: isTablet ? 140 : 120,
                  },
                  errors.message && styles.inputError,
                ]}
                value={message}
                onChangeText={(text) => updateField("message", text)}
                placeholder="Tell us how we can help you..."
                placeholderTextColor={AppColors.gray[400]}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={1000}
              />
              <View style={[styles.charCount, { marginTop: isTablet ? 6 : 4 }]}>
                <Text
                  style={[
                    styles.charCountText,
                    { fontSize: config.smallFontSize - 1 },
                  ]}
                >
                  {message.length}/1000
                </Text>
              </View>
              {errors.message && (
                <Text
                  style={[styles.errorText, { fontSize: config.smallFontSize }]}
                >
                  {errors.message}
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              title="Send Message"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={
                <Ionicons name="send" size={isTablet ? 20 : 18} color="white" />
              }
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Subject Modal */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSubjectModal(false)}
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
            <View style={[styles.modalHeader, { padding: isTablet ? 22 : 20 }]}>
              <Text
                style={[styles.modalTitle, { fontSize: isTablet ? 20 : 18 }]}
              >
                Select Subject
              </Text>
              <DebouncedTouchable onPress={() => setShowSubjectModal(false)}>
                <Ionicons
                  name="close"
                  size={isTablet ? 26 : 24}
                  color={AppColors.text.primary}
                />
              </DebouncedTouchable>
            </View>
            <ScrollView>
              {SUBJECTS.map((subject, index) => (
                <DebouncedTouchable
                  key={index}
                  style={[
                    styles.modalOption,
                    {
                      paddingVertical: isTablet ? 16 : 14,
                      paddingHorizontal: isTablet ? 22 : 20,
                    },
                    selectedSubject === subject && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedSubject(subject)
                    setShowSubjectModal(false)
                    if (errors.subject) {
                      setErrors((prev) => ({ ...prev, subject: "" }))
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { fontSize: config.bodyFontSize },
                      selectedSubject === subject &&
                        styles.modalOptionTextSelected,
                    ]}
                  >
                    {subject}
                  </Text>
                  {selectedSubject === subject && (
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
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  // Section
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  // Contact Card
  contactCard: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contactInfo: {},
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactIcon: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  contactSubtitle: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  contactDescription: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  contactAction: {
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
  },
  contactActionText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
  // Form Card
  formCard: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  formSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  // Input
  inputGroup: {},
  label: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  input: {
    backgroundColor: AppColors.gray[50],
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  textArea: {
    backgroundColor: AppColors.gray[50],
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: 4,
  },
  charCount: {
    alignItems: "flex-end",
  },
  charCountText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
  // Selector
  selector: {
    backgroundColor: AppColors.gray[50],
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  selectorPlaceholder: {
    color: AppColors.gray[400],
  },
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
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  modalOptionSelected: {
    backgroundColor: AppColors.primary[50],
  },
  modalOptionText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  modalOptionTextSelected: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
})
