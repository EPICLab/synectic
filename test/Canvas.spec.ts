import { expect } from 'chai';
import 'mocha';
import { Base } from '../src/core/Base';
import { Canvas } from '../src/core/Canvas';

describe('Canvas class', () => {

  class Extends extends Base {
    constructor(...param: any[]) {
      super(...param);
    }
  }

  let canvas: Canvas;
  const e1: Base = new Extends();
  const e2: Base = new Extends();

  beforeEach(() => {
    canvas = new Canvas();
  });

  it('Should contain children when initalized with children parameter', () => {
    expect(canvas.children).to.exist.and.have.length(0);
    canvas = new Canvas([e1, e2]);
    expect(canvas.children).to.contain(e1).and.to.contain(e2);
  });

  it('Should increase children count when adding new child', () => {
    canvas.add(e1);
    expect(canvas.children).to.contain(e1).and.have.length(1);
  });

  it('Should decrease children count when target is in Canvas', () => {
    canvas = new Canvas([e1, e2]);
    canvas.remove(e1);
    expect(canvas.children).to.have.length(1);
    canvas.remove(e1);
    expect(canvas.children).to.have.length(1);
  });

  it('Should return e1 when searching for e1 when in Canvas', () => {
    canvas = new Canvas([e1, e2]);
    expect(canvas.find(e1.uuid)).to.have.length(1).and.contain(e1);
  });

  it('Should return empty when searching for e1 when not in Canvas', () => {
    canvas = new Canvas([e2]);
    expect(canvas.find(e1.uuid)).to.have.length(0);
  });

});
