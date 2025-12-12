import { useCallback, useState } from "react"

import {
  recordSuccessfulOrder,
  shouldShowRatingPrompt,
} from "@/src/services/appRating"

export function useAppRating() {
  const [showRatingModal, setShowRatingModal] = useState(false)

  /**
   * Call this after a successful order
   */
  const onSuccessfulOrder = useCallback(async () => {
    // Record the order
    await recordSuccessfulOrder()

    // Check if we should show the prompt
    const shouldShow = await shouldShowRatingPrompt()

    if (shouldShow) {
      // Small delay to let the success UI show first
      setTimeout(() => {
        setShowRatingModal(true)
      }, 2000)
    }
  }, [])

  const closeRatingModal = useCallback(() => {
    setShowRatingModal(false)
  }, [])

  return {
    showRatingModal,
    onSuccessfulOrder,
    closeRatingModal,
  }
}
