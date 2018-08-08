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

  constructor(parent: Canvas | Stack) {
    super(parent);
    // global.Synectic.dispatcher.addEventListener('open-file', () => console.log('opening file...'));

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
