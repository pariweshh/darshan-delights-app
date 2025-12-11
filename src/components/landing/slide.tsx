import { HEIGHT, WIDTH } from "@/src/config/constants"
import {
  fontSizes,
  IsIPAD,
  SCREEN_WIDTH,
  windowHeight,
  windowWidth,
} from "@/src/themes/app.constants"
import { LandingSlide } from "@/src/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { moderateScale, scale, verticalScale } from "react-native-size-matters"
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg"
import AuthModal from "../auth/auth-modal"

interface SlideProps {
  slide: LandingSlide
  totalSlides: number
  index: number
  setIndex: (value: number) => void
}

const Slide = ({ slide, totalSlides, index, setIndex }: SlideProps) => {
  const [modalVisible, setModalVisible] = useState(false)

  const handlePress = (index: number, setIndex: (index: number) => void) => {
    if (index === totalSlides - 1) {
      setModalVisible(true)
    } else {
      setIndex(index + 1)
    }
  }

  return (
    <>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="gradient" cx="50%" cy="35%">
            <Stop offset="0%" stopColor={slide.color} />
            <Stop offset="100%" stopColor={slide.color} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#gradient)" />
      </Svg>

      <View style={styles.container}>
        <View>{slide.image}</View>
        <View>
          <View
            style={{
              width: SCREEN_WIDTH * 1,
              paddingHorizontal: IsIPAD ? verticalScale(20) : verticalScale(25),
            }}
          >
            <Text
              style={{
                fontSize: IsIPAD ? fontSizes.FONT20 : fontSizes.FONT30,
                fontWeight: "600",
                color: "#05030d",
                fontFamily: "Poppins_600SemiBold",
              }}
            >
              {slide.title}
            </Text>

            <Text
              style={{
                paddingVertical: verticalScale(4),
                fontSize: IsIPAD ? fontSizes.FONT12 : fontSizes.FONT18,
                color: "#3e3b54",
                fontFamily: "Poppins_300Light",
              }}
            >
              {slide.subTitle}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.indicatorContainer}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.indicator, i === index && styles.activeIndicator]}
          />
        ))}
      </View>

      {index <= totalSlides - 1 && (
        <LinearGradient
          colors={["#FF9001", "#FF8E01"]}
          style={styles.nextButton}
        >
          <Pressable
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
            onPress={() => handlePress(index, setIndex)}
          >
            {index === totalSlides - 1 ? (
              <Text className="text-lg font-semibold text-white">
                Get Started
              </Text>
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </Pressable>
        </LinearGradient>
      )}

      {index < totalSlides - 1 && (
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => handlePress(index, setIndex)}
        >
          <Ionicons
            name="chevron-forward-outline"
            size={scale(18)}
            color="black"
          />
        </TouchableOpacity>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)}>
          <AuthModal setModalVisible={setModalVisible} />
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    padding: scale(60),
    paddingTop: IsIPAD ? verticalScale(0) : verticalScale(100),
    alignItems: "center",
  },
  indicatorContainer: {
    flexDirection: "row",
    marginTop: verticalScale(35),
    position: "absolute",
    bottom: verticalScale(55),
    left: scale(10),
  },
  indicator: {
    height: verticalScale(7),
    width: scale(18),
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: scale(4),
    borderRadius: scale(4),
  },
  activeIndicator: {
    height: verticalScale(8),
    width: scale(40),
    backgroundColor: "white",
  },
  nextButton: {
    position: "absolute",
    zIndex: 999999999,
    right: windowWidth(25),
    bottom: windowHeight(50),
    marginTop: windowHeight(30),
    alignItems: "center",
    justifyContent: "center",
    width: IsIPAD ? windowWidth(100) : windowWidth(140),
    height: IsIPAD ? windowHeight(70) : windowHeight(37),
    borderRadius: IsIPAD ? windowWidth(8) : windowWidth(12),
  },
  nextButtonText: {
    color: "white",
    fontSize: IsIPAD ? fontSizes.FONT16 : fontSizes.FONT22,
    fontWeight: "bold",
  },
  arrowButton: {
    position: "absolute",
    width: IsIPAD ? scale(50) : scale(30),
    height: IsIPAD ? scale(50) : scale(30),
    borderRadius: IsIPAD ? scale(25) : scale(20),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    right: moderateScale(5),
    top:
      Platform.OS === "ios" && IsIPAD ? verticalScale(235) : verticalScale(345),
    transform: [{ translateY: -22 }, { translateX: IsIPAD ? -12 : 1.5 }],
  },
})

export default Slide
