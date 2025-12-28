import { Ionicons } from "@expo/vector-icons"
import * as Updates from "expo-updates"
import React, { Component, ErrorInfo, ReactNode } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import { NetworkError } from "@/src/api/client"
import AppColors from "@/src/constants/Colors"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isNetworkError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isNetworkError: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isNetworkError:
        error instanceof NetworkError ||
        error.message.includes("Network") ||
        error.message.includes("network") ||
        error.message.includes("internet"),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Don't log network errors as they're expected
    if (!(error instanceof NetworkError)) {
      console.error("Error Boundary caught an error:", error)
      console.error("Error Info:", errorInfo)
      this.props.onError?.(error, errorInfo)
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isNetworkError: false,
    })
  }

  handleRestart = async (): Promise<void> => {
    try {
      // Check if we're in a production build with updates enabled
      if (!__DEV__) {
        await Updates.reloadAsync()
      } else {
        // In development, just reset the error state
        this.handleRetry()
      }
    } catch (e) {
      // If restart fails, at least reset the error state
      this.handleRetry()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Network error UI
      if (this.state.isNetworkError) {
        return (
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={[styles.iconContainer, styles.networkIconContainer]}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={64}
                  color={AppColors.gray[500]}
                />
              </View>

              <Text style={styles.title}>No Internet Connection</Text>

              <Text style={styles.message}>
                Please check your internet connection and try again.
              </Text>

              <View style={styles.buttonContainer}>
                <DebouncedTouchable
                  style={styles.primaryButton}
                  onPress={this.handleRetry}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </DebouncedTouchable>
              </View>
            </View>
          </View>
        )
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name="warning-outline"
                size={64}
                color={AppColors.error}
              />
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Oops! Something went wrong</Text>

            {/* Error Message */}
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again
              or restart the app.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <DebouncedTouchable
                style={styles.primaryButton}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </DebouncedTouchable>

              <DebouncedTouchable
                style={styles.secondaryButton}
                onPress={this.handleRestart}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="reload"
                  size={20}
                  color={AppColors.primary[600]}
                />
                <Text style={styles.secondaryButtonText}>Restart App</Text>
              </DebouncedTouchable>
            </View>

            {/* Error Details (Development Only) */}
            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  networkIconContainer: {
    backgroundColor: AppColors.gray[100],
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary[500],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "white",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary[50],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.primary[600],
  },
  errorDetails: {
    marginTop: 24,
    maxHeight: 200,
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
  },
  errorDetailsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.error,
    marginBottom: 8,
  },
  stackTrace: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: AppColors.text.secondary,
  },
})

export default ErrorBoundary
