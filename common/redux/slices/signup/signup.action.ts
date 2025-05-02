import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  AppSession,
  ApiResponse,
  SignupPayload,
  SignupResponse,
  AddRelativePayload,
  AddRelativeResponse,
} from "../../models";
import appConfigurationSlice from "../appConfiguration/app-configuration.slice";

import { AuthApi } from "@common/services/api";
import type { RootState } from "@common/redux/store";
import AppConstants from "@common/assets/AppConstants";
import { EncryptedStorage } from "@common/services/EncryptedStorage";

export const initializeSignup = createAsyncThunk<void, SignupPayload>("signup/initializeSignup", async (args) => {
  const response = await AuthApi.post<ApiResponse<void>>(AppConstants.ApiKeys.signup.registrations, args);

  const { data, message } = response.data;

  if (response?.status !== 200) {
    throw new Error(message);
  }

  return data;
});

export const addRelative = createAsyncThunk<AddRelativeResponse, AddRelativePayload>(
  "signup/addRelatives",
  async (args, api) => {
    const formState = (api.getState() as RootState).signup.formState;

    const response = await AuthApi.post<ApiResponse<AddRelativeResponse>>(AppConstants.ApiKeys.signup.addRelatives, {
      userId: "",
      ...args,
    });

    const { data, message } = response.data;

    if (response?.status !== 200) {
      throw new Error(message);
    }

    return data;
  }
);

export const signUpSetPassword = createAsyncThunk<SignupResponse, { password: string }>(
  "signup/swtPassword",
  async (args, api) => {
    const formState = (api.getState() as RootState).signup.formState;

    const response = await AuthApi.post<ApiResponse<SignupResponse>>(AppConstants.ApiKeys.signup.setPassword, {
      password: args.password,
      token: formState.otpToken,
      email: formState.email,
    });

    if (response?.status !== 200) {
      throw new Error(response.data.message);
    }

    const { access_token, expires_in, refresh_expires_in, refresh_token, token_type } = response.data.data;

    const sessionData: AppSession = {
      token_type,
      access_token,
      expires_in,
      refresh_token,
      refresh_expires_in,
    };

    api.dispatch(appConfigurationSlice.actions.setBiometricScreenDismissed(true));
    await EncryptedStorage.setItem(AppConstants.StorageKey.appSession, sessionData);
    return response.data.data;
  }
);
