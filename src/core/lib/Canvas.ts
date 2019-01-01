import { Base } from './base';
import { Stack } from './Stack';
import { Card } from './Card';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

/**
 * Definition of a canvas to contain all open elements in context.
 */
export class Canvas implements Base<null, (Stack | Card)> {

  uuid: string = v4();
  created: DateTime = DateTime.local();
  modified: DateTime = DateTime.local();
  element: HTMLDivElement = document.createElement('div');
  parent: null;
  children: (Stack | Card)[] = [];

  /**
   * Default constructor for creating a canvas.
   * @param children Array of stacks and cards to populate the new canvas; can be empty.
   */
  constructor(children: (Stack | Card)[]) {
    children.map(c => this.add(c));
    this.element.setAttribute('class', 'canvas');
    document.body.appendChild(this.element);
  }

  /**
   * Default destructor for detaching from HTML DOM and deleting instance.
  */
  destructor(): void {
    document.body.removeChild(this.element);
    delete this.element;
  }

  /**
   * Adds stack or card to this canvas.
   * @param child A stack or card to be added.
   * @return Boolean indicating insertion success; false indicates child already exists in canvas.
  */
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

  /**
   * Removes a stack or card from this canvas.
   * @param child A stack or card to be removed.
   * @return Boolean indicating removal success; false indicates child not found in canvas.
  */
  remove(child: Stack | Card): boolean {
    if (this.children.some(c => c.uuid === child.uuid)) {
      this.children = this.children.filter(c => c !== child);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Search for a stack or card on this canvas.
   * @param uuid The unique user ID to search for within the canvas.
   * @return An array of stacks and cards that match the given uuid; can be empty.
  */
  search(uuid: string): (Stack | Card)[] {
    return this.children.filter(c => c.uuid === uuid);
  }
}
