const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer"
);
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts.push("svg");

// Prevent EMFILE (too many open files) on Windows by blocking
// Metro from watching irrelevant sibling project folders.
// Use absolute path anchors so ft-mobile's own node_modules are NOT blocked.
const parent = path.resolve(__dirname, "..");
config.watchFolders = [__dirname];
config.resolver.blockList = [
  new RegExp(`^${escapeRegex(path.join(parent, "ft_ad"))}.*`),
  new RegExp(`^${escapeRegex(path.join(parent, "ft"))}\\\\(?!.*ft-mobile).*`),
  new RegExp(`^${escapeRegex(path.join(parent, "be"))}.*`),
  new RegExp(`^${escapeRegex(path.join(parent, "backup_backend"))}.*`),
  new RegExp(`^${escapeRegex(path.join(parent, "backuptomongo"))}.*`),
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = config;
