import { Card } from '../core/Card';
import { Canvas } from '../core/Canvas';
import { Stack } from '../core/Stack';
import * as ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/monokai';
import { addClass } from '../core/helper';

export class CodeEditor extends Card {

  public editor: HTMLDivElement;

  constructor(parent: Canvas | Stack) {
    super(parent);

    this.editor = document.createElement('div');
    this.editor.setAttribute('id', (this.uuid + '-editor'));
    addClass(this.element, 'editor');
    $(this.editor).css({
      width: '100%',
      height: '100%'
    });
    this.element.appendChild(this.editor);

    const editor = ace.edit(this.uuid + '-editor');
    editor.getSession().setMode('ace/mode/javascript');
    editor.setTheme('ace/theme/monokai');
  }
}
