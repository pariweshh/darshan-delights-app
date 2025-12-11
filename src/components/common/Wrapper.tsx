import { StyleProp, StyleSheet, ViewStyle } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface WrapperProps {
  children: React.ReactNode
  edges?: ("top" | "right" | "bottom" | "left")[]
  style?: StyleProp<ViewStyle>
}

const Wrapper: React.FC<WrapperProps> = ({ children, edges = [], style }) => {
  return (
    <SafeAreaView style={[styles.safeView, style]} edges={edges}>
      {children}
    </SafeAreaView>
  )
}

export default Wrapper

const styles = StyleSheet.create({
  safeView: {
    flex: 1,
  },
})
