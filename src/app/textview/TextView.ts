import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import { openDialog } from '../../core/fs/fileUI';
import { addClass } from '../../core/lib/helper';

export class TextView extends Card {

  public loadButton: HTMLButtonElement = document.createElement('button');
  public content: HTMLDivElement = document.createElement('div');

  constructor(parent: Canvas | Stack) {
    super(parent);
    addClass(this.content, 'card-content');

    this.loadButton.innerText = 'Select File';
    this.loadButton.onclick = () => openDialog({ filters: [{name: 'text', extensions:['txt']}] }, this.content);

    this.element.appendChild(this.loadButton);
    this.element.appendChild(this.content);
  }
}
