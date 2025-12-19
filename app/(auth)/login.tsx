import { Link, useRouter } from "expo-router"
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

import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Error", "Please enter your email and password")
      return
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address")
      return
    }

    clearError()
    const result = await login(trimmedEmail, trimmedPassword)

    if (result?.user) {
      router.replace("/(tabs)/home")
    }
  }

  // For tablet, constrain form width
  const formMaxWidth = isTablet ? (isLandscape ? 450 : 400) : undefined
  const contentPadding = isTablet ? 32 : 24

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
              paddingTop: isTablet ? 60 : 40,
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
            <View style={[styles.header, { marginBottom: isTablet ? 48 : 40 }]}>
              <Text style={[styles.title, { fontSize: isTablet ? 36 : 30 }]}>
                Welcome Back
              </Text>
              <Text
                style={[styles.subtitle, { fontSize: config.subtitleFontSize }]}
              >
                Sign in to continue shopping
              </Text>
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
            <View style={[styles.form, { gap: isTablet ? 24 : 20 }]}>
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
                  Email
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
                  Password
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      {
                        paddingHorizontal: isTablet ? 18 : 16,
                        paddingVertical: isTablet ? 18 : 16,
                        borderRadius: config.cardBorderRadius,
                        fontSize: config.bodyFontSize,
                      },
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={AppColors.gray[400]}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <DebouncedTouchable
                    style={[
                      styles.showPasswordButton,
                      { top: isTablet ? 18 : 16, right: isTablet ? 18 : 16 },
                    ]}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text
                      style={[
                        styles.showPasswordText,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </DebouncedTouchable>
                </View>
              </View>

              {/* Forgot Password */}
              <DebouncedTouchable
                style={styles.forgotPassword}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text
                  style={[
                    styles.forgotPasswordText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  Forgot Password?
                </Text>
              </DebouncedTouchable>

              {/* Login Button */}
              <View style={{ marginTop: isTablet ? 12 : 8 }}>
                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isLoading}
                />
              </View>

              {/* Sign Up Link */}
              <View
                style={[
                  styles.linkContainer,
                  { marginTop: isTablet ? 28 : 24 },
                ]}
              >
                <Text
                  style={[styles.linkText, { fontSize: config.bodyFontSize }]}
                >
                  Don't have an account?{" "}
                </Text>
                <Link href="/(auth)/signup" asChild>
                  <DebouncedTouchable>
                    <Text
                      style={[
                        styles.linkHighlight,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      Sign Up
                    </Text>
                  </DebouncedTouchable>
                </Link>
              </View>

              {/* Browse as Guest */}
              <DebouncedTouchable
                style={[styles.guestButton, { marginTop: isTablet ? 20 : 16 }]}
                onPress={() => router.replace("/(tabs)/home")}
              >
                <Text
                  style={[styles.guestText, { fontSize: config.bodyFontSize }]}
                >
                  Browse as Guest
                </Text>
              </DebouncedTouchable>
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
  header: {},
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
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 70,
  },
  showPasswordButton: {
    position: "absolute",
  },
  showPasswordText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
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
  guestButton: {
    alignItems: "center",
  },
  guestText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.gray[500],
    textDecorationLine: "underline",
  },
})
