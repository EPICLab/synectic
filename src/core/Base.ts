import { v4 } from 'uuid';

export abstract class Base {

  public readonly uuid: string = v4();
  public element: HTMLDivElement;
  protected parent: Base | null;
  protected children: Base[] = new Array();

  constructor(parent?: Base) {
    this.parent = parent ? parent : null;
    this.element = document.createElement('div');
    this.element.setAttribute('id', this.uuid);
  }

  public abstract destructor(): void;

  // walks the parent tree looking for the nearest matching type
  protected closest<T extends Base>(_prototype: T): T | null {
    let e: Base | null = this.parent;
    while (e && e.constructor.name !== _prototype.constructor.name) {
      e = e.parent;
    }
    return e === null ? null : e as T;
  }

  // generic add method for appending to children
  protected _add<T extends Base>(object: T): boolean {
    if (this.children.some(c => c.uuid === object.uuid)) {
      return false;
    } else {
      if (object.parent) object.parent._remove(object);
      this.children.push(object);
      return true;
    }
  }

  // generic remove method for removing from children
  protected _remove<T extends Base>(object: T): boolean {
    if (this.children.some(c => c.uuid === object.uuid)) {
      this.children = this.children.filter(c => c !== object);
      return true;
    } else {
      return false;
    }
  }

  // generic search method for locating children based on uuid
  protected _search(uuid: string): Base[] {
    return this.children.filter(c => c.uuid === uuid);
  }

}
