const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackCleanPlugin = require('webpack-clean');

var PACKAGE = require('./package.json');

const webpackConfig = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        loader: 'standard-loader',
        options: {
          typeCheck: true,
          emitErrors: true
        }
      },
      {
        test: /\.ts$/,
        enforce: 'pre',
        loader: 'tslint-loader',
        options: {
          typeCheck: true,
          emitErrors: true
        }
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.json']
  },
  node: {
    __dirname: false
  }
}

let cleanOptions = {
  root:     __dirname,
  exclude:  ['shared.js'],
  verbose:  true,
  watch:    true,
  dry:      false
}

module.exports = [
  Object.assign(
    {
      target: 'electron-main',
      entry: { main: './src/core/main.ts' },
      plugins: [
        new ExtractTextPlugin('styles.css'),
        new WebpackCleanPlugin([
            'index.html',
            '*.js',
            '*.map'
        ], path.join(__dirname, 'tests'))
      ]
    },
    webpackConfig),
  Object.assign(
    {
      target: 'electron-renderer',
      entry: { gui: './src/gui.ts' },
      plugins: [
        new CleanWebpackPlugin('dist', cleanOptions),
        new ExtractTextPlugin('styles.css'),
        new HtmlWebpackPlugin({
          title: PACKAGE.full_name + ' - ' + PACKAGE.version,
          // template: './src/core/index.html'
        })
      ]
    },
    webpackConfig)
]
