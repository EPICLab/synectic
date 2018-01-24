import { expect } from 'chai';
import 'mocha';
import { Base } from '../src/core/Base';
import { Card } from '../src/core/Card';

describe('Card class', () => {

  class Extends extends Base {
    constructor(...param: any[]) {
      super(...param);
    }
  }

  it('Should have parent', () => {
    const parent: Base = new Extends();
    const card: Card = new Card(parent);
    expect(card.parent).to.exist;
  });

});
