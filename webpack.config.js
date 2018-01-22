const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

var PACKAGE = require('./package.json');


const webpackConfig = {
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
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
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: "file-loader",
        query: {
          name: '[name].[ext]',
          outputPath: 'images/'
        }
      },
      {
        test: require.resolve('jquery'),
        use: [{
          loader: 'expose-loader',
          options: '$'
        }]
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

module.exports = [
  Object.assign(
    {
      target: 'electron-main',
      entry: { main: './src/core/main.ts' },
      plugins: [
        new ExtractTextPlugin('styles.css'),
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery',
          'window.jQuery': 'jquery',
          'window.$': 'jquery'
        })
      ]
    },
    webpackConfig),
  Object.assign(
    {
      target: 'electron-renderer',
      entry: { gui: './src/core/renderer.ts' },
      plugins: [
        new ExtractTextPlugin('styles.css'),
        new HtmlWebpackPlugin({
          title: PACKAGE.full_name + ' - ' + PACKAGE.version
        })
      ]
    },
    webpackConfig)
]
