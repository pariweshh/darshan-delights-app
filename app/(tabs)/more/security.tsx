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
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"

export default function SecurityScreen() {
  const { config, isTablet, isLandscape } = useResponsive()

  // Auth store
  const {
    token,
    biometricAuthEnabled,
    setBiometricAuth,
    isLoading: authLoading,
  } = useAuthStore()

  // Biometric hook
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

  // Layout configuration
  const contentMaxWidth = isTablet ? (isLandscape ? 600 : 550) : undefined

  // Responsive sizes
  const iconContainerSize = isTablet ? 48 : 44
  const iconSize = isTablet ? 26 : 24
  const menuIconSize = isTablet ? 24 : 22
  const inputPaddingH = isTablet ? 18 : 16
  const inputPaddingV = isTablet ? 16 : 14
  const inputFontSize = isTablet ? 16 : 15
  const inputBorderRadius = isTablet ? 14 : 12

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
    if (!validatePasswordForm()) return

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
      >
        {/* Biometric Authentication Section */}
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
            Biometric Authentication
          </Text>

          <View
            style={[
              styles.card,
              {
                padding: isTablet ? 18 : 16,
                borderRadius: config.cardBorderRadius + 4,
              },
            ]}
          >
            {/* Biometric Toggle */}
            <View style={styles.settingRow}>
              <View
                style={[
                  styles.settingIconContainer,
                  {
                    width: iconContainerSize,
                    height: iconContainerSize,
                    borderRadius: isTablet ? 14 : 12,
                    marginRight: isTablet ? 14 : 12,
                  },
                ]}
              >
                <Ionicons
                  name={biometricIcon as any}
                  size={iconSize}
                  color={AppColors.primary[600]}
                />
              </View>

              <View
                style={[
                  styles.settingInfo,
                  { marginRight: isTablet ? 14 : 12 },
                ]}
              >
                <Text
                  style={[
                    styles.settingLabel,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  Enable {biometricType}
                </Text>
                <Text
                  style={[
                    styles.settingHint,
                    {
                      fontSize: config.bodyFontSize - 2,
                      lineHeight: (config.bodyFontSize - 2) * 1.4,
                      marginTop: isTablet ? 4 : 2,
                    },
                  ]}
                >
                  {isBiometricAvailable
                    ? `Use ${biometricType} for quick and secure sign-in`
                    : "Not available on this device"}
                </Text>
              </View>

              <View
                style={[styles.switchContainer, { width: isTablet ? 56 : 52 }]}
              >
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
              <View
                style={[
                  styles.warningBanner,
                  {
                    padding: isTablet ? 14 : 12,
                    borderRadius: isTablet ? 14 : 12,
                    marginTop: isTablet ? 18 : 16,
                    gap: isTablet ? 12 : 10,
                  },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={isTablet ? 22 : 20}
                  color="#92400E"
                />
                <Text
                  style={[
                    styles.warningText,
                    {
                      fontSize: config.bodyFontSize - 1,
                      lineHeight: (config.bodyFontSize - 1) * 1.4,
                    },
                  ]}
                >
                  {!isBiometricSupported
                    ? "Your device does not support biometric authentication."
                    : "No biometrics enrolled. Please set up biometrics in your device settings."}
                </Text>
              </View>
            )}

            {/* Test Button */}
            {isBiometricAvailable && biometricAuthEnabled && (
              <DebouncedTouchable
                style={[
                  styles.testButton,
                  {
                    paddingVertical: isTablet ? 16 : 14,
                    borderRadius: isTablet ? 14 : 12,
                    marginTop: isTablet ? 18 : 16,
                    gap: isTablet ? 10 : 8,
                  },
                ]}
                onPress={handleTestBiometrics}
                activeOpacity={0.7}
                disabled={isSwitchLoading}
              >
                <Ionicons
                  name={biometricIcon as any}
                  size={isTablet ? 22 : 20}
                  color="white"
                />
                <Text
                  style={[
                    styles.testButtonText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  Test {biometricType}
                </Text>
              </DebouncedTouchable>
            )}
          </View>
        </View>

        {/* Password Section */}
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
            Password
          </Text>

          <View
            style={[
              styles.card,
              {
                padding: isTablet ? 18 : 16,
                borderRadius: config.cardBorderRadius + 4,
              },
            ]}
          >
            <DebouncedTouchable
              style={styles.menuItem}
              onPress={() => setShowPasswordModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemLeft, { gap: isTablet ? 14 : 12 }]}>
                <View
                  style={[
                    styles.menuIconContainer,
                    {
                      width: iconContainerSize,
                      height: iconContainerSize,
                      borderRadius: isTablet ? 14 : 12,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={menuIconSize}
                    color={AppColors.primary[600]}
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.menuItemLabel,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    Change Password
                  </Text>
                  <Text
                    style={[
                      styles.menuItemHint,
                      {
                        fontSize: config.bodyFontSize - 2,
                        marginTop: isTablet ? 4 : 2,
                      },
                    ]}
                  >
                    Update your account password
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 22 : 20}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>
          </View>
        </View>

        {/* Security Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              padding: isTablet ? 18 : 16,
              borderRadius: config.cardBorderRadius + 4,
              gap: isTablet ? 14 : 12,
            },
          ]}
        >
          <View
            style={[
              styles.infoIconContainer,
              {
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 2,
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={iconSize}
              color={AppColors.primary[600]}
            />
          </View>
          <View style={styles.infoContent}>
            <Text
              style={[
                styles.infoTitle,
                {
                  fontSize: config.bodyFontSize,
                  marginBottom: isTablet ? 6 : 4,
                },
              ]}
            >
              Your Security Matters
            </Text>
            <Text
              style={[
                styles.infoText,
                {
                  fontSize: config.bodyFontSize - 1,
                  lineHeight: (config.bodyFontSize - 1) * 1.5,
                },
              ]}
            >
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
        presentationStyle={isTablet ? "formSheet" : "pageSheet"}
        onRequestClose={handleClosePasswordModal}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            isTablet && {
              maxWidth: isLandscape ? 550 : 500,
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          {/* Modal Header */}
          <View
            style={[
              styles.modalHeader,
              {
                paddingHorizontal: config.horizontalPadding,
                paddingVertical: isTablet ? 18 : 16,
              },
            ]}
          >
            <DebouncedTouchable onPress={handleClosePasswordModal}>
              <Text
                style={[
                  styles.modalCancelText,
                  { fontSize: config.subtitleFontSize },
                ]}
              >
                Cancel
              </Text>
            </DebouncedTouchable>
            <Text style={[styles.modalTitle, { fontSize: isTablet ? 20 : 18 }]}>
              Change Password
            </Text>
            <DebouncedTouchable
              onPress={handlePasswordChange}
              disabled={isSavingPassword}
            >
              <Text
                style={[
                  styles.modalSaveText,
                  { fontSize: config.subtitleFontSize },
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
            contentContainerStyle={{ padding: config.horizontalPadding }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Current Password */}
            <View
              style={[styles.inputGroup, { marginBottom: isTablet ? 22 : 20 }]}
            >
              <Text
                style={[
                  styles.inputLabel,
                  {
                    fontSize: config.bodyFontSize,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                Current Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderRadius: inputBorderRadius },
                  passwordErrors.currentPassword && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      paddingHorizontal: inputPaddingH,
                      paddingVertical: inputPaddingV,
                      fontSize: inputFontSize,
                    },
                  ]}
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
                  style={[styles.eyeButton, { padding: isTablet ? 16 : 14 }]}
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
                    size={isTablet ? 22 : 20}
                    color={AppColors.gray[500]}
                  />
                </DebouncedTouchable>
              </View>
              {passwordErrors.currentPassword && (
                <Text
                  style={[styles.errorText, { fontSize: config.smallFontSize }]}
                >
                  {passwordErrors.currentPassword}
                </Text>
              )}
            </View>

            {/* New Password */}
            <View
              style={[styles.inputGroup, { marginBottom: isTablet ? 22 : 20 }]}
            >
              <Text
                style={[
                  styles.inputLabel,
                  {
                    fontSize: config.bodyFontSize,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                New Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderRadius: inputBorderRadius },
                  passwordErrors.newPassword && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      paddingHorizontal: inputPaddingH,
                      paddingVertical: inputPaddingV,
                      fontSize: inputFontSize,
                    },
                  ]}
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
                  style={[styles.eyeButton, { padding: isTablet ? 16 : 14 }]}
                  onPress={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                >
                  <Ionicons
                    name={showPasswords.new ? "eye-off-outline" : "eye-outline"}
                    size={isTablet ? 22 : 20}
                    color={AppColors.gray[500]}
                  />
                </DebouncedTouchable>
              </View>
              {passwordErrors.newPassword && (
                <Text
                  style={[styles.errorText, { fontSize: config.smallFontSize }]}
                >
                  {passwordErrors.newPassword}
                </Text>
              )}

              {/* Password Strength Indicator */}
              {passwordData.newPassword.length > 0 && (
                <View
                  style={[
                    styles.strengthContainer,
                    { marginTop: isTablet ? 12 : 10, gap: isTablet ? 12 : 10 },
                  ]}
                >
                  <View
                    style={[
                      styles.strengthBarContainer,
                      { gap: isTablet ? 6 : 4 },
                    ]}
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          { height: isTablet ? 5 : 4 },
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
                      {
                        color: passwordStrength.color,
                        fontSize: config.smallFontSize,
                      },
                    ]}
                  >
                    {passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View
              style={[styles.inputGroup, { marginBottom: isTablet ? 22 : 20 }]}
            >
              <Text
                style={[
                  styles.inputLabel,
                  {
                    fontSize: config.bodyFontSize,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                Confirm New Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderRadius: inputBorderRadius },
                  passwordErrors.confirmPassword && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      paddingHorizontal: inputPaddingH,
                      paddingVertical: inputPaddingV,
                      fontSize: inputFontSize,
                    },
                  ]}
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
                  style={[styles.eyeButton, { padding: isTablet ? 16 : 14 }]}
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
                    size={isTablet ? 22 : 20}
                    color={AppColors.gray[500]}
                  />
                </DebouncedTouchable>
              </View>
              {passwordErrors.confirmPassword && (
                <Text
                  style={[styles.errorText, { fontSize: config.smallFontSize }]}
                >
                  {passwordErrors.confirmPassword}
                </Text>
              )}

              {/* Password Match Indicator */}
              {passwordData.confirmPassword.length > 0 &&
                passwordData.newPassword.length > 0 && (
                  <View
                    style={[
                      styles.matchIndicator,
                      { marginTop: isTablet ? 10 : 8, gap: isTablet ? 8 : 6 },
                    ]}
                  >
                    <Ionicons
                      name={
                        passwordData.newPassword ===
                        passwordData.confirmPassword
                          ? "checkmark-circle"
                          : "close-circle"
                      }
                      size={isTablet ? 18 : 16}
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
                        { fontSize: config.smallFontSize },
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
            <View
              style={[
                styles.requirementsCard,
                {
                  padding: isTablet ? 18 : 16,
                  borderRadius: isTablet ? 14 : 12,
                  marginTop: isTablet ? 10 : 8,
                },
              ]}
            >
              <Text
                style={[
                  styles.requirementsTitle,
                  {
                    fontSize: config.bodyFontSize,
                    marginBottom: isTablet ? 14 : 12,
                  },
                ]}
              >
                Password Requirements
              </Text>
              <View
                style={[styles.requirementsList, { gap: isTablet ? 10 : 8 }]}
              >
                <RequirementItem
                  text="At least 6 characters"
                  met={passwordData.newPassword.length >= 6}
                  isTablet={isTablet}
                  fontSize={config.bodyFontSize - 1}
                />
                <RequirementItem
                  text="One uppercase letter"
                  met={/[A-Z]/.test(passwordData.newPassword)}
                  isTablet={isTablet}
                  fontSize={config.bodyFontSize - 1}
                />
                <RequirementItem
                  text="One lowercase letter"
                  met={/[a-z]/.test(passwordData.newPassword)}
                  isTablet={isTablet}
                  fontSize={config.bodyFontSize - 1}
                />
                <RequirementItem
                  text="One number"
                  met={/\d/.test(passwordData.newPassword)}
                  isTablet={isTablet}
                  fontSize={config.bodyFontSize - 1}
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
const RequirementItem: React.FC<{
  text: string
  met: boolean
  isTablet: boolean
  fontSize: number
}> = ({ text, met, isTablet, fontSize }) => (
  <View style={[styles.requirementItem, { gap: isTablet ? 10 : 8 }]}>
    <Ionicons
      name={met ? "checkmark-circle" : "ellipse-outline"}
      size={isTablet ? 18 : 16}
      color={met ? AppColors.success : AppColors.gray[400]}
    />
    <Text
      style={[
        styles.requirementText,
        { fontSize },
        met && styles.requirementTextMet,
      ]}
    >
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
  scrollContent: {},
  // Section
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  // Card
  card: {
    backgroundColor: AppColors.background.primary,
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
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  settingHint: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  switchContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Warning Banner
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
  },
  warningText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "#92400E",
  },
  // Test Button
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary[500],
  },
  testButtonText: {
    fontFamily: "Poppins_600SemiBold",
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
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  menuItemHint: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  // Info Card
  infoCard: {
    flexDirection: "row",
    backgroundColor: AppColors.primary[50],
  },
  infoIconContainer: {
    backgroundColor: AppColors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[700],
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[600],
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
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  modalCancelText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  modalSaveText: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[600],
  },
  modalSaveTextDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
  },
  // Input Group
  inputGroup: {},
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  inputContainerError: {
    borderColor: AppColors.error,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  eyeButton: {},
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: 6,
  },
  // Password Strength
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  strengthBarContainer: {
    flex: 1,
    flexDirection: "row",
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: "Poppins_500Medium",
    width: 70,
    textAlign: "right",
  },
  // Match Indicator
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchText: {
    fontFamily: "Poppins_400Regular",
  },
  // Requirements Card
  requirementsCard: {
    backgroundColor: AppColors.gray[50],
  },
  requirementsTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  requirementsList: {},
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  requirementText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  requirementTextMet: {
    color: AppColors.success,
  },
})
