import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { SplashScreen, useNavigationContainerRef } from "expo-router";

import { useAppConfiguration } from "./context";
import { useLoadAssets } from "./FontConfiguration";

export type AppConfigurationProps = {
  assets: readonly number[];
};

const fonts = {};

export const AppConfiguration = React.memo(function $AppConfiguration({
  children,
  ...config
}: React.PropsWithChildren<AppConfigurationProps>) {
  const navigationContainerRef = useNavigationContainerRef();
  const navigationRef = useRef(navigationContainerRef.isReady());

  const splashHidden = useRef(false);
  const appConfig = useAppConfiguration();
  const assetsReady = useLoadAssets(config.assets, fonts);

  const ready = appConfig.isReady && assetsReady;

  useEffect(() => {
    if (navigationContainerRef.isReady() || appConfig.isNavigationReady) {
      return;
    }

    let id: NodeJS.Timeout | undefined;
    const cleanup = () => {
      if (id) {
        clearInterval(id);
        id = undefined;
      }
    };
    id = setInterval(() => {
      if (navigationRef.current) {
        cleanup();
      }
      const isReady = navigationContainerRef.isReady();
      if (isReady && navigationRef.current !== isReady) {
        cleanup();
        navigationRef.current = isReady;
        appConfig.updateState({ isNavigationReady: true });
      }
    }, 1000);

    return () => {
      cleanup();
    };
  }, [appConfig.updateState, appConfig.isNavigationReady]);

  useEffect(() => {
    if (splashHidden.current || !appConfig.isUIReady) return;
    setTimeout(() => {
      SplashScreen.hideAsync().catch(Promise.resolve);
      splashHidden.current = true;
    }, 500);
  }, [appConfig.isUIReady, appConfig.isNavigationReady]);

  useEffect(() => {
    if (assetsReady && !appConfig.isAssetsReady) {
      appConfig.updateState({ isAssetsReady: true, isUIReady: true });
    }
  }, [assetsReady, appConfig.isAssetsReady]);

  if (!ready) {
    return null; // Ensure the component returns something when not ready
  }

  return (
    <View
      style={{ flex: 1 }}
      onLayout={() => {
        if (!ready) return;
        appConfig.updateState({ isUIReady: true });
      }}
    >
      {children}
    </View>
  );
});
