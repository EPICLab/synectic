const webpack = require('webpack');
const common = require('./webpack.common');
const path = require('path');
const glob = require('glob');
const glob_entries = require('webpack-glob-entries');

module.exports = [
  Object.assign({
    target: 'electron-main',
    entry: glob_entries('./test/**/*.spec.ts'),
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist')
    },
    module: {
      rules: [{
        test: require.resolve('jquery'),
        use: [{
          loader: 'expose-loader',
          options: 'jQuery'
        },{
          loader: 'expose-loader',
          options: '$'
        }]
      }]
    }
  }, common.webpackConfig)
]
