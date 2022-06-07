import { flattenArray, flattenObject } from './flatten';

describe('flattenArray', () => {

  it('flattenArray resolves simple arrays of depth 1', () => {
    expect(flattenArray([1])).toStrictEqual([1]);
  });

  it('flattenArray resolves arrays of equal max-depth', () => {
    expect(flattenArray([[1], [2]])).toStrictEqual([1, 2]);
  });

  it('flattenArray resolves arrays of non-equal max-depth', () => {
    expect(flattenArray([[1], 2])).toStrictEqual([1, 2]);
  });

  it('flattenArray resolves heterogenous arrays of primitive value types', () => {
    expect(flattenArray([[1, 2], [['apple'], [true]]])).toStrictEqual([1, 2, 'apple', true]);
  });

  it('flattenArray resolves heterogenous arrays of object types', () => {
    const flatArray = [{ id: 1 }, { 2: 'pink' }, 'apple', { state: true }];
    expect(flattenArray([[{ id: 1 }, { 2: 'pink' }], [['apple'], [{ state: true }]]])).toStrictEqual(flatArray);
  });

});

describe('flattenObject', () => {
  it('flattenObject resolves nested heterogenous JavaScript objects', () => {
    const origObj = { a: 'string', b: { c: 13 } };
    expect(flattenObject(origObj)).toMatchSnapshot();
  });
});