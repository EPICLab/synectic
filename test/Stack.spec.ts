import { expect } from 'chai';
import 'mocha';
import { AppManagerInstance } from '../src/core/AppManager';
import { Stack } from '../src/core/Stack';
import { Card } from '../src/core/Card';

describe('Stack class', () => {

  let card1: Card;
  let card2: Card;
  let card3: Card;
  let stack: Stack;

  beforeEach(() => {
    global.SynecticManager = AppManagerInstance;
    global.SynecticManager.newCanvas();
    card1 = new Card(global.SynecticManager.current);
    card2 = new Card(global.SynecticManager.current);
    card3 = new Card(global.SynecticManager.current);
    stack = new Stack(card1, card2, card3);
  });

  it('Should have the same parent as the first parameter Card', () => {
    expect(stack.parent).to.equal(card1.parent);
  });

  it('Should contain all parameter Cards in Stack', () => {
    expect(stack.children).to.contain(card1).and.to.contain(card2).and.to.contain(card3);
  });

});
