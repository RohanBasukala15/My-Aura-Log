import { createTheme } from "@shopify/restyle";

export const appLightPalette = {
  primary: "#9B87F5", // Lavender
  secondary: "#7DD3C0", // Teal

  white: "#FFFFFF",
  black: "#061A23",
  grey: "#A7A7A7",

  onSurface: "#111213",
  critical: "#ED3A3A",
  warning: "#F1C21B",
  highlight: "#3DDBD9",
  success: "#7DDE86",

  backgroundDefault: "#F8F6FF", // Soft lavender background
  backgroundHovered: "#F1F2F3",
  backgroundPressed: "#EDEEEF",
  backgroundSelected: "#E8D5FF", // Light lavender

  divider: "#DBDBDB",

  surfaceDefault: "#f5f5f5",
  surfaceSubdued: "rgba(250, 251, 251, 1)",
  surfaceHovered: "#F2F5F9",
  surfacePressed: "rgba(241, 242, 243, 1)",
  surfaceDepressed: "rgba(241, 242, 243, 1)",
  surfaceDisabled: "#DEDEDE",
  surfaceSelectedDefault: "rgba(246, 253, 255, 1)",
  surfaceSelectedHovered: "rgba(208, 226, 255, 1)",
  surfaceSelectedPressed: "rgba(166, 200, 255, 1)",
  surfaceWarningDefault: "rgba(255, 248, 236, 1)",
  surfaceWarningHovered: "rgba(255, 245, 234, 1)",
  surfaceWarningSubdued: "rgba(255, 242, 226, 1)",
  surfaceWarningPressed: "rgba(255, 235, 211, 1)",
  surfaceCriticalDefault: "rgba(255, 245, 243, 1)",
  surfaceCriticalHovered: "rgba(255, 240, 240, 1)",
  surfaceCriticalSubdued: "#FFFFFF",
  surfaceCriticalPressed: "rgba(255, 233, 232, 1)",
  surfaceCriticalDepressed: "rgba(254, 188, 185, 1)",
  surfaceSuccessDefault: "rgba(249, 255, 246, 1)",

  textDefault: "#333333",
  textSubdued: "#7D828A",
  textDisabled: "#C8D1E1",
  textCritical: "rgba(255, 33, 0, 1)",
  textWarning: "rgba(145, 106, 0, 1)",
  textSuccess: "rgba(25, 128, 56, 1)",
  textHighlight: "ff3b30",
  textOnPrimary: "rgba(255, 255, 255, 1)",
  textOnCritical: "rgba(255, 255, 255, 1)",
  textOnInteractive: "rgba(255, 255, 255, 1)",

  iconsDefault: "rgba(0, 0, 0, 1)",
  iconsSubdued: "rgba(140, 145, 150, 1)",
  iconsHovered: "rgba(26, 28, 29, 1)",
  iconsPressed: "rgba(68, 71, 74, 1)",
  iconsDisabled: "rgba(186, 190, 195, 1)",
  iconsCritical: "rgba(255, 33, 0, 1)",
  iconsWarning: "rgba(241, 194, 27, 1)",
  iconsSuccess: "rgba(25, 128, 56, 1)",
  iconsHighlight: "#00A0AC",
  iconsOnPrimary: "rgba(255, 255, 255, 1)",
  iconsOnCritical: "rgba(255, 255, 255, 1)",
  iconsOnInteractive: "rgba(255, 255, 255, 1)",
  iconsBackground: "rgba(163, 236, 255, 0.21)",

  interactiveDefault: "#30B7DB",
  interactiveHovered: "rgba(0, 107, 229, 1)",
  interactiveDepressed: "#001D6C",
  interactiveDisabled: "#BDC1CC",
  interactiveCritical: "#FF6650",
  interactiveCriticalHovered: "#CD290C",
  interactiveCriticalDepressed: "#670F03",
  interactiveCriticalDisabled: "#FD938D",

  borderDefault: "#C5C5C5",
  borderSubdued: "#A7A7A7",
  borderHovered: "#999EA4",
  borderDepressed: "#575959",
  borderDisabled: "#D2D5D8",
  borderShadowSubdued: "#BABFC4",
  borderCriticalDefault: "#DC3E16",
  borderCriticalSubdued: "#E0B3B2",
  borderCriticalDisabled: "#FFA7A3",
  borderSuccessDefault: "#6EA84E",
  borderSuccessSubdued: "#BCDDC5",
  borderHighlightDefault: "#98C6CD",
  borderHighlightSubdued: "#21B6C1",
  borderWarningDefault: "#F7D9A4",

  actionPrimaryDefault: "#AAD20B",
  actionPrimaryHovered: "#5B5B5B",
  actionPrimaryPressed: "#232323",
  actionPrimaryDepressed: "#000000",
  actionPrimaryDisabled: "rgba(0, 0, 0, 0.55)",
  actionSecondaryDefault: "#FFFFFF",
  actionSecondaryHovered: "#F6F6F7",
  actionSecondaryPressed: "#F1F2F3",
  actionSecondaryDepressed: "#6D7175",
  actionSecondaryDisabled: "#FFFFFF",
  actionCriticalDefault: "#FA6650",
  actionCriticalHovered: "#BC2200",
  actionCriticalPressed: "#A21B00",
  actionCriticalDepressed: "#6C0F00",
  actionCriticalDisabled: "#F1F1F1",
};

const lightTheme = createTheme({
  dark: false,
  colors: appLightPalette,
  spacing: {
    xxs: 2,
    xs: 4,
    s: 8,
    sm: 12,
    m: 16,
    xm: 20,
    xxm: 24,
    xxxm: 28,
    l: 32,
    xl: 36,
    xxl: 40,
    xxxl: 48,
  },
  borderRadii: {
    xs: 4,
    s: 8,
    sm: 12,
    m: 16,
    xm: 18,
    l: 32,
    xl: 36,
    xxl: 48,
  },
  sizeVariant: {
    small: {
      height: 22,
    },
    medium: {
      height: 48,
    },
    large: {
      height: 56,
    },
    xlarge: {
      height: 58,
    },
  },
  textVariants: {
    h1: {
      fontSize: 32,
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    h2: {
      fontSize: 28,
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    h3: {
      fontSize: 24,
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    h4: {
      fontSize: 22,
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    h5: {
      fontSize: 16,
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    h6: {
      fontSize: 14,
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    h7: {
      fontSize: 12,
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    h8: {
      fontSize: 10,
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    labels: {
      fontSize: 14,
      fontWeight: "700",
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_500Medium",
    },
    selectionLabel: {
      fontSize: 14,
      fontWeight: "400",
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    button: {
      fontSize: 18,
      fontWeight: "500",
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_700Bold",
    },
    caption: {
      fontSize: 14,
      fontWeight: "400",
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
    default: {
      fontSize: 18,
      fontWeight: "400",
      fontStyle: "normal",
      fontFamily: "HankenGrotesk_400Regular",
    },
  },
  toastVariant: {
    defaults: {
      borderRadius: "sm",
      marginHorizontal: "l",
    },
    information: {
      backgroundColor: "surfaceSelectedDefault",
      borderColor: "primary",
    },
    error: {
      backgroundColor: "surfaceCriticalDefault",
      borderColor: "borderCriticalDefault",
    },
    warning: {
      backgroundColor: "surfaceWarningDefault",
      borderColor: "borderWarningDefault",
    },
    success: {
      backgroundColor: "surfaceSuccessDefault",
      borderColor: "borderSuccessDefault",
    },
  },
  breakpoints: {
    phone: 0,
    tablet: 768,
  },
});

const traderLightTheme = createTheme({
  ...lightTheme,
  dark: false,
  colors: {
    ...appLightPalette,
    primary: "#FD5631",
    actionPrimaryDefault: "#FD5631",
  },
});

const darkTheme = createTheme({
  ...lightTheme,
  dark: true,
  colors: {
    ...appLightPalette,
  },
});

export { lightTheme, darkTheme, traderLightTheme };
