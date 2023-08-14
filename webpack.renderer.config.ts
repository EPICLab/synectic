import type { Configuration } from 'webpack';
import path from 'path';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
});

export const rendererConfig: Configuration = {
  module: {
    rules
  },
  plugins,
  resolve: {
    alias: {
      'react-dnd': path.resolve('node_modules/react-dnd')
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      assert: false,
      constants: false,
      crypto: false,
      fs: false,
      os: false,
      path: false,
      stream: false,
      url: false,
      util: false
    }
  }
};
