import { Image } from "expo-image"
import { StyleSheet, View } from "react-native"

interface LogoProps {
  size?: number
}

const Logo: React.FC<LogoProps> = ({ size = 60 }) => {
  return (
    <View style={styles.logoView}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  )
}

export default Logo

const styles = StyleSheet.create({
  logoView: {
    flexDirection: "row",
    alignItems: "center",
  },
})
