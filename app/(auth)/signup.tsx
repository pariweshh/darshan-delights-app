import { Link, useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Ionicons } from "@expo/vector-icons"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { signup, isLoading, error, clearError } = useAuthStore()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToPolicies, setAgreedToPolicies] = useState(false)
  const [policyError, setPolicyError] = useState(false)

  const handleSignup = async () => {
    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    const trimmedConfirmPassword = confirmPassword.trim()

    // Clear previous policy error
    setPolicyError(false)

    if (!trimmedFirstName || !trimmedEmail || !trimmedPassword) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address")
      return
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (trimmedPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    // Check policy agreement
    if (!agreedToPolicies) {
      setPolicyError(true)
      Toast.show({
        type: "error",
        text1: "Agreement Required",
        text2: "Please agree to the Privacy Policy and Terms of Service",
      })
      return
    }

    clearError()

    try {
      const username = trimmedEmail.split("@")[0]
      const result = await signup(
        username,
        trimmedEmail,
        trimmedPassword,
        trimmedFirstName,
        trimmedLastName,
        agreedToPolicies
      )

      if (result?.success) {
        router.push({
          pathname: "/(auth)/verify-email",
          params: { email: trimmedEmail },
        })
      }
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Registration failed"
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: message,
      })
    }
  }

  // Handle policy checkbox toggle
  const handlePolicyToggle = () => {
    setAgreedToPolicies(!agreedToPolicies)
    if (policyError) {
      setPolicyError(false)
    }
  }

  const handleOpenPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        "https://darshandelights.com.au/policies/privacy-policy"
      )
    } catch (error) {
      console.error("Error opening privacy policy:", error)
      Alert.alert("Error", "Unable to open privacy policy")
    }
  }

  const handleOpenTermsOfService = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        "https://darshandelights.com.au/policies/terms-of-service"
      )
    } catch (error) {
      console.error("Error opening terms of service:", error)
      Alert.alert("Error", "Unable to open terms of service")
    }
  }

  const handleGoHome = () => {
    router.replace("/")
  }

  // For tablet, constrain form width
  const formMaxWidth = isTablet ? (isLandscape ? 500 : 450) : undefined
  const contentPadding = isTablet ? 32 : 24
  const checkboxSize = isTablet ? 22 : 20

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: contentPadding,
              paddingTop: isTablet ? 48 : 40,
              paddingBottom: 40,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Centered form container for tablets */}
          <View
            style={[
              styles.formContainer,
              {
                maxWidth: formMaxWidth,
                alignSelf: formMaxWidth ? "center" : undefined,
                width: formMaxWidth ? "100%" : undefined,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { marginBottom: isTablet ? 40 : 32 }]}>
              <View>
                <Text style={[styles.title, { fontSize: isTablet ? 36 : 30 }]}>
                  Create Account
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { fontSize: config.subtitleFontSize },
                  ]}
                >
                  Sign up to start shopping
                </Text>
              </View>
              <DebouncedTouchable
                onPress={handleGoHome}
                style={styles.iconContainer}
              >
                <Ionicons
                  name="home-outline"
                  size={isTablet ? 44 : 28}
                  color={AppColors.primary[500]}
                />
              </DebouncedTouchable>
            </View>

            {/* Error Message */}
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  {
                    padding: isTablet ? 18 : 16,
                    borderRadius: config.cardBorderRadius,
                    marginBottom: isTablet ? 28 : 24,
                  },
                ]}
              >
                <Text
                  style={[styles.errorText, { fontSize: config.bodyFontSize }]}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={[styles.form, { gap: isTablet ? 20 : 16 }]}>
              {/* Name Row */}
              <View style={[styles.nameRow, { gap: isTablet ? 16 : 12 }]}>
                <View style={styles.nameField}>
                  <Text
                    style={[
                      styles.label,
                      {
                        fontSize: config.bodyFontSize,
                        marginBottom: isTablet ? 10 : 8,
                      },
                    ]}
                  >
                    First Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        paddingHorizontal: isTablet ? 18 : 16,
                        paddingVertical: isTablet ? 18 : 16,
                        borderRadius: config.cardBorderRadius,
                        fontSize: config.bodyFontSize,
                      },
                    ]}
                    placeholder="First name"
                    placeholderTextColor={AppColors.gray[400]}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={styles.nameField}>
                  <Text
                    style={[
                      styles.label,
                      {
                        fontSize: config.bodyFontSize,
                        marginBottom: isTablet ? 10 : 8,
                      },
                    ]}
                  >
                    Last Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        paddingHorizontal: isTablet ? 18 : 16,
                        paddingVertical: isTablet ? 18 : 16,
                        borderRadius: config.cardBorderRadius,
                        fontSize: config.bodyFontSize,
                      },
                    ]}
                    placeholder="Last name"
                    placeholderTextColor={AppColors.gray[400]}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize,
                      marginBottom: isTablet ? 10 : 8,
                    },
                  ]}
                >
                  Email *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      paddingHorizontal: isTablet ? 18 : 16,
                      paddingVertical: isTablet ? 18 : 16,
                      borderRadius: config.cardBorderRadius,
                      fontSize: config.bodyFontSize,
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={AppColors.gray[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password Input */}
              <View>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize,
                      marginBottom: isTablet ? 10 : 8,
                    },
                  ]}
                >
                  Password *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      paddingHorizontal: isTablet ? 18 : 16,
                      paddingVertical: isTablet ? 18 : 16,
                      borderRadius: config.cardBorderRadius,
                      fontSize: config.bodyFontSize,
                    },
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={AppColors.gray[400]}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize,
                      marginBottom: isTablet ? 10 : 8,
                    },
                  ]}
                >
                  Confirm Password *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      paddingHorizontal: isTablet ? 18 : 16,
                      paddingVertical: isTablet ? 18 : 16,
                      borderRadius: config.cardBorderRadius,
                      fontSize: config.bodyFontSize,
                    },
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={AppColors.gray[400]}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              {/* Show Password Toggle */}
              <DebouncedTouchable
                style={styles.showPasswordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      width: isTablet ? 22 : 20,
                      height: isTablet ? 22 : 20,
                      borderRadius: isTablet ? 5 : 4,
                    },
                    showPassword && styles.checkboxChecked,
                  ]}
                />
                <Text
                  style={[
                    styles.showPasswordLabel,
                    { fontSize: config.bodyFontSize - 2 },
                  ]}
                >
                  Show passwords
                </Text>
              </DebouncedTouchable>

              {/* Policy Agreement Checkbox */}
              <View style={styles.policyContainer}>
                <DebouncedTouchable
                  style={styles.policyToggle}
                  onPress={handlePolicyToggle}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        width: checkboxSize,
                        height: checkboxSize,
                        borderRadius: isTablet ? 5 : 4,
                      },
                      agreedToPolicies && styles.checkboxChecked,
                      policyError && styles.checkboxError,
                    ]}
                  >
                    {agreedToPolicies && (
                      <Ionicons
                        name="checkmark"
                        size={checkboxSize - 6}
                        color="#fff"
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.policyText,
                      { fontSize: config.bodyFontSize - 2 },
                    ]}
                  >
                    I agree to the
                  </Text>
                </DebouncedTouchable>
                <View style={styles.policyLinks}>
                  <DebouncedTouchable onPress={handleOpenPrivacyPolicy}>
                    <Text
                      style={[
                        styles.policyLink,
                        { fontSize: config.bodyFontSize - 2 },
                      ]}
                    >
                      Privacy Policy
                    </Text>
                  </DebouncedTouchable>
                  <Text
                    style={[
                      styles.policyText,
                      { fontSize: config.bodyFontSize - 1 },
                    ]}
                  >
                    {" "}
                    and{" "}
                  </Text>
                  <DebouncedTouchable onPress={handleOpenTermsOfService}>
                    <Text
                      style={[
                        styles.policyLink,
                        { fontSize: config.bodyFontSize - 1 },
                      ]}
                    >
                      Terms of Service
                    </Text>
                  </DebouncedTouchable>
                  <Text
                    style={[
                      styles.policyText,
                      { fontSize: config.bodyFontSize - 1 },
                    ]}
                  >
                    {" "}
                    *
                  </Text>
                </View>
              </View>

              {/* Policy Error Message */}
              {policyError && (
                <Text
                  style={[
                    styles.policyErrorText,
                    { fontSize: config.bodyFontSize - 2 },
                  ]}
                >
                  You must agree to the Privacy Policy and Terms of Service
                </Text>
              )}

              {/* Signup Button */}
              <View style={{ marginTop: isTablet ? 16 : 12 }}>
                <Button
                  title="Create Account"
                  onPress={handleSignup}
                  loading={isLoading}
                />
              </View>

              {/* Login Link */}
              <View
                style={[
                  styles.linkContainer,
                  { marginTop: isTablet ? 28 : 24 },
                ]}
              >
                <Text
                  style={[styles.linkText, { fontSize: config.bodyFontSize }]}
                >
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Text
                    className="text-orange-600 font-bold"
                    style={[{ fontSize: config.bodyFontSize }]}
                  >
                    Sign In
                  </Text>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: AppColors.primary[300],
    backgroundColor: AppColors.primary[50],
    padding: 8,
    borderRadius: "100%",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    textAlign: "center",
  },
  form: {},
  nameRow: {
    flexDirection: "row",
  },
  nameField: {
    flex: 1,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
    backgroundColor: AppColors.background.primary,
  },
  showPasswordToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: AppColors.primary[500],
    borderColor: AppColors.primary[500],
  },
  checkboxError: {
    borderColor: AppColors.error,
    borderWidth: 2,
  },
  showPasswordLabel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  policyContainer: {
    flexDirection: "row",
  },
  policyToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  policyLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 3, // Align with text after checkbox
    marginTop: -0.5,
  },
  policyText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  policyLink: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[500],
    textDecorationLine: "underline",
    lineHeight: 20,
  },
  policyErrorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: -8,
    marginLeft: 30,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  linkText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  linkHighlight: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[500],
  },
})
