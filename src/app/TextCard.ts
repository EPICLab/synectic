import { Card } from '../core/Card';
import { Canvas } from '../core/Canvas';
import { Stack } from '../core/Stack';
import { openDialog } from '../core/System';
import { addClass } from '../core/helper';

export class TextCard extends Card {

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
