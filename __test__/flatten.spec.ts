import { flatten } from '../src/containers/flatten';

describe('flatten.flatten', () => {

  it('flatten resolves simple arrays of depth 1', () => {
    expect(flatten([1])).toStrictEqual([1]);
  });

  it('flatten resolves arrays of equal max-depth', () => {
    expect(flatten([[1], [2]])).toStrictEqual([1, 2]);
  });

  it('flatten resolves arrays of non-equal max-depth', () => {
    expect(flatten([[1], 2])).toStrictEqual([1, 2]);
  });

  it('flatten resolves heterogenous arrays of primitive value types', () => {
    expect(flatten([[1, 2], [['apple'], [true]]])).toStrictEqual([1, 2, 'apple', true]);
  });

  it('flatten resolves heterogenous arrays of object types', () => {
    const flatArray = [{ id: 1 }, { 2: 'pink' }, 'apple', { state: true }];
    expect(flatten([[{ id: 1 }, { 2: 'pink' }], [['apple'], [{ state: true }]]])).toStrictEqual(flatArray);
  });

});