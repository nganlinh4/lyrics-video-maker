const webpack = require('webpack');
const url = require('url');

module.exports = function override(config, env) {
  // Add TypeScript loader for node_modules
  const nodeModulesRule = {
    test: /\.tsx?$/,
    include: /node_modules/,
    use: [
      {
        loader: require.resolve('swc-loader'),
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
              decorators: true
            },
            target: 'es2015'
          }
        }
      }
    ]
  };

  // Add specific rule for .d.ts files
  const dtsRule = {
    test: /\.d\.ts$/,
    loader: 'ignore-loader'
  };

  config.module.rules.push(nodeModulesRule, dtsRule);

  // Handle node: protocol imports
  const nodeProtocolHandler = new webpack.NormalModuleReplacementPlugin(
    /^node:/,
    (resource) => {
      resource.request = resource.request.replace(/^node:/, '');
    }
  );

  // Configure webpack 5 polyfills
  config.plugins = [
    ...(config.plugins || []),
    nodeProtocolHandler,
    new webpack.ProvidePlugin({
      process: require.resolve('process/browser.js'),
      Buffer: ['buffer', 'Buffer'],
      URL: ['url', 'URL']
    })
  ];

  // Add fallback configurations for Node.js core modules
  config.resolve = {
    ...config.resolve,
    fallback: {
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      console: require.resolve('console-browserify'),
      constants: require.resolve('constants-browserify'),
      crypto: require.resolve('crypto-browserify'),
      domain: require.resolve('domain-browser'),
      events: require.resolve('events/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      punycode: require.resolve('punycode/'),
      process: require.resolve('process/browser.js'),
      querystring: require.resolve('querystring-es3'),
      stream: require.resolve('stream-browserify'),
      string_decoder: require.resolve('string_decoder/'),
      sys: require.resolve('util/'),
      timers: require.resolve('timers-browserify'),
      tty: require.resolve('tty-browserify'),
      url: require.resolve('url/'),
      util: require.resolve('util/'),
      vm: require.resolve('vm-browserify'),
      zlib: require.resolve('browserify-zlib'),
      fs: false,
      net: false,
      child_process: false,
      worker_threads: false,
      module: false,
      dns: false
    }
  };

  return config;
};