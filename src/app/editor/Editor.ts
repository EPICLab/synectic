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
    this.editor.getSession().setMode('ace/mode/javascript');
    this.editor.setTheme('ace/theme/monokai');
  }
}
