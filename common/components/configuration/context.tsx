import React, { useContext, useMemo, useState } from "react";

export interface AppConfigurationState {
  isReady?: boolean;
  isUIReady?: boolean;
  isAssetsReady?: boolean;
  isNavigationReady?: boolean;
}

export interface AppConfigurationActions {
  prepareConfiguration: () => void;
  updateState: (state: Partial<AppConfigurationState>) => void;
}

export interface AppConfigurationType extends AppConfigurationActions, AppConfigurationState {}

const AppConfigurationContext = React.createContext<AppConfigurationType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateState: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prepareConfiguration: () => {},
});

export function AppConfigurationProvider({
  prepareConfiguration,
  children,
}: React.PropsWithChildren<Pick<AppConfigurationActions, "prepareConfiguration">>) {
  const [state, setState] = useState<AppConfigurationState>({});

  const value = useMemo(
    () => ({
      ...state,
      prepareConfiguration,
      updateState: (config: Partial<AppConfigurationState>) => setState((prev) => ({ ...prev, ...config })),
    }),
    [state, prepareConfiguration]
  );

  return <AppConfigurationContext.Provider value={value}>{children}</AppConfigurationContext.Provider>;
}

export const useAppConfiguration = () => {
  const value = useContext(AppConfigurationContext);
  if (!value) {
    throw new Error("useAppConfiguration() should be used inside the AppConfigurationProvider");
  }
  return value;
};
