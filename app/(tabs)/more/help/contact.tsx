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
  TouchableOpacity,
  View,
} from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import Toast from "react-native-toast-message"

import { sendMessage } from "@/src/api/contact"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"

const SUBJECTS = [
  "Order Inquiry",
  "Product Question",
  "Delivery Issue",
  "Account Help",
  "Refund Request",
  "Other",
]

interface ContactMethod {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle: string
  description: string
  action: string
  onPress: () => void
}

const contactMethods: ContactMethod[] = [
  {
    icon: "call-outline",
    title: "Call Us",
    subtitle: "+61 452 550 534",
    description: "Mon-Fri 5PM-8PM, Sat-Sun 9AM-5PM",
    action: "Call Now",
    onPress: () => Linking.openURL("tel:+61452550534"),
  },
  {
    icon: "mail-outline",
    title: "Email Us",
    subtitle: "support@darshandelights.com.au",
    description: "We typically reply within 2-4 hours",
    action: "Send Email",
    onPress: () => Linking.openURL("mailto:support@darshandelights.com.au"),
  },
  {
    icon: "logo-whatsapp",
    title: "WhatsApp",
    subtitle: "+61 452 550 534",
    description: "Quick responses via WhatsApp",
    action: "Chat Now",
    onPress: () => Linking.openURL("https://wa.me/61452550534"),
  },
]

export default function ContactScreen() {
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={250}
      >
        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          {contactMethods.map((method, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <View style={styles.contactHeader}>
                  <View style={styles.contactIcon}>
                    <Ionicons
                      name={method.icon}
                      size={20}
                      color={AppColors.primary[600]}
                    />
                  </View>
                  <View style={styles.contactText}>
                    <Text style={styles.contactTitle}>{method.title}</Text>
                    <Text style={styles.contactSubtitle}>
                      {method.subtitle}
                    </Text>
                  </View>
                </View>
                <Text style={styles.contactDescription}>
                  {method.description}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.contactAction}
                onPress={method.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.contactActionText}>{method.action}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <View style={styles.formCard}>
            <Text style={styles.formSubtitle}>
              We'd love to hear from you. Fill out the form below and we'll get
              back to you as soon as possible.
            </Text>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(text) => updateField("name", text)}
                placeholder="Enter your full name"
                placeholderTextColor={AppColors.gray[400]}
                autoCapitalize="words"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={(text) => updateField("email", text)}
                placeholder="Enter your email"
                placeholderTextColor={AppColors.gray[400]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Subject */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject *</Text>
              <TouchableOpacity
                style={[styles.selector, errors.subject && styles.inputError]}
                onPress={() => setShowSubjectModal(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !selectedSubject && styles.selectorPlaceholder,
                  ]}
                >
                  {selectedSubject || "Select a subject"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={AppColors.gray[400]}
                />
              </TouchableOpacity>
              {errors.subject && (
                <Text style={styles.errorText}>{errors.subject}</Text>
              )}
            </View>

            {/* Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.textArea, errors.message && styles.inputError]}
                value={message}
                onChangeText={(text) => updateField("message", text)}
                placeholder="Tell us how we can help you..."
                placeholderTextColor={AppColors.gray[400]}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={1000}
              />
              <View style={styles.charCount}>
                <Text style={styles.charCountText}>{message.length}/1000</Text>
              </View>
              {errors.message && (
                <Text style={styles.errorText}>{errors.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              title="Send Message"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={<Ionicons name="send" size={18} color="white" />}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={AppColors.text.primary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SUBJECTS.map((subject, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
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
                      selectedSubject === subject &&
                        styles.modalOptionTextSelected,
                    ]}
                  >
                    {subject}
                  </Text>
                  {selectedSubject === subject && (
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  // Contact Card
  contactCard: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  contactSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[600],
    marginTop: 2,
  },
  contactDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.secondary,
    marginLeft: 52,
  },
  contactAction: {
    backgroundColor: AppColors.primary[500],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  contactActionText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "white",
  },
  // Form Card
  formCard: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  formSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  // Input
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.primary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  textArea: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
    minHeight: 120,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
  },
  charCount: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  charCountText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
  },
  // Selector
  selector: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
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
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  modalOptionSelected: {
    backgroundColor: AppColors.primary[50],
  },
  modalOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  modalOptionTextSelected: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
})
