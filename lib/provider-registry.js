// @ts-check
/// <reference path="../typings/atom-ide.d.ts"/>
'use babel';

const { Disposable, TextEditor } = require('atom');

/**
 * the registry of signature help providers
 */
module.exports = class ProviderRegistry {

  constructor() {
    /**
     * the initial empty provider list
     * @type {Array<AtomIDE.SignatureHelpProvider>}
     */
    this.providers = [];
  }

  /**
   * adds a signature help provider to the registry
   * @param {AtomIDE.SignatureHelpProvider} provider the data tip provider to be added
   * @return {Disposable} a disposable object to clean up the provider registration later
   */
  addProvider(provider) {
    const index = this.providers.findIndex(
      p => provider.priority > p.priority,
    );
    if (index === -1) {
      this.providers.push(provider);
    } else {
      this.providers.splice(index, 0, provider);
    }

    return new Disposable(() => this.removeProvider(provider));
  }

  /**
   * removes a signature help provider from the registry
   * @param  {AtomIDE.SignatureHelpProvider} provider [description]
   */
  removeProvider(provider) {
    const index = this.providers.indexOf(provider);
    if (index !== -1) {
      this.providers.splice(index, 1);
    }
  }

  /**
   * looks for the first known provider to a given Atom text editor
   * @param  {TextEditor} editor the Atom text editor to be looked for
   * @return {AtomIDE.SignatureHelpProvider | null} a signature help provider if found
   */
  getProviderForEditor(editor) {
    const grammar = editor.getGrammar().scopeName;
    return this.findProvider(grammar);
  }

  /**
   * looks for all known providers of a given Atom text editor
   * @param  {TextEditor} editor the Atom text editor to be looked for
   * @return {Array<AtomIDE.SignatureHelpProvider>}  a list of signature help providers available for this editor
   */
  getAllProvidersForEditor(editor) {
    const grammar = editor.getGrammar().scopeName;
    return this.findAllProviders(grammar);
  }

  /**
   * internal helper function to look for the first signature help provider for a specific grammar
   * @param  {String} grammar the grammar scope to be looked for
   * @return {AtomIDE.SignatureHelpProvider | null}   a signature help provider available for that grammar, or null if none
   */
  findProvider(grammar) {
    for (const provider of this.findAllProviders(grammar)) {
      return provider;
    }
    return null;
  }

  /**
   * internal helper to look for all signature help providers for a specific grammar
   * @param  {String}    grammar the grammar scope to be looked for
   * @return {Array<AtomIDE.SignatureHelpProvider>}   a list of all known signature help providers for that grammar
   */
  *findAllProviders(grammar) {
    for (const provider of this.providers) {
      if (provider.grammarScopes == null ||
          provider.grammarScopes.indexOf(grammar) !== -1) {
        yield provider;
      }
    }
  }
}
