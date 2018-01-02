import { v4 } from 'uuid';
import * as $ from 'jquery';

export class Canvas {

  public readonly uuid: string = v4();
  public base: HTMLDivElement;

  constructor() {
    this.base = document.createElement('div');
    $(this.base).attr({class: 'canvas'});
    document.body.appendChild(this.base);
  }

}
