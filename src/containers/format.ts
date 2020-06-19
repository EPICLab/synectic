/**
 * Converts a JavaScript Object Notation (JSON) string into a typed object.
 * @param json A valid JSON string.
 * @return A typed object (or nested array of objects).
 */
export const deserialize = <T>(json: string) => JSON.parse(json) as T;

/**
 * Filters an array and removes any undefined elements contained within it.
 * @param array The given array of elements that should be filtered for undefined.
 * @return The resulting array devoid of any undefined elements.
 */
export const removeUndefined = <T>(array: (T | undefined)[]): T[] => {
  return array.filter((item): item is T => typeof item !== 'undefined');
}

/**
 * Compares two `ArrayBufferLike` objects for equality; compatible objects include `TypedArray`, `DataView`, 
 * and `Buffer`. However, `Buffer` has `.equals()` and `.compare()` functions for comparisons and these should 
 * be used in lieu of this function. `TypedArray` is a class of objects, which includes all of the following: 
 * `Int8Array`, `Uint8Array`, `Uint8ClampedArray`, `Int16Array` ,`Int32Array`, `Uint32Array`, `Float32Array`, 
 * `Float64Array`, `BigInt64Array`, `BigUint64Array`.
 * @param buf1 An `ArrayBufferLike` object.
 * @param buf2 An `ArrayBufferLike` object.
 * @return A boolean indicating true if the `ArrayBufferLike` objects are equal, or false otherwise.
 */
export const equalArrayBuffers = (buf1: ArrayBufferLike, buf2: ArrayBufferLike) => {
  if (buf1.byteLength != buf2.byteLength) return false;
  const dv1 = new Int8Array(buf1);
  const dv2 = new Int8Array(buf2);
  for (let i = 0; i != buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) return false;
  }
  return true;
}

/**
 * Convert a `Buffer` object into an `ArrayBuffer` object.
 * @param buf A `Buffer` object representing binary data in the form of a sequence of bytes.
 * @return A new `ArrayBuffer` object containing a copy of all data in `Buffer` object.
 */
export const toArrayBuffer = (buf: Buffer): ArrayBuffer => {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; i++) {
    view[i] = buf[i];
  }
  return ab;
};