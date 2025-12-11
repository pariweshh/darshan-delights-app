import api from "./client"

export const sendFeedback = async ({
  name,
  email,
  topic,
  rating,
  message,
}: {
  name: string
  email: string
  topic: string
  rating: number | null
  message: string
}) => {
  try {
    const { data } = await api.post("/feedbacks", {
      name,
      email,
      topic,
      rating,
      message,
    })
    return data
  } catch (error) {
    console.error("Error sending message: ", error)
    throw error
  }
}
