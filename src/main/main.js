// Imports.
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { app, BrowserWindow, nativeTheme, ipcMain, dialog, Menu, MenuItem } = require('electron')
import('./preload.js')

// See https://vitejs.dev/guide/env-and-mode.html
const loadURL = import.meta.env.PROD
  ? `file://${path.resolve(__dirname, '../production/index.html')}`
  : process['env'].RENDERER_URL || 'http://localhost:3000'

// Launch the main browser window (i.e. main application window).
let mainWindow
function createMainWindow() {
  nativeTheme.themeSource = 'light'
  mainWindow = new BrowserWindow({
    title: 'Document Builder',
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 600,
    icon: path.resolve(__dirname, 'icon-app.ico'),
    webPreferences: {
      nodeIntegration: true,
      sandbox: false,
      contextIsolation: false
      // preload: path.resolve(__dirname, 'preload.js')
    }
  })
  mainWindow.loadURL(loadURL)

  // Context menu.
  mainWindow.webContents.on('context-menu', (events, params) => {
    const menu = new Menu()

    // Add each spelling suggestion.
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(
        new MenuItem({
          label: suggestion,
          click: () => mainWindow.webContents.replaceMisspelling(suggestion)
        })
      )
    }

    // Allow users to add the misspelled word to the dictionary.
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: 'Add to dictionary',
          click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        })
      )
    }

    menu.popup()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createMainWindow()

  // The application will attempt to open the first filepath
  // detected, if any.
  if (process.argv.length >= 2 && import.meta.env.PROD) {
    for (let i = 1; i < process.argv.length; i++) {
      let filepath = process.argv[i]
      try {
        await fsp.access(filepath, fs.constants.R_OK)
        mainWindow.webContents.on('did-finish-load', () => {
          mainWindow.webContents.send('open-project', filepath)
        })
        break
      } catch (error) {}
    }
  }

  // Open developer tools by default if production is develop.
  if (import.meta.env.PROD === false) {
    mainWindow.setBounds({ width: 1800, height: 900 })
    mainWindow.webContents.openDevTools()
    mainWindow.focus()
  }

  // Create application menu.
  const { createMenu } = await import('./menu.js')
  createMenu(mainWindow)

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Event handlers.
ipcMain.handle('save-dialog', async (event, options) => {
  return await dialog.showSaveDialog(mainWindow, options)
})

ipcMain.handle('open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(mainWindow, options)
})

ipcMain.handle('message-box', async (event, options) => {
  return await dialog.showMessageBox(mainWindow, options)
})

ipcMain.handle('set-window-title', async (event, string) => {
  mainWindow.setTitle(`drip${string === undefined || string === '' ? '' : ' | ' + string}`)
})

ipcMain.handle('get-application-data', async (event, options) => {
  let packageJSON = await import('../../package.json')
  return packageJSON
})

ipcMain.handle('__dirname', async (event, options) => {
  return path.resolve(__dirname)
})
