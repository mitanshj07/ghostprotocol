const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      os: false,
      stream: false,
      assert: false
    };
    return config;
  },
  experimental: {
    largePageDataBytes: 512 * 1024
  }
};

module.exports = nextConfig;
