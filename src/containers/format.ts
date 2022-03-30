import { flattenObject } from './flatten';

/** Requires all properties to be nullable (i.e. `null` or `undefined` or `void`).
 * Inspired by: https://javascript.plainenglish.io/typescript-advanced-mapped-and-conditional-types-2d10c96042fe
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null | undefined;
};

/** Requires properties to be defined, or excluded from the type otherwise. Allows for empty object.
 * Inspired by: https://stackoverflow.com/a/60574436
 */
export type NonUndefinedProperties<T> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined | void>;
} | Record<string, never>;

/** Requires at least one type property, similar to `Partial<T>` but excludes the empty object.
 * Inspired by: https://stackoverflow.com/questions/48230773/how-to-create-a-partial-like-that-requires-a-single-property-to-be-set/48244432#48244432
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K>; }> =
  Partial<T> & U[keyof U];

/** Requires exactly one type property in an object, no more and no less.
 * Inspired by: https://github.com/sindresorhus/type-fest/blob/main/source/require-exactly-one.d.ts
 */
export type ExactlyOne<T, U extends keyof T = keyof T> =
  { [K in U]: (Required<Pick<T, K>> & Partial<Record<Exclude<U, K>, never>>) }[U] & Omit<T, U>;

/** From T, set as required all properties whose keys are in the union K
 * Inspired by: https://github.com/bkinseyx/testing-react-redux-toolkit/blob/610c8a676b7e799ea20047bf46dc35c47b3b988b/src/utils/types.ts
 */
export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** From T, set as optional all properties whose keys are in the union K
 * Inspired by: https://github.com/bkinseyx/testing-react-redux-toolkit/blob/610c8a676b7e799ea20047bf46dc35c47b3b988b/src/utils/types.ts
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Removes `undefined` and `null` values from an Array or Object type via a `filter` and type guard.
 * Reused from: https://github.com/robertmassaioli/ts-is-present
 * @param t Object that includes at least one of `undefined`, `null` or `void` in the type signature.
 * @returns A type narrowed version of the same `t` object.
 */
export const isPresent = <T>(t: T | undefined | null | void): t is T => {
  return t !== undefined && t !== null;
}

/**
 * Removes `undefined` values from an Array or Object type via a `filter` and type guard.
 * Reused from: https://github.com/robertmassaioli/ts-is-present
 * @param t Object that includes `undefined` in the type signature.
 * @returns A type narrowed version of the same `t` object.
 */
export const isDefined = <T>(t: T | undefined): t is T => {
  return t !== undefined;
}

/**
 * Removes `null` values from an Array or Object type via a `filter` and type guard.
 * Reused from: https://github.com/robertmassaioli/ts-is-present
 * @param t Object that includes `null` in the type signature.
 * @returns A type narrowed version of the same `t` object.
 */
export const isFilled = <T>(t: T | null): t is T => {
  return t !== null;
}

/**
 * Converts a JavaScript Object Notation (JSON) string into a typed object.
 * @param json A valid JSON string.
 * @return A typed object (or nested array of objects).
 */
export const deserialize = <T>(json: string): T => JSON.parse(json) as T;

/**
 * Generic for partitioning an array into two disjoint arrays given a predicate function
 * that indicates whether an element should being in the passing subarray or failing subarray.
 * @param array The given array of elements to partition.
 * @param predicate A predicate function that resolves to true if element `e` meets
 * the inclusion requirements, and false otherwise.
 * @returns The resulting array of arrays where elements that passed the predicate are in
 * the left subarray and elements that failed the predicate are in the right subarray.
 */
export const partition = <T>(array: T[], predicate: (e: T) => boolean) => {
  return array.reduce((accumulator: [T[], T[]], item) => predicate(item)
    ? (accumulator[0].push(item), accumulator)
    : (accumulator[1].push(item), accumulator), [[], []]);
}

/**
 * Filters an array and removes any undefined elements contained within it.
 * @param array The given array of elements that should be filtered for undefined.
 * @return The resulting array devoid of any undefined elements.
 */
export const removeUndefined = <T>(array: (T | undefined)[]): T[] => {
  return array.filter((item): item is T => typeof item !== 'undefined');
};

/**
 * Filters an object and removes any properties with undefined values.
 * @param obj The given object containing key-value properties that should be filtered for undefined.
 * @returns The resulting object devoid of any undefined values.
 */
export const removeUndefinedProperties = <V, T extends Record<string, V | undefined | null | void>>(obj: T): NonUndefinedProperties<T> => {
  return Object.entries(obj)
    .filter((e): e is [string, V] => isPresent(e[1]))
    .reduce((accumulator, [k, v]) => ({ ...accumulator, [k]: v }), {});
}

/**
 * Generic for deduplicating array of elements given a comparator function that
 * indicates whether a pair of elements should be considered duplicates.
 * @param arr An array of elements.
 * @param comparator A comparator function that indicates true if elements a
 * and b are duplicate, and false otherwise.
 * @return The resulting array devoid of duplicate elements.
 */
export const removeDuplicates = <T>(arr: T[], comparator: (a: T, b: T) => boolean): T[] => {
  return arr.reduce((accumulator: T[], current) => {
    if (!accumulator.some(item => comparator(item, current))) accumulator.push(current);
    return accumulator;
  }, []);
};

/**
 * Generic for asynchronously filtering an array of elements given an async predicate
 * function that resolves to indicate whether an element should be considered for
 * inclusion in the resulting array.
 * @param arr An array of elements.
 * @param predicate A predicate function that resolves to true if element `e` meets
 * the filter inclusion requirements, and false otherwise.
 * @return The resulting array devoid of elements that did not meet the predicate.
 */
export const asyncFilter = async <T>(arr: T[], predicate: (e: T) => Promise<boolean>): Promise<T[]> => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
};

/**
 * Generic for flattening and filtering an object given a set of filtering keys for inclusion in the resulting object.
 * @param obj An object containing key-value indexed fields.
 * @param filter An array of key strings that indicate which key-value pairs should be included or excluded.
 * @return The resulting object devoid of key-value fields that did not match the key filter, or an empty object.
 */
export const filterObject = <V, T extends Record<string, V>>(obj: T, filter: string[]): T | Record<string, never> => {
  return Object.entries(flattenObject(obj))
    .filter(([key]) => filter.includes(key))
    .reduce((accumulator, [k, v]) => ({ ...accumulator, [k]: v }), {});
}

/**
 * Expand an array of path elements (i.e. a dot-format path such as `user.name`) into a successive series of named
 * objects that contain any subsequent path elements and/or the updated value.
 * @param path An array of path elements ordered in sequence (i.e. `user.name.lastName` would be `[user, name, lastName]`).
 * @param value The value to insert or update at the specific path in the return object.
 * @return An object containing a key-value structure of embedded container objects according to the given path.
 */
export const objectifyPath = (path: Array<string | number>, value: string | boolean | number | undefined):
  Record<string | number, unknown> => {
  return path
    .slice(0, -1)
    .reduceRight((prev: Record<string | number, unknown>, curr) => { return { [curr]: prev } }, { [path[path.length - 1]]: value });
};

/**
 * Compares two `Map` objects for equality; only supports `Map` and not objects with key-value pairs (i.e. `const map: {[key: string]: value}`).
 * Checks for same map sizes, then tests all underlying key-value entries for equality between maps.
 * @param map1 A `Map` object.
 * @param map2 A `Map` object.
 * @returns A boolean indicating true if the `Map` objects are equal, or false otherwise.
 */
export const equalMaps = <K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean => {
  if (map1.size !== map2.size) return false;
  for (const [key, val] of map1) {
    const testVal = map2.get(key);
    if (JSON.stringify(testVal) !== JSON.stringify(val) || (testVal === undefined && !map2.has(key))) return false;
  }
  return true;
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
export const equalArrayBuffers = (buf1: ArrayBufferLike, buf2: ArrayBufferLike): boolean => {
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