import { Card } from '../core/Card';
import { Canvas } from '../core/Canvas';
import { Stack } from '../core/Stack';
import { testLoad } from '../core/System';

export class TextCard extends Card {

  public loadButton: HTMLButtonElement;
  public content: HTMLDivElement;

  constructor(parent: Canvas | Stack) {
    super(parent);

    this.loadButton = document.createElement('button');
    this.loadButton.innerText = 'Load Textfile';
    this.loadButton.onclick = () => console.log(testLoad());

    this.content = document.createElement('div');
    $(this.content).css({
      width: '100%',
      height: '100%'
    });

    this.element.appendChild(this.loadButton);
    this.element.appendChild(this.content);
  }
}
