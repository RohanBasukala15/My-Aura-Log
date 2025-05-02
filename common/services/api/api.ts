import Axios from "axios";

import AppConstants from "../../assets/AppConstants";

import { formatErrorAndThrow } from "./error-mapper";
import { requestInterceptor, responseInterceptor } from "./interceptor";

const AuthApi = Axios.create({
  baseURL: `${AppConstants.Config.Api.authURL}`,
  timeout: AppConstants.Config.Api.maxConnectionTimeout,
  headers: {
    Connection: "close",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const Api = Axios.create({
  baseURL: `${AppConstants.Config.Api.apiURL}`,
  timeout: AppConstants.Config.Api.maxConnectionTimeout,
  headers: {
    Connection: "close",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/**
 *  Apply the Auth Api request & response interceptor
 */
AuthApi.interceptors.request.use((config) => config, formatErrorAndThrow);
AuthApi.interceptors.response.use((config) => config, formatErrorAndThrow);

/**
 *  Apply the Api request & response interceptor
 */
export function applyInterceptor({ onUserSignout }: { onUserSignout: () => void }) {
  Api.interceptors.request.use(requestInterceptor, formatErrorAndThrow);
  Api.interceptors.response.use(
    (response) => response,
    (error) => responseInterceptor(error, Api, onUserSignout)
  );
}

export { AuthApi, Api };
