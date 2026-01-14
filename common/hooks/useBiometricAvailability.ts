import { useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

type BiometricType = "FaceID" | "TouchID" | "Fingerprint" | "Face" | "Iris" | "None";

export function useBiometricAvailability(): { isAvailable: boolean; type: BiometricType } {
  const [result, setResult] = useState<{ isAvailable: boolean; type: BiometricType }>({
    isAvailable: false,
    type: "None",
  });

  useEffect(() => {
    async function checkBiometricAvailability() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          setResult({ isAvailable: false, type: "None" });
          return;
        }

        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!isEnrolled || supportedTypes.length === 0) {
          setResult({ isAvailable: false, type: "None" });
          return;
        }

        let type: BiometricType = "None";

        if (Platform.OS === "ios") {
          // iOS specific types - iOS is more accurate, FaceID/TouchID are mutually exclusive
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            type = "FaceID";
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            type = "TouchID";
          }
        } else if (Platform.OS === "android") {
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            type = "Fingerprint";
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            type = "Face";
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            type = "Iris";
          }
        }

        setResult({ isAvailable: type !== "None", type });

        const result = { isAvailable: type !== "None", type };
        setResult(result);
      } catch (error) {
        console.error("Error checking biometric availability:", error);
        setResult({ isAvailable: false, type: "None" });
      }
    }

    checkBiometricAvailability();
  }, []);

  return result;
}
