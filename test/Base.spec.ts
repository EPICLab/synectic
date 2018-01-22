import { expect } from 'chai';
import 'mocha';
import { Base } from '../src/core/Base';

describe('Base abstract class', () => {

  class Extends extends Base {
    constructor(...param: any[]) {
      super(...param);
    }
  }

  it('Should contain no parent or children when no parameters provided', () => {
    const extendedBase: Extends = new Extends();
    expect(extendedBase.parent).to.not.exist;
    expect(extendedBase.children).to.be.empty;
  });

  it('Should contain parent with UUID that matches parent parameter object', () => {
    const parent: Extends = new Extends();
    const extendedBase: Extends = new Extends(parent);
    expect((extendedBase.parent as Base).uuid).to.equal(parent.uuid);
  });

  it('Should contain children that match children parameter objects', () => {
    const child1: Extends = new Extends();
    const child2: Extends = new Extends();
    const children: Extends[] = [child1, child2];
    const extendedBase: Extends = new Extends(undefined, children);
    expect(extendedBase.children).to.contain(child1).and.to.contain(child2);
  });

  it('Should contain both parent and children when provided to constructor', () => {
    const parent: Extends = new Extends();
    const children: Extends[] = [new Extends(), new Extends()];
    const extendedBase: Extends = new Extends(parent, children);
    expect(extendedBase.parent).to.exist.and.be.instanceof(Base);
    expect(extendedBase.children).to.exist.and.have.length(2);
  });

  it('Should not contain an element after destructor method is invoked', () => {
    const extendedBase: Extends = new Extends();
    extendedBase.destructor();
    expect(extendedBase.element).to.not.exist;
  });

});
