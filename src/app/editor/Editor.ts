import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import { addClass } from '../../core/lib/helper';
import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/mode/typescript';
import 'brace/mode/latex';
import 'brace/mode/python';
import 'brace/theme/monokai';
import { extname, readFileAsync } from '../../core/fs/io';
import { searchExt } from '../../core/fs/filetypes';
import { snackbar } from '../../core/fs/notifications';

export class Editor extends Card {

  public editorWindow: HTMLDivElement;
  public editor: ace.Editor;

  /**
   * Default constructor for creating an Editor card.
   * @param parent A canvas or stack instance that will contain the new Editor card.
   * @param filename A valid filename or path to load content into new Editor card.
   */
  constructor(parent: Canvas | Stack, filename: string) {
    super(parent, filename);

    this.editorWindow = document.createElement('div');
    this.editorWindow.setAttribute('id', (this.uuid + '-editor'));
    addClass(this.element, 'editor');
    $(this.editorWindow).css({
      width: '100%',
      height: '100%'
    });
    this.element.appendChild(this.editorWindow);

    this.editor = ace.edit(this.uuid + '-editor');
    this.editor.setTheme('ace/theme/monokai');
    if (filename !== '') this.loadContent(this.filename);
  }

  /**
   * Reads local file content into this Editor card.
   * @param filename A valid filename or path for reading content into this card.
   */
  loadContent(filename: string): void {
    Promise.all([readFileAsync(filename), searchExt(extname(filename))])
    .then(result => {
      let [content, filetype] = result;
      this.setContent(content);
      if (filetype !== undefined) this.setMode(filetype.name);
    })
    .catch(error => snackbar(global.Synectic.current, error.message, 'Editor Card Error: File Loading Failed'));
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
}
