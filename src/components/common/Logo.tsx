import { usePathname, useRouter } from "expo-router"
import { Image, StyleSheet, TouchableOpacity } from "react-native"

interface LogoProps {
  size?: number
}

const Logo: React.FC<LogoProps> = ({ size = 60 }) => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <TouchableOpacity
      style={styles.logoView}
      onPress={() => router.replace("/home")}
      activeOpacity={0.8}
    >
      <Image
        source={require("@/assets/images/logo.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  )
}

export default Logo

const styles = StyleSheet.create({
  logoView: {
    flexDirection: "row",
    alignItems: "center",
  },
})
