const fsp = require('fs/promises')
const path = require('path')
const chalk = require('chalk')
const electron = require('electron')
const { spawn } = require('child_process')
const { createServer, createLogger, build } = require('vite')
const { MAIN_ROOT, RENDERER_ROOT } = require('./constants')

let manualRestart
let electronProcess

/**
 * Start Vite development server on Electron.js renderer files. This will allow
 * for hot-reloading during development.
 */
async function startRender() {
  try {
    const viteServer = await createServer({
      root: RENDERER_ROOT,
      publicDir: '../../public'
    })
    await viteServer.listen()
    return viteServer
  } catch (error) {
    createLogger().error(chalk.red(`Error when starting develop server:\n${error.stack}`))
  }
}

/**
 * Watch Electron.js main process.
 * @returns {Promise}
 */
async function watchMainProcess() {
  try {
    const rollupWatcher = await build({
      root: MAIN_ROOT,
      publicDir: '../../public',
      mode: 'development',
      build: {
        emptyOutDir: false,
        outDir: path.resolve(__dirname, '../dist/dev'),
        watch: true
      }
    })

    return await new Promise((resolve, reject) => {
      rollupWatcher.on('event', (event) => {
        if (event.code === 'BUNDLE_END') {
          resolve(rollupWatcher)
        }
      })
    })
  } catch (error) {
    createLogger().error(chalk.red(`Error watching electron main process:\n${error.stack}`))
    process.exit(1)
  }
}

/**
 * Spawns Electron.
 * @param {String} RENDERER_URL
 */
function startElectron(RENDERER_URL) {
  let args = ['--inspect=5858', path.join(__dirname, '../dist/dev/main.cjs.js')]

  electronProcess = spawn(electron, args, {
    env: { RENDERER_URL }
  })

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit()
  })
}

/**
 * Starts the development environment in the proper sequence.
 */
async function start() {
  const rendererServer = await startRender()
  const mainWatcher = await watchMainProcess()
  const { port = 3000, https = false } = rendererServer.config.server
  const rendererURL = `http${https ? 's' : ''}://localhost:${port}`

  startElectron(rendererURL)

  mainWatcher.on('event', (event) => {
    if (event.code !== 'BUNDLE_END') {
      return
    }

    if (electronProcess && electronProcess.kill) {
      manualRestart = true
      process.kill(electronProcess.pid)
      electronProcess = null
      startElectron(rendererURL)

      setTimeout(() => {
        manualRestart = false
      }, 5000)
    }
  })
}

start()
