import { createAsyncThunk } from "@reduxjs/toolkit";

import { ApiResponse, AppSession } from "../../models/Base";
import { SignInPayload, SignInResponse } from "../../models/Signin";
import AppConstants from "../../../assets/AppConstants";
import appConfigurationSlice from "../appConfiguration/app-configuration.slice";
import { registerDevice } from "../appConfiguration/app-configuration.action";

import { AuthApi } from "@common/services/api";
import { Storage } from "@common/services/Storage";
import { EncryptedStorage } from "@common/services/EncryptedStorage";

export const signIn = createAsyncThunk<SignInResponse, SignInPayload>("signIn/signInApi", async (payload, api) => {
  const reqObj = {
    username: payload.email,
    password: payload.password,
  };

  const response = await AuthApi.post<ApiResponse<SignInResponse>>(AppConstants.ApiKeys.signIn, reqObj);
  if (response?.status !== 200) {
    throw new Error(response.data.message);
  }

  const { access_token, expires_in, refresh_expires_in, refresh_token, token_type } = response.data.data;

  // Register for App Push Notification
  const fcmToken = await Storage.getItem<string>(AppConstants.StorageKey.fcmToken);

  const sessionData: AppSession = {
    token_type,
    access_token,
    expires_in,
    refresh_token,
    refresh_expires_in,
  };
  await EncryptedStorage.setItem(AppConstants.StorageKey.appSession, sessionData);

  api.dispatch(appConfigurationSlice.actions.setAppSession(sessionData));

  if (fcmToken) {
    api.dispatch(registerDevice({ fcmToken }));
  }

  if (payload.rememberMe) {
    api.dispatch(
      appConfigurationSlice.actions.setRememberUser({
        email: payload.email,
        rememberMe: payload.rememberMe,
      })
    );
  } else {
    await Storage.removeItem(AppConstants.StorageKey.rememberUser);
    api.dispatch(appConfigurationSlice.actions.setRememberUser());
  }

  return response.data.data;
});
