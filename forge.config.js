const path = require('path')

module.exports = {
  packagerConfig: {
    asar: true,
    packageManager: 'yarn',
    icon: 'src/assets/icon/icon'
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'Synectic',
        iconUrl: 'src/assets/icon/icon.ico',
        setupIcon: 'src/assets/icon/icon.ico'
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: 'src/assets/icon/icon.icns',
        iconSize: 128,
        overwrite: true
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: [
        "darwin"
      ]
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Nicholas Nelson',
          homepage: 'https://github.com/EPICLab/synectic',
          categories: ['Development'],
          description: 'Research prototype IDE designed for human cognition and spatial interactions'
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Nicholas Nelson',
          homepage: 'https://github.com/EPICLab/synectic',
          categories: ['Development'],
          description: 'Research prototype IDE designed for human cognition and spatial interactions'
        }
      }
    }
  ],
  plugins: [
    [
      '@electron-forge/plugin-webpack',
      {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/app.tsx',
              name: 'main_window'
            }
          ]
        }
      }
    ]
  ]
}