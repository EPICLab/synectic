const path = require('path');

module.exports = [
  // Add support for native node modules
  {
    test: /\.node$/,
    use: ['node-loader'],
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: [{
      loader: '@vercel/webpack-asset-relocator-loader', options: { outputAssetBase: 'native_modules', },
    }],
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|.webpack)/,
    use: [{
      loader: 'ts-loader', options: { transpileOnly: true, },
    }],
  },
  {
    test: /\.jsx?$/,
    use: ['react-hot-loader/webpack'],
    include: path.join(__dirname, '/src')
  },
  {
    test: /\.(png|jpe?g|gif|svg|ico|icns)$/i,
    use: [{
      loader: 'file-loader',
      options: {
        // Electron-Forge requires these options for packaging static assets with correct paths, solution found here:
        // https://github.com/electron-userland/electron-forge/issues/1196
        name: '[path][name].[ext]',
        publicPath: '..', // move up from 'main_window'
        context: 'src' // set relative working folder to src
      }
    }]
  }
];
