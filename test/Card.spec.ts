/// <reference path="../src/core/global.d.ts" />
import { expect } from 'chai';
import { AppManagerInstance } from '../src/core/lib/AppManager';
import { Canvas } from '../src/core/lib/Canvas';
import { Card } from '../src/core/lib/Card';

describe('Card class', () => {

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

  it('Should append HTML element to DOM when constructor is invoked', () => {
    const canvas: Canvas = global.Synectic.current;
    const card: Card = new BlankCard(canvas);
    expect(document.getElementById(card.element.id)).to.exist;
  });

  it('Should only be able to append to Canvas once', () => {
    const canvas: Canvas = global.Synectic.current;
    const card: Card = new BlankCard(canvas);
    expect(canvas.search(card.uuid)).to.contain(card).and.have.length(1);
    expect(canvas.add(card)).to.equal(false);
    expect(canvas.search(card.uuid)).to.have.length(1);
  });

  it('Should remove HTML element from DOM when desructor is invoked', () => {
    const canvas: Canvas = global.Synectic.current;
    const card: Card = new BlankCard(canvas);
    const cardId: string = card.element.id;
    card.destructor();
    expect(document.getElementById(cardId)).to.not.exist;
  });

  it('Should remove self from Canvas when destructor is invoked', () => {
    const canvas: Canvas = global.Synectic.current;
    const card: Card = new BlankCard(canvas);
    expect(canvas.children).to.contain(card).and.have.length(1);
    card.destructor();
    expect(canvas.children).to.not.contain(card);
  });

//   it('Should allow dragging when Draggable is enabled');
//
//   it('Should allow dropping when Droppable is enabled');

});
