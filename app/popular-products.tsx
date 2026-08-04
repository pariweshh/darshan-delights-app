import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import AppColors from "@/src/constants/Colors"

export default function PopularProductsScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#18181B" />
        </Pressable>
        <Text style={styles.headerTitle}>Popular Products</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="flame-outline" size={64} color={AppColors.primary[500]} />
        <Text style={styles.title}>Most Popular Favorites</Text>
        <Text style={styles.subtitle}>
          Browse top-selling snacks, sweets, and customer favorites across Darshan Delights.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18181B",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#18181B",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#71717A",
    textAlign: "center",
    lineHeight: 20,
  },
})
