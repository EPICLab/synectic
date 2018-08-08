/// <reference path="../src/core/global.d.ts" />
import { AppManagerInstance } from '../src/core/lib/AppManager';
import { expect } from 'chai';
import { instance, mock, when } from 'ts-mockito';
import { Card } from '../src/core/lib/Card';

// import jsdom = require("jsdom");
// const { JSDOM } = jsdom;
// const { window } = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);

describe('Sample tests and mocking classes', () => {
  beforeEach(() => {
    global.Synectic = AppManagerInstance;
    global.Synectic.newCanvas();
  });

  it('Mocked abstract class should return UUID of 42', () => {
    const mockedBase: Card = mock(Card);
    const mockedInstance = instance(mockedBase);
    when(mockedBase.uuid).thenReturn('42');
    expect(mockedInstance.uuid).to.equal('42');
  });

  it('Multiple mocked abstract class instances should return different UUIDs', () => {
    const [mockedBase1, mockedBase2]: [Card, Card] = [mock(Card), mock(Card)];
    const [instance1, instance2] = [instance(mockedBase1), instance(mockedBase2)];
    when(mockedBase1.uuid).thenReturn('21');
    when(mockedBase2.uuid).thenReturn('32');
    expect(instance1.uuid).to.not.equal(instance2.uuid);
  });
});
