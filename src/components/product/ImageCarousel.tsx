import AppColors from "@/src/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { useRef, useState } from "react"
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  View,
  ViewToken,
} from "react-native"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface ImageCarouselProps {
  images: { url: string; alternativeText?: string }[]
  coverImage?: { url: string }
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  coverImage,
}) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  // Combine cover image with additional images
  const allImages = coverImage
    ? [
        coverImage,
        ...(images || []).filter((img) => img.url !== coverImage.url),
      ]
    : images || []

  // If no images, show placeholder
  if (allImages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Ionicons
            name="image-outline"
            size={64}
            color={AppColors.gray[300]}
          />
        </View>
      </View>
    )
  }

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index)
      }
    }
  ).current

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  const renderItem = ({ item }: { item: { url: string } }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={allImages}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Pagination Dots */}
      {allImages.length > 1 && (
        <View style={styles.pagination}>
          {allImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

export default ImageCarousel

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    backgroundColor: AppColors.background.primary,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderContainer: {
    flex: 1,
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
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: AppColors.primary[500],
    width: 24,
  },
  inactiveDot: {
    backgroundColor: AppColors.gray[300],
  },
})
