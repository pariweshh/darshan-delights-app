import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { deleteUserAccount } from "@/src/api/auth"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"

export default function ProfileScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const { user, token, logout, updateUser } = useAuthStore()

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    fName: user?.fName || "",
    lName: user?.lName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  })

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Layout configuration
  const contentMaxWidth = isTablet ? (isLandscape ? 600 : 550) : undefined

  // Responsive sizes
  const avatarSize = isTablet ? 100 : 80
  const avatarFontSize = isTablet ? 34 : 28
  const inputPaddingH = isTablet ? 16 : 14
  const inputPaddingV = isTablet ? 14 : 12
  const inputFontSize = isTablet ? 16 : 15
  const inputBorderRadius = isTablet ? 12 : 10
  const menuIconContainerSize = isTablet ? 44 : 40

  // Sync profile data with user
  useEffect(() => {
    if (user) {
      setProfileData({
        fName: user.fName || "",
        lName: user.lName || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  // Memoized values
  const initials = useMemo(() => {
    if (!profileData.fName && !profileData.lName) return "?"
    return `${profileData.fName.charAt(0)}${profileData.lName.charAt(
      0
    )}`.toUpperCase()
  }, [profileData.fName, profileData.lName])

  const hasChanges = useMemo(() => {
    return (
      profileData.fName !== (user?.fName || "") ||
      profileData.lName !== (user?.lName || "") ||
      profileData.phone !== (user?.phone || "")
    )
  }, [profileData, user])

  // Handlers
  const handleEditToggle = () => {
    if (isEditing && hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setProfileData({
                fName: user?.fName || "",
                lName: user?.lName || "",
                email: user?.email || "",
                phone: user?.phone || "",
              })
              setIsEditing(false)
            },
          },
        ]
      )
    } else {
      setIsEditing(!isEditing)
    }
  }

  const handleSaveProfile = async () => {
    if (!token) return

    if (!hasChanges) {
      setIsEditing(false)
      return
    }

    // Validation
    if (!profileData.fName.trim() || !profileData.lName.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "First name and last name are required",
        visibilityTime: 2000,
      })
      return
    }

    setIsSaving(true)
    try {
      const changedFields: Record<string, string> = {}
      if (profileData.fName !== user?.fName)
        changedFields.fName = profileData.fName
      if (profileData.lName !== user?.lName)
        changedFields.lName = profileData.lName
      if (profileData.phone !== user?.phone)
        changedFields.phone = profileData.phone

      const result = await updateUser(token, changedFields)

      if (result?.id) {
        setIsEditing(false)
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: "Your profile has been updated successfully",
          visibilityTime: 2000,
        })
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.message || "Failed to update profile",
        visibilityTime: 2000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout()
            router.replace("/(tabs)/home")
            Toast.show({
              type: "success",
              text1: "Logged out",
              text2: "You have been logged out successfully",
              visibilityTime: 2000,
            })
          } catch (error) {
            console.error("Logout error:", error)
          }
        },
      },
    ])
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      Toast.show({
        type: "error",
        text1: "Confirmation Required",
        text2: 'Please type "DELETE" to confirm',
        visibilityTime: 2000,
      })
      return
    }

    Alert.alert(
      "Final Confirmation",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true)
            try {
              const result = await deleteUserAccount(token as string)

              if (result?.success) {
                await logout()
                router.replace("/(tabs)/home")
                Toast.show({
                  type: "success",
                  text1: "Account Deleted",
                  text2: "Your account has been permanently deleted",
                  visibilityTime: 3000,
                })
              }
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Deletion Failed",
                text2: error.message || "Failed to delete account",
                visibilityTime: 2000,
              })
            } finally {
              setIsDeleting(false)
              setShowDeleteModal(false)
            }
          },
        },
      ]
    )
  }

  // Navigation handlers
  const handleGoToSecurity = () => router.push("/(tabs)/more/security")
  const handleGoToNotifications = () =>
    router.push("/(tabs)/more/notification-preferences")

  if (!user || !token) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <View
          style={[
            styles.guestContainer,
            {
              padding: config.horizontalPadding + 8,
              maxWidth: isTablet ? 400 : undefined,
              alignSelf: isTablet ? "center" : undefined,
            },
          ]}
        >
          <Text
            style={[styles.guestText, { fontSize: config.subtitleFontSize }]}
          >
            Please login to view your profile
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push("/(auth)/login")}
            containerStyles="mt-4"
          />
        </View>
      </Wrapper>
    )
  }

  return (
    <Wrapper style={styles.container} edges={[]}>
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Header */}
        <View
          style={[
            styles.profileHeader,
            {
              paddingVertical: isTablet ? 28 : 24,
              borderRadius: config.cardBorderRadius + 4,
              marginBottom: isTablet ? 28 : 24,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                marginBottom: isTablet ? 14 : 12,
              },
            ]}
          >
            <Text style={[styles.avatarText, { fontSize: avatarFontSize }]}>
              {initials}
            </Text>
          </View>
          <Text style={[styles.profileName, { fontSize: isTablet ? 22 : 20 }]}>
            {profileData.fName} {profileData.lName}
          </Text>
          <Text
            style={[
              styles.profileEmail,
              { fontSize: config.bodyFontSize, marginTop: isTablet ? 6 : 4 },
            ]}
          >
            {profileData.email}
          </Text>
        </View>

        {/* Personal Information */}
        <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
          <View
            style={[styles.sectionHeader, { marginBottom: isTablet ? 14 : 12 }]}
          >
            <Text
              style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 16 }]}
            >
              Personal Information
            </Text>
            <DebouncedTouchable
              style={[
                styles.editButton,
                {
                  paddingHorizontal: isTablet ? 14 : 12,
                  paddingVertical: isTablet ? 8 : 6,
                  borderRadius: isTablet ? 10 : 8,
                  gap: isTablet ? 6 : 4,
                },
              ]}
              onPress={handleEditToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isEditing ? "close" : "pencil"}
                size={isTablet ? 18 : 16}
                color={AppColors.primary[600]}
              />
              <Text
                style={[
                  styles.editButtonText,
                  { fontSize: config.bodyFontSize - 1 },
                ]}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </DebouncedTouchable>
          </View>

          <View
            style={[
              styles.formCard,
              {
                padding: isTablet ? 18 : 16,
                borderRadius: config.cardBorderRadius + 4,
              },
            ]}
          >
            {/* First Name & Last Name */}
            <View
              style={[
                styles.fieldRow,
                { gap: isTablet ? 14 : 12, marginBottom: isTablet ? 18 : 16 },
              ]}
            >
              <View style={styles.fieldHalf}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      fontSize: config.bodyFontSize - 1,
                      marginBottom: isTablet ? 8 : 6,
                    },
                  ]}
                >
                  First Name
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
                    !isEditing && styles.inputDisabled,
                  ]}
                  value={profileData.fName}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, fName: text })
                  }
                  editable={isEditing}
                  placeholder="First name"
                  placeholderTextColor={AppColors.gray[400]}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      fontSize: config.bodyFontSize - 1,
                      marginBottom: isTablet ? 8 : 6,
                    },
                  ]}
                >
                  Last Name
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
                    !isEditing && styles.inputDisabled,
                  ]}
                  value={profileData.lName}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, lName: text })
                  }
                  editable={isEditing}
                  placeholder="Last name"
                  placeholderTextColor={AppColors.gray[400]}
                />
              </View>
            </View>

            {/* Email (Read-only) */}
            <View style={[styles.field, { marginBottom: isTablet ? 18 : 16 }]}>
              <Text
                style={[
                  styles.fieldLabel,
                  {
                    fontSize: config.bodyFontSize - 1,
                    marginBottom: isTablet ? 8 : 6,
                  },
                ]}
              >
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputDisabled,
                  {
                    paddingHorizontal: inputPaddingH,
                    paddingVertical: inputPaddingV,
                    borderRadius: inputBorderRadius,
                    fontSize: inputFontSize,
                  },
                ]}
                value={profileData.email}
                editable={false}
                placeholder="Email address"
              />
              <Text
                style={[styles.fieldHint, { fontSize: config.smallFontSize }]}
              >
                Email cannot be changed
              </Text>
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <Text
                style={[
                  styles.fieldLabel,
                  {
                    fontSize: config.bodyFontSize - 1,
                    marginBottom: isTablet ? 8 : 6,
                  },
                ]}
              >
                Phone Number
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
                  !isEditing && styles.inputDisabled,
                ]}
                value={profileData.phone}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, phone: text })
                }
                editable={isEditing}
                placeholder="Enter phone number"
                placeholderTextColor={AppColors.gray[400]}
                keyboardType="phone-pad"
              />
            </View>

            {/* Save Button */}
            {isEditing && (
              <Button
                title={isSaving ? "Saving..." : "Save Changes"}
                onPress={handleSaveProfile}
                disabled={!hasChanges || isSaving}
                loading={isSaving}
                containerStyles="mt-4"
              />
            )}
          </View>
        </View>

        {/* Settings Section */}
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
            Settings
          </Text>
          <View
            style={[
              styles.menuCard,
              { borderRadius: config.cardBorderRadius + 4 },
            ]}
          >
            <DebouncedTouchable
              style={[
                styles.menuItem,
                {
                  paddingVertical: isTablet ? 16 : 14,
                  paddingHorizontal: isTablet ? 18 : 16,
                },
              ]}
              onPress={handleGoToSecurity}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemLeft, { gap: isTablet ? 14 : 12 }]}>
                <View
                  style={[
                    styles.menuIconContainer,
                    {
                      width: menuIconContainerSize,
                      height: menuIconContainerSize,
                      borderRadius: isTablet ? 12 : 10,
                      backgroundColor: AppColors.primary[50],
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={isTablet ? 22 : 20}
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
                    Security
                  </Text>
                  <Text
                    style={[
                      styles.menuItemHint,
                      { fontSize: config.smallFontSize },
                    ]}
                  >
                    Password & biometrics
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 22 : 20}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>

            <View
              style={[styles.menuDivider, { marginLeft: isTablet ? 76 : 68 }]}
            />

            <DebouncedTouchable
              style={[
                styles.menuItem,
                {
                  paddingVertical: isTablet ? 16 : 14,
                  paddingHorizontal: isTablet ? 18 : 16,
                },
              ]}
              onPress={handleGoToNotifications}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemLeft, { gap: isTablet ? 14 : 12 }]}>
                <View
                  style={[
                    styles.menuIconContainer,
                    {
                      width: menuIconContainerSize,
                      height: menuIconContainerSize,
                      borderRadius: isTablet ? 12 : 10,
                      backgroundColor: "#FEF3C7",
                    },
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={isTablet ? 22 : 20}
                    color="#D97706"
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.menuItemLabel,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    Notifications
                  </Text>
                  <Text
                    style={[
                      styles.menuItemHint,
                      { fontSize: config.smallFontSize },
                    ]}
                  >
                    Push notification preferences
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

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isTablet ? 17 : 16,
                marginBottom: isTablet ? 14 : 12,
                color: AppColors.error,
              },
            ]}
          >
            Danger Zone
          </Text>
          <View
            style={[
              styles.menuCard,
              { borderRadius: config.cardBorderRadius + 4 },
            ]}
          >
            <DebouncedTouchable
              style={[
                styles.menuItem,
                {
                  paddingVertical: isTablet ? 16 : 14,
                  paddingHorizontal: isTablet ? 18 : 16,
                },
              ]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemLeft, { gap: isTablet ? 14 : 12 }]}>
                <View
                  style={[
                    styles.menuIconContainer,
                    {
                      width: menuIconContainerSize,
                      height: menuIconContainerSize,
                      borderRadius: isTablet ? 12 : 10,
                      backgroundColor: "#FEF3C7",
                    },
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={isTablet ? 22 : 20}
                    color={AppColors.warning}
                  />
                </View>
                <Text
                  style={[
                    styles.menuItemLabel,
                    { fontSize: config.bodyFontSize, color: AppColors.warning },
                  ]}
                >
                  Logout
                </Text>
              </View>
            </DebouncedTouchable>

            <View
              style={[styles.menuDivider, { marginLeft: isTablet ? 76 : 68 }]}
            />

            <DebouncedTouchable
              style={[
                styles.menuItem,
                {
                  paddingVertical: isTablet ? 16 : 14,
                  paddingHorizontal: isTablet ? 18 : 16,
                },
              ]}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemLeft, { gap: isTablet ? 14 : 12 }]}>
                <View
                  style={[
                    styles.menuIconContainer,
                    {
                      width: menuIconContainerSize,
                      height: menuIconContainerSize,
                      borderRadius: isTablet ? 12 : 10,
                      backgroundColor: "#FEE2E2",
                    },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={isTablet ? 22 : 20}
                    color={AppColors.error}
                  />
                </View>
                <Text
                  style={[
                    styles.menuItemLabel,
                    { fontSize: config.bodyFontSize, color: AppColors.error },
                  ]}
                >
                  Delete Account
                </Text>
              </View>
            </DebouncedTouchable>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        presentationStyle={isTablet ? "formSheet" : "pageSheet"}
        onRequestClose={() => setShowDeleteModal(false)}
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
          <View
            style={[
              styles.modalHeader,
              {
                paddingHorizontal: config.horizontalPadding,
                paddingVertical: isTablet ? 18 : 16,
              },
            ]}
          >
            <DebouncedTouchable
              onPress={() => {
                setShowDeleteModal(false)
                setDeleteConfirmation("")
              }}
            >
              <Text
                style={[
                  styles.modalCancelText,
                  { fontSize: config.subtitleFontSize },
                ]}
              >
                Cancel
              </Text>
            </DebouncedTouchable>
            <Text
              style={[
                styles.modalTitle,
                { fontSize: isTablet ? 20 : 18, color: AppColors.error },
              ]}
            >
              Delete Account
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ padding: config.horizontalPadding }}
          >
            <View
              style={[
                styles.deleteWarning,
                { paddingVertical: isTablet ? 24 : 20 },
              ]}
            >
              <View
                style={[
                  styles.deleteWarningIcon,
                  {
                    width: isTablet ? 90 : 80,
                    height: isTablet ? 90 : 80,
                    borderRadius: isTablet ? 45 : 40,
                    marginBottom: isTablet ? 18 : 16,
                  },
                ]}
              >
                <Ionicons
                  name="warning"
                  size={isTablet ? 52 : 48}
                  color={AppColors.error}
                />
              </View>
              <Text
                style={[
                  styles.deleteWarningTitle,
                  {
                    fontSize: isTablet ? 20 : 18,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                This action cannot be undone
              </Text>
              <Text
                style={[
                  styles.deleteWarningText,
                  {
                    fontSize: config.bodyFontSize,
                    marginBottom: isTablet ? 18 : 16,
                  },
                ]}
              >
                Deleting your account will permanently remove:
              </Text>
              <View style={styles.deleteWarningList}>
                {[
                  "Your profile information",
                  "Order history",
                  "Saved addresses",
                  "Your Reviews",
                  "Favorites list",
                  "All account data",
                ].map((item, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.deleteWarningItem,
                      {
                        fontSize: config.bodyFontSize,
                        marginBottom: isTablet ? 6 : 4,
                      },
                    ]}
                  >
                    • {item}
                  </Text>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.deleteConfirmation,
                { marginVertical: isTablet ? 28 : 24 },
              ]}
            >
              <Text
                style={[
                  styles.deleteConfirmationLabel,
                  {
                    fontSize: config.bodyFontSize,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                Type <Text style={{ fontWeight: "bold" }}>DELETE</Text> to
                confirm:
              </Text>
              <TextInput
                style={[
                  styles.deleteConfirmationInput,
                  {
                    paddingHorizontal: isTablet ? 16 : 14,
                    paddingVertical: isTablet ? 14 : 12,
                    borderRadius: isTablet ? 12 : 10,
                    fontSize: isTablet ? 17 : 16,
                  },
                ]}
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Type DELETE"
                placeholderTextColor={AppColors.gray[400]}
                autoCapitalize="characters"
              />
            </View>

            <Button
              title={isDeleting ? "Deleting..." : "Delete My Account"}
              onPress={handleDeleteAccount}
              disabled={
                deleteConfirmation.toLowerCase() !== "delete" || isDeleting
              }
              loading={isDeleting}
              containerStyles="mb-8"
              style={{
                backgroundColor:
                  deleteConfirmation.toLowerCase() === "delete"
                    ? AppColors.error
                    : AppColors.gray[300],
              }}
            />
          </ScrollView>
        </SafeAreaView>
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
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guestText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  // Profile Header
  profileHeader: {
    alignItems: "center",
    backgroundColor: AppColors.background.primary,
  },
  avatar: {
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    color: "white",
  },
  profileName: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
  profileEmail: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  // Section
  section: {},
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[50],
  },
  editButtonText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  // Form
  formCard: {
    backgroundColor: AppColors.background.primary,
  },
  fieldRow: {
    flexDirection: "row",
  },
  fieldHalf: {
    flex: 1,
  },
  field: {},
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  fieldHint: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    marginTop: 4,
  },
  input: {
    backgroundColor: AppColors.background.secondary,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  inputDisabled: {
    backgroundColor: AppColors.gray[100],
    color: AppColors.text.secondary,
  },
  // Menu
  menuCard: {
    backgroundColor: AppColors.background.primary,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  menuItemHint: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: AppColors.gray[100],
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
  modalContent: {
    flex: 1,
  },
  // Delete Warning
  deleteWarning: {
    alignItems: "center",
  },
  deleteWarningIcon: {
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteWarningTitle: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.error,
  },
  deleteWarningText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  deleteWarningList: {
    alignSelf: "stretch",
  },
  deleteWarningItem: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  deleteConfirmation: {},
  deleteConfirmationLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  deleteConfirmationInput: {
    borderWidth: 2,
    borderColor: AppColors.error,
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
})
