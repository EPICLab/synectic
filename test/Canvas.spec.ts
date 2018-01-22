import { expect } from 'chai';
import 'mocha';
import { instance, mock, verify, when } from 'ts-mockito';
import { Canvas } from '../src/Canvas';

describe('Canvas class', () => {

  it('Basic Canvas instance', () => {
    const canvas = new Canvas();
    expect(canvas.uuid).to.not.equal(null);
    expect(canvas.children).to.exist.and.have.length(0);
    expect(canvas.parent).to.equal(null);
  });

});
