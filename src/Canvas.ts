import { Base } from './Base';

export class Canvas extends Base {

  constructor(children?: Base[]) {
    super(undefined, children);
    this.element.setAttribute('class', 'canvas');
    
  }
}
