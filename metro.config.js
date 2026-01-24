const { getDefaultConfig } = require('@expo/metro-config');
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Remove svg from the asset extensions.
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
// And add it to the source code extensions.
config.resolver.sourceExts.push('svg');

// Add a custom babel transformer which converts svg files to React components.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = config;
