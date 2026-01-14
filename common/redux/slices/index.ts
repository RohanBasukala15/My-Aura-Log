import appConfigurationSlice from "./appConfiguration/app-configuration.slice";
import signupSlice from "./signup/signup.slice";
import signInSlice from "./signin/signIn.slice";
import userSlice from "./user/user.slice";
import premiumSlice from "./premium/premium.slice";
import entryDraftSlice from "./entryDraft/entryDraft.slice";

export const reducers = {
  [appConfigurationSlice.name]: appConfigurationSlice.reducer,
  [signupSlice.name]: signupSlice.reducer,
  [signInSlice.name]: signInSlice.reducer,
  [userSlice.name]: userSlice.reducer,
  [premiumSlice.name]: premiumSlice.reducer,
  [entryDraftSlice.name]: entryDraftSlice.reducer,
};
