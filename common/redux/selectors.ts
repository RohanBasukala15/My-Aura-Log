import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "./store";

const selectSession = (state: RootState) => state.appConfiguration.appSession;

export const selectUserLoginState = createSelector([selectSession], (session) => {
  return !!session?.access_token;
});
