import { expect } from 'chai';
import 'mocha';
import { instance, mock, when } from 'ts-mockito';
import { Base } from '../src/core/Base';

describe('Startup class', () => {

  it('should return hello world', () => {
    const mockedBase: Base = mock(Base);
    const mockedInstance = instance(mockedBase);
    when(mockedBase.uuid).thenReturn('42');
    expect(mockedInstance.uuid).to.equal('42');
  });
});
