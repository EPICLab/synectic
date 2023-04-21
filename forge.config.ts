import MakerDeb from '@electron-forge/maker-deb';
import MakerDMG from '@electron-forge/maker-dmg';
import MakerRpm from '@electron-forge/maker-rpm';
import MakerSquirrel from '@electron-forge/maker-squirrel';
import { ForgeConfig } from '@electron-forge/shared-types';
import WebpackPlugin from '@electron-forge/plugin-webpack';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: 'synectic',
    icon: 'src/assets/icon/icon'
  },
  makers: [
    new MakerSquirrel({
      name: 'Synectic',
      setupIcon: 'src/assets/icon/icon.ico'
    }),
    new MakerDMG({
      icon: 'src/assets/icon/icon.icns',
      format: 'ULFO'
    }),
    new MakerDeb({
      options: {
        maintainer: 'Nicholas Nelson',
        homepage: 'https://github.com/EPICLab/synectic',
        categories: ['Development'],
        description: 'Research prototype IDE designed for human cognition and spatial interactions'
      }
    }),
    new MakerRpm({
      options: {
        homepage: 'https://github.com/EPICLab/synectic',
        categories: ['Development'],
        description: 'Research prototype IDE designed for human cognition and spatial interactions'
      }
    })
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/app.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts'
            }
          }
        ]
      }
    })
  ]
};

export default config;
