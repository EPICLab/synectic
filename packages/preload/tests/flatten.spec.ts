import {describe, expect, test} from 'vitest';
import {flattenArray, flattenObject} from '../src';

describe('flattenArray', () => {
  test('flattenArray resolves simple arrays of depth 1', () => {
    expect(flattenArray([1])).toStrictEqual([1]);
  });

  test('flattenArray resolves arrays of equal max-depths', () => {
    expect(flattenArray([[1], [2]])).toStrictEqual([1, 2]);
  });

  test('flattenArray resolves arrays of non-equal max-depths', () => {
    expect(flattenArray([[1], 2])).toStrictEqual([1, 2]);
  });

  test('flattenArray resolves heterogenous arrays of primitive types', () => {
    expect(
      flattenArray([
        [1, 2],
        [['apple'], [true]],
      ]),
    ).toStrictEqual([1, 2, 'apple', true]);
  });

  test('flattenArray resolves heterogenous arrays of object types', () => {
    const flatArray = [{id: 1}, {2: 'pink'}, 'apple', {state: true}];
    expect(
      flattenArray([
        [{id: 1}, {2: 'pink'}],
        [['apple'], [{state: true}]],
      ]),
    ).toStrictEqual(flatArray);
  });
});

describe('flattenObject', () => {
  test('flattenObject resolves nested heterogenous JavaScript objects', () => {
    const origObj = {a: 'string', b: {c: 13}};
    expect(flattenObject(origObj)).toMatchSnapshot();
  });
});
