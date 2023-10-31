import {describe, expect, test} from 'vitest';
import {
  asyncFilter,
  delay,
  deserialize,
  equalArrayBuffers,
  equalArrays,
  equalMaps,
  filterObject,
  filteredArrayEquality,
  filteredObjectEquality,
  getRandomInt,
  isDefined,
  isFilled,
  isPresent,
  objectifyPath,
  partition,
  removeDuplicates,
  removeNullableProperties,
  removeObjectProperty,
  removeUndefined,
  symmetrical,
  toArrayBuffer,
} from '../src';

describe('utils', () => {
  // let mockedInstance: MockInstance;
  // beforeAll(async () => {
  //   const instance = await mock({
  //     foo: {
  //       bar: file({ content: 'file contents', mtime: new Date(1) }),
  //       zap: file({ content: 'file contents', mtime: new Date(1) }),
  //       'tracked-file.js': 'directory is tracked by git'
  //     }
  //   });
  //   return (mockedInstance = instance);
  // });

  // afterAll(() => mockedInstance.reset());

  test('isPresent returns true on present', () => {
    expect(isPresent({data: 'hello world'})).toBeTruthy();
  });

  test('isPresent returns false on undefined', () => {
    expect(isPresent(undefined)).toBeFalsy();
  });

  test('isPresent returns false on null', () => {
    expect(isPresent(null)).toBeFalsy();
  });

  test('isPresent returns false on void with undefined', () => {
    const voidVal: void = undefined;
    expect(isPresent(voidVal)).toBeFalsy();
  });

  test('isPresent filters out only present values from an array', () => {
    const results: Array<{data: string} | undefined | null> = [
      {data: 'hello'},
      null,
      {data: 'world'},
      undefined,
      {data: 'wow'},
    ];
    const presentResults: Array<{data: string}> = results.filter(isPresent);
    expect(presentResults).toEqual([{data: 'hello'}, {data: 'world'}, {data: 'wow'}]);
  });

  test('isDefined returns true on defined', () => {
    expect(isDefined({data: 'hello world'})).toBeTruthy();
  });

  test('isDefined returns false on undefined', () => {
    expect(isDefined(undefined)).toBeFalsy();
  });

  test('isDefined filters out only defined values from an array', () => {
    const results: Array<{data: string} | undefined> = [
      {data: 'hello'},
      {data: 'world'},
      undefined,
      {data: 'wow'},
    ];
    const definedResults: Array<{data: string}> = results.filter(isDefined);
    expect(definedResults).toEqual([{data: 'hello'}, {data: 'world'}, {data: 'wow'}]);
  });

  test('isFilled returns true on filled', () => {
    expect(isFilled({data: 'hello world'})).toBeTruthy();
  });

  test('isFilled returns false on null', () => {
    expect(isFilled(null)).toBeFalsy();
  });

  test('isFilled filters out only filled values from an array', () => {
    const results: Array<{data: string} | null> = [
      {data: 'hello'},
      {data: 'world'},
      null,
      {data: 'wow'},
    ];
    const filledResults: Array<{data: string}> = results.filter(isFilled);
    expect(filledResults).toEqual([{data: 'hello'}, {data: 'world'}, {data: 'wow'}]);
  });

  // const mockedMetafile: FileMetafile = {
  //   id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
  //   name: 'bar.js',
  //   modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
  //   handler: 'Editor',
  //   filetype: 'Javascript',
  //   flags: [],
  //   path: 'foo/bar.js',
  //   state: 'unmodified',
  //   content: 'file contents',
  //   mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf()
  // };

  // it('hasUpdates returns false for empty objects', () => {
  //   expect(utils.hasUpdates(mockedMetafile, {})).toBeFalsy();
  // });

  // it('hasUpdates returns false for exactly similar metafiles', () => {
  //   expect(utils.hasUpdates(mockedMetafile, mockedMetafile)).toBeFalsy();
  // });

  // it('hasUpdates returns true on new property', () => {
  //   expect(utils.hasUpdates(mockedMetafile, { repo: '23', branch: '101' })).toBeTruthy();
  // });

  // it('hasUpdates returns true on modified property', () => {
  //   const updatedMetafile: FileMetafile = {
  //     ...mockedMetafile,
  //     content: 'new content'
  //   };
  //   expect(utils.hasUpdates(mockedMetafile, updatedMetafile)).toBeTruthy();
  // });

  // it('isNumber returns true on numeric-only strings', () => {
  //   expect(utils.isNumber('135')).toBe(true);
  //   expect(utils.isNumber('493721')).toBe(true);
  // });

  // it('isNumber returns false on non-numeric and mixed strings', () => {
  //   expect(utils.isNumber('test')).toBe(false);
  //   expect(utils.isNumber('3again2')).toBe(false);
  // });

  // it('getConflictingChunks to locate conflicts in a string', () => {
  //   const testfileContent = `<html>\n<div>\n   <ul>\n<<<<<<< HEAD\n      <li><a href="about.html">About Us</a></li>\n=======\n      <li><a href="about.html">About The Company</a></li>\n>>>>>>>\n<li><a href="contact.html">Contact Us</a><li>\n<<<<<<< HEAD\n      <li><a href="license.html">Legal</a></li>\n=======\n      <li><a href="license.html">License</a></li>\n>>>>>>>\n   <\\ul>\n<\\div>\n`;
  //   expect(utils.getConflictingChunks(testfileContent)).toStrictEqual([21, 203]);
  // });

  // it('getConflictingChunks returns an empty array on malformed strings', () => {
  //   const testfileContent = `<ul>\n<<<<<<< HEAD\n      <li><a href="about.html">About Us</a></li>\n\n      <li><a href="about.html">About The Company</a></li>\n>>>>>>\n   <\\ul>\n<\\div>\n`;
  //   expect(utils.getConflictingChunks(testfileContent)).toStrictEqual([]);
  // });

  test('deserialize to parse a JSON string into a TypeScript object', () => {
    const json = '{"result":true, "count":42}';
    type typedJson = {result: boolean; count: number};
    const deserializedJson = deserialize<typedJson>(json);
    expect(typeof deserializedJson.result).toBe('boolean');
    expect(deserializedJson.result).toBe(true);
    expect(deserializedJson).toMatchSnapshot();
  });

  test('deserialize fails with an error on malformed JSON', () => {
    // eslint-disable-next-line no-useless-escape
    const malformedJson = '{ "key": "Something \\\\"Name\\\\" something", "anotherkey": "value" }';
    expect(() => deserialize(malformedJson)).toThrow(SyntaxError);
  });

  test('partition splits array using value-based predicate', () => {
    const arr = [4, 6, 11, 10, 19, 5, 1, 0];
    const predicate = (e: number) => e >= 10;
    expect(partition(arr, predicate)).toStrictEqual([
      [11, 10, 19],
      [4, 6, 5, 1, 0],
    ]);
  });

  test('partition splits array using type-based predicate', () => {
    const arr = ['4', 6, '11', '10', 19, 5, '1', 0];
    const predicate = (e: number | string): e is number => typeof e === 'number';
    expect(partition(arr, predicate)).toStrictEqual([
      [6, 19, 5, 0],
      ['4', '11', '10', '1'],
    ]);
  });

  test('symmetrical splits arrays of primitive types into symmetrical differences and intersection', () => {
    expect(symmetrical([1, 2, 3], [2, 3, 4], (e1, e2) => e1 === e2)).toStrictEqual(
      expect.arrayContaining([
        [1],
        [
          [2, 2],
          [3, 3],
        ],
        [4],
      ]),
    );
  });

  test('symmetrical splits arrays of dissimilar types into symmetrical differences and intersection', () => {
    const arr1 = [
      [151, 'John'],
      [203, 'Mary'],
      [681, 'Sue'],
      [750, 'Isiah'],
    ];
    const arr2 = [
      {id: 151, name: 'John', rank: 3},
      {id: 681, name: 'Robert', rank: 1},
      {id: 85, name: 'Isiah', rank: 4},
    ];
    expect(symmetrical(arr1, arr2, (e1, e2) => e1[0] === e2.id && e1[1] === e2.name)).toStrictEqual(
      expect.arrayContaining([
        [
          [203, 'Mary'],
          [681, 'Sue'],
          [750, 'Isiah'],
        ],
        [[[151, 'John'], {id: 151, name: 'John', rank: 3}]],
        [
          {id: 681, name: 'Robert', rank: 1},
          {id: 85, name: 'Isiah', rank: 4},
        ],
      ]),
    );
  });

  test('removeUndefined removes undefined from array of Primitive types', () => {
    const arr = [3, 'a', undefined, true];
    expect(removeUndefined(arr)).toStrictEqual([3, 'a', true]);
  });

  test('removeUndefined removes undefined from array of Object types', () => {
    const arr = [undefined, {a: 3}, undefined, {b: 7}];
    expect(removeUndefined(arr)).toStrictEqual([{a: 3}, {b: 7}]);
  });

  test('removeUndefined returns original array when no undefined are present', () => {
    const arr = [{a: 3}, 'a', {b: 7}, true];
    expect(removeUndefined(arr)).toStrictEqual(arr);
  });

  test('removeUndefined returns original array when no undefined are present', () => {
    const arr = [{a: 3}, 'a', {b: 7}, true];
    expect(removeUndefined(arr)).toStrictEqual(arr);
  });

  test('removeObjectProperty removes target property from Object', () => {
    const obj = {a: 3, b: 'alpha', c: {d: 4, e: 'z'}};
    expect(removeObjectProperty(obj, 'c')).toStrictEqual({a: 3, b: 'alpha'});
  });

  test('removeNullableProperties removes undefined from Object of Primitive types', () => {
    const obj = {a: 3, b: 'a', c: undefined, d: true};
    expect(removeNullableProperties(obj)).toStrictEqual({a: 3, b: 'a', d: true});
  });

  test('removeNullableProperties removes top-level undefined from Object with nested Objects', () => {
    const obj = {a: undefined, b: {c: 3}, d: {e: undefined}, f: {g: 7}};
    expect(removeNullableProperties(obj)).toStrictEqual({
      b: {c: 3},
      d: {e: undefined},
      f: {g: 7},
    });
  });

  test('removeDuplicates removes duplicates from array of Primitive types', () => {
    const arr = [3, 4, 1, 0, 3, 3];
    const comparator = (a: number, b: number) => a === b;
    expect(removeDuplicates(arr, comparator)).toStrictEqual([3, 4, 1, 0]);
  });

  test('removeDuplicates removes duplicates from array of Object types', () => {
    const arr = [{id: 3}, {id: 10}, {id: 3}];
    const comparator = (a: {id: number}, b: {id: number}) => a.id === b.id;
    expect(removeDuplicates(arr, comparator)).toStrictEqual([{id: 3}, {id: 10}]);
  });

  test('removeDuplicates returns original array on empty array', () => {
    const arr: number[] = [];
    const comparator = (a: number, b: number) => a === b;
    expect(removeDuplicates(arr, comparator)).toStrictEqual(arr);
  });

  test('asyncFilter evaluates and returns array of async Primitive types', async () => {
    const arr = [3, 4, 1, 0, 2, 3];
    const predicate = async (e: number) => e % 2 == 0;
    return expect(asyncFilter(arr, predicate)).resolves.toStrictEqual([4, 0, 2]);
  });

  test('asyncFilter evaluates and returns array of await Primitive types', async () => {
    const arr = [3, 4, 1, 0, 2, 3];
    const predicate = async (e: number) => {
      await delay(2);
      return e % 2 === 0;
    };
    return expect(asyncFilter(arr, predicate)).resolves.toStrictEqual([4, 0, 2]);
  });

  test('filterObject recursively filters objects and returns homogenously-typed values', () => {
    const obj: {a: number; b: {c: string; d: {e: string}}} = {
      a: 13,
      b: {c: 'rose', d: {e: 'tulip'}},
    };
    return expect(filterObject(obj, ['c', 'e'])).toStrictEqual({c: 'rose', e: 'tulip'});
  });

  test('filterObject recursively filters objects and returns heterogenously-typed values', () => {
    const obj: {a: number; b: {c: string; d: {e: string}}} = {
      a: 13,
      b: {c: 'rose', d: {e: 'tulip'}},
    };
    return expect(filterObject(obj, ['e', 'a'])).toStrictEqual({a: 13, e: 'tulip'});
  });

  test('objectifyPath converts array of path elements into object with value', () => {
    const expected = {user: {name: 3}};
    expect(objectifyPath(['user', 'name'], 3)).toStrictEqual(expected);
  });

  test('equalMaps identifies equal and non-equal maps containing primitive types', () => {
    const map1 = new Map<string, number | string>([
      ['a', 13],
      ['b', 'thomas'],
    ]);
    const map2 = new Map<string, number | string>([
      ['a', 13],
      ['b', 'thomas'],
    ]);
    const map3 = new Map<string, number | string>([
      ['a', 13],
      ['b', 'ralph'],
    ]);
    expect(equalMaps(map1, map2)).toBe(true);
    expect(equalMaps(map1, map3)).toBe(false);
  });

  test('equalMaps identifies equal and non-equal maps containing Array types', () => {
    const map1 = new Map<string, Array<number>>([
      ['john', [3, 5]],
      ['mary', [7, 1]],
    ]);
    const map2 = new Map<string, Array<number>>([
      ['john', [3, 5]],
      ['mary', [7, 1]],
    ]);
    const map3 = new Map<string, Array<number>>([
      ['john', [3, 2]],
      ['mary', [7, 1]],
    ]);
    expect(equalMaps(map1, map2)).toBe(true);
    expect(equalMaps(map1, map3)).toBe(false);
  });

  test('equalMaps identifies equal and non-equal maps containing nested object types', () => {
    type NestedObject = {age: number; friends: {name: string}[]};
    const map1 = new Map<string, NestedObject>([
      ['john', {age: 40, friends: [{name: 'mary'}, {name: 'thomas'}]}],
      ['mary', {age: 35, friends: [{name: 'john'}, {name: 'thomas'}]}],
    ]);
    const map2 = new Map<string, NestedObject>([
      ['john', {age: 40, friends: [{name: 'mary'}, {name: 'thomas'}]}],
      ['mary', {age: 35, friends: [{name: 'john'}, {name: 'thomas'}]}],
    ]);
    const map3 = new Map<string, NestedObject>([
      ['john', {age: 40, friends: [{name: 'mary'}, {name: 'thomas'}]}],
      ['mary', {age: 35, friends: [{name: 'john'}, {name: 'ralph'}]}],
    ]);
    expect(equalMaps(map1, map2)).toBe(true);
    expect(equalMaps(map1, map3)).toBe(false);
  });

  test('equalArrays identifies equal and non-equal arrays containing primitive types', () => {
    expect(equalArrays([13, 'a', 14, 'b'], [13, 'a', 14, 'b'])).toBe(true);
    expect(equalArrays([13, 'a', 14, 'b'], [13, 'a', 14, 'c'])).toBe(false);
  });

  test('equalArrays identifies equal and non-equal arrays containing nested types', () => {
    const arr = [13, 'a', [3, 2, 1], {name: 'john'}];
    expect(equalArrays(arr, [13, 'a', [3, 2, 1], {name: 'john'}])).toBe(true);
    expect(equalArrays(arr, [13, 'a', [3, 0, 1], {name: 'john'}])).toBe(false);
  });

  test('filteredObjectEquality identifies equal and non-equal objects based on property filters', () => {
    const a = {name: 'rose', age: 32, attending: true};
    const b = {name: 'rose', age: 32, attending: false};
    const c = {name: 'bob', age: 56, attending: true};
    expect(filteredObjectEquality(a, b, ['age'])).toBe(true);
    expect(filteredObjectEquality(a, b, ['age', 'attending'])).toBe(false);
    expect(filteredObjectEquality(a, c, ['attending'])).toBe(true);
  });

  test('filteredArrayEquality identifies equal and non-equal arrays of objects based on property filters', () => {
    const a = {name: 'rose', age: 32, attending: true};
    const b = {name: 'rose', age: 32, attending: false};
    const c = {name: 'cyrus', age: 32, attending: false};
    const d = {name: 'bob', age: 32, attending: false};
    expect(filteredArrayEquality([a, b, c], [a, b, c], ['age'])).toBe(true);
    expect(filteredArrayEquality([a, b, c], [a, b, c, d], ['age'])).toBe(false);
    expect(filteredArrayEquality([a, b, c], [b, c, d], ['age', 'attending'])).toBe(false);
  });

  test('equalArrayBuffers identifies equal and non-equal Buffers containing UTF-8 string data', () => {
    const buf1 = Buffer.from('test content');
    const buf2 = Buffer.from('test content');
    const buf3 = Buffer.from('other content');
    expect(equalArrayBuffers(buf1, buf2)).toBe(true);
    expect(equalArrayBuffers(buf2, buf3)).toBe(false);
  });

  test('equalArrayBuffers identifies equal and non-equal Buffers containing binary data', () => {
    const buf1 = Buffer.from([23, 13, 99]);
    const buf2 = Buffer.from([23, 13, 99]);
    const buf3 = Buffer.from([14, 54, 116, 34, 28]);
    expect(equalArrayBuffers(buf1, buf2)).toBe(true);
    expect(equalArrayBuffers(buf3, buf2)).toBe(false);
  });

  test('equalArrayBuffers identifies equal and non-equal Uint8Arrays containing binary data', () => {
    const arr1 = new Uint8Array([23, 13, 99]);
    const arr2 = new Uint8Array([23, 13, 99]);
    const arr3 = new Uint8Array([14, 54, 116, 34, 28]);
    const arr4 = new Uint8Array([14, 53, 116, 34, 28]);
    expect(equalArrayBuffers(arr1, arr2)).toBe(true);
    expect(equalArrayBuffers(arr3, arr2)).toBe(false);
    expect(equalArrayBuffers(arr3, arr4)).toBe(false);
  });

  test('equalArrayBuffers identifies equal and non-equal ArrayBufferLike objects of different types', () => {
    const buf1 = Buffer.from([23, 13, 99]);
    const buf2 = Buffer.from([14, 54, 116, 34, 28]);
    const arr1 = new Uint8Array([23, 13, 99]);
    const arr2 = new Uint8Array([14, 53, 116, 34, 28]);
    expect(equalArrayBuffers(buf1, arr1)).toBe(true);
    expect(equalArrayBuffers(buf2, arr2)).toBe(false);
  });

  test('toArrayBuffer converts Buffer containing UTF-8 string data', () => {
    const buf1 = Buffer.from('test content');
    const arr1 = toArrayBuffer(buf1);
    expect(equalArrayBuffers(buf1, arr1)).toBe(true);
  });

  test('toArrayBuffer converts Buffer containing binary data', () => {
    const buf1 = Buffer.from([14, 54, 116, 34, 28]);
    const arr1 = toArrayBuffer(buf1);
    expect(equalArrayBuffers(buf1, arr1)).toBe(true);
  });

  test('toArrayBuffer converts Uint8Array containing binary data', () => {
    const arr1 = new Uint8Array([14, 54, 116, 34, 28]);
    const buf1 = Buffer.from(arr1);
    const arr2 = toArrayBuffer(buf1);
    expect(equalArrayBuffers(arr1, arr2)).toBe(true);
  });

  test('getRandomInt returns numbers bounded by min and max parameters', () => {
    const randomNumber = getRandomInt(1, 5);
    expect(randomNumber).toBeGreaterThanOrEqual(1);
    expect(randomNumber).toBeLessThanOrEqual(5);
  });
});
