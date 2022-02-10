import { v4 as guid } from 'uuid'
import masterList from '../data/source-list.json'

/**
 * Generic document.
 */
export class Document {
  /**
   * Constructs a new instance of a document.
   */
  constructor() {
    masterList.forEach((item) => {
      // Mutating master list with properties we want.
      //@ts-ignore
      item.isIncluded = false
      //@ts-ignore
      item.guid = guid()
    })
    this.contents = masterList
  }

  _revisions = [new Revision('Initial release.')]
  _author = ''

  /**
   * Title.
   */
  title: string = ''

  /**
   * Subtitle.
   */
  subtitle: string = ''

  /**
   * Project number.
   */
  projectNumber = ''

  /**
   * Document number.
   */
  documentNumber = ''

  /**
   * Document author.
   */
  get author() {
    return this._author
  }

  /**
   * Document author.
   */
  set author(text: string) {
    this._author = text
    this._revisions[0].author = text
  }

  /**
   * Document contents. The document contents should be a list of notes and/or
   * specifications.
   */
  contents = []

  /**
   * Array of document revisions.
   */
  get revisions() {
    return this._revisions
  }

  /**
   * Adds a revision to the document. By default the document will have one
   * revision (index: 0) with the comment/description of "Initial release.".
   */
  addRevision() {
    this.revisions.push(new Revision())
  }

  /**
   * Removes a specific revision from the document givin its unique ID. Note
   * that the first revision of (i.e., "Initial release.") cannot be removed.
   * @param guid Unique ID of a revision.
   */
  removeRevision(guid: string) {
    let index = this._revisions.findIndex((rev) => rev.guid === guid)
    if (index !== -1 && index !== 0) {
      this._revisions.splice(index, 1)
    }
  }
}

/**
 * Document revision.
 */
export class Revision {
  /**
   * Constructs a new instance of a document revision.
   * @param text Revision description / comment.
   */
  constructor(text: string = '') {
    this.description = text
  }

  /**
   * Unique ID.
   */
  guid = guid()

  /**
   * Description.
   */
  description = ''

  /**
   * Created date / revision date.
   */
  date = new Date()

  /**
   * Author.
   */
  author = ''
}
