import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import diff from 'fast-diff';
import ace from 'brace';
import 'brace/theme/monokai';
import { extname, writeFileAsync, readFileAsync } from '../../core/fs/io';
import { searchExt } from '../../core/fs/filetypes';
import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import './editor.css';
import './modes';
import { SplitMode } from '../../core/lib/interaction';
import { Dialog } from '../../core/lib/Dialog';
import { basename } from 'path';
import { toggleVisibility } from '../../core/lib/helper';
// import { CredentialManager } from '../../core/vcs/CredentialManager';

export class Editor extends Card {

  editor: ace.Editor;
  editorWindow: HTMLDivElement = document.createElement('div');
  private snapshot: string = '';

  /**
   * Default constructor for creating an Editor card.
   * @param parent A canvas or stack instance that will contain the new Editor card.
   * @param filepath A valid filename or path to associate content with this Editor card.
   */
  constructor(parent: Canvas | Stack, filepath: fs.PathLike) {
    super(parent, filepath);
    this.element.classList.add('editor');
    this.editorWindow.setAttribute('id', (this.uuid + '-editor'));
    this.editorWindow.setAttribute('class', 'editor-window');
    this.front.appendChild(this.editorWindow);

    this.editor = ace.edit(this.uuid + '-editor');
    this.editor.setTheme('ace/theme/monokai');
    this.load(this.filepath);

    this.editor.addEventListener('change', () => {
      this.modified = DateTime.local();
      this.hasUnsavedChanges();
    });
  }

  /**
   * Reads local file content into this Editor card.
   * @param filepath A valid filename or path to load into this Editor.
   */
  load(filepath: fs.PathLike): void {
    this.filepath = filepath;
    this.title.innerHTML = basename(filepath.toString());
    toggleVisibility(this.loading, true);
    Promise.all([readFileAsync(filepath), searchExt(extname(filepath))])
      .then(result => {
        toggleVisibility(this.loading, false);
        const [content, filetype] = result;
        this.setContent(content);
        this.snapshot = content;
        if (filetype !== undefined) this.setMode(filetype.name);
      })
      .then(() => {
        const fpath: string = this.filepath.toString();
        this.watcher = fs.watch(fpath, (_, fpath) => {
          if (fpath) {
            this.load(this.filepath);
          } else {
            throw Error('Filepath not valid or file access permissions denied.');
          }
        });
      })
      .catch(error => new Dialog('snackbar', 'Editor Card Error: File Loading Failed', error.message));
  }

  /**
   * Writes content from Editor window to local file.
   */
  save(): void {
    writeFileAsync(this.filepath.toString(), this.editor.getValue())
      .then(() => {
        this.snapshot = this.editor.getValue();
        this.hasUnsavedChanges();
      })
      .catch(error => new Dialog('snackbar', 'Editor Card Error: Save Error', error.message));
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

  resize(): void {
    super.resize();
    this.editor.resize();
  }

  split(mode: SplitMode): void {
    super.split(mode);
    this.editor.resize();
  }
}
