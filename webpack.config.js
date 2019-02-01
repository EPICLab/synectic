const webpack = require('webpack');
const common = require('./webpack.common');

module.exports = [
  Object.assign({
    target: 'electron-main',
    entry: { main: './src/core/main.ts' },
  }, common.webpackConfig),
  Object.assign({
    target: 'electron-renderer',
    entry: { renderer: './src/core/renderer.ts' },
  }, common.webpackConfig)
]
