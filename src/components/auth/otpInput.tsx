import React, { useEffect, useRef, useState } from "react"
import { Keyboard, StyleSheet, TextInput, View } from "react-native"

import AppColors from "@/src/constants/Colors"

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  error?: boolean
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  error = false,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(
    autoFocus ? 0 : null
  )

  // Split value into array
  const otpArray = value
    .split("")
    .concat(Array(length).fill(""))
    .slice(0, length)

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return

    // Handle paste (multiple characters)
    if (text.length > 1) {
      const pastedCode = text.slice(0, length)
      onChange(pastedCode)

      // Focus appropriate input
      const nextIndex = Math.min(pastedCode.length, length - 1)
      inputRefs.current[nextIndex]?.focus()

      // Trigger complete if full
      if (pastedCode.length === length && onComplete) {
        Keyboard.dismiss()
        onComplete(pastedCode)
      }
      return
    }

    // Build new OTP value
    const newOtpArray = [...otpArray]
    newOtpArray[index] = text
    const newValue = newOtpArray.join("").slice(0, length)
    onChange(newValue)

    // Move to next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Trigger complete if full
    if (newValue.length === length && onComplete) {
      Keyboard.dismiss()
      onComplete(newValue)
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otpArray[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus()

        // Clear previous
        const newOtpArray = [...otpArray]
        newOtpArray[index - 1] = ""
        onChange(newOtpArray.join(""))
      } else {
        // Clear current
        const newOtpArray = [...otpArray]
        newOtpArray[index] = ""
        onChange(newOtpArray.join(""))
      }
    }
  }

  const handleFocus = (index: number) => {
    setFocusedIndex(index)
  }

  const handleBlur = () => {
    setFocusedIndex(null)
  }

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref
            }}
            style={[
              styles.input,
              otpArray[index] && styles.inputFilled,
              focusedIndex === index && styles.inputFocused,
              error && styles.inputError,
              disabled && styles.inputDisabled,
            ]}
            value={otpArray[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={index === 0 ? length : 1}
            editable={!disabled}
            selectTextOnFocus
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
        ))}
    </View>
  )
}

export default OTPInput

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    backgroundColor: AppColors.background.secondary,
    textAlign: "center",
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  inputFilled: {
    borderColor: AppColors.primary[500],
    backgroundColor: AppColors.primary[50],
  },
  inputFocused: {
    borderColor: AppColors.primary[600],
    backgroundColor: AppColors.background.primary,
  },
  inputError: {
    borderColor: AppColors.error,
    backgroundColor: "#FEF2F2",
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: AppColors.gray[100],
  },
})
