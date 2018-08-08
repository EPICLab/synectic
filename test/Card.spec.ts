/// <reference path="../src/core/global.d.ts" />
import { expect } from 'chai';
import { AppManagerInstance } from '../src/core/AppManager';
import { Canvas } from '../src/core/Canvas';
import { Card } from '../src/core/Card';

describe('Card class', () => {

  beforeEach(() => {
    global.Synectic = AppManagerInstance;
    global.Synectic.newCanvas();
  });

  it('Should append HTML element to DOM when constructor is invoked', () => {
    const canvas: Canvas = global.Synectic.current;
    const card: Card = new Card(canvas, ['js']);
    expect(document.getElementById(card.element.id)).to.exist;
  });

//   it('Should only be able to append to Canvas once', () => {
//     const canvas: Canvas = global.SynecticManager.current;
//     const card: Card = new Card(canvas);
//     expect(canvas.search(card.uuid)).to.contain(card).and.have.length(1);
//     expect(canvas.add(card)).to.equal(false);
//     expect(canvas.search(card.uuid)).to.have.length(1);
//   });
//
//   it('Should remove HTML element from DOM when desructor is invoked', () => {
//     const canvas: Canvas = global.SynecticManager.current;
//     const card: Card = new Card(canvas);
//     const cardId: string = card.element.id;
//     card.destructor();
//     expect(document.getElementById(cardId)).to.not.exist;
//   });
//
//   it('Should remove self from Canvas when destructor is invoked', () => {
//     const canvas: Canvas = global.SynecticManager.current;
//     const card: Card = new Card(canvas);
//     expect(canvas.children).to.contain(card).and.have.length(1);
//     card.destructor();
//     expect(canvas.children).to.not.contain(card);
//   });
//
//   it('Should return null when searching for closest Card', () => {
//     const card: Card = new Card(global.SynecticManager.current);
//     expect(card.closest(Card.prototype)).to.equal(null);
//   });
//
//   it('Should return Canvas when searching for closest Canvas', () => {
//     const canvas: Canvas = global.SynecticManager.current;
//     const card: Card = new Card(canvas);
//     expect(card.closest(Canvas.prototype)).to.equal(canvas);
//   });
//
//   it('Should allow dragging when Draggable is enabled');
//
//   it('Should allow dropping when Droppable is enabled');

});
