import * as LocalAuthentication from "expo-local-authentication";

import { Toast } from "./toast-utils";

interface BiometricAuthOptions {
  promptMessage: string;
  fallbackLabel: string;
  errorMessage: string;
  onSuccess: () => void;
  onFailure?: () => void;
  /**
   * If true, disables device fallback (PIN/password).
   * For maximum security, set to true. Default: false (allows fallback).
   */
  disableDeviceFallback?: boolean;
}

/**
 * Handles biometric authentication using Face ID or Touch ID
 * @param options Configuration object with prompt messages and callbacks
 * @returns Promise<boolean> indicating if authentication was successful
 */
export const authenticateWithBiometrics = async (options: BiometricAuthOptions): Promise<boolean> => {
  const { promptMessage, fallbackLabel, errorMessage, onSuccess, onFailure, disableDeviceFallback = false } = options;

  try {
    // Verify biometric is enrolled before attempting authentication
    // Note: Caller should handle enrollment checks, but we verify here as a safety check
    // without showing toast to avoid premature error messages
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      // Don't show toast here - let the caller handle the enrollment state
      onFailure?.();
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel,
      biometricsSecurityLevel: "strong",
      cancelLabel: "Go Back",
      disableDeviceFallback,
    });

    if (result.success) {
      onSuccess();
      return true;
    } else {
      // Only show error message for actual authentication failures, not user cancellations
      const errorType = result.error;
      if (errorType !== "user_cancel" && errorType !== "app_cancel" && errorType !== "system_cancel") {
        // Only show toast for actual failures, not cancellations
        Toast.show(errorMessage, { type: "warning" });
      }
      onFailure?.();
      return false;
    }
  } catch (error) {
    // Only show toast for unexpected errors during authentication
    Toast.show(errorMessage, { type: "error" });
    onFailure?.();
    return false;
  }
};

export const formatBiometricType = (type: string): string => {
  switch (type) {
    case "FaceID":
    case "Face":
      return "FaceID";
    case "TouchID":
      return "Touch ID";
    case "Fingerprint":
      return "Fingerprint";
    case "Iris":
      return "Iris";
    default:
      return "Biometric";
  }
};

