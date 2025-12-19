import AppColors from "@/src/constants/Colors"
import { AntDesign } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface QuantitySelectorProps {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  maxQuantity: number
  minQuantity?: number
  disabled?: boolean
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  maxQuantity,
  minQuantity = 1,
  disabled = false,
}) => {
  const canDecrease = quantity > minQuantity && !disabled
  const canIncrease = quantity < maxQuantity && !disabled

  return (
    <View style={styles.container}>
      <DebouncedTouchable
        onPress={onDecrease}
        style={[styles.button, !canDecrease && styles.buttonDisabled]}
        disabled={!canDecrease}
        activeOpacity={0.7}
      >
        <AntDesign
          name="minus"
          size={18}
          color={canDecrease ? AppColors.primary[600] : AppColors.gray[400]}
        />
      </DebouncedTouchable>

      <View style={styles.quantityContainer}>
        <Text style={styles.quantity}>{quantity}</Text>
      </View>

      <DebouncedTouchable
        onPress={onIncrease}
        style={[styles.button, !canIncrease && styles.buttonDisabled]}
        disabled={!canIncrease}
        activeOpacity={0.7}
      >
        <AntDesign
          name="plus"
          size={18}
          color={canIncrease ? AppColors.primary[600] : AppColors.gray[400]}
        />
      </DebouncedTouchable>
    </View>
  )
}

export default QuantitySelector

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: AppColors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: AppColors.gray[100],
  },
  quantityContainer: {
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
})
