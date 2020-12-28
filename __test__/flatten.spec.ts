import { flattenArray, flattenObject } from '../src/containers/flatten';

describe('flatten.flatten', () => {

  it('flatten resolves simple arrays of depth 1', () => {
    expect(flattenArray([1])).toStrictEqual([1]);
  });

  it('flatten resolves arrays of equal max-depth', () => {
    expect(flattenArray([[1], [2]])).toStrictEqual([1, 2]);
  });

  it('flatten resolves arrays of non-equal max-depth', () => {
    expect(flattenArray([[1], 2])).toStrictEqual([1, 2]);
  });

  it('flatten resolves heterogenous arrays of primitive value types', () => {
    expect(flattenArray([[1, 2], [['apple'], [true]]])).toStrictEqual([1, 2, 'apple', true]);
  });

  it('flatten resolves heterogenous arrays of object types', () => {
    const flatArray = [{ id: 1 }, { 2: 'pink' }, 'apple', { state: true }];
    expect(flattenArray([[{ id: 1 }, { 2: 'pink' }], [['apple'], [{ state: true }]]])).toStrictEqual(flatArray);
  });

});

describe('flatten.flattenObject', () => {
  it('flattenObject resolves nested heterogenous JavaScript objects', () => {
    const origObj = { a: 'string', b: { c: 13 } };
    expect(flattenObject(origObj)).toMatchSnapshot();
  });
});