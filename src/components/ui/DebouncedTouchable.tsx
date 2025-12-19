import { useDebouncedCallback } from "@/src/hooks/useDebouncedCallback"
import { TouchableOpacity, TouchableOpacityProps } from "react-native"

interface DebouncedTouchableProps extends TouchableOpacityProps {
  debounceDelay?: number
}

const DebouncedTouchable = ({
  onPress,
  debounceDelay = 200,
  ...props
}: DebouncedTouchableProps) => {
  const debouncedOnPress = useDebouncedCallback(
    onPress || (() => {}),
    debounceDelay
  )

  return <TouchableOpacity {...props} onPress={debouncedOnPress} />
}

export default DebouncedTouchable
