import appConfigurationSlice from "./appConfiguration/app-configuration.slice";
import signupSlice from "./signup/signup.slice";
import signInSlice from "./signin/signIn.slice";
import userSlice from "./user/user.slice";

export const reducers = {
  [appConfigurationSlice.name]: appConfigurationSlice.reducer,
  [signupSlice.name]: signupSlice.reducer,
  [signInSlice.name]: signInSlice.reducer,
  [userSlice.name]: userSlice.reducer,
};
