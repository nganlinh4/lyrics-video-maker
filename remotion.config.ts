import { WebpackOverrideFn } from '@remotion/bundler';
import type { RuleSetRule } from 'webpack';
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const webpackOverride: WebpackOverrideFn = (currentConfiguration) => {
  // Ensure module and rules exist with proper type checking
  const rules = currentConfiguration.module?.rules || [];
  const updatedRules = rules.map((rule) => {
    if (typeof rule === 'object' && rule !== null && 'loader' in rule && 
        typeof rule.loader === 'string' && 
        rule.loader.includes('source-map-loader')) {
      return {
        ...(rule as RuleSetRule),
        exclude: [/\.d\.ts$/],
      };
    }
    return rule;
  });

  return {
    ...currentConfiguration,
    module: {
      ...(currentConfiguration.module || {}),
      rules: updatedRules,
    },
    resolve: {
      ...(currentConfiguration.resolve || {}),
      fallback: {
        ...(currentConfiguration.resolve?.fallback || {}),
        "assert": false,
        "child_process": false,
        "crypto": false,
        "dns": false,
        "fs": false,
        "http": false,
        "module": false,
        "os": false,
        "path": false,
        "querystring": "querystring-es3",
        "url": false,
        "util": false,
        "worker_threads": false,
      },
    },
    plugins: [
      ...(currentConfiguration.plugins || []),
      new NodePolyfillPlugin(),
    ],
  };
};

export default webpackOverride;