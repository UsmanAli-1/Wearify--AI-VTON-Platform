const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This tells the Metro bundler to safely package our Google AI model
config.resolver.assetExts.push('tflite');

module.exports = config;