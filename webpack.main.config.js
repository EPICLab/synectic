module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  target: 'electron-main',
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    fallback: {
      assert: require.resolve('assert'),
      buffer: require.resolve('buffer'),
      // console: require.resolve('console-browserify'),
      // constants: require.resolve('constants-browserify'),
      // crypto: require.resolve('crypto-browserify'),
      // domain: require.resolve('domain-browser'),
      events: require.resolve('events'),
      // http: require.resolve('stream-http'),
      // https: require.resolve('https-browserify'),
      // os: require.resolve('os-browserify/browser'),
      // path: require.resolve('path-browserify'),
      punycode: require.resolve('punycode'),
      process: require.resolve('process/browser'),
      // querystring: require.resolve('querystring-es3'),
      // stream: require.resolve('stream-browserify'),
      string_decoder: require.resolve('string_decoder'),
      sys: require.resolve('util'),
      // timers: require.resolve('timers-browserify'),
      // tty: require.resolve('tty-browserify'),
      url: require.resolve('url'),
      util: require.resolve('util'),
      // vm: require.resolve('vm-browserify'),
      // zlib: require.resolve('browserify-zlib'),
    },
  },
};