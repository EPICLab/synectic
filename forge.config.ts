import MakerDeb from '@electron-forge/maker-deb';
import MakerDMG from '@electron-forge/maker-dmg';
import MakerRpm from '@electron-forge/maker-rpm';
import MakerSquirrel from '@electron-forge/maker-squirrel';
import { ForgeConfig } from '@electron-forge/shared-types';

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
        categories: [
          'Development'
        ],
        description: 'Research prototype IDE designed for human cognition and spatial interactions'
      }
    }),
    new MakerRpm({
      options: {
        homepage: 'https://github.com/EPICLab/synectic',
        categories: [
          'Development'
        ],
        description: 'Research prototype IDE designed for human cognition and spatial interactions'
      }
    })
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        devContentSecurityPolicy: "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; worker-src * data: 'unsafe-eval' 'unsafe-inline' blob:",
        renderer: {
          config: './webpack.renderer.config.js',
          nodeIntegration: true,
          entryPoints: [{
            html: './src/index.html',
            js: './src/app.tsx',
            name: 'main_window'
          }]
        }
      }
    }
  ]
};

export default config;