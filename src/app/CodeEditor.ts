import { Card } from '../core/Card';
import { Canvas } from '../core/Canvas';
import { Stack } from '../core/Stack';
import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/monokai';
import { addClass } from '../core/helper';

export class CodeEditor extends Card {

  public editorWindow: HTMLDivElement;
  public editor: ace.Editor;

  constructor(parent: Canvas | Stack) {
    super(parent, ['js']);

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
