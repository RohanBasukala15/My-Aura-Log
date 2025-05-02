import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { TokenUtils } from "../../utils/token-utils";

import { ErrorResponse, formatErrorAndThrow, StatusCode } from "./error-mapper";

import AppConstants from "@common/assets/AppConstants";
import type { AppSession } from "@common/redux/models";
import { EncryptedStorage } from "@common/services/EncryptedStorage";

async function responseInterceptor(
  error: AxiosError<ErrorResponse>,
  httpClient: AxiosInstance,
  onUserSignout?: (error: AxiosError) => void
) {
  const originalRequest = error.request;

  console.log("Original Request", originalRequest);

  if (error.response?.status === StatusCode.FORBIDDEN && !originalRequest?.retry) {
    originalRequest.retry = true;
    const session = await EncryptedStorage.getItem<AppSession>(AppConstants.StorageKey.appSession);

    if (session?.access_token && !TokenUtils.isTokenExpired(session?.access_token)) {
      // Re-request if token is not expired
      originalRequest.headers = {
        Authorization: `Bearer ${session.access_token}`,
      };
      return httpClient(originalRequest);
    }
    // App token has expired so, logout the app
    onUserSignout?.(error);
  }
  return formatErrorAndThrow(error);
}

async function requestInterceptor<I>(config: InternalAxiosRequestConfig<I>) {
  console.log("Config in requestInterceptor", config);
  const session = await EncryptedStorage.getItem<AppSession>(AppConstants.StorageKey.appSession);

  if (session && !TokenUtils.isTokenExpired(session?.access_token)) {
    config.headers.setAuthorization(`Bearer ${session.access_token}`);
  }

  return config;
}

export { requestInterceptor, responseInterceptor };
