// src/components/common/TitleHeader.tsx

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { StyleSheet, Text, View } from "react-native"

interface TitleHeaderProps {
  title: string
  subtitle?: string
  align?: "center" | "left"
}

const TitleHeader: React.FC<TitleHeaderProps> = ({
  title,
  subtitle,
  align = "center",
}) => {
  const { config, isTablet, isLandscape } = useResponsive()

  return (
    <View
      style={[
        styles.container,
        { alignItems: align === "center" ? "center" : "flex-start" },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            fontSize: isTablet
              ? isLandscape
                ? config.titleFontSize
                : config.titleFontSize + 2
              : 24,
            textAlign: align,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: config.bodyFontSize,
              marginTop: isTablet ? 6 : 4,
              textAlign: align,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  )
}

export default TitleHeader

const styles = StyleSheet.create({
  container: {},
  title: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
})
