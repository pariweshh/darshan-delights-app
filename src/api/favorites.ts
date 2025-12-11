import api from "./client"

export const getFavorites = async (token: string): Promise<any> => {
  try {
    const { data } = await api.get("/wishlists", {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  } catch (error) {
    console.error("[FAVORITES ERROR - getFavorites]:", error)
    throw error
  }
}

export const toggleFavorite = async (
  fav: { product_id: number },
  token: string
): Promise<any> => {
  try {
    const { data } = await api.post("/wishlists", fav, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  } catch (error) {
    console.error("[FAVORITES ERROR - toggleFavorite]:", error)
    throw error
  }
}
