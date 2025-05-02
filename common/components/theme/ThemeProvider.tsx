import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { ThemeContext, ThemeProvider as ReStyleThemeProvider } from "@shopify/restyle";
import { setStatusBarStyle } from "expo-status-bar";
import { Storage } from "../../services/Storage";
import { darkTheme, lightTheme } from "./theme-palette";

const THEME_STATE_KEY = "THEME_STATE_KEY";

type ThemeValue = {
  isDark?: boolean;
  changeTheme: (isDark?: boolean) => void;
};
const DarkModeContext = React.createContext<ThemeValue>({
  isDark: false,
  changeTheme: () => {
    /* do nothing */
  },
});

// TODO: need to work on migrating to redux state
function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setDarkMode] = useState<{ isDark?: boolean }>({
    isDark: false,
  });

  useEffect(() => {
    Storage.getItem<{ isDark?: boolean }>(THEME_STATE_KEY)
      .then(themeState => {
        if (themeState) {
          setDarkMode(themeState);
        }
      })
      .catch();
  }, []);

  const changeTheme = (isDark = false) => {
    Storage.setItem(THEME_STATE_KEY, { isDark }).then().catch();
    setStatusBarStyle(isDark ? "light" : "dark");
    setDarkMode({ isDark });
  };

  const contextValue = useMemo(() => ({ ...state, changeTheme }), [state, changeTheme]);

  const theme = useMemo(() => {
    return state.isDark ? darkTheme : lightTheme;
  }, [state.isDark]);

  return (
    <DarkModeContext.Provider value={contextValue}>
      <ReStyleThemeProvider theme={theme}>{children}</ReStyleThemeProvider>
    </DarkModeContext.Provider>
  );
}

export type Theme = typeof lightTheme;

const useThemeState = () => React.useContext(DarkModeContext);

const ThemeConsumer = ThemeContext.Consumer;

export { ThemeProvider, ThemeConsumer, useThemeState };
