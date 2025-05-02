import React, { useEffect } from "react";
import { SplashScreen, Stack } from "expo-router";
import { Provider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { Alert, BackHandler } from "react-native";

import {
  AppConfiguration,
  AppConfigurationProvider,
  ThemeProvider,
  useAppConfiguration,
  useScreenOptions,
} from "../common/components";

import { store } from "@common/redux/store";
import { toastConfig } from "@common/utils/toast-utils";
import { useAppDispatch, useAppSelector } from "@common/redux";
import { loadConfiguration } from "@common/redux/slices/appConfiguration/app-configuration.action";

SplashScreen.preventAutoHideAsync();

const NavigatorLayout = React.memo(function NavigatorLayout() {
  const screenOptions = useScreenOptions();
  return <Stack screenOptions={screenOptions} />;
});

function ConfigurationState() {
  const appConfig = useAppConfiguration();
  const dispatch = useAppDispatch();

  // TODO: observe cache state and update status with ready status;
  useEffect(() => {
    dispatch(loadConfiguration());
    setTimeout(() => {
      //TODO: Call this once app configuration loaded (also check if league has be selected)
      appConfig.updateState({
        isReady: true,
        isUIReady: true,
      });
    }, 1000);
  }, []);

  return null;
}

export default function Root() {
  // disabled android gesture
  useEffect(() => {
    const backAction = () => {
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppConfigurationProvider
          prepareConfiguration={() => {
            // TODO: initiate cache loading work like redux loadConfiguration (assign country)
          }}
        >
          <Provider store={store}>
            <ConfigurationState />
            <AppConfiguration assets={[]}>
              <NavigatorLayout />
              <Toast position="bottom" bottomOffset={40} config={toastConfig} />
            </AppConfiguration>
          </Provider>
        </AppConfigurationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
