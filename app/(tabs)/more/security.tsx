import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { updatePassword } from "@/src/api/auth"
import Loader from "@/src/components/common/Loader"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useBiometricAuth } from "@/src/hooks/useBiometricAuth"
import { useAuthStore } from "@/src/store/authStore"

export default function SecurityScreen() {
  // Auth store - handles biometric auth state
  const {
    token,
    biometricAuthEnabled,
    setBiometricAuth,
    isLoading: authLoading,
  } = useAuthStore()

  // Biometric hook - handles device capabilities
  const {
    isBiometricSupported,
    isBiometricEnrolled,
    isLoading: biometricLoading,
    getBiometricType,
    getBiometricIcon,
    authenticateWithBiometrics,
    checkBiometricSupport,
  } = useBiometricAuth()

  // Local state
  const [isSwitchLoading, setIsSwitchLoading] = useState(false)

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  )
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Check biometric support on mount
  useEffect(() => {
    checkBiometricSupport()
  }, [checkBiometricSupport])

  // Computed values
  const isBiometricAvailable = isBiometricSupported && isBiometricEnrolled
  const biometricType = getBiometricType()
  const biometricIcon = getBiometricIcon()

  /**
   * Handle biometric toggle
   */
  const handleBiometricToggle = async (value: boolean) => {
    setIsSwitchLoading(true)

    try {
      const result = await setBiometricAuth(value)

      if (result.success) {
        Toast.show({
          type: "success",
          text1: value
            ? `${biometricType} Enabled`
            : `${biometricType} Disabled`,
          text2: value
            ? `You can now use ${biometricType} to sign in`
            : `${biometricType} sign-in has been turned off`,
          visibilityTime: 2500,
        })
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to Update",
          text2: result.error || "Please try again",
          visibilityTime: 2500,
        })
      }
    } catch (error) {
      console.error("Biometric toggle error:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An unexpected error occurred",
        visibilityTime: 2000,
      })
    } finally {
      setIsSwitchLoading(false)
    }
  }

  /**
   * Test biometric authentication
   */
  const handleTestBiometrics = async () => {
    if (!isBiometricAvailable) {
      Alert.alert(
        "Not Available",
        "Biometric authentication is not available on this device."
      )
      return
    }

    setIsSwitchLoading(true)

    try {
      const result = await authenticateWithBiometrics(
        `Test ${biometricType} Authentication`
      )

      Alert.alert(
        result.success ? "Success! ✓" : "Failed",
        result.success
          ? `${biometricType} authentication is working correctly.`
          : result.error || "Authentication failed. Please try again."
      )
    } catch (error) {
      Alert.alert("Error", "Failed to test biometric authentication.")
    } finally {
      setIsSwitchLoading(false)
    }
  }

  /**
   * Validate password form
   */
  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {}
    const { currentPassword, newPassword, confirmPassword } = passwordData

    if (!currentPassword.trim()) {
      errors.currentPassword = "Current password is required"
    }

    if (!newPassword.trim()) {
      errors.newPassword = "New password is required"
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters"
    } else if (!/[a-z]/.test(newPassword)) {
      errors.newPassword = "Password must include a lowercase letter"
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword = "Password must include an uppercase letter"
    } else if (!/\d/.test(newPassword)) {
      errors.newPassword = "Password must include a number"
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password"
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (currentPassword === newPassword && newPassword.trim()) {
      errors.newPassword =
        "New password must be different from current password"
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Handle password change
   */
  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) {
      return
    }

    if (!token) {
      Toast.show({
        type: "error",
        text1: "Session Expired",
        text2: "Please login again",
        visibilityTime: 2000,
      })
      return
    }

    setIsSavingPassword(true)

    try {
      const result = await updatePassword(token, {
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword,
        passwordConfirmation: passwordData.confirmPassword,
      })

      if (result?.jwt) {
        Toast.show({
          type: "success",
          text1: "Password Changed",
          text2: "Your password has been updated successfully",
          visibilityTime: 2500,
        })

        // Close modal and reset form
        setShowPasswordModal(false)
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setPasswordErrors({})
      } else {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: "Failed to change password. Please try again.",
          visibilityTime: 2500,
        })
      }
    } catch (error: any) {
      console.error("Password change error:", error)

      const errorMessage = error.message?.includes("Invalid")
        ? "Current password is incorrect"
        : error.message || "Failed to change password"

      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: errorMessage,
        visibilityTime: 2500,
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  /**
   * Close password modal and reset
   */
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setPasswordErrors({})
    setShowPasswords({ current: false, new: false, confirm: false })
  }

  /**
   * Calculate password strength
   */
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: AppColors.gray[300] }

    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 10) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++

    const strengths = [
      { label: "", color: AppColors.gray[300] },
      { label: "Very Weak", color: AppColors.error },
      { label: "Weak", color: "#F97316" },
      { label: "Fair", color: AppColors.warning },
      { label: "Good", color: "#84CC16" },
      { label: "Strong", color: AppColors.success },
    ]

    return { score, ...strengths[Math.min(score, 5)] }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  // Loading state
  if (biometricLoading || authLoading) {
    return <Loader fullScreen text="Loading security settings..." />
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Biometric Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric Authentication</Text>

          <View style={styles.card}>
            {/* Biometric Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name={biometricIcon as any}
                  size={24}
                  color={AppColors.primary[600]}
                />
              </View>

              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable {biometricType}</Text>
                <Text style={styles.settingHint}>
                  {isBiometricAvailable
                    ? `Use ${biometricType} for quick and secure sign-in`
                    : "Not available on this device"}
                </Text>
              </View>

              <View style={styles.switchContainer}>
                {isSwitchLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={AppColors.primary[500]}
                  />
                ) : (
                  <Switch
                    value={biometricAuthEnabled}
                    onValueChange={handleBiometricToggle}
                    disabled={!isBiometricAvailable}
                    trackColor={{
                      false: AppColors.gray[300],
                      true: AppColors.primary[200],
                    }}
                    thumbColor={
                      biometricAuthEnabled
                        ? AppColors.primary[500]
                        : AppColors.gray[100]
                    }
                  />
                )}
              </View>
            </View>

            {/* Warning if not available */}
            {!isBiometricAvailable && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={20} color="#92400E" />
                <Text style={styles.warningText}>
                  {!isBiometricSupported
                    ? "Your device does not support biometric authentication."
                    : "No biometrics enrolled. Please set up biometrics in your device settings."}
                </Text>
              </View>
            )}

            {/* Test Button */}
            {isBiometricAvailable && biometricAuthEnabled && (
              <DebouncedTouchable
                style={styles.testButton}
                onPress={handleTestBiometrics}
                activeOpacity={0.7}
                disabled={isSwitchLoading}
              >
                <Ionicons name={biometricIcon as any} size={20} color="white" />
                <Text style={styles.testButtonText}>Test {biometricType}</Text>
              </DebouncedTouchable>
            )}
          </View>
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password</Text>

          <View style={styles.card}>
            <DebouncedTouchable
              style={styles.menuItem}
              onPress={() => setShowPasswordModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={AppColors.primary[600]}
                  />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Change Password</Text>
                  <Text style={styles.menuItemHint}>
                    Update your account password
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>
          </View>
        </View>

        {/* Security Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={AppColors.primary[600]}
            />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Security Matters</Text>
            <Text style={styles.infoText}>
              Your biometric data is stored securely on your device and is never
              shared with our servers. We use industry-standard encryption to
              protect your credentials.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClosePasswordModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <DebouncedTouchable onPress={handleClosePasswordModal}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </DebouncedTouchable>
            <Text style={styles.modalTitle}>Change Password</Text>
            <DebouncedTouchable
              onPress={handlePasswordChange}
              disabled={isSavingPassword}
            >
              <Text
                style={[
                  styles.modalSaveText,
                  isSavingPassword && styles.modalSaveTextDisabled,
                ]}
              >
                {isSavingPassword ? "Saving..." : "Save"}
              </Text>
            </DebouncedTouchable>
          </View>

          {/* Modal Content */}
          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordErrors.currentPassword && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => {
                    setPasswordData({ ...passwordData, currentPassword: text })
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors({
                        ...passwordErrors,
                        currentPassword: "",
                      })
                    }
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor={AppColors.gray[400]}
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <DebouncedTouchable
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                >
                  <Ionicons
                    name={
                      showPasswords.current ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={AppColors.gray[500]}
                  />
                </DebouncedTouchable>
              </View>
              {passwordErrors.currentPassword && (
                <Text style={styles.errorText}>
                  {passwordErrors.currentPassword}
                </Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordErrors.newPassword && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={passwordData.newPassword}
                  onChangeText={(text) => {
                    setPasswordData({ ...passwordData, newPassword: text })
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({ ...passwordErrors, newPassword: "" })
                    }
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor={AppColors.gray[400]}
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <DebouncedTouchable
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                >
                  <Ionicons
                    name={showPasswords.new ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={AppColors.gray[500]}
                  />
                </DebouncedTouchable>
              </View>
              {passwordErrors.newPassword && (
                <Text style={styles.errorText}>
                  {passwordErrors.newPassword}
                </Text>
              )}

              {/* Password Strength Indicator */}
              {passwordData.newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarContainer}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              level <= passwordStrength.score
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

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordErrors.confirmPassword && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => {
                    setPasswordData({ ...passwordData, confirmPassword: text })
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({
                        ...passwordErrors,
                        confirmPassword: "",
                      })
                    }
                  }}
                  placeholder="Confirm new password"
                  placeholderTextColor={AppColors.gray[400]}
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <DebouncedTouchable
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                >
                  <Ionicons
                    name={
                      showPasswords.confirm ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={AppColors.gray[500]}
                  />
                </DebouncedTouchable>
              </View>
              {passwordErrors.confirmPassword && (
                <Text style={styles.errorText}>
                  {passwordErrors.confirmPassword}
                </Text>
              )}

              {/* Password Match Indicator */}
              {passwordData.confirmPassword.length > 0 &&
                passwordData.newPassword.length > 0 && (
                  <View style={styles.matchIndicator}>
                    <Ionicons
                      name={
                        passwordData.newPassword ===
                        passwordData.confirmPassword
                          ? "checkmark-circle"
                          : "close-circle"
                      }
                      size={16}
                      color={
                        passwordData.newPassword ===
                        passwordData.confirmPassword
                          ? AppColors.success
                          : AppColors.error
                      }
                    />
                    <Text
                      style={[
                        styles.matchText,
                        {
                          color:
                            passwordData.newPassword ===
                            passwordData.confirmPassword
                              ? AppColors.success
                              : AppColors.error,
                        },
                      ]}
                    >
                      {passwordData.newPassword === passwordData.confirmPassword
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </Text>
                  </View>
                )}
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>
                Password Requirements
              </Text>
              <View style={styles.requirementsList}>
                <RequirementItem
                  text="At least 6 characters"
                  met={passwordData.newPassword.length >= 6}
                />
                <RequirementItem
                  text="One uppercase letter"
                  met={/[A-Z]/.test(passwordData.newPassword)}
                />
                <RequirementItem
                  text="One lowercase letter"
                  met={/[a-z]/.test(passwordData.newPassword)}
                />
                <RequirementItem
                  text="One number"
                  met={/\d/.test(passwordData.newPassword)}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

/**
 * Requirement Item Component
 */
const RequirementItem: React.FC<{ text: string; met: boolean }> = ({
  text,
  met,
}) => (
  <View style={styles.requirementItem}>
    <Ionicons
      name={met ? "checkmark-circle" : "ellipse-outline"}
      size={16}
      color={met ? AppColors.success : AppColors.gray[400]}
    />
    <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
      {text}
    </Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
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

  // Card
  card: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Setting Row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  settingHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  switchContainer: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  // Warning Banner
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },

  // Test Button
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary[500],
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  testButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "white",
  },

  // Menu Item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  menuItemHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    backgroundColor: AppColors.primary[50],
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.primary[700],
    marginBottom: 4,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.primary[600],
    lineHeight: 19,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  modalCancelText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.text.secondary,
  },
  modalSaveText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.primary[600],
  },
  modalSaveTextDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  inputContainerError: {
    borderColor: AppColors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  eyeButton: {
    padding: 14,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 6,
  },

  // Password Strength
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  strengthBarContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    width: 70,
    textAlign: "right",
  },

  // Match Indicator
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  matchText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },

  // Requirements Card
  requirementsCard: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  requirementsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
  },
  requirementTextMet: {
    color: AppColors.success,
  },
})
