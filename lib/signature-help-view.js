"use babel"
/** @jsx etch.dom */

import { renderToStaticMarkup } from "react-dom/server"
import etch from "etch"

/**
 * a reference to the DOMpurify function to make safe HTML strings
 * @type {DOMPurify}
 */
import DOMPurify from "dompurify"

/**
 * an etch component that can host already prepared HTML text
 */
class HtmlView {
  /**
   * creates the HTML view component and hands over the HTML to embedd
   * @param {String} html the HTML string to embedd into the HTML view component
   */
  constructor({ html }) {
    this.rootElement = document.createElement("div")
    this.rootElement.className = "signature-marked-container"
    this.rootElement.addEventListener("wheel", this.onMouseWheel, {
      passive: true,
    })
    if (html) {
      const innerHTML = DOMPurify.sanitize(html)
      this.rootElement.innerHTML = `
        <div className='signature-marked'>${innerHTML}</div>`
    }
  }

  /**
   * cleanup the HTML view component
   */
  destroy() {
    this.rootElement.removeEventListener("wheel", this.onMouseWheel)
  }

  /**
   * returns the root element of the HTML view component
   * @return {HTMLElement} the root element wrapping the HTML content
   */
  get element() {
    return this.rootElement
  }

  /**
   * handles the mouse wheel event to enable scrolling over long text
   * @param  {MouseWheelEvent} evt the mouse wheel event being triggered
   */
  onMouseWheel(evt) {
    evt.stopPropagation()
  }
}

/**
 * an etch component that hosts a code snippet incl. syntax highlighting
 */
class SnippetView {
  /**
   * creates a snippet view component handing in the snippet
   * @param {String} snippet the code snippet to be embedded
   */
  constructor({ snippet }) {
    this.rootElement = document.createElement("div")
    this.rootElement.className = "signature-container"
    if (snippet) {
      const innerHTML = DOMPurify.sanitize(snippet)
      this.rootElement.innerHTML = `
        <div className='signature-snippet'>${innerHTML}</div>`
    }
  }

  /**
   * returns the root element of the snippet view component
   * @return {HTMLElement} the root element wrapping the HTML content
   */
  get element() {
    return this.rootElement
  }
}

/**
 * an etch component that can host an externally given React component
 */
class ReactView {
  /**
   * creates a React view component handing over the React code to be rendered
   * @param {String} component the React component to be rendered
   */
  constructor({ component }) {
    if (component) {
      this.children = component()
    }
    this.render()
    // etch.initialize(this);
  }

  render() {
    this.rootElement = document.createElement("span")
    this.rootElement.classList.add("signature-container")
    this.childrenStatic = DOMPurify.sanitize(renderToStaticMarkup(this.children))
    this.rootElement.innerHTML = `
        <div className="signature-content">${this.childrenStatic}</div>
    `
    return this.rootElement
  }

  // update(props, children) {
  //   return
  //}

  /**
   * returns the root element of the React view component
   * @return {HTMLElement} the root element wrapping the HTML content
   */
  get element() {
    return this.rootElement
  }
}

/**
 * an etch component for a signature help
 */
module.exports = class SignatureHelpView {
  /**
   * creates a data tip view component
   * @param {any} properties  the properties of this data tip view
   * @param {Array<JSX.Element>} children potential child nodes of this data tip view
   */
  constructor(properties, children) {
    this.properties = properties
    this.children = children || []
    this.updateChildren()
    etch.initialize(this)
  }

  /**
   * renders the data tip view component
   * @return {JSX.Element} the data tip view element
   */
  render() {
    const glowClass = atom.config.get("atom-ide-signature-help.glowOnHover") ? "signature-glow" : ""
    const classes = `signature-element ${glowClass}`
    return <div className={classes}>{this.children}</div>
  }

  /**
   * updates the internal state of the data tip view
   */
  update(props, children) {
    // perform custom update logic here...
    // then call `etch.update`, which is async and returns a promise
    this.properties = props
    this.children = children || []
    this.updateChildren()
    return etch.update(this)
  }

  // Optional: Destroy the component. Async/await syntax is pretty but optional.
  /**
   * clean up the data tip view
   * @return {Promise} a promise object to keep track of the asynchronous operation
   */
  async destroy() {
    await etch.destroy(this)
  }

  /**
   * internal helper function to figure out the structure of the signature help view
   * to be rendered
   */
  updateChildren() {
    const { component, snippet, html } = this.properties
    if (component) {
      this.children.push(<ReactView component={component} />)
    }
    if (snippet) {
      this.children.push(<SnippetView snippet={snippet} />)
    }
    if (html) {
      this.children.push(<HtmlView html={html} />)
    }
  }
}
