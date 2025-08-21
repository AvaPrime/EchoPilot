const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // VS Code extensions run in a Node.js-context
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'out' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};

/**@type {import('webpack').Configuration}*/
const webConfig = {
  target: 'webworker', // extensions run in a webworker context
  mode: 'none',
  entry: {
    'extension': './src/extension.ts',
    'web-extension': './src/web/webExtension.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'out'),
    libraryTarget: 'commonjs',
    devtoolModuleFilenameTemplate: '../../[resource-path]'
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.ts', '.js'],
    alias: {
      // provides alternate implementation for node module and source files
    },
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
      'assert': require.resolve('assert'),
      'buffer': require.resolve('buffer'),
      'console': require.resolve('console-browserify'),
      'constants': require.resolve('constants-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'domain': require.resolve('domain-browser'),
      'events': require.resolve('events'),
      'http': require.resolve('stream-http'),
      'https': require.resolve('https-browserify'),
      'os': require.resolve('os-browserify/browser'),
      'path': require.resolve('path-browserify'),
      'punycode': require.resolve('punycode'),
      'process': require.resolve('process/browser'),
      'querystring': require.resolve('querystring-es3'),
      'stream': require.resolve('stream-browserify'),
      'string_decoder': require.resolve('string_decoder'),
      'sys': require.resolve('util'),
      'timers': require.resolve('timers-browserify'),
      'tty': require.resolve('tty-browserify'),
      'url': require.resolve('url'),
      'util': require.resolve('util'),
      'vm': require.resolve('vm-browserify'),
      'zlib': require.resolve('browserify-zlib')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new (require('webpack')).ProvidePlugin({
      process: 'process/browser', // provide a shim for the global `process` variable
    }),
  ],
  externals: {
    'vscode': 'commonjs vscode', // ignored because it doesn't exist
  },
  performance: {
    hints: false
  },
  devtool: 'nosources-source-map' // create a source map that points to the original source file
};

module.exports = [config, webConfig];