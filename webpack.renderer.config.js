/* eslint-disable @typescript-eslint/no-var-requires */
const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push({
  test: /\.css$/,
  use: [
    { loader: "style-loader" },  // Webpack loader to inject CSS into the DOM
    { loader: "css-modules-typescript-loader" },  // Webpack loader to create TypeScript declarations for CSS Modules
    { loader: "css-loader", options: { modules: false } },  // Converts the resulting CSS to JavaScript prior to bundling
    // NOTE: The first build after adding/removing/renaming CSS classes fails, since the newly generated .d.ts typescript module is picked up only later
  ]
});

module.exports = {
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  },
  module: {
    rules,
  },
  plugins: plugins
};
