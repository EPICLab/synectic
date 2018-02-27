import { Base } from './base';
import { Stack } from './Stack';
import { Card } from './Card';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

export class Canvas implements Base<null, (Stack | Card)> {

  uuid: string = v4();
  created: DateTime = DateTime.local();
  modified: DateTime = DateTime.local();
  element: HTMLDivElement = document.createElement('div');
  parent: null;
  children: (Stack | Card)[] = [];

  constructor(children: (Stack | Card)[]) {
    children.map(c => this.add(c));
    this.element.setAttribute('class', 'canvas');
    document.body.appendChild(this.element);
  }

  destructor(): void {
    document.body.removeChild(this.element);
    delete this.element;
  }

  add(child: Stack | Card): boolean {
    if (this.children.some(c => c.uuid === child.uuid)) {
      return false;
    } else {
      if (child instanceof Stack) child.parent.remove(child);
      if (child instanceof Card && child.parent instanceof Canvas) {
        child.parent.remove(child);
      }
      if (child instanceof Card && child.parent instanceof Stack) {
        child.parent.remove(child);
      }
      this.children.push(child);
      this.element.appendChild(child.element);
      return true;
    }
  }

  remove(child: Stack | Card): boolean {
    if (this.children.some(c => c.uuid === child.uuid)) {
      this.children = this.children.filter(c => c !== child);
      return true;
    } else {
      return false;
    }
  }

  search(uuid: string): (Stack | Card)[] {
    return this.children.filter(c => c.uuid === uuid);
  }
}
