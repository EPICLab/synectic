const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin({
    async: false,
    eslint: {
      enabled: true,
      files: ['./src/**/*.ts', './src/**/*.tsx', './src/**/*.js']
    }
  }),
];