import { fontSizes, IsIPAD } from "@/src/themes/app.constants"
import { LandingSlide } from "@/src/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { moderateScale, scale, verticalScale } from "react-native-size-matters"
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg"
import AuthModal from "../auth/auth-modal"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface SlideProps {
  slide: LandingSlide
  totalSlides: number
  index: number
  setIndex: (value: number) => void
}

const Slide = ({ slide, totalSlides, index, setIndex }: SlideProps) => {
  const { width: WIDTH, height: HEIGHT } = useWindowDimensions()
  const [modalVisible, setModalVisible] = useState(false)

  const handlePress = (index: number, setIndex: (index: number) => void) => {
    if (index === totalSlides - 1) {
      setModalVisible(true)
    } else {
      setIndex(index + 1)
    }
  }

  // Calculate responsive values
  const isLandscape = WIDTH > HEIGHT
  const contentPaddingTop = IsIPAD
    ? isLandscape
      ? verticalScale(20)
      : verticalScale(60)
    : verticalScale(100)

  // Arrow button position - centered vertically on the wave
  const arrowButtonTop = HEIGHT / 2

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

      <View style={[styles.container, { paddingTop: contentPaddingTop }]}>
        <View style={styles.imageContainer}>{slide.image}</View>
        <View style={styles.textContainer}>
          <View
            style={[
              styles.textWrapper,
              {
                width: IsIPAD ? WIDTH * 0.7 : WIDTH * 0.9,
                paddingHorizontal: IsIPAD
                  ? moderateScale(40)
                  : verticalScale(25),
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  fontSize: IsIPAD ? moderateScale(24, 0.3) : fontSizes.FONT30,
                },
              ]}
            >
              {slide.title}
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: IsIPAD ? moderateScale(14, 0.3) : fontSizes.FONT18,
                },
              ]}
            >
              {slide.subTitle}
            </Text>
          </View>
        </View>
      </View>

      {/* Page Indicators */}
      <View
        style={[
          styles.indicatorContainer,
          {
            bottom: IsIPAD ? verticalScale(40) : verticalScale(55),
            left: IsIPAD ? moderateScale(20) : scale(10),
          },
        ]}
      >
        {Array.from({ length: totalSlides }).map((_, i) => (
          <DebouncedTouchable
            key={i}
            style={[
              styles.indicator,
              i === index && styles.activeIndicator,
              IsIPAD && styles.indicatorTablet,
              i === index && IsIPAD && styles.activeIndicatorTablet,
            ]}
          />
        ))}
      </View>

      {index <= totalSlides - 1 && (
        <LinearGradient
          colors={["#FF9001", "#FF8E01"]}
          style={[
            styles.nextButton,
            {
              right: IsIPAD ? moderateScale(20) : moderateScale(25),
              bottom: IsIPAD ? verticalScale(20) : verticalScale(50),
              width: IsIPAD ? moderateScale(140, 0.3) : moderateScale(120),
              height: IsIPAD ? verticalScale(45) : verticalScale(40),
              borderRadius: IsIPAD ? moderateScale(10) : moderateScale(12),
            },
          ]}
        >
          <Pressable
            style={styles.nextButtonPressable}
            onPress={() => handlePress(index, setIndex)}
          >
            {index === totalSlides - 1 ? (
              <Text
                style={[
                  styles.nextButtonText,
                  {
                    fontSize: IsIPAD
                      ? moderateScale(14, 0.3)
                      : fontSizes.FONT18,
                  },
                ]}
              >
                Get Started
              </Text>
            ) : (
              <Text
                style={[
                  styles.nextButtonText,
                  {
                    fontSize: IsIPAD
                      ? moderateScale(14, 0.3)
                      : fontSizes.FONT18,
                  },
                ]}
              >
                Next
              </Text>
            )}
          </Pressable>
        </LinearGradient>
      )}

      {/* Arrow Button on Wave - Centered Vertically */}
      {index < totalSlides - 1 && (
        <DebouncedTouchable
          style={[
            styles.arrowButton,
            {
              width: IsIPAD ? moderateScale(45, 0.3) : scale(30),
              height: IsIPAD ? moderateScale(45, 0.3) : scale(30),
              borderRadius: IsIPAD ? moderateScale(22, 0.3) : scale(15),
              right: IsIPAD ? moderateScale(8) : moderateScale(5),
              top: arrowButtonTop,
              transform: [
                { translateY: IsIPAD ? -moderateScale(22, 0.3) : -15 },
              ],
            },
          ]}
          onPress={() => handlePress(index, setIndex)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward-outline"
            size={IsIPAD ? moderateScale(20, 0.3) : scale(18)}
            color="black"
          />
        </DebouncedTouchable>
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
    padding: IsIPAD ? moderateScale(60) : moderateScale(100),
    alignItems: "center",
  },
  imageContainer: {
    flex: 0.9,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
  },
  textWrapper: {
    alignItems: "flex-start",
  },
  title: {
    fontWeight: "600",
    color: "#05030d",
    fontFamily: "Poppins_600SemiBold",
  },
  subtitle: {
    paddingVertical: verticalScale(4),
    color: "#3e3b54",
    fontFamily: "Poppins_300Light",
  },
  indicatorContainer: {
    flexDirection: "row",
    position: "absolute",
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
  indicatorTablet: {
    height: verticalScale(5),
    width: moderateScale(20, 0.3),
    marginHorizontal: moderateScale(4),
    borderRadius: moderateScale(4),
  },
  activeIndicatorTablet: {
    height: verticalScale(6),
    width: moderateScale(45, 0.3),
  },
  nextButton: {
    position: "absolute",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonPressable: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  nextButtonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "Poppins_600SemiBold",
  },
  arrowButton: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
})

export default Slide
