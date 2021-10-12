import * as format from '../src/containers/format';

describe('containers/format', () => {

  it('isPresent returns true on present', () => {
    expect(format.isPresent({ data: 'hello world' })).toBeTruthy();
  });

  it('isPresent returns false on undefined', () => {
    expect(format.isPresent(undefined)).toBeFalsy();
  });

  it('isPresent returns false on null', () => {
    expect(format.isPresent(null)).toBeFalsy();
  });

  it('isPresent returns false on void with undefined', () => {
    const voidVal: void = undefined;
    expect(format.isPresent(voidVal)).toBeFalsy();
  });

  it('isPresent filters out only present values from an array', () => {
    const results: Array<{ data: string } | undefined | null> = [
      { data: 'hello' }, null, { data: 'world' }, undefined, { data: 'wow' }
    ];
    const presentResults: Array<{ data: string }> = results.filter(format.isPresent);
    expect(presentResults).toEqual([{ data: 'hello' }, { data: 'world' }, { data: 'wow' }]);
  });

  it('isDefined returns true on defined', () => {
    expect(format.isDefined({ data: 'hello world' })).toBeTruthy();
  });

  it('isDefined returns false on undefined', () => {
    expect(format.isDefined(undefined)).toBeFalsy();
  });

  it('isDefined filters out only defined values from an array', () => {
    const results: Array<{ data: string } | undefined> = [
      { data: 'hello' }, { data: 'world' }, undefined, { data: 'wow' }
    ];
    const definedResults: Array<{ data: string }> = results.filter(format.isDefined);
    expect(definedResults).toEqual([{ data: 'hello' }, { data: 'world' }, { data: 'wow' }]);
  });

  it('isFilled returns true on filled', () => {
    expect(format.isFilled({ data: 'hello world' })).toBeTruthy();
  });

  it('isFilled returns false on null', () => {
    expect(format.isFilled(null)).toBeFalsy();
  });

  it('isFilled filters out only filled values from an array', () => {
    const results: Array<{ data: string } | null> = [
      { data: 'hello' }, { data: 'world' }, null, { data: 'wow' }
    ];
    const filledResults: Array<{ data: string }> = results.filter(format.isFilled);
    expect(filledResults).toEqual([{ data: 'hello' }, { data: 'world' }, { data: 'wow' }]);
  });

  it('deserialize to parse a JSON string into a TypeScript object', () => {
    const json = '{"result":true, "count":42}';
    type typedJson = { result: boolean; count: number };
    const deserializedJson = format.deserialize<typedJson>(json);
    expect(typeof deserializedJson.result).toBe('boolean');
    expect(deserializedJson.result).toBe(true);
    expect(deserializedJson).toMatchSnapshot();
  });

  it('deserialize fails with an error on malformed JSON', () => {
    // eslint-disable-next-line no-useless-escape
    const malformedJson = '{ "key": "Something \\\\"Name\\\\" something\", "anotherkey": "value" }';
    expect(() => format.deserialize(malformedJson)).toThrow(SyntaxError);
  });

  it('removeUndefined removes undefined from array of Primitive types', () => {
    const arr = [3, 'a', undefined, true];
    expect(format.removeUndefined(arr)).toStrictEqual([3, 'a', true]);
  });

  it('removeUndefined removes undefined from array of Object types', () => {
    const arr = [undefined, { a: 3 }, undefined, { b: 7 }];
    expect(format.removeUndefined(arr)).toStrictEqual([{ a: 3 }, { b: 7 }]);
  });

  it('removeUndefined returns original array when no undefined are present', () => {
    const arr = [{ a: 3 }, 'a', { b: 7 }, true];
    expect(format.removeUndefined(arr)).toStrictEqual(arr);
  });

  it('removeUndefinedFields removes undefined from Object of Primitive types', () => {
    const obj = { a: 3, b: 'a', c: undefined, d: true };
    expect(format.removeUndefinedFields(obj)).toStrictEqual({ a: 3, b: 'a', d: true });
  });

  it('removeUndefinedFields removes top-level undefined from Object with nested Objects', () => {
    const obj = { a: undefined, b: { c: 3 }, d: { e: undefined }, f: { g: 7 } };
    expect(format.removeUndefinedFields(obj)).toStrictEqual({ b: { c: 3 }, d: { e: undefined }, f: { g: 7 } });
  });

  it('removeUndefinedFields returns original array when no undefined are present', () => {
    const arr = [{ a: 3 }, 'a', { b: 7 }, true];
    expect(format.removeUndefined(arr)).toStrictEqual(arr);
  });

  it('removeDuplicates removes duplicates from array of Primitive types', () => {
    const arr = [3, 4, 1, 0, 3, 3];
    const comparator = (a: number, b: number) => (a === b);
    expect(format.removeDuplicates(arr, comparator)).toStrictEqual([3, 4, 1, 0]);
  });

  it('removeDuplicates removes duplicates from array of Object types', () => {
    const arr = [{ id: 3 }, { id: 10 }, { id: 3 }];
    const comparator = (a: { id: number }, b: { id: number }) => (a.id === b.id);
    expect(format.removeDuplicates(arr, comparator)).toStrictEqual([{ id: 3 }, { id: 10 }]);
  });

  it('removeDuplicates returns original array on empty array', () => {
    const arr: number[] = [];
    const comparator = (a: number, b: number) => (a === b);
    expect(format.removeDuplicates(arr, comparator)).toStrictEqual(arr);
  });

  it('asyncFilter evaluates and returns array of async Primitive types', async () => {
    const arr = [3, 4, 1, 0, 2, 3];
    const predicate = async (e: number) => (e % 2 == 0);
    return expect(format.asyncFilter(arr, predicate)).resolves.toStrictEqual([4, 0, 2]);
  });

  it('asyncFilter evaluates and returns array of await Primitive types', async () => {
    const arr = [3, 4, 1, 0, 2, 3];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const predicate = async (e: number) => {
      await delay(2);
      return e % 2 === 0;
    };
    return expect(format.asyncFilter(arr, predicate)).resolves.toStrictEqual([4, 0, 2]);
  });

  it('filterObject recursively filters objects and returns homogenously-typed values', () => {
    const obj: { a: number; b: { c: string, d: { e: string } } } = { a: 13, b: { c: 'rose', d: { e: 'tulip' } } };
    return expect(format.filterObject(obj, ['c', 'e'])).toStrictEqual({ c: 'rose', e: 'tulip' });
  });

  it('filterObject recursively filters objects and returns heterogenously-typed values', () => {
    const obj: { a: number; b: { c: string, d: { e: string } } } = { a: 13, b: { c: 'rose', d: { e: 'tulip' } } };
    return expect(format.filterObject(obj, ['e', 'a'])).toStrictEqual({ a: 13, e: 'tulip' });
  });

  it('objectifyPath converts array of path elements into object with value', () => {
    const expected = { user: { name: 3 } };
    expect(format.objectifyPath(['user', 'name'], 3)).toStrictEqual(expected);
  });

  it('equalArrayBuffers identifies equal and non-equal Buffers containing UTF-8 string data', () => {
    const buf1 = Buffer.from('test content');
    const buf2 = Buffer.from('test content');
    const buf3 = Buffer.from('other content');
    expect(format.equalArrayBuffers(buf1, buf2)).toBe(true);
    expect(format.equalArrayBuffers(buf2, buf3)).toBe(false);
  });

  it('equalArrayBuffers identifies equal and non-equal Buffers containing binary data', () => {
    const buf1 = Buffer.from([23, 13, 99]);
    const buf2 = Buffer.from([23, 13, 99]);
    const buf3 = Buffer.from([14, 54, 116, 34, 28]);
    expect(format.equalArrayBuffers(buf1, buf2)).toBe(true);
    expect(format.equalArrayBuffers(buf3, buf2)).toBe(false);
  });

  it('equalArrayBuffers identifies equal and non-equal Uint8Arrays containing binary data', () => {
    const arr1 = new Uint8Array([23, 13, 99]);
    const arr2 = new Uint8Array([23, 13, 99]);
    const arr3 = new Uint8Array([14, 54, 116, 34, 28]);
    const arr4 = new Uint8Array([14, 53, 116, 34, 28]);
    expect(format.equalArrayBuffers(arr1, arr2)).toBe(true);
    expect(format.equalArrayBuffers(arr3, arr2)).toBe(false);
    expect(format.equalArrayBuffers(arr3, arr4)).toBe(false);
  });

  it('equalArrayBuffers identifies equal and non-equal ArrayBufferLike objects of different types', () => {
    const buf1 = Buffer.from([23, 13, 99]);
    const buf2 = Buffer.from([14, 54, 116, 34, 28]);
    const arr1 = new Uint8Array([23, 13, 99]);
    const arr2 = new Uint8Array([14, 53, 116, 34, 28]);
    expect(format.equalArrayBuffers(buf1, arr1)).toBe(true);
    expect(format.equalArrayBuffers(buf2, arr2)).toBe(false);
  });

  it('toArrayBuffer converts Buffer containing UTF-8 string data', () => {
    const buf1 = Buffer.from('test content');
    const arr1 = format.toArrayBuffer(buf1);
    expect(format.equalArrayBuffers(buf1, arr1)).toBe(true);
  });

  it('toArrayBuffer converts Buffer containing binary data', () => {
    const buf1 = Buffer.from([14, 54, 116, 34, 28]);
    const arr1 = format.toArrayBuffer(buf1);
    expect(format.equalArrayBuffers(buf1, arr1)).toBe(true);
  });

  it('toArrayBuffer converts Uint8Array containing binary data', () => {
    const arr1 = new Uint8Array([14, 54, 116, 34, 28]);
    const buf1 = Buffer.from(arr1);
    const arr2 = format.toArrayBuffer(buf1);
    expect(format.equalArrayBuffers(arr1, arr2)).toBe(true);
  });
});