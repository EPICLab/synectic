import { expect } from 'chai';
import 'mocha';
import { Base } from '../src/core/Base';
import { Canvas } from '../src/core/Canvas';
import { AppManagerInstance } from '../src/core/AppManager';

describe('Canvas class', () => {

  let c1: ExtBase;
  let c2: ExtBase;

  class ExtBase extends Base {
    constructor(parent?: Base) {
      super(parent);
    }
    public destructor(): void { }
  }

  beforeEach(() => {
    global.SynecticManager = AppManagerInstance;
    [c1, c2] = [new ExtBase(), new ExtBase()];
  });

  it('Should append HTMLDivElement to DOM when constructor is invoked', () => {
    const canvas: Canvas = global.SynecticManager.newCanvas();
    expect(document.getElementById(canvas.element.id)).to.exist;
  });

  it('Should remove HTMLDivElement from DOM when desructor is invoked', () => {
    const canvas: Canvas = global.SynecticManager.current;
    const canvasId: string = canvas.element.id;
    canvas.destructor();
    expect(document.getElementById(canvasId)).to.not.exist;
  });

  it('Should contain no children by default', () => {
    const canvas = new Canvas();
    expect(canvas.children).to.be.empty;
  });

  it('Should contain children when initalized with children parameter', () => {
    const canvas = new Canvas([c1, c2]);
    expect(canvas.children).to.contain(c1).and.to.contain(c2);
  });

  it('Should return true on add when child added to Canvas', () => {
    const canvas = new Canvas();
    expect(canvas.children.length).to.equal(0);
    expect(canvas.add(c1)).to.equal(true);
    expect(canvas.children).to.contain(c1).and.have.length(1);
  });

  it('Should return false on add when child already exists in Canvas)', () => {
    const canvas = new Canvas([c1]);
    expect(canvas.children).to.contain(c1).and.have.length(1);
    expect(canvas.add(c1)).to.equal(false);
  });

  it('Should return true on remove when child removed from Canvas', () => {
    const canvas = new Canvas([c1, c2]);
    expect(canvas.children).to.contain(c1).and.have.length(2);
    expect(canvas.remove(c1)).to.equal(true);
    expect(canvas.remove(c1)).to.equal(false);
    expect(canvas.children).to.have.length(1);
  });

  it('Should return search object when in Canvas', () => {
    const canvas = new Canvas([c1, c2]);
    expect(canvas.search(c1.uuid)).to.have.length(1).and.contain(c1);
  });

  it('Should return empty when search object not in Canvas', () => {
    const canvas = new Canvas([c2]);
    expect(canvas.search(c1.uuid)).to.be.empty;
  });

});
