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
import { useAuthStore } from "@/src/store/authStore"

export default function ProfileScreen() {
  const router = useRouter()
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
    if (!profileData.fName || !profileData.lName) return "?"
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
        <View style={styles.guestContainer}>
          <Text style={styles.guestText}>
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>
            {profileData.fName} {profileData.lName}
          </Text>
          <Text style={styles.profileEmail}>{profileData.email}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <DebouncedTouchable
              style={styles.editButton}
              onPress={handleEditToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isEditing ? "close" : "pencil"}
                size={16}
                color={AppColors.primary[600]}
              />
              <Text style={styles.editButtonText}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </DebouncedTouchable>
          </View>

          <View style={styles.formCard}>
            {/* First Name & Last Name */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
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
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
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
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profileData.email}
                editable={false}
                placeholder="Email address"
              />
              <Text style={styles.fieldHint}>Email cannot be changed</Text>
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            <DebouncedTouchable
              style={styles.menuItem}
              onPress={handleGoToSecurity}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: AppColors.primary[50] },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={AppColors.primary[600]}
                  />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Security</Text>
                  <Text style={styles.menuItemHint}>Password & biometrics</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>

            <View style={styles.menuDivider} />

            <DebouncedTouchable
              style={styles.menuItem}
              onPress={handleGoToNotifications}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: "#FEF3C7" },
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#D97706"
                  />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Notifications</Text>
                  <Text style={styles.menuItemHint}>
                    Push notification preferences
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

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: AppColors.error }]}>
            Danger Zone
          </Text>
          <View style={styles.menuCard}>
            <DebouncedTouchable
              style={styles.menuItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: "#FEF3C7" },
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color={AppColors.warning}
                  />
                </View>
                <Text
                  style={[styles.menuItemLabel, { color: AppColors.warning }]}
                >
                  Logout
                </Text>
              </View>
            </DebouncedTouchable>

            <View style={styles.menuDivider} />

            <DebouncedTouchable
              style={styles.menuItem}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={AppColors.error}
                  />
                </View>
                <Text
                  style={[styles.menuItemLabel, { color: AppColors.error }]}
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
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <DebouncedTouchable
              onPress={() => {
                setShowDeleteModal(false)
                setDeleteConfirmation("")
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </DebouncedTouchable>
            <Text style={[styles.modalTitle, { color: AppColors.error }]}>
              Delete Account
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.deleteWarning}>
              <View style={styles.deleteWarningIcon}>
                <Ionicons name="warning" size={48} color={AppColors.error} />
              </View>
              <Text style={styles.deleteWarningTitle}>
                This action cannot be undone
              </Text>
              <Text style={styles.deleteWarningText}>
                Deleting your account will permanently remove:
              </Text>
              <View style={styles.deleteWarningList}>
                <Text style={styles.deleteWarningItem}>
                  • Your profile information
                </Text>
                <Text style={styles.deleteWarningItem}>• Order history</Text>
                <Text style={styles.deleteWarningItem}>• Saved addresses</Text>
                <Text style={styles.deleteWarningItem}>• Favorites list</Text>
              </View>
            </View>

            <View style={styles.deleteConfirmation}>
              <Text style={styles.deleteConfirmationLabel}>
                Type <Text style={{ fontWeight: "bold" }}>DELETE</Text> to
                confirm:
              </Text>
              <TextInput
                style={styles.deleteConfirmationInput}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  guestText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.text.secondary,
  },
  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "white",
  },
  profileName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: AppColors.text.primary,
  },
  profileEmail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 4,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[600],
  },
  // Form
  formCard: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 16,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  fieldHalf: {
    flex: 1,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginBottom: 6,
  },
  fieldHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
    marginTop: 4,
  },
  input: {
    backgroundColor: AppColors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
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
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  menuItemHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: AppColors.gray[100],
    marginLeft: 68,
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // Delete Warning
  deleteWarning: {
    alignItems: "center",
    paddingVertical: 20,
  },
  deleteWarningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  deleteWarningTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: AppColors.error,
    marginBottom: 8,
  },
  deleteWarningText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
  },
  deleteWarningList: {
    alignSelf: "stretch",
  },
  deleteWarningItem: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  deleteConfirmation: {
    marginVertical: 24,
  },
  deleteConfirmationLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  deleteConfirmationInput: {
    borderWidth: 2,
    borderColor: AppColors.error,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.text.primary,
  },
})
