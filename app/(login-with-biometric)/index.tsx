import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Platform } from "react-native";
import { Box, PageView, Text } from "@common/components";
import { useBiometricAvailability } from "@common/hooks/useBiometricAvailability";
import { authenticateWithBiometrics, formatBiometricType } from "@common/utils/biometric-utils";
import { useAppDispatch } from "@common/redux/hooks";
import {
  setBiometricScreenDismissed,
  setBiometricEnabled,
} from "@common/redux/slices/appConfiguration/app-configuration.slice";
import { EncryptedStorage } from "@common/services/EncryptedStorage";
import { Storage } from "@common/services/Storage";
import AppConstants from "@common/assets/AppConstants";
import * as LocalAuthentication from "expo-local-authentication";

export default function BiometricLoggingInScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { type } = useBiometricAvailability();
  const dispatch = useAppDispatch();
  const [, setIsAuthenticating] = useState(false);
  const [, setHasFailed] = useState(false);

  const handleBiometricAuth = useCallback(async () => {
    // Check biometric availability synchronously before making any decisions
    // This prevents race conditions where the hook state might not be ready yet
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      router.replace("/(onboarding)");
      return;
    }

    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!isEnrolled || supportedTypes.length === 0) {
      // Biometric no longer available - clear session and redirect to onboarding
      await EncryptedStorage.removeItem(AppConstants.StorageKey.appSession);
      await Storage.removeItem("biometric_enabled");
      dispatch(setBiometricEnabled(false));
      dispatch(setBiometricScreenDismissed(false));
      router.replace("/(onboarding)");
      return;
    }

    // Determine biometric type for the prompt message
    let biometricType: string = type;
    if (Platform.OS === "ios") {
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = "FaceID";
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = "TouchID";
      }
    }

    setIsAuthenticating(true);
    setHasFailed(false);

    const biometricTypeName = formatBiometricType(biometricType);
    const success = await authenticateWithBiometrics({
      promptMessage: `Authenticate with ${biometricTypeName} to continue`,
      fallbackLabel: "Use Passcode",
      errorMessage: `Failed to authenticate with ${biometricTypeName}. Please try again.`,
      onSuccess: () => {
        setIsAuthenticating(false);
        // Mark biometric setup as completed (user has authenticated)
        dispatch(setBiometricScreenDismissed(false));
        router.replace("/(home)/(tabs)/dashboard");
      },
      onFailure: () => {
        setIsAuthenticating(false);
        setHasFailed(true);
      },
    });

    if (!success) {
      setIsAuthenticating(false);
      setHasFailed(true);
    }
  }, [type, router, dispatch]);

  useEffect(() => {
    // Trigger biometric authentication when screen mounts
    handleBiometricAuth();
  }, [handleBiometricAuth]);

  return (
    <PageView type="View">
      <Box flex={1} justifyContent="center" alignItems="center">
        <Box flex={1} justifyContent="center" alignItems="center" paddingVertical={"xl"}>
          <Image
            source={require("@common/assets/images/biometric-login.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </Box>
        <Text variant="h1-pacifico" color="black" textAlign="center">
          Log in with Biometric
        </Text>
      </Box>
    </PageView>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    image: {
      width: 392,
      height: 326,
    },
    icon: {
      width: 200,
      height: 200,
      marginBottom: 32,
    },
  });
};

