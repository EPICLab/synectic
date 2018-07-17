const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

var PACKAGE = require('./package.json');

const webpackConfig = {
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool: 'source-map',
  node: {
    __dirname: false,
    __filename: false
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: true }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]',
          outputPath: 'images/'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: PACKAGE.full_name + ' - ' + PACKAGE.version,
      inject: 'body'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery'
    })
  ]
};

module.exports = [
  Object.assign({
    target: 'electron-main',
    entry: { main: './src/core/main.ts' },
  }, webpackConfig),
  Object.assign({
    target: 'electron-renderer',
    entry: { renderer: './src/core/renderer.ts' },
  }, webpackConfig)
]
