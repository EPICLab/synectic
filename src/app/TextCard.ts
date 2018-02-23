import { Card } from '../core/Card';
import { Canvas } from '../core/Canvas';
import { Stack } from '../core/Stack';
import { testLoad, asyncLoad } from '../core/System';
import { addClass } from '../core/helper';
import { remote } from 'electron';

export class TextCard extends Card {

  public loadButton: HTMLButtonElement = document.createElement('button');
  public loadASyncButton: HTMLButtonElement = document.createElement('button');
  public selectorButton: HTMLButtonElement = document.createElement('button');
  public content: HTMLDivElement = document.createElement('div');

  constructor(parent: Canvas | Stack) {
    super(parent);
    addClass(this.content, 'card-content');

    this.loadButton.innerText = 'Load Textfile';
    this.loadButton.onclick = () => console.log(testLoad('/foo.txt'));

    this.loadASyncButton.innerText = 'Load ASync';
    this.loadASyncButton.onclick = () => asyncLoad('/foo.txt', this.content);

    this.selectorButton.innerText = 'Select File';
    this.selectorButton.onclick = () => {
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {}, function(fileNames) {
        if (fileNames === undefined) return;
        fileNames.map((filename) => {
          console.log(filename);
        });
      });
    };

    this.element.appendChild(this.loadButton);
    this.element.appendChild(this.loadASyncButton);
    this.element.appendChild(this.selectorButton);
    this.element.appendChild(this.content);
  }
}
