import React, { useRef, useState } from "react"
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Image } from "expo-image"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface ImageCarouselProps {
  coverImage?: { url: string }
  images: { url: string }[]
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  coverImage,
  images,
}) => {
  const { width, isTablet, isLandscape } = useResponsive()
  const flatListRef = useRef<FlatList>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Calculate carousel width based on layout
  const carouselWidth = isTablet && isLandscape ? width * 0.45 : width
  const imageHeight = isTablet ? (isLandscape ? 400 : 350) : 300

  // Combine cover image with other images
  const allImages = coverImage
    ? [coverImage, ...images.filter((img) => img.url !== coverImage.url)]
    : images

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / carouselWidth)
    setActiveIndex(index)
  }

  const handleThumbnailPress = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true })
    setActiveIndex(index)
  }

  if (allImages.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: carouselWidth, height: imageHeight },
        ]}
      >
        <Image
          source={require("@/assets/images/empty.png")}
          style={styles.placeholderImage}
          contentFit="contain"
        />
      </View>
    )
  }

  return (
    <View style={{ width: carouselWidth }}>
      {/* Main Image Carousel */}
      <FlatList
        ref={flatListRef}
        data={allImages}
        keyExtractor={(item, index) => `image-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View
            style={[
              styles.imageContainer,
              { width: carouselWidth, height: imageHeight },
            ]}
          >
            <Image
              source={{ uri: item.url }}
              style={styles.image}
              contentFit="contain"
            />
          </View>
        )}
      />

      {/* Pagination Dots */}
      {allImages.length > 1 && (
        <View style={styles.pagination}>
          {allImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: isTablet ? 10 : 8,
                  height: isTablet ? 10 : 8,
                  borderRadius: isTablet ? 5 : 4,
                },
                activeIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}

      {/* Thumbnails (for tablets) */}
      {isTablet && allImages.length > 1 && (
        <FlatList
          data={allImages}
          keyExtractor={(item, index) => `thumb-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailContainer}
          renderItem={({ item, index }) => (
            <DebouncedTouchable
              onPress={() => handleThumbnailPress(index)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.thumbnail,
                  activeIndex === index && styles.activeThumbnail,
                ]}
              >
                <Image
                  source={{ uri: item.url }}
                  style={styles.thumbnailImage}
                  contentFit="contain"
                />
              </View>
            </DebouncedTouchable>
          )}
        />
      )}
    </View>
  )
}

export default ImageCarousel

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderImage: {
    width: "60%",
    height: "60%",
    opacity: 0.5,
  },
  imageContainer: {
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    backgroundColor: AppColors.gray[300],
  },
  activeDot: {
    backgroundColor: AppColors.primary[500],
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: AppColors.gray[50],
    overflow: "hidden",
  },
  activeThumbnail: {
    borderColor: AppColors.primary[500],
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
})
