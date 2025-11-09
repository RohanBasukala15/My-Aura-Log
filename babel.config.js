module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [".ts", ".tsx", ".ttf"],
          alias: {
            "@app": "./@app",
            "@common": "./common",
            axios: "./node_modules/axios/dist/browser/axios.cjs"
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
