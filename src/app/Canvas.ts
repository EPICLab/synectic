import { v4 } from 'uuid';
import { Base } from './Base';
import { Card } from './Card';
import 'jquery';

export class Canvas {

  public readonly uuid: string = v4();
  public element: HTMLDivElement;
  public readonly children: Array<any> = new Array();

  constructor() {
    this.element = document.createElement('div');
    $(this.element).attr('id', this.uuid);
    $(this.element).attr('class', 'canvas');
    document.body.appendChild(this.element);

    let newCardButton = document.createElement('button');
    newCardButton.innerText = 'New Card';
    newCardButton.onclick = () => this.add(new Card(this));
    this.element.appendChild(newCardButton);
  }

  public add<T extends Base>(el: T): void {
    this.children.push(el);
    this.element.appendChild(el.element);
  }

  public remove<T extends Base>(el: T): boolean {
    if (this.children.some(c => c === el)) {
      this.children.filter(c => c !== el);
      return true;
    } else {
      return false;
    }
  }

  public find<T extends Base>(uuid: string): T {
    return this.children.filter(c => c.uuid === uuid)[0] as T;
  }

}
