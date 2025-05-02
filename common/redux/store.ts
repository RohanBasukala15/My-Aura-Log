/* eslint-disable prettier/prettier */
import { configureStore, Middleware, ReducersMapObject } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Platform } from "react-native";
import Constants from "expo-constants";

import { applyInterceptor } from "../services/api";
import { setupMockApi } from "../services/api/mock/setup";

import { resetState } from "./actions";
import { reducers as sliceReducers } from "./slices";

// Initialize mock API in development mode
if (__DEV__ && !process.env.JEST_WORKER_ID && Constants.appOwnership !== "expo") {
  setupMockApi();
}

const resetStateMiddleware: Middleware = (api) => (next) => async (action) => {
  const response = next(action);
  if (action.type === "user/signout/fulfilled") {
    resetState(api.dispatch);
  }
  return response;
};

const reducer = {
  ...sliceReducers,
};
const middleware: Middleware[] = [resetStateMiddleware];

if (__DEV__ && !process.env.JEST_WORKER_ID && Constants.appOwnership !== "expo" && Platform.OS !== "web") {
  // eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
  // const ReduxLogger = require("redux-logger").default;
  // middleware.push(ReduxLogger);
}

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }).concat(middleware),
});
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Apply API interceptor
applyInterceptor({
  onUserSignout() {
    resetState(store.dispatch);
  },
});
