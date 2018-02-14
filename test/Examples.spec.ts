import { expect } from 'chai';
import 'mocha';
import { instance, mock, when } from 'ts-mockito';
import { Base } from '../src/core/Base';

describe('Sample tests and mocking classes', () => {

  it('Mocked abstract class should return UUID of 42', () => {
    const mockedBase: Base = mock(Base);
    const mockedInstance = instance(mockedBase);
    when(mockedBase.uuid).thenReturn('42');
    expect(mockedInstance.uuid).to.equal('42');
  });

  it('Multiple mocked abstract class instances should return different UUIDs', () => {
    const [mockedBase1, mockedBase2]: [Base, Base] = [mock(Base), mock(Base)];
    const [instance1, instance2] = [instance(mockedBase1), instance(mockedBase2)];
    when(mockedBase1.uuid).thenReturn('21');
    when(mockedBase2.uuid).thenReturn('32');
    expect(instance1.uuid).to.not.equal(instance2.uuid);
  });
});
