import { StyleSheet, View } from "react-native"

import { useResponsive } from "@/src/hooks/useResponsive"
import ProductCardSkeleton from "./ProductCardSkeleton"

interface ProductGridSkeletonProps {
  count?: number
}

const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count }) => {
  const { config, isTablet, isLandscape, width } = useResponsive()

  const numColumns = isTablet ? (isLandscape ? 4 : 3) : 2
  const itemCount = count || (isTablet ? 6 : 4)

  const gap = config.gap
  const totalGaps = gap * (numColumns - 1)
  const containerWidth = width - config.horizontalPadding * 2
  const itemWidth = (containerWidth - totalGaps) / numColumns

  // Create rows
  const rows: number[][] = []
  for (let i = 0; i < itemCount; i += numColumns) {
    const row: number[] = []
    for (let j = 0; j < numColumns && i + j < itemCount; j++) {
      row.push(i + j)
    }
    rows.push(row)
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`skeleton-row-${rowIndex}`} style={styles.row}>
          {row.map((_, colIndex) => {
            const isLastInRow = colIndex === numColumns - 1
            return (
              <View
                key={`skeleton-${rowIndex}-${colIndex}`}
                style={{
                  width: itemWidth,
                  marginRight: isLastInRow ? 0 : gap,
                  marginBottom: gap,
                }}
              >
                <ProductCardSkeleton />
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

export default ProductGridSkeleton

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: "row",
  },
})
