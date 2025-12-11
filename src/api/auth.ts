import { AuthResponse, LoginProps, SignUpProps, User } from "../types"
import api from "./client"

export const signIn = async (loginData: LoginProps): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/local", loginData)
    return data
  } catch (error) {
    console.error("[AUTH ERROR - signIn]:", error)
    throw error
  }
}

export const signUp = async (
  signUpData: SignUpProps
): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>(
      "/auth/local/register",
      signUpData
    )
    return data
  } catch (error) {
    console.error("[AUTH ERROR - signUp]:", error)
    throw error
  }
}

// Verify OTP
export const verifyOTP = async (
  email: string,
  otp: string
): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/verify-otp", { email, otp })
  return data
}

// Verify token (deep link)
export const verifyToken = async (token: string): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/verify-token", { token })
  return data
}

// Resend confirmation
export const resendConfirmation = async (
  email: string
): Promise<{ ok: boolean; message: string }> => {
  const { data } = await api.post("/auth/resend-confirmation", {
    email,
    platform: "mobile",
  })
  return data
}

// Verify reset OTP
export const verifyResetOTP = async (
  email: string,
  otp: string
): Promise<{ ok: boolean; resetToken: string }> => {
  const { data } = await api.post("/auth/verify-reset-otp", { email, otp })
  return data
}

// Reset password
export const resetPassword = async (
  token: string,
  password: string,
  passwordConfirmation: string
): Promise<{ ok: boolean; message: string }> => {
  const { data } = await api.post("/auth/reset-password", {
    token,
    password,
    passwordConfirmation,
  })
  return data
}

export const getUserInfo = async (token: string): Promise<User> => {
  if (!token) throw new Error("No token provided")
  try {
    const { data } = await api.get<User>("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  } catch (error) {
    console.error("[AUTH ERROR - getUserInfo]:", error)
    throw error
  }
}

export const updateUserInfo = async (
  token: string,
  userData: Partial<User>
): Promise<User> => {
  if (!token) throw new Error("No token provided")
  try {
    const { data } = await api.put<User>(
      "/users",
      { data: userData },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return data
  } catch (error) {
    console.error("[AUTH ERROR - updateUserInfo]:", error)
    throw error
  }
}

export const updatePassword = async (
  token: string,
  passwordData: {
    currentPassword: string
    password: string
    passwordConfirmation: string
  }
): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>(
      "/auth/change-password",
      passwordData,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return data
  } catch (error) {
    console.error("[AUTH ERROR - updatePassword]:", error)
    throw error
  }
}

export const forgotPassword = async (
  email: string
): Promise<{ ok: boolean }> => {
  try {
    const { data } = await api.post("/auth/forgot-password", {
      email,
      platform: "mobile",
    })
    return data
  } catch (error) {
    console.error("[AUTH ERROR - forgotPassword]:", error)
    throw error
  }
}

export const verifyUserPassword = async (
  token: string,
  password: string
): Promise<{ valid: boolean }> => {
  try {
    const { data } = await api.post<{ valid: boolean }>(
      "/users/verify-password",
      { password },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return data
  } catch (error) {
    console.error("[AUTH ERROR - verifyUserPassword]:", error)
    throw error
  }
}

export const deleteUserAccount = async (
  token: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data } = await api.delete("/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  } catch (error) {
    console.error("[AUTH ERROR - deleteUserAccount]:", error)
    throw error
  }
}
