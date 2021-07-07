module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  target: 'electron-main',
  node: {
    // Webpack needs to provide a working '__dirname' value
    // (ref: https://webpack.js.org/configuration/node/#node-__dirname)
    __dirname: false
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json']
  },
  module: {
    rules: require('./webpack.rules'),
  },
};
