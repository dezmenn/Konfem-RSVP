const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize for touch responsiveness during development
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Reduce file watching overhead
config.watchFolders = [__dirname];

// Optimize transformer for better performance
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Reduce minification overhead in development
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Optimize server settings
config.server = {
  ...config.server,
  // Reduce WebSocket polling frequency
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add headers to reduce connection overhead
      res.setHeader('Cache-Control', 'no-cache');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;