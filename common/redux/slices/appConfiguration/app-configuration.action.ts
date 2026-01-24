import i18next from "i18next";
import { createAsyncThunk } from "@reduxjs/toolkit";

import AppConstants from "../../../assets/AppConstants";
import {
  AppSession,
  ApiResponse,
  SupportedLanguage,
  RememberUserState,
  RegisterDeviceResponse,
} from "../../models/Base";

import { Api } from "@common/services/api";
import { getDeviceId } from "@common/utils";
import { Storage } from "@common/services/Storage";
import { EncryptedStorage } from "@common/services/EncryptedStorage";

export const loadConfiguration = createAsyncThunk<
  {
    appSession?: AppSession;
    appLanguage?: SupportedLanguage;
    isOnboardingCompleted?: boolean;
    rememberUser?: RememberUserState;
    isFcmTokenRegistered?: boolean;
    isBiometricSetupRequired?: boolean;
    biometricEnabled?: boolean;
  } | null,
  void
>("appConfiguration/loadConfiguration", async (_, api) => {
  const appSession = await EncryptedStorage.getItem<AppSession>(AppConstants.StorageKey.appSession);

  const isOnboardingCompleted = await Storage.getItem<boolean>(AppConstants.StorageKey.onboardingState);

  const appLanguage = await Storage.getItem<SupportedLanguage>(AppConstants.StorageKey.appLanguage);

  const rememberUser = await Storage.getItem<RememberUserState>(AppConstants.StorageKey.rememberUser);

  const fcmToken = await Storage.getItem<string>(AppConstants.StorageKey.fcmToken);
  const isFcmTokenRegistered = await Storage.getItem<boolean>(AppConstants.StorageKey.fcmRegistryCompleted);

  // Load biometric enabled state
  const biometricEnabled = await Storage.getItem<boolean>("biometric_enabled");
  
  // Determine if biometric setup is required
  // If biometric is enabled and onboarding is completed, setup is required
  const isBiometricSetupRequired = biometricEnabled === true && isOnboardingCompleted === true;

  if (fcmToken && !isFcmTokenRegistered && appSession?.access_token) {
    api.dispatch(registerDevice({ fcmToken }));
  }

  return {
    appSession: appSession ?? undefined,
    appLanguage: appLanguage ?? "en",
    rememberUser: rememberUser ?? undefined,
    isFcmTokenRegistered: isFcmTokenRegistered ?? false,
    isOnboardingCompleted: isOnboardingCompleted ?? false,
    biometricEnabled: biometricEnabled ?? false,
    isBiometricSetupRequired: isBiometricSetupRequired,
  };
});

export const changeLanguage = createAsyncThunk<SupportedLanguage, SupportedLanguage>(
  "appConfiguration/changeLanguage",
  async (language: SupportedLanguage) => {
    await i18next.changeLanguage(language);
    return language;
  }
);

export const registerDevice = createAsyncThunk<void, { fcmToken: string }>(
  "appConfiguration/registerDevice",
  async (params) => {
    const deviceId = await getDeviceId();

    const response = await Api.post<ApiResponse<RegisterDeviceResponse>>(AppConstants.ApiKeys.fcmRegistration, {
      deviceId,
      channel: "WEB",
      fcmId: params.fcmToken,
    });

    const { data, message } = response.data;

    if (response?.status !== 200) {
      throw new Error(message);
    }

    await Storage.setItem(AppConstants.StorageKey.fcmRegistryCompleted, true);
  }
);
