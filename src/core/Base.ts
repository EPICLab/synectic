import { v4 } from 'uuid';

export abstract class Base {

  public readonly uuid: string = v4();
  public element: HTMLDivElement;
  public parent: Base | null;
  public children: Base[];

  constructor(parent?: Base, children?: Base[]) {
    this.parent = parent ? parent : null;
    this.children = children ? children : new Array();

    this.element = document.createElement('div');
    this.element.setAttribute('id', this.uuid);
  }

  public destructor() {
    const event = new CustomEvent('remove', { detail: this.uuid });
    document.dispatchEvent(event);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }

  public closest(selector: string): Base | null {
    let e = this.parent;
    while (e && e.parent && e.constructor.name !== selector) {
      e = e.parent;
    }
    return e;
  }

}
