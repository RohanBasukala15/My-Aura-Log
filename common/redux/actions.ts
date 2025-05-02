import { AnyAction, Dispatch } from "redux";

import appConfigurationSlice from "./slices/appConfiguration/app-configuration.slice";
import * as $appConfigurationActions from "./slices/appConfiguration/app-configuration.action";
import signupSlice from "./slices/signup/signup.slice";
import * as $signupActions from "./slices/signup/signup.action";
import * as $signInActions from "./slices/signin/signin.action";
import signInSlice from "./slices/signin/signIn.slice";
import userSlice from "./slices/user/user.slice";
import * as $userActions from "./slices/user/user.action";

export const appConfigurationActions = {
  ...appConfigurationSlice.actions,
  ...$appConfigurationActions,
};

export const userActions = {
  ...userSlice.actions,
  ...$userActions,
};

export const signInActions = {
  ...signInSlice.actions,
  ...$signInActions,
};

export const signupActions = {
  ...signupSlice.actions,
  ...$signupActions,
};

const resetActions = [
  appConfigurationActions.resetState(),
  signInActions.resetState(),
  signupActions.resetState(),
  userActions.resetState(),
];

export function resetState(dispatch: Dispatch<AnyAction>) {
  resetActions.forEach((action) => {
    dispatch(action);
  });
}
