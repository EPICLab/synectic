import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import diff from 'fast-diff';
import ace from 'brace';
import 'brace/theme/monokai';
import { extname, readFileAsync, writeFileAsync } from '../../core/fs/io';
import { searchExt } from '../../core/fs/filetypes';
import { snackbar } from '../../core/fs/notifications';
import { DateTime } from 'luxon';
import { OptionState } from '../../core/lib/Interactions';
import * as fs from 'fs-extra';
import * as git from 'isomorphic-git';
git.plugins.set('fs', fs);
import './editor.css';
import './modes';

export class Editor extends Card {

  editor: ace.Editor;
  editorWindow: HTMLDivElement = document.createElement('div');
  private snapshot: string = '';
  private reverseContent: Map<string, HTMLSpanElement> = new Map();

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

    this.editor.addEventListener('change', () => {
      this.modified = DateTime.local();
      this.hasUnsavedChanges();
    });
    this.setReverseContent();
  }

  /**
   * Writes content from Editor window to local file.
   */
  save(): void {
    if (this.filename === '') {
      // TODO: Prompt for a filename and filetype and proceed with save, instead of error.
      const message = 'This card is not associated with a filename, and cannot write to file.';
      snackbar(global.Synectic.current, message, 'Editor Card Error: No Filename');
      return;
    }
    writeFileAsync(this.filename, this.editor.getValue())
      .then(() => {
        this.snapshot = this.editor.getValue();
        this.hasUnsavedChanges();
      })
      .catch(error => snackbar(global.Synectic.current, error.message, 'Editor Card Error: Save Error'));
  }

  /**
   * Reads local file content into this Editor card.
   */
  load(): void {
    if (this.filename === '') return; // no associated file to load
    Promise.all([readFileAsync(this.filename), searchExt(extname(this.filename))])
      .then(result => {
        const [content, filetype] = result;
        this.setContent(content);
        this.snapshot = content;
        if (filetype !== undefined) this.setMode(filetype.name);
      })
      .catch(error => snackbar(global.Synectic.current, error.message, 'Editor Card Error: File Loading Failed'));
  }

  /**
   * Compares the most recent snapshot with the content in the Editor window.
   * @return Boolean indicating that differences exist between snapshot and Editor content.
   */
  hasUnsavedChanges(): boolean {
    const changeset = diff(this.snapshot, this.editor.getValue());
    const nonEqualSets = changeset.filter(d => d[0] !== diff.EQUAL);
    if (nonEqualSets.length > 0) {
      $(this.saveButton).show();
      return true;
    } else {
      $(this.saveButton).hide();
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

  setReverseContent(): void {
    git.findRoot({ filepath: this.filename })
      .then(gitroot => {
        this.addReverseContent('Root', gitroot);
        git.listFiles({ dir: gitroot })
          .then(files => console.log(files))
          .catch(() => console.log('Git files not available'));
      })
      .catch(() => this.addReverseContent('Root', 'Unable to find git root'));

    // isGitRepoAsync(path.dirname(this.filename))
    //   .then(status => {
    //     this.addReverse('Path', path.resolve(path.join(path.dirname(this.filename), '/.git')));
    //     this.addReverse('VCS', status.toString());
    //   })
    //   .catch(() => {
    //     this.addReverse('VCS', '[failed check]');
    //   });
  }

  addReverseContent(key: string, value: string): void {
    let label = document.createElement('span');
    let field = document.createElement('span');
    label.setAttribute('class', 'data-label');
    field.setAttribute('class', 'data-field');
    label.innerText = key;
    field.innerText = value;
    this.back.appendChild(label);
    this.back.appendChild(field);
    this.reverseContent.set(key, field);
  }

  updateReverseContent(key: string, newValue: string): boolean {
    let field: HTMLSpanElement | undefined = this.reverseContent.get(key);
    if (field !== undefined) {
      field.innerText = newValue;
      return true;
    } else {
      return false;
    }
  }

    /**
     * Used to expand card to full screen view.
     */
    expand(): void {
      this.header.appendChild(this.leftSplitButton);
      this.header.appendChild(this.rightSplitButton);

      if(!this.fullScreen){
        this.cardX = String(this.element.style.left);
        this.cardY = String(this.element.style.top);
      }

      this.element.style.top = "0px";
      this.element.style.left = "0px";

      this.element.style.height = "100%";
      this.element.style.width = "100%";
      this.element.style.zIndex = "9999999";

      this.editor.resize();
      this.draggable(OptionState.disable);
      this.droppable(OptionState.disable);
      this.selectable(OptionState.disable);
      this.fullScreen = true;
    }

  /**
   * Returns card to default size.
   */
  shrink(): void{
    this.header.removeChild(this.leftSplitButton);
    this.header.removeChild(this.rightSplitButton);

    this.element.style.height = "280px";
    this.element.style.width = "200px";
    this.element.style.zIndex = "auto";

    this.element.style.top = this.cardY;
    this.element.style.left = this.cardX;

    this.editor.resize();
    this.draggable(OptionState.enable);
    this.droppable(OptionState.enable);
    this.selectable(OptionState.enable);
    this.fullScreen = false;
  }


  /**
   * Move card view to left half of screen.
   */
  split_left(): void{
    this.element.style.right = "auto"
    this.element.style.top = "0px";
    this.element.style.left = "0px";

    this.element.style.height = "100%";
    this.element.style.width = "50%"; 

    this.editor.resize();
    this.draggable(OptionState.disable);
    this.droppable(OptionState.disable);
    this.selectable(OptionState.disable);
  }

  /**
   * Move card view to right half of screen.
   */
  split_right(): void{
    this.element.style.left = "auto";
    this.element.style.top = "0px";
    this.element.style.right = "0px";

    this.element.style.height = "100%";
    this.element.style.width = "50%"; 

    this.editor.resize();
    this.draggable(OptionState.disable);
    this.droppable(OptionState.disable);
    this.selectable(OptionState.disable);
  }
}
