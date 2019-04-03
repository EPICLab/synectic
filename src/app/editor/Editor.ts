import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import diff from 'fast-diff';
import ace from 'brace';
import 'brace/theme/monokai';
import { extname, readFileAsync, writeFileAsync } from '../../core/fs/io';
import { searchExt } from '../../core/fs/filetypes';
import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import * as git from 'isomorphic-git';
import * as sgit from '../../core/vcs/git';
import './editor.css';
import './modes';
import { SplitMode } from '../../core/lib/interaction';
// import { CredentialManager } from '../../core/vcs/CredentialManager';
import { Dialog } from '../../core/lib/Dialog';

export class Editor extends Card {

  editor: ace.Editor;
  editorWindow: HTMLDivElement = document.createElement('div');
  private snapshot: string = '';

  /**
   * Default constructor for creating an Editor card.
   * @param parent A canvas or stack instance that will contain the new Editor card.
   * @param filename A valid filename or path to associate content with this Editor card.
   */
  constructor(parent: Canvas | Stack, filename: string) {
    super(parent, filename);

    this.element.classList.add('editor');
    this.editorWindow.setAttribute('id', (this.uuid + '-editor'));
    this.editorWindow.setAttribute('class', 'editor-window');
    this.front.appendChild(this.editorWindow);

    this.editor = ace.edit(this.uuid + '-editor');
    this.editor.setTheme('ace/theme/monokai');
    if (filename !== '') this.load();

    this.setReverseContent().then(); // THIS IS A PROBLEM!!!!
    this.editor.addEventListener('change', () => {
      this.modified = DateTime.local();
      this.hasUnsavedChanges();
    });
    fs.watch(this.filename, (_, filename) => {
      if (filename) {
        this.load();
      } else {
        console.log('filename not provided or check file access permissions');
      }
    });
  }

  /**
   * Writes content from Editor window to local file.
   */
  save(): void {
    if (this.filename === '') {
      // TODO: Prompt for a filename and filetype and proceed with save, instead of error.
      const message = 'This card is not associated with a filename, and cannot write to file.';
      new Dialog('snackbar', 'Editor Card Error: No Filename', message);
      return;
    }
    writeFileAsync(this.filename, this.editor.getValue())
      .then(() => {
        this.snapshot = this.editor.getValue();
        this.hasUnsavedChanges();
      })
      .catch(error => new Dialog('snackbar', 'Editor Card Error: Save Error', error.message));
  }

  /**
   * Reads local file content into this Editor card.
   */
  load(filename?: string): void {
    const filepath = filename ? filename : this.filename;
    if (filepath === '') return; // no associated file to load
    Promise.all([readFileAsync(filepath), searchExt(extname(filepath))])
      .then(result => {
        const [content, filetype] = result;
        this.setContent(content);
        this.snapshot = content;
        if (filetype !== undefined) this.setMode(filetype.name);
      })
      .catch(error => new Dialog('snackbar', 'Editor Card Error: File Loading Failed', error.message));
  }

  /**
   * Compares the most recent snapshot with the content in the Editor window.
   * @return Boolean indicating that differences exist between snapshot and Editor content.
   */
  hasUnsavedChanges(): boolean {
    const changeset = diff(this.snapshot, this.editor.getValue());
    const nonEqualSets = changeset.filter(d => d[0] !== diff.EQUAL);
    if (nonEqualSets.length > 0) {
      this.toggleButton('saveButton', true);
      return true;
    } else {
      this.toggleButton('saveButton', false);
      return false;
    }
  }

  /**
   * Sets the Ace editor to display content.
   * @param content A string of content to be displayed in this card.
   */
  setContent(content: string): void {
    this.editor.setSession(new ace.EditSession(content));
  }

  /**
   * Sets the Ace editor mode for syntax highlighting and auto-completion.
   * @param mode The name of an Ace editor mode (e.g. JavaScript).
   */
  setMode(mode: string): void {
    this.editor.getSession().setMode('ace/mode/' + mode.toLowerCase());
  }

  async setReverseContent() {
    const repoLabel = document.createElement('span');
    const repoField = document.createElement('span');
    repoLabel.innerText = 'Path:';
    repoLabel.className = 'label';
    const repoRoot = await sgit.getRepoRoot(this.filename);
    repoField.innerText = repoRoot;
    repoField.className = 'field';
    this.back.appendChild(repoLabel);
    this.back.appendChild(repoField);

    const current = await git.currentBranch({ dir: repoRoot, fullname: false });
    const branches = await sgit.getAllBranches(repoRoot);
    const branchesLabel = document.createElement('span');
    const branchesList = document.createElement('select');
    branchesLabel.className = 'label';
    branchesLabel.innerText = 'Branches:';
    branchesList.className = 'field';
    for (const branch in branches) {
      const option = document.createElement('option');
      option.value = branches[branch];
      option.innerText = branches[branch];
      branchesList.appendChild(option);
    }
    if (current) branchesList.value = current;
    branchesList.onchange = async () => {
      console.log(`changing to branch '${branchesList.value}'`);
      this.load(await sgit.checkoutFile(this.filename, branchesList.value));
    };
    this.back.appendChild(branchesLabel);
    this.back.appendChild(branchesList);

    // const remoteRefs = await sgit.getRemotes(repoRoot);
    // const origin: git.RemoteDefinition = remoteRefs[0];

    const fetchLabel = document.createElement('span');
    fetchLabel.className = 'label';
    const fetchButton = document.createElement('button');
    fetchButton.className = 'field';
    fetchLabel.innerText = 'Fetch:';
    fetchButton.innerText = 'Fetch';
    fetchButton.onclick = () => {
      console.log('fetching...');
      // await git.fetch({
      //   dir: repoRoot,
      //   url: CredentialManager.toHTTPS(origin.url),
      //   ref: 'master',
      //   depth: 1,
      //   singleBranch: true,
      //   tags: false
      // });
      // console.log('fetch is done');
    };
    this.back.appendChild(fetchLabel);
    this.back.appendChild(fetchButton);
  }

  resize(): void {
    super.resize();
    this.editor.resize();
  }

  split(mode: SplitMode): void {
    super.split(mode);
    this.editor.resize();
  }
}
