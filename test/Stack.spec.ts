/// <reference path="../src/core/global.d.ts" />
import { expect } from 'chai';
import { AppManagerInstance } from '../src/core/AppManager';
import { Stack } from '../src/core/Stack';
import { Card } from '../src/core/Card';

describe('Stack class', () => {

  beforeEach(() => {
    global.Synectic = AppManagerInstance;
    global.Synectic.newCanvas();
  });

  it('Should have the same parent as the first parameter Card', () => {
    let card1 = new Card(global.Synectic.current, ['js']);
    let card2 = new Card(global.Synectic.current, ['js']);
    let stack = new Stack(global.Synectic.current, [card1, card2]);
    expect(stack.parent).to.equal(card1.parent);
  });

  it('Should contain all parameter Cards in Stack', () => {
    let card1 = new Card(global.Synectic.current, ['js']);
    let card2 = new Card(global.Synectic.current, ['js']);
    let stack = new Stack(global.Synectic.current, [card1, card2]);
    expect(stack.children).to.contain(card1).and.to.contain(card2);
  });

  it('Should append child HTMLDivElement to parent when destructor is invoked', () => {
    let card1 = new Card(global.Synectic.current, ['js']);
    let stack = new Stack(global.Synectic.current, [card1]);
    let parent = stack.parent;
    stack.destructor();
    expect(parent.search(card1.uuid)).to.have.length(1).and.contain(card1);
  });

  it('Should remove child from parent when add is invoked', () => {
    const card1 = new Card(global.Synectic.current, ['js']);
    const card2 = new Card(global.Synectic.current, ['js']);
    const parent = card2.parent;
    const stack = new Stack(global.Synectic.current, [card1]);
    stack.add(card2);
    expect(parent.search(card2.uuid)).to.have.length(0);
  });

  it('Should append child to Stack when add is invoked', () => {
    const card1 = new Card(global.Synectic.current, ['js']);
    const card2 = new Card(global.Synectic.current, ['js']);
    const stack = new Stack(global.Synectic.current, [card1]);
    stack.add(card2);
    expect(stack.children).to.have.length(2).and.contain(card1).and.contain(card2);
  });

});
