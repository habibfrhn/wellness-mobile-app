const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.projectRoot = __dirname;
config.watchFolders = [path.resolve(__dirname), path.resolve(__dirname, ".."), path.resolve(__dirname, "../..")];

module.exports = config;
