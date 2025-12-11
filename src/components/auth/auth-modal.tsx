import { CommonActions } from "@react-navigation/native"
import { BlurView } from "expo-blur"
import { router, useNavigation } from "expo-router"
import { Image, Text, View } from "react-native"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { IsIPAD, windowHeight, windowWidth } from "@/src/themes/app.constants"
import { setOnboardingCompleted } from "@/src/utils/storage"

interface AuthModalProps {
  setModalVisible: (value: boolean) => void
}

const AuthModal = ({ setModalVisible }: AuthModalProps) => {
  const navigation = useNavigation()

  const handleLogin = () => {
    setModalVisible(false)
    setOnboardingCompleted()
    router.push("/(auth)/login")
  }

  const handleBrowse = () => {
    setModalVisible(false)
    setOnboardingCompleted()
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "(tabs)" }],
      })
    )
  }

  return (
    <BlurView intensity={50} className="flex-1 justify-center items-center">
      <View
        style={{
          width: IsIPAD ? windowWidth(200) : windowWidth(420),
          height: windowHeight(350),
          marginHorizontal: windowWidth(50),
          padding: 32,
          borderRadius: 24,
        }}
        className="justify-center items-center bg-white"
      >
        <Image
          source={require("@/assets/images/logo.png")}
          resizeMode="contain"
          className="w-40 h-40"
        />

        <View className="relative">
          <Text
            style={{ fontFamily: "Poppins_700Bold" }}
            className="text-xl text-center"
          >
            Sign up to Darshan Delights
          </Text>
          <Text
            style={{ fontFamily: "Poppins_300Light" }}
            className="mt-2 text-gray-700 text-center"
          >
            Shop from the palm of your hand
          </Text>
          <Image
            source={require("@/assets/images/path.png")}
            className="w-20 h-4 absolute -bottom-6 right-0"
            resizeMode="contain"
          />
        </View>

        <Button
          title="Log in or sign up"
          onPress={handleLogin}
          style={{ marginTop: 32 }}
          fullWidth
        />

        <Button
          title="Browse for now"
          onPress={handleBrowse}
          fullWidth
          style={{ backgroundColor: "transparent", marginTop: 4 }}
          textStyle={{
            color: AppColors.primary[500],
            textDecorationLine: "underline",
          }}
        />
      </View>
    </BlurView>
  )
}

export default AuthModal
