'use babel';
/** @jsx etch.dom */

const etch = require('etch')
const marked = require('marked')
const createDOMPurify = require('dompurify')
/**
 * [domPurify description]
 * @type {DOMPurify}
 */
const domPurify = createDOMPurify();

class SnippetView {
  constructor({ snippet, grammar }) {
    this.rootElement = document.createElement("div");
    this.rootElement.className = "datatip-container";
    if (snippet) {
      this.refreshRootElement(snippet, grammar);
    }
  }

  update({ snippet, grammar }) {
    this.refreshRootElement(snippet, grammar);
  }

  refreshRootElement(snippet, grammar) {
    const wrapper = document.createElement("div");
    wrapper.className = "datatip-marked-text-editor";
    if (snippet) {
      const regExpLSPPrefix = /^\((method|property|parameter)\)\W/;
      snippet = snippet.replace(regExpLSPPrefix, '');
      if (grammar) {
        const atomElem = atom.workspace.buildTextEditor({
          lineNumberGutterVisible: false,
          readonly: true,
          keyboardInputEnabled: false,
          showInvisibles: false,
          tabLength: atom.config.get("editor.tabLength")
        });
        atomElem.setGrammar(grammar);
        atomElem.setText(snippet);
        const atomView = atom.views.getView(atomElem);
        atomView.setUpdatedSynchronously(true);
        atomView.style.pointerEvents = "none"
        atomView.style.position = "absolute";
        atomView.style.width = "0px";
        atomView.style.height = "1px";
        atom.views.getView(atom.workspace).appendChild(atomView);
        this.editorTokenized(atomElem).then(() => {
          const html = Array.from(atomView.querySelectorAll(".line:not(.dummy)"));
          wrapper.innerHTML = domPurify.sanitize(html.map(x => x.innerHTML).join("\n"), { breaks: true });
          atomView.remove();
        }).catch(() => {
          atomView.remove();
        })
      }
    }
    this.rootElement.appendChild(wrapper);
  }

  get element() {
    return this.rootElement;
  }

  /**
   * [editorTokenized description]
   * @param  {TextEditor}  editor [description]
   * @return {Promise}        [description]
   */
  editorTokenized(editor) {
    return new Promise(resolve => {
      if (editor.getBuffer().getLanguageMode().fullyTokenized) {
        resolve()
      } else {
        const disp = editor.onDidTokenize(() => {
          disp.dispose()
          resolve()
        })
      }
    })
  }
}

class MarkdownView {
  constructor({ markedString }) {
    this.markedString = markedString;
    this.rootElement = document.createElement('div');
    this.rootElement.className = "datatip-marked-container";
    this.rootElement.addEventListener("wheel", this.onMouseWheel, { passive: true });

    if (this.markedString) {
      this.rootElement.innerHTML = domPurify.sanitize(marked(this.markedString, { breaks: true }));
    }
  }
  update({ markedString }) {
    this.markedString = markedString;
    if (this.markedString) {
      this.rootElement.innerHTML = domPurify.sanitize(marked(this.markedString, { breaks: true }));
    }
  }

  destroy() {
    this.rootElement.removeEventListener("wheel", this.onMouseWheel);
  }

  get element() {
    return this.rootElement;
  }

  onMouseWheel(evt) {
    evt.stopPropagation();
  }
}

module.exports = class SignatureHelpView {
  // Required: Define an ordinary constructor to initialize your component.
  constructor(properties) {
    this.properties = properties;
    etch.initialize(this);
  }

  render() {
    const documentation = this.properties.signature.documentation.value || this.properties.signature.documentation || null;
    return (
      <div className="datatip-element">
        <SnippetView snippet={this.properties.signature.label} grammar={this.properties.grammar} />
        <MarkdownView markedString={documentation} />
      </div>
    );
  }

  update(props, children) {
    // perform custom update logic here...
    // then call `etch.update`, which is async and returns a promise
    return etch.update(this)
  }

  // Optional: Destroy the component. Async/await syntax is pretty but optional.
  async destroy() {
    // call etch.destroy to remove the element and destroy child components
    await etch.destroy(this)
    // then perform custom teardown logic here...
  }
}
