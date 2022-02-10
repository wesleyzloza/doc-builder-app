/**
 * @type {import('electron-builder').CliOptions}
 * {@link https://www.electron.build/configuration/configuration}
 */
const options = {
  config: {
    productName: 'Document Builder',
    appId: 'com.example.yourapp',
    directories: {
      buildResources: 'public',
      output: 'build'
    },
    files: ['dist/production/**/*'],
    win: {
      icon: './icon-app.ico',
      fileAssociations: [
        {
          ext: 'docBuilder',
          name: 'Document Builder File',
          icon: './icon-file.ico'
        }
      ]
    }
  }
}

module.exports = options
