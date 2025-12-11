import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { resetPassword } from "@/src/api/auth"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { token } = useLocalSearchParams<{ token: string }>()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return

    if (!token) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Invalid reset token. Please try again.",
      })
      router.replace("/(auth)/forgot-password")
      return
    }

    Keyboard.dismiss()
    setIsLoading(true)

    try {
      await resetPassword(token, password, confirmPassword)

      Toast.show({
        type: "success",
        text1: "Password Reset! 🎉",
        text2: "You can now log in with your new password",
      })

      // Navigate to login
      router.replace("/(auth)/login")
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message || "Failed to reset password"
      Toast.show({
        type: "error",
        text1: "Reset Failed",
        text2: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (): {
    level: number
    label: string
    color: string
  } => {
    if (!password) return { level: 0, label: "", color: AppColors.gray[300] }

    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 2)
      return { level: 1, label: "Weak", color: AppColors.error }
    if (strength <= 3)
      return { level: 2, label: "Medium", color: AppColors.warning }
    return { level: 3, label: "Strong", color: "#22C55E" }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="key-outline"
                size={48}
                color={AppColors.primary[600]}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Your new password must be different from previously used passwords.
          </Text>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={errors.password ? AppColors.error : AppColors.gray[400]}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={AppColors.gray[400]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={AppColors.gray[400]}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Password Strength */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            passwordStrength.level >= level
                              ? passwordStrength.color
                              : AppColors.gray[200],
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: passwordStrength.color },
                  ]}
                >
                  {passwordStrength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.confirmPassword ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={
                  errors.confirmPassword ? AppColors.error : AppColors.gray[400]
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={AppColors.gray[400]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text)
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={AppColors.gray[400]}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            {/* Match indicator */}
            {confirmPassword.length > 0 && password === confirmPassword && (
              <View style={styles.matchContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.matchText}>Passwords match</Text>
              </View>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password must contain:</Text>
            <View style={styles.requirement}>
              <Ionicons
                name={
                  password.length >= 8 ? "checkmark-circle" : "ellipse-outline"
                }
                size={16}
                color={password.length >= 8 ? "#22C55E" : AppColors.gray[400]}
              />
              <Text
                style={[
                  styles.requirementText,
                  password.length >= 8 && styles.requirementMet,
                ]}
              >
                At least 8 characters
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons
                name={
                  /[A-Z]/.test(password) && /[a-z]/.test(password)
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  /[A-Z]/.test(password) && /[a-z]/.test(password)
                    ? "#22C55E"
                    : AppColors.gray[400]
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  /[A-Z]/.test(password) &&
                    /[a-z]/.test(password) &&
                    styles.requirementMet,
                ]}
              >
                Upper & lowercase letters
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons
                name={
                  /[0-9]/.test(password)
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={/[0-9]/.test(password) ? "#22C55E" : AppColors.gray[400]}
              />
              <Text
                style={[
                  styles.requirementText,
                  /[0-9]/.test(password) && styles.requirementMet,
                ]}
              >
                At least one number
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title={isLoading ? "Resetting..." : "Reset Password"}
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            containerStyles="w-full mt-4"
          />
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    gap: 10,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
    paddingVertical: 14,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 6,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
  },
  strengthBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  matchText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#22C55E",
  },
  requirementsContainer: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  requirementsTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginBottom: 12,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.gray[500],
  },
  requirementMet: {
    color: AppColors.text.primary,
  },
})
