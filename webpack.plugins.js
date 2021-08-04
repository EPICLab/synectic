/* eslint-disable @typescript-eslint/no-var-requires */
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new CircularDependencyPlugin({
    exclude: /a\.js|node_modules/,
    include: /src/,
    failOnError: true,
    allowAsyncCycles: false,
    cwd: process.cwd(),
  })
];
