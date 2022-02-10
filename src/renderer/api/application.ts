// Import
import { Document } from './document'
import { Templater } from './templater'

// Must use this syntax it appears compatibility with Node.js and TypeScript.
// https://stackoverflow.com/a/35171227
import fs = require('fs')
import fsp = require('fs/promises')
import path = require('path')
import assign = require('lodash.assign')
import flatted = require('flatted')
import electron = require('electron')
import { ElMessage, MessageHandle } from 'element-plus'

// @ts-ignore
import { router } from '../router.js'
const { ipcRenderer } = electron

// Enums
enum ApplicationState {
  Clean,
  Dirty
}

// Private Globals
let _state: ApplicationState = ApplicationState.Dirty
let _document = new Document()
let _documentPath: string

// Modify As Necessary
_document.title = 'Generic Document'
_document.subtitle = 'An example of generic document builder'

// Export
/**
 * Application Interface
 * @description Application programming interface (API). The methods
 * in this exported object is used to control the application and acts
 * as the main tunnel between the Main and Renderer processes. It should be
 * noted that this isn't a recommended practice.
 */
export const Application = {
  /**
   * Creates a new document instance.
   * @returns Promise that resolves to a boolean of whether a new document has
   * been successfully created. `false` indicates that the user has cancelled
   * the operation.
   */
  async newDocument(): Promise<Boolean> {
    let closeResponse = await Application.closeDocument()
    if (closeResponse === true || closeResponse === undefined) {
      // "Freshen-up".
      _state = ApplicationState.Dirty
      _documentPath = ''
      assign(_document, new Document())

      // Route to new project view.
      router.push('/Loading')
      setTimeout(() => {
        router.push('/')
      }, 1000)
      return Promise.resolve(true)
    } else {
      return Promise.resolve(false)
    }
  },

  /**
   * Saves the active document.
   * @description Saves the active document to disk. If a file location
   * hasn't been specified then the user will be prompted with a save dialog.
   * @returns Promise that resolves to a boolean of whether the document has
   * been successfully saved. `false` indicates that the user has cancelled
   * the operation.
   */
  async saveDocument(): Promise<Boolean> {
    if (_state === ApplicationState.Dirty) {
      try {
        await fsp.access(path.dirname(_documentPath), fs.constants.W_OK)
      } catch (error) {
        // Log to console.
        console.info('Project file path is either undefined or invalid. Prompting the user for input.')

        // Save dialog.
        let saveDialog = await ipcRenderer.invoke('save-dialog', {
          title: 'Save Form',
          defaultPath: _document.documentNumber,
          filters: [
            {
              name: 'Document Builder File',
              extensions: ['docBuilder']
            }
          ]
        })

        if (saveDialog.canceled === true) return Promise.resolve(false)
        _documentPath = saveDialog.filePath
      }

      // Note that the flatted library (and not JSON) must be used to stringify
      // the Project class because of circular references. As a result we must
      // parse any serialized data using the same library. See openProject().
      await fsp.writeFile(_documentPath, flatted.stringify(_document))
      showSaveMessage()
      return Promise.resolve(true)
    } else {
      return Promise.resolve(false)
    }
  },

  /**
   * Prompts the user to save the document with a new filename.
   * @returns Promise that resolves to a boolean of whether the document has
   * been successfully saved with a new name. `false` indicates that the user
   * has cancelled the operation.
   */
  async saveDocumentAs(): Promise<Boolean> {
    if (_state === ApplicationState.Dirty) {
      // Save dialog.
      let saveDialog = await ipcRenderer.invoke('save-dialog', {
        title: 'Save Form As',
        filters: [
          {
            name: 'Document Builder File',
            extensions: ['docBuilder']
          }
        ]
      })

      if (saveDialog.canceled === true) return Promise.resolve(false)
      _documentPath = saveDialog.filePath

      // Note that the flatted library (and not JSON) must be used to stringify
      // the Project class because of circular references. As a result we must
      // parse any serialized data using the same library. See openProject().
      await fsp.writeFile(_documentPath, flatted.stringify(_document))
      showSaveMessage()
      return Promise.resolve(true)
    } else {
      return Promise.resolve(false)
    }
  },

  /**
   * Open an existing document. Note that this action will first close any
   * active documents using `closeDocument()`.
   * @returns Promise that resolves to a boolean of whether the document has
   * been successfully opened. `false` indicates that the users has cancelled
   * the operation.
   * @argument filePath - Optional argument for filepath.
   */
  async openDocument(filePath: string | undefined = undefined): Promise<Boolean> {
    // Close any active documents.
    let closeResponse = await Application.closeDocument()
    if (closeResponse === true || closeResponse === undefined) {
      if (filePath === undefined) {
        // Prompt user for project file to open.
        let openDialog = await ipcRenderer.invoke('open-dialog', {
          title: 'Open Form',
          filters: [
            {
              name: 'Document Builder File',
              extensions: ['docBuilder']
            }
          ],
          properties: ['openFile']
        })

        // Return false if the open dialog is cancelled.
        if (openDialog.canceled === true) return Promise.resolve(false)
        _documentPath = openDialog.filePaths[0]
      } else {
        _documentPath = filePath
      }

      // TODO: Improve this functionality.
      // Manage state.
      _state = ApplicationState.Dirty

      // Note that the flatted library (and not JSON) must be used to parse
      // the serialized data because of circular references. Note this also
      // required for the data to be originally serialized by the same library.
      // See saveProject() for more information.
      let serializedDocument = await fsp.readFile(_documentPath, 'utf-8')
      let deserializedDocument = flatted.parse(serializedDocument)
      assign(_document, deserializedDocument) // TODO: Fix this, this is kind of shit. Had to change from merge to assign... (not sure why it worked).

      router.push('/Loading')
      setTimeout(() => {
        router.push('/')
      }, 1000)

      return Promise.resolve(true)
    } else {
      // Return false if the user has cancelled closing any active documents.
      // A project will not be opened from the file system until the active
      // document is closed.
      return Promise.resolve(false)
    }
  },

  /**
   * Closes the active document.
   * @returns Promise that resolves to a boolean of whether the document has
   * been successfully closed or `undefined`. A resolved promise of `false`
   * indicates that the users has cancelled the operation. A resolved promise
   * of `undefined` indicates that the action has been skipped because no
   * active documents are opened.
   */
  async closeDocument(): Promise<Boolean | undefined> {
    // "Dirty" application indicates that the user has a document
    // currently open.
    if (_state === ApplicationState.Dirty) {
      // Confirm with the user if the active project should be closed.
      let confirmDialog = await ipcRenderer.invoke('message-box', {
        type: 'question',
        title: 'Confirm Close',
        message: 'Are you sure you want to close the active document?\nAny unsaved changes will be lost.',
        buttons: ['yes', 'cancel'],
        defaultId: 0,
        cancelId: 1
      })

      // Take action based on user response.
      if (confirmDialog.response === 0) {
        assign(_document, new Document())
        _state = ApplicationState.Clean
        router.push('/Loading')
        setTimeout(() => {
          router.push('/')
        }, 1000)
        return Promise.resolve(true)
      } else {
        return Promise.resolve(false)
      }
    } else {
      return Promise.resolve(undefined)
    }
  },

  /**
   * Exports the active document as a Microsoft Word document.
   * @returns Promise that resolves to a boolean of whether the document has
   * been successfully exported. A resolved promise of `false`
   * indicates that the users has cancelled the operation.
   */
  async exportDocument(): Promise<Boolean> {
    // Format data for export.
    let notesToPrint = _document.contents.filter((item) => item.isIncluded === true)
    let data = JSON.parse(JSON.stringify(_document))
    Object.defineProperty(data, 'Notes', Object.getOwnPropertyDescriptor(data, 'contents'))
    delete data['contents']
    data.Notes = notesToPrint

    // Template path.
    let dirname = await ipcRenderer.invoke('__dirname')
    let templatePath = path.resolve(dirname, 'export.docx')

    // Save Dialog
    let saveDialog = await ipcRenderer.invoke('save-dialog', {
      title: 'Export Form',
      defaultPath: `${_document.documentNumber}-R${_document.revisions.length - 1}`,
      filters: [
        {
          name: 'Word Document',
          extensions: ['docx']
        }
      ]
    })

    if (saveDialog.canceled === true) return Promise.resolve(false)
    let savePath = saveDialog.filePath

    // Create template.
    Templater.create(data, templatePath, savePath)
    return Promise.resolve(true)
  },

  /**
   * Active document.
   */
  get Document(): Document {
    return _document
  },

  /**
   * Active document file path.
   */
  get DocumentPath(): string | undefined {
    return _documentPath
  },

  /**
   * Application version.
   * @returns Application version.
   */
  async version(): Promise<String> {
    let data = await ipcRenderer.invoke('get-application-data')
    return data.version
  }
}

/**
 * Displays a save message to the user.
 * See https://element-plus.org/en-US/component/message.html
 * @private
 */
function showSaveMessage(): MessageHandle {
  return ElMessage({
    type: 'success',
    message: 'Document Saved',
    customClass: 'el-message-dark',
    offset: window.innerHeight - 96,
    duration: 1500
  })
}

// Event Listeners
ipcRenderer.on('new-document', () => {
  Application.newDocument()
})

ipcRenderer.on('open-document', (event, filepath) => {
  Application.openDocument(filepath)
})

ipcRenderer.on('close-document', () => {
  Application.closeDocument()
})

ipcRenderer.on('save-document', () => {
  Application.saveDocument()
})

ipcRenderer.on('save-document-as', () => {
  Application.saveDocumentAs()
})

ipcRenderer.on('export-document', () => {
  Application.exportDocument()
})
