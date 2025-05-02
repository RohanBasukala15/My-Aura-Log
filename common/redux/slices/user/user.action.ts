import { createAsyncThunk } from "@reduxjs/toolkit";

import AppConstants from "../../../assets/AppConstants";
import { UserInfo, ApiResponse, EditProfileRequest, ChangePasswordRequest, AppSession } from "../../models";

import { AuthApi, Api } from "@common/services/api";
import type { RootState } from "@common/redux/store";
import { EncryptedStorage } from "@common/services/EncryptedStorage";

export const changePassword = createAsyncThunk<void, ChangePasswordRequest>("user/changePassword", async (args) => {
  const response = await Api.post<ApiResponse<void>>(AppConstants.ApiKeys.changePassword, args, {
    baseURL: AppConstants.Config.Api.authURL,
  });

  const { data, message } = response.data;

  if (response?.status !== 200) {
    throw new Error(message);
  }

  return data;
});

export const signout = createAsyncThunk<void, void>("user/signout", async (_, api) => {
  const session = await EncryptedStorage.getItem<AppSession>(AppConstants.StorageKey.appSession);

  try {
    await AuthApi.post<ApiResponse<void>>(AppConstants.ApiKeys.logout, {
      refresh_token: session?.refresh_token,
    });
  } catch (e) {
    // ignore API errors
  }

  await EncryptedStorage.removeItem(AppConstants.StorageKey.appSession);

  return;
});

export const editProfile = createAsyncThunk<UserInfo, EditProfileRequest>("user/edit", async (obj, api) => {
  const formState = (api.getState() as RootState).user.userDetails;

  const response = await Api.post<ApiResponse<void>>(AppConstants.ApiKeys.editProfile, obj, {
    baseURL: AppConstants.Config.Api.authURL,
  });

  const { data, message } = response.data;

  if (response?.status !== 200) {
    throw new Error(message);
  }

  const updatedData: UserInfo = {
    firstName: formState?.firstName ?? "",
    lastName: formState?.lastName ?? "",
    email: obj.email ?? "",
    msisdn: formState?.msisdn ?? "",
    user_id: formState?.user_id ?? "",
  };

  return updatedData;
});
