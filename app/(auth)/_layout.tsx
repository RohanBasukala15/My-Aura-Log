import { Stack } from "expo-router";

import { useScreenOptions } from "@common/components";

export const unstable_settings = {
  initialRouteName: "sign-in",
};

const AuthStack = () => {
  const screenOptions = useScreenOptions();
  return <Stack screenOptions={screenOptions} />;
};

export default AuthStack;
