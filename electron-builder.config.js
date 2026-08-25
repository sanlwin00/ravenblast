module.exports = {
  appId: 'com.ravenblast.app',
  productName: 'RavenBlast',
  directories: {
    output: 'dist'
  },
  files: ['out/**/*'],
  win: {
    target: 'nsis',
    icon: 'resources/icon.ico'
  },
  mac: {
    target: 'dmg',
    icon: 'resources/icon.icns'
  },
  linux: {
    target: 'AppImage'
  }
}
