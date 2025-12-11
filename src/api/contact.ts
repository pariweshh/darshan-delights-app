import api from "./client"

export const sendMessage = async ({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) => {
  try {
    const { data } = await api.post("/contact-us", {
      name,
      email,
      subject,
      message,
    })
    return data
  } catch (error: any) {
    console.error("Error sending message: ", error)
    throw error
  }
}
