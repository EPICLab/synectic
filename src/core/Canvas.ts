import { Base } from './Base';

export class Canvas extends Base {

  constructor(children?: Base[]) {
    super(undefined, children);
    this.element.setAttribute('class', 'canvas');
    document.body.appendChild(this.element);

    document.addEventListener('remove', (e) => {
      let object: Base = this.find((e as CustomEvent).detail)[0];
      console.log('EVENT: remove ' + object.uuid);
      this.remove(object);
    }, false);
  }

  public add<T extends Base>(object: T): void {
    this.children.push(object);
    this.element.appendChild(object.element);
  }

  public remove<T extends Base>(object: T): boolean {
    if (this.children.some(c => c === object)) {
      this.children = this.children.filter(c => c !== object);
      return true;
    } else {
      return false;
    }
  }

  public find(uuid: string): Base[] {
    return this.children.filter(c => c.uuid === uuid);
  }
}
