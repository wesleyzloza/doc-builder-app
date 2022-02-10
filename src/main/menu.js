const { BrowserWindow, Menu, dialog, shell } = require('electron')
const path = require('path')

/**
 * Creates the application menu from a pre-defined template. The
 * main browser window instance must be passed to properly
 * bind child windows.
 * @param {BrowserWindow} browserWindow Main browser window.
 * @returns {void}
 */
function createMenu(browserWindow) {
  /**
   * Returns the icon path given its name.
   * @param {string} iconName
   * @returns {string}
   */
  function getIconPath(iconName) {
    return path.resolve(__dirname, 'icons', iconName + '-16.png')
  }

  // Menu template.
  const menu = [
    {
      label: '&File',
      submenu: [
        {
          label: 'New Document',
          accelerator: 'Ctrl+N',
          click: () => {
            browserWindow.webContents.send('new-document')
          },
          icon: getIconPath('add-file')
        },
        {
          label: 'Open Document',
          accelerator: 'Ctrl+O',
          click: () => {
            browserWindow.webContents.send('open-document')
          },
          icon: getIconPath('opened-folder')
        },
        {
          label: 'Close Document',
          accelerator: 'Ctrl+W',
          click: () => {
            browserWindow.webContents.send('close-document')
          },
          icon: getIconPath('delete-file')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'Ctrl+S',
          click: () => {
            browserWindow.webContents.send('save-document')
          },
          icon: getIconPath('save')
        },
        {
          label: 'Save As...',
          accelerator: 'Ctrl+Shift+S',
          click: () => {
            browserWindow.webContents.send('save-document-as')
          },
          icon: getIconPath('save-as')
        },
        {
          label: 'Export As...',
          accelerator: 'Ctrl+Shift+E',
          click: () => {
            browserWindow.webContents.send('export-document')
          },
          icon: getIconPath('export-pdf')
        },
        { type: 'separator' },
        {
          label: 'Refresh',
          role: 'reload',
          icon: getIconPath('reset'),
          visible: false
        },
        {
          label: 'Exit',
          role: 'close',
          accelerator: 'Ctrl+Q',
          icon: getIconPath('close-window')
        }
      ]
    },
    {
      label: '&Edit',
      submenu: [
        {
          label: 'Cut',
          role: 'cut',
          icon: getIconPath('cut')
        },
        {
          label: 'Copy',
          role: 'copy',
          icon: getIconPath('copy')
        },
        {
          label: 'Paste',
          role: 'paste',
          icon: getIconPath('paste')
        }
      ]
    },
    {
      label: '&View',
      submenu: [
        {
          label: 'Zoom In',
          role: 'zoomIn',
          icon: getIconPath('zoom-in')
        },
        {
          label: 'Zoom Out',
          role: 'zoomOut',
          icon: getIconPath('zoom-out')
        },
        {
          label: 'Reset Zoom',
          role: 'resetZoom',
          icon: getIconPath('zoom-to-actual-size')
        },
        {
          label: 'Toggle Full Screen',
          role: 'togglefullscreen',
          icon: getIconPath('fullscreen')
        }
      ]
    },
    {
      label: '&Help',
      submenu: [
        {
          role: 'toggledevtools',
          visible: false
        },
        {
          label: 'Report Issue',
          icon: getIconPath('mailing'),
          click: async () => {
            let address = ''
            let subject = encodeURI('<Insert Issue Name>')
            let body = encodeURI('## Expected Behavior\n\n\n## Actual Behavior\n\n\n## Steps to Reproduce\n\n\n')
            await shell.openExternal(`mailto:${address}?subject=${subject}&body=${body}`)
          }
        }
      ]
    }
  ]

  // Set application menu.
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
}

// Exports
module.exports = { createMenu }
