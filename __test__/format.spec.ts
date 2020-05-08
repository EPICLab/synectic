import * as format from '../src/containers/format';

describe('format.deserialize', () => {
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
});

describe('format.equalArrayBuffers', () => {
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
});

describe('format.toArrayBuffer', () => {
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