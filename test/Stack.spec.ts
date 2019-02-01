/// <reference path="../src/core/global.d.ts" />
// import { expect } from 'chai';
import { expect } from 'chai';
import { AppManagerInstance } from '../src/core/lib/AppManager';
import { Stack } from '../src/core/lib/Stack';
import { Card } from '../src/core/lib/Card';
import { Canvas } from '../src/core/lib/Canvas';

describe('Stack class', () => {

  class BlankCard extends Card {
    constructor(parent: Canvas) {
      super(parent, '');
    }
    load(): void {
      throw new Error("Method not implemented.");
    }
    save(): void {
      throw new Error("Method not implemented.");
    }
  }

  beforeEach(() => {
    global.Synectic = AppManagerInstance;
    global.Synectic.newCanvas();
  });

  it('Should throw Error when instantiated with less than two Cards', () => {
    let card1 = new BlankCard(global.Synectic.current);
    expect(() => {new Stack(global.Synectic.current, [card1])}).to.throw(Error);
  });

  it('Should contain all parameter Cards in Stack', () => {
    let card1 = new BlankCard(global.Synectic.current);
    let card2 = new BlankCard(global.Synectic.current);
    let stack = new Stack(global.Synectic.current, [card1, card2]);
    expect(stack.children).to.contain(card1).and.to.contain(card2);
  });

  it('Should have the same parent as the first parameter Card', () => {
    let card1 = new BlankCard(global.Synectic.current);
    let card2 = new BlankCard(global.Synectic.current);
    let stack = new Stack(global.Synectic.current, [card1, card2]);
    expect(stack.parent).to.equal(card1.parent);
  });

  it('Should reparent all children to Canvas when destructor is invoked', () => {
    let card1 = new BlankCard(global.Synectic.current);
    let card2 = new BlankCard(global.Synectic.current);
    let stack = new Stack(global.Synectic.current, [card1, card2]);
    let parent: Canvas = stack.parent;
    stack.destructor();
    expect(parent.children).to.contain(card1).and.to.contain(card2);
  });

  it('Should append Card to Stack children when added to Stack', () => {
    const card1 = new BlankCard(global.Synectic.current);
    const card2 = new BlankCard(global.Synectic.current);
    const card3 = new BlankCard(global.Synectic.current);
    const stack = new Stack(global.Synectic.current, [card1, card2]);
    stack.add(card3);
    expect(stack.children).to.have.length(3).and.contain(card3);
  });

  it('Should remove Card from Canvas when added to Stack', () => {
    const canvas = global.Synectic.current;
    let card1 = new BlankCard(canvas);
    let card2 = new BlankCard(canvas);
    let card3 = new BlankCard(canvas);
    let stack = new Stack(canvas, [card1, card2]);
    stack.add(card3);
    expect(canvas.search(card3.uuid)).to.have.length(0);
  });

});
