import { PayloadAction, SerializedError, createSlice } from "@reduxjs/toolkit";

import { Storage } from "../../../services/Storage";
import AppConstants from "../../../assets/AppConstants";
import { AppSession, SupportedLanguage, RememberUserState } from "../../models/Base";

import { changeLanguage, loadConfiguration, registerDevice } from "./app-configuration.action";

interface AppConfiguration {
  ready: boolean;
  isUIReady?: boolean;
  error?: SerializedError;
  appSession?: AppSession | null;
  appLanguage?: SupportedLanguage;
  isOnboardingCompleted?: boolean;
  rememberUser?: RememberUserState;
  isBiometricSetupRequired?: boolean;
  biometricEnabled?: boolean;
  fcmTokenState?: "registered" | "pending";
}

const initialState: AppConfiguration = {
  ready: false,
};

const appConfigurationSlice = createSlice({
  name: "appConfiguration",
  initialState,
  reducers: {
    setOnboardingComplete: state => {
      state.isOnboardingCompleted = true;
      // we'll be ignoring the promise, its done this way not to block the user
      Storage.setItem(AppConstants.StorageKey.onboardingState, true).then().catch();
    },

    setAppSession: (state, action: PayloadAction<AppSession | undefined | null>) => {
      state.appSession = action.payload;
    },

    setRememberUser: (state, action: PayloadAction<RememberUserState | undefined>) => {
      state.rememberUser = action.payload;
      Storage.setItem(AppConstants.StorageKey.rememberUser, action.payload).then().catch();
    },

    setBiometricScreenDismissed: (state, action: PayloadAction<boolean>) => {
      state.isBiometricSetupRequired = action.payload;
    },

    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
      // Persist to storage
      Storage.setItem("biometric_enabled", action.payload).then().catch();
      // If biometric is enabled, setup is required on next app launch
      state.isBiometricSetupRequired = action.payload;
    },

    onUIReady: state => {
      state.isUIReady = true;
    },

    resetState: state => {
      state.error = undefined;
      state.appSession = undefined;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadConfiguration.fulfilled, (state, action) => {
        state.ready = true;
        state.appSession = action.payload?.appSession;
        state.appLanguage = action.payload?.appLanguage;
        state.isOnboardingCompleted = action.payload?.isOnboardingCompleted;
        state.rememberUser = action.payload?.rememberUser;
        state.fcmTokenState = action.payload?.isFcmTokenRegistered ? "registered" : undefined;
        state.biometricEnabled = action.payload?.biometricEnabled ?? false;
        state.isBiometricSetupRequired = action.payload?.isBiometricSetupRequired ?? false;
      })
      .addCase(loadConfiguration.rejected, (state, action) => {
        state.ready = false;
        state.error = action.error;
      })
      .addCase(changeLanguage.fulfilled, (state, action) => {
        state.appLanguage = action.payload;
      })
      .addCase(registerDevice.pending, state => {
        state.fcmTokenState = "pending";
      })
      .addCase(registerDevice.fulfilled, state => {
        state.fcmTokenState = "registered";
      })
      .addCase(registerDevice.rejected, state => {
        state.fcmTokenState = undefined;
      });
  },
});

export const {
  setOnboardingComplete,
  setAppSession,
  setRememberUser,
  setBiometricScreenDismissed,
  setBiometricEnabled,
  onUIReady,
  resetState,
} = appConfigurationSlice.actions;

export default appConfigurationSlice;

