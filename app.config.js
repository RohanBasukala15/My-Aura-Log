const path = require("path");
const withNotificationColorOverride = require("./plugins/withNotificationColorOverride");
require("dotenv").config({
  path: path.resolve(__dirname, process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env"),
});

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        target[key] = [...(target?.[key] ?? []), ...(source?.[key] ?? [])];
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

const extractValue = value => {
  if (value.startsWith("[") && value.endsWith("]")) {
    return value.replace("[", "").replace("]", "").split(",").filter(Boolean);
  }

  if (["true", "false"].includes(value?.toLowerCase())) {
    return value?.toLowerCase() === "true";
  }

  return value;
};

const prepareConfigFromEnv = () => {
  const result = {};
  Object.entries(process.env)
    .filter(([key]) => key.startsWith("EXPO_CONFIG_"))
    .reduce((prev, [key, value]) => {
      const keys = key
        .replace("EXPO_CONFIG_", "")
        .split("_")
        .map(part => part);
      keys.reduce((obj, k, index) => {
        obj[k] = obj[k] || (index === keys.length - 1 ? extractValue(value) : {});
        return obj[k];
      }, prev);
      return prev;
    }, result);
  return result;
};

const envConfig = prepareConfigFromEnv();
const usesCleartextTraffic = process.env.EXPO_PUBLIC_apiEndpoint?.startsWith("http://");

module.exports = ({ config }) => {
  const overridesConfig = {
    name: "My Aura Log",
    slug: "myauralog",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.myauralog.app",
      buildNumber: "8",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#E8D5FF",
      },
      package: "com.myauralog",
      versionCode: 10,
      permissions: ["android.permission.CAMERA"],
      privacy: {
        privacyPolicy: "https://rohanbasukala15.github.io/My-Aura-Log/privacy-policy.html",
      },
      googleServicesFile: "./google-services.json",
    },
    plugins: [
      "expo-mail-composer",
      "expo-asset",
      "expo-font",
      "expo-localization",
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic,
          },
          ios: {
            useFrameworks: "static",
            allowNonModularIncludesInFrameworkModules: true,
            buildReactNativeFromSource: true,
            deploymentTarget: "15.1",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#9B87F5",
          sounds: [],
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/splash.png",
          backgroundColor: "#E8D5FF",
          resizeMode: "contain",
          imageWidth: 220,
          android: {
            imageWidth: 280,
            backgroundColor: "#E8D5FF",
          },
          ios: {
            backgroundColor: "#E8D5FF",
            resizeMode: "contain",
          },
        },
      ],
      withNotificationColorOverride,
      "@react-native-firebase/app",
    ],
    updates: {
      fallbackToCacheTimeout: 1200,
      url: "https://u.expo.dev/90b03824-3a3e-4ee2-a500-68b936989cb3",
    },
    owner: "rohanbasukala15",
    extra: {
      eas: {
        projectId: "90b03824-3a3e-4ee2-a500-68b936989cb3",
      },
    },
    runtimeVersion: {
      policy: "appVersion",
    },
  };

  const finalConfig = mergeDeep({}, config, envConfig, overridesConfig);

  if (finalConfig?.android?.versionCode) {
    finalConfig.android.versionCode = parseInt(finalConfig.android.versionCode, 10) || 1;
  }
  if (finalConfig.updates) {
    finalConfig.updates.enabled = finalConfig.updates.enabled === "true";
    finalConfig.updates.fallbackToCacheTimeout = +finalConfig.updates.fallbackToCacheTimeout ?? 0;
  }

  return finalConfig;
};

