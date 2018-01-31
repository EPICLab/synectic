import { Base } from './Base';

export class Canvas extends Base {

  public parent: null;
  public children: Base[];

  constructor(children?: Base[]) {
    super();
    if (children) children.map(c => this.add(c));
    this.element.setAttribute('class', 'canvas');
    document.body.appendChild(this.element);

    document.addEventListener('destruct', (e) => {
      const uuid: string = (e as CustomEvent).detail;
      const found: Base | undefined = this.search(uuid).pop();
      if (found) {
        this.remove(found);
      }
    }, false);
  }

  public destructor() {
    document.body.removeChild(this.element);
    delete this.element;
  }

  public add<T extends Base>(object: T): boolean {
    this.element.appendChild(object.element);
    return super._add(object);
  }

  public remove<T extends Base>(object: T): boolean {
    return super._remove(object);
  }

  public search(uuid: string): Base[] {
    return super._search(uuid);
  }

}
