// frontend/next.config.ts
import type { NextConfig } from 'next';
import ESLintPlugin from 'eslint-webpack-plugin';

const nextConfig: NextConfig = {
  // other Next.js config options…
  webpack(config, { dev, isServer }) {
    // in dev on the client, run ESLint on every rebuild
    if (dev && !isServer) {
      config.plugins.push(
        new ESLintPlugin({
          extensions: ['js', 'jsx', 'ts', 'tsx'],
          emitWarning: true, // show warnings in console
          fix: true,
          failOnError: false, // don’t break compilation on errors
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
