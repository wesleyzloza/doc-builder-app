import DOCXTemplater = require('docxtemplater')
import PizZip = require('pizzip')
import fs = require('fs')
import dateFormat = require('dateformat')
import expressions = require('angular-expressions')

/**
 * Document Template Engine
 */
export class Templater {
  /**
   * Creates a new Microsoft Word document based on passed data and a template file.
   * Template file must comply to docxtemplater syntax:
   * https://docxtemplater.readthedocs.io/en/
   * @param data Object containing template data.
   * @param templatePath Path to template document (.docx)
   * @param savePath Path of new document (.docx)
   * @returns
   */
  static create(data, templatePath, savePath) {
    return create(data, templatePath, savePath)
  }
}

/**
 * Creates a new Microsoft Word document based on passed data and a template file.
 * Template file must comply to docxtemplater syntax:
 * https://docxtemplater.readthedocs.io/en/
 * @param {object} data Object containing template data.
 * @param {string} templatePath Path to template document (.docx).
 * @param {string} savePath Path of new document (.docx).
 */
function create(data, templatePath, savePath) {
  // Setup template document.
  let template = fs.readFileSync(templatePath, 'binary')
  let zip = new PizZip(template)

  // Date format.
  expressions.filters.date = (date, formatString = undefined) => {
    let UTCDate = new Date(date)
    if (!date || UTCDate.toString() === 'Invalid Date') return date
    let format = formatString === undefined ? 'shortDate' : formatString
    return dateFormat(UTCDate, format)
  }

  // Angular Parser (Custom Parser)
  let angularParser = function (tag) {
    return {
      get:
        tag === '.'
          ? function (s) {
              return s
            }
          : function (s) {
              return expressions.compile(tag.replace(/(’|“|”)/g, "'"))(s)
            }
    }
  }

  // Custom Module
  // https://github.com/open-xml-templating/docxtemplater/issues/539
  const avoidRenderingCoreXMLModule = {
    optionsTransformer: function (options, docxtemplater) {
      this.docxtemplater = docxtemplater
      return options
    },
    set: function ({ compiled }) {
      if (compiled) {
        this.docxtemplater.templatedFiles = this.docxtemplater.templatedFiles.filter(function (file) {
          if (file === 'docProps/core.xml' || file === 'docProps/app.xml') {
            return false
          }
          return true
        })
      }
    }
  }

  // Create DOCXTemplater new instance with options.
  //@ts-ignore
  let doc = new DOCXTemplater(zip, {
    parser: angularParser,
    paragraphLoop: true,
    linebreaks: true,
    modules: [avoidRenderingCoreXMLModule]
  })
  doc.setData(data) // passing data to templating engine.

  // Try to render document.
  try {
    doc.render()
  } catch (error) {
    let e = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      properties: error.properties
    }
    console.log(
      JSON.stringify({
        error: e
      })
    )
    throw error
  }

  // Write buffer to file.
  let buf = doc.getZip().generate({ type: 'nodebuffer' })
  fs.writeFileSync(savePath, buf)
  return 0
}
