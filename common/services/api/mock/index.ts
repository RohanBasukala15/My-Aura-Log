import MockAdapter from "axios-mock-adapter";

import { AuthApi, Api } from "../api";
import AppConstants from "../../../assets/AppConstants";

interface MockAdapterOptions {
  delayResponse?: number;
  onNoMatch?: "passthrough" | "throwException";
}

export default function mockApi(options: MockAdapterOptions = { delayResponse: 1000 }) {
  const authApiMock = new MockAdapter(AuthApi, options);
  const apiMock = new MockAdapter(Api, options);
  console.log("authApiMock", authApiMock);
  authApiMock.onPost(AppConstants.ApiKeys.logout).reply(() => [200, { message: "Logout completed!" }]);

  authApiMock.onPost(AppConstants.ApiKeys.signIn).reply(() => [
    200,
    {
      status: "SUCCESS",
      message: "User found",
      data: {
        token_type: "auth",
        access_token: "mock_access_token",
        expires_in: 10,
        refresh_token: "refresh_mock_access_token",
        refresh_expires_in: 10,
      },
    },
  ]);

  apiMock.onGet(AppConstants.ApiKeys.user).reply(() => [400, { message: "No user found" }]);

  return { authApiMock, apiMock };
}
