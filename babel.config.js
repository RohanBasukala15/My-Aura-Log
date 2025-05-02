module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          extensions: [".ts", ".tsx", ".ttf"],
          alias: {
            "@app": "./@app",
            "@common": "./common",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
