import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { DeliveryStatus } from "@/src/types"

interface Props {
  status: DeliveryStatus
  isPickup?: boolean
}

interface Step {
  key: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

const DELIVERY_STEPS: Step[] = [
  { key: "processing", label: "Processing", icon: "cube-outline" },
  { key: "dispatched", label: "Dispatched", icon: "car-outline" },
  { key: "delivered", label: "Delivered", icon: "checkmark-circle-outline" },
]

const PICKUP_STEPS: Step[] = [
  { key: "processing", label: "Processing", icon: "cube-outline" },
  { key: "ready for pickup", label: "Ready", icon: "storefront-outline" },
  { key: "picked up", label: "Picked Up", icon: "checkmark-circle-outline" },
]

const OrderDeliveryProgress: React.FC<Props> = ({
  status,
  isPickup = false,
}) => {
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS
  const isCanceled = status === "canceled"

  const getStepIndex = (): number => {
    if (isCanceled) return -1
    const index = steps.findIndex((step) => step.key === status)
    return index >= 0 ? index : 0
  }

  const currentStepIndex = getStepIndex()

  const getStepStatus = (
    index: number
  ): "completed" | "current" | "pending" => {
    if (isCanceled) return "pending"
    if (index < currentStepIndex) return "completed"
    if (index === currentStepIndex) return "current"
    return "pending"
  }

  if (isCanceled) {
    return (
      <View style={styles.canceledContainer}>
        <View style={styles.canceledIcon}>
          <Ionicons name="close-circle" size={32} color={AppColors.error} />
        </View>
        <Text style={styles.canceledText}>Order Canceled</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(index)
        const isLast = index === steps.length - 1

        return (
          <View key={step.key} style={styles.stepContainer}>
            {/* Step Circle */}
            <View
              style={[
                styles.stepCircle,
                stepStatus === "completed" && styles.stepCircleCompleted,
                stepStatus === "current" && styles.stepCircleCurrent,
              ]}
            >
              <Ionicons
                name={stepStatus === "completed" ? "checkmark" : step.icon}
                size={stepStatus === "completed" ? 16 : 20}
                color={stepStatus === "pending" ? AppColors.gray[400] : "white"}
              />
            </View>

            {/* Step Label */}
            <Text
              style={[
                styles.stepLabel,
                stepStatus === "completed" && styles.stepLabelCompleted,
                stepStatus === "current" && styles.stepLabelCurrent,
              ]}
            >
              {step.label}
            </Text>

            {/* Connector Line */}
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  stepStatus === "completed" && styles.connectorCompleted,
                ]}
              />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default OrderDeliveryProgress

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.gray[200],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    zIndex: 1,
  },
  stepCircleCompleted: {
    backgroundColor: AppColors.success,
  },
  stepCircleCurrent: {
    backgroundColor: AppColors.primary[500],
  },
  stepLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
    textAlign: "center",
  },
  stepLabelCompleted: {
    color: AppColors.success,
    fontFamily: "Poppins_500Medium",
  },
  stepLabelCurrent: {
    color: AppColors.primary[600],
    fontFamily: "Poppins_600SemiBold",
  },
  connector: {
    position: "absolute",
    top: 20,
    left: "60%",
    right: "-40%",
    height: 3,
    backgroundColor: AppColors.gray[200],
    zIndex: 0,
  },
  connectorCompleted: {
    backgroundColor: AppColors.success,
  },
  canceledContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  canceledIcon: {
    marginBottom: 8,
  },
  canceledText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.error,
  },
})
