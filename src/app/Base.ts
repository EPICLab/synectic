import { v4 } from 'uuid';
import { Canvas } from './Canvas';
import 'jquery';

export abstract class Base {

  public readonly uuid: string = v4();
  public parent: Base | Canvas;
  public element: HTMLDivElement;

  constructor(parent: Base | Canvas) {
    this.parent = parent;
    this.element = document.createElement('div');
    $(this.element).attr('id', this.uuid);
  }

  closest<T>(selector: string): T {
    let el: any = this;
    while (el && el.parent && el.parent.constructor.name !== selector) {
      el = el.parent;
    }
    return el.parent;
  }

}
