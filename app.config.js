const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env"),
});

export function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export function mergeDeep(target, ...sources) {
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

const extractValue = (value) => {
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
        .map((part) => part);
      keys.reduce((obj, k, index) => {
        obj[k] = obj[k] || (index === keys.length - 1 ? extractValue(value) : {});
        return obj[k];
      }, prev);
      return prev;
    }, result);
  return result;
};

const envConfig = prepareConfigFromEnv();

// Enable http support
const usesCleartextTraffic = process.env.EXPO_PUBLIC_apiEndpoint?.startsWith("http://");

module.exports = ({ config }) => {
  const overridesConfig = {
    name: "My Aura Log",
    slug: "myauralog",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#E8D5FF",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.myauralog.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#E8D5FF",
      },
      package: "com.myauralog",
    },
    plugins: [
      ["expo-build-properties", { android: { usesCleartextTraffic } }],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#9B87F5",
          sounds: [],
        },
      ],
    ],
    updates: {
      fallbackToCacheTimeout: 1200,
      url: "https://u.expo.dev/489d329b-044e-4fef-be78-43dd072cd456",
    },
    owner: "studio_bravo",
    extra: {
      eas: {
        projectId: "489d329b-044e-4fef-be78-43dd072cd456",
      },
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  };
  const finalConfig = mergeDeep({}, config, envConfig, overridesConfig);
  finalConfig.plugins.push(
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static"
        }
      }
    ]
  );
  if (finalConfig?.android?.versionCode) {
    finalConfig.android.versionCode = parseInt(finalConfig.android.versionCode, 10) || 1;
  }
  if (finalConfig.updates) {
    finalConfig.updates.enabled = finalConfig.updates.enabled === "true";
    finalConfig.updates.fallbackToCacheTimeout = +finalConfig.updates.fallbackToCacheTimeout ?? 0;
  }

  return finalConfig;
};
