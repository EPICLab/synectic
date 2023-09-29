import { GitStatus } from '../store';
import { flattenObject } from './flatten';
import { NonNullableObject } from '../../renderer/src/store/types/util.types';

/**
 * Removes `undefined` and `null` values from an Array or Object type via a `filter` and type guard.
 * Reused from: https://github.com/robertmassaioli/ts-is-present
 *
 * @param t Object that includes at least one of `undefined`, `null` or `void` in the type
 *   signature.
 * @returns {object | undefined | null | void} A type narrowed version of the same `t` object.
 */
export const isPresent = <T>(t: T | undefined | null | void): t is T => {
  return t !== undefined && t !== null;
};

/**
 * Removes `undefined` values from an Array or Object type via a `filter` and type guard. Reused
 * from: https://github.com/robertmassaioli/ts-is-present
 *
 * @param t Object that includes `undefined` in the type signature.
 * @returns {object | undefined} A type narrowed version of the same `t` object.
 */
export const isDefined = <T>(t: T | undefined): t is T => {
  return t !== undefined;
};

/**
 * Removes `null` values from an Array or Object type via a `filter` and type guard. Reused from:
 * https://github.com/robertmassaioli/ts-is-present
 *
 * @param t Object that includes `null` in the type signature.
 * @returns {object | null} A type narrowed version of the same `t` object.
 */
export const isFilled = <T>(t: T | null): t is T => {
  return t !== null;
};

/**
 * Generic for comparing possible updates against the current state of an object.
 *
 * @param object The original state object.
 * @param properties The updated state properties.
 * @returns {boolean} A boolean indicating true if at least one property is new or contains modified
 *   values, false otherwise.
 */
export const hasUpdates = <T extends Record<string | number | symbol, unknown>>(
  object: T,
  properties: Partial<T>
): boolean => {
  let prop: keyof typeof properties;
  for (prop in properties) {
    if (!(prop in object)) return true;
    if (object[prop] !== properties[prop]) return true;
  }
  return false;
};

/**
 * Check for the existence of numeric values in a string object. Returns a Boolean value that
 * indicates whether a String value contains only numeric values.
 *
 * @param maybeNumber A string possibly containing only numeric values.
 * @returns {boolean} A boolean indicating true if the parameter is a number, false otherwise.
 */
export const isNumber = (maybeNumber: string | undefined): boolean => {
  return isDefined(maybeNumber) && !isNaN(+maybeNumber);
};

/**
 * Check for a string containing a quote-encapsulated value (e.g. `a = '"quote"'`).
 *
 * @param maybeQuote A string possibly containing a quote-encapsulated string value.
 * @returns {boolean} A boolean indicating true if the paraemter is quote-encapsulated, false
 *   otherwise.
 */
export const isWrappedQuote = (maybeQuote: string): boolean => {
  return (
    (maybeQuote.startsWith(`'`) && maybeQuote.endsWith(`'`)) ||
    (maybeQuote.startsWith(`"`) && maybeQuote.endsWith(`"`))
  );
};

/**
 * Check for status indicating changes to a file have been staged; i.e. the file contents have been
 * added to the index (staging area).
 *
 * @param status An enumerated git status value.
 * @returns {boolean} A boolean indicating true if modified and staged, and false otherwise.
 */
export const isStaged = (status: GitStatus): boolean =>
  ['added', 'modified', 'deleted'].includes(status);

/**
 * Check for status indicating changes to a file that differ from the index, but have not been
 * staged.
 *
 * @param status An enumerated git status value.
 * @returns {boolean} A boolean indicating true if modified and unstaged, and false otherwise.
 */
export const isModified = (status: GitStatus): boolean =>
  ['absent', '*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(status);

/**
 * Check for status indicating a file has unmerged changes from an incomplete merge.
 *
 * **Warning:** This does not guarantee that the file _currently_ contains conflicting chunks.
 *
 * @param status An enumerated git status value.
 * @returns {boolean} A boolean indicating true if unmerged, and false otherwise.
 */
export const isUnmerged = (status: GitStatus): boolean => status === 'unmerged';

/**
 * Typed version of
 * [Object.entries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
 * which respects the types of the key/value pairs within properties on the input object.
 *
 * @param o An object.
 * @returns {Array} An array of typed key/value pairs.
 */
export const objectEntries = <
  T extends Record<PropertyKey, unknown>,
  K extends keyof T,
  V extends T[K]
>(
  o: T
): [K, V][] => {
  return Object.entries(o) as [K, V][];
};

/**
 * Check for conflicting chunks in a string (i.e. code surrounded by `<<<<<<<` and `>>>>>>>`).
 *
 * @param content A string containing code that possibly includes conflicting chunks.
 * @returns {number[]} An array of indices representing the starting point for each conflicting
 *   chunk found in the string, or empty if clean.
 */
export const getConflictingChunks = (content: string): number[] => {
  const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
  return removeUndefined(
    Array.from(content.matchAll(conflictPattern)).map(m =>
      isDefined(m.index) ? m.index : undefined
    )
  );
};

/**
 * Converts a JavaScript Object Notation (JSON) string into a typed object.
 *
 * @param json A valid JSON string.
 * @returns {object} A typed object (or nested array of objects).
 */
export const deserialize = <T>(json: string): T => JSON.parse(json) satisfies T;

/**
 * Generic for partitioning an array into two disjoint arrays given a predicate function that
 * indicates whether an element should be in the passing subarray or failing subarray.
 *
 * @param array The given array of elements to partition.
 * @param predicate A predicate function that resolves to true if element `e` meets the inclusion
 *   requirements, and false otherwise.
 * @returns {[object[], object[]]} The resulting array of arrays where elements that passed the
 *   predicate are in the left subarray and elements that failed the predicate are in the right
 *   subarray.
 */
export const partition = <T>(array: T[], predicate: (e: T) => boolean): [T[], T[]] => {
  return array.reduce(
    (accumulator: [T[], T[]], item) =>
      predicate(item)
        ? (accumulator[0].push(item), accumulator)
        : (accumulator[1].push(item), accumulator),
    [[], []]
  );
};

/**
 * Generic for partitioning two arrays into the symmetric differences, also known as the disjunctive
 * union, and the intersection given a predicate that indicates whether an element should be in the
 * intersection subarray.
 *
 * @param array1 An array of elements.
 * @param array2 An array of elements.
 * @param predicate A predicate function that resolves to true if element `e1` from `array1` has a
 *   equivalent complement in `array2`, and false otherwise.
 * @returns {[object[], object[], object[]][]} The resulting array of arrays where symmetrically
 *   different elements from `array1` are in the left subarray, intersection subarray containing
 *   pairs of element `e1` from `array1` and the complementary element `e2` from `array2` in the
 *   center subarray, and the symmetrically different elements from `array2` are in the right
 *   subarray.
 */
export const symmetrical = <T, U>(
  array1: T[],
  array2: U[],
  predicate: (e1: T, e2: U) => boolean
): [left: T[], intersect: [T, U][], right: U[]] => {
  const intersection: [T, U][] = [];
  const leftComplement: T[] = array1.filter(t => {
    const match = array2.find(u => predicate(t, u));
    if (match) intersection.push([t, match]);
    return match ? false : true;
  });
  const rightComplement: U[] = array2.filter(u => !array1.some(t => predicate(t, u)));
  return [leftComplement, intersection, rightComplement];
};

/**
 * Filters an array and removes any undefined elements contained within it.
 *
 * @param array The given array of elements that should be filtered for undefined.
 * @returns {object[]} The resulting array devoid of any undefined elements.
 */
export const removeUndefined = <T>(array: (T | undefined)[]): T[] => {
  return array.filter((item): item is T => typeof item !== 'undefined');
};

/**
 * Remove property from object by immutably destructuring the object properties into a new object.
 *
 * @param obj The initial source object.
 * @param key The key of the property to be removed.
 * @returns {object} New object containing all properties except for the one associated with the
 *   key.
 */
export const removeObjectProperty = <T extends Record<PropertyKey, unknown>, K extends keyof T>(
  obj: T,
  key: K
): Omit<T, K> => {
  const { [key]: _removedProp, ...objRest } = obj; // eslint-disable-line @typescript-eslint/no-unused-vars
  return objRest;
};

/**
 * Generic for flattening and filtering an object given a set of filtering keys for inclusion in the
 * resulting object.
 *
 * @param obj An object containing key-value indexed fields.
 * @param keyFilter An array of keys that indicate which key-value pairs should be included.
 * @returns {object} The resulting object devoid of key-value fields that did not match the key
 *   filter, or an empty object if all fields were removed.
 */
export const filterObject = <T extends Record<PropertyKey, unknown>>(
  obj: T,
  keyFilter: string[]
): ReturnType<typeof flattenObject<T>> => {
  return objectEntries(flattenObject(obj))
    .filter(([k]) => typeof k === 'string' && keyFilter.includes(k))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
};

/**
 * Filters an object and removes properties that only resolve to nullable values (`undefined | null
 *
 * | void`), while also narrowing the property types to remove nullable types from any type unions.
 *
 * @param obj The given object containing key-value properties that should be filtered for nullable
 *   values.
 * @returns {object} The resulting object devoid of any nullable values.
 */
export const removeNullableProperties = <
  T extends Record<PropertyKey, unknown>,
  K extends keyof T,
  V extends T[K]
>(
  obj: T
): NonNullableObject<T> => {
  return objectEntries(obj)
    .filter((e): e is [K, NonNullable<V>] => isPresent(e[1]))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as NonNullableObject<T>);
};

/**
 * Generic for deduplicating array of elements given a comparator function that indicates whether a
 * pair of elements should be considered duplicates.
 *
 * @param arr An array of elements.
 * @param comparator A comparator function that indicates true if elements a and b are duplicate,
 *   and false otherwise.
 * @returns {object[]} The resulting array devoid of duplicate elements.
 */
export const removeDuplicates = <T>(arr: T[], comparator: (a: T, b: T) => boolean): T[] => {
  return arr.reduce((accumulator: T[], current) => {
    if (!accumulator.some(item => comparator(item, current))) accumulator.push(current);
    return accumulator;
  }, []);
};

/**
 * Generic for asynchronously filtering an array of elements given an async predicate function that
 * resolves to indicate whether an element should be considered for inclusion in the resulting
 * array.
 *
 * @param arr An array of elements.
 * @param predicate A predicate function that resolves to true if element `e` meets the filter
 *   inclusion requirements, and false otherwise.
 * @returns {Promise<object[]>} The resulting array devoid of elements that did not meet the
 *   predicate.
 */
export const asyncFilter = async <T>(
  arr: T[],
  predicate: (e: T) => Promise<boolean>
): Promise<T[]> => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
};

/**
 * Expand an array of path elements (i.e. a dot-format path such as `user.name`) into a successive
 * series of named objects that contain any subsequent path elements and/or the updated value.
 *
 * @param path An array of path elements ordered in sequence (i.e. `user.name.lastName` would be
 *   `[user, name, lastName]`).
 * @param value The value to insert or update at the specific path in the return object.
 * @returns {object} An object containing a key-value structure of embedded container objects
 *   according to the given path.
 */
export const objectifyPath = (
  path: Array<string | number>,
  value: string | boolean | number | undefined
): Record<string | number, unknown> => {
  const init = { [path[path.length - 1] as string | number]: value };
  return path.slice(0, -1).reduceRight((prev: Record<string | number, unknown>, curr) => {
    return { [curr]: prev };
  }, init);
};

/**
 * Compares two `Map` objects for equality; only supports `Map` and not objects with key-value pairs
 * (i.e. `const map: {[key: string]: value}`). Checks for same map sizes, then tests all underlying
 * key-value entries for equality between maps.
 *
 * @param map1 A `Map` object.
 * @param map2 A `Map` object.
 * @returns {boolean} A boolean indicating true if the `Map` objects are equal, or false otherwise.
 */
export const equalMaps = <K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean => {
  if (map1.size !== map2.size) return false;
  for (const [key, val] of map1) {
    const testVal = map2.get(key);
    if (
      JSON.stringify(testVal) !== JSON.stringify(val) ||
      (testVal === undefined && !map2.has(key))
    )
      return false;
  }
  return true;
};

/**
 * Compares two `Array` objects for equality. Checks for same array length, then tests all
 * underlying elements for equality between arrays.
 *
 * @param arr1 An `Array` object.
 * @param arr2 An `Array` object.
 * @returns {boolean} A boolean indicating true if the `Array` objects are equal, or false
 *   otherwise.
 */
export const equalArrays = <T>(arr1: Array<T>, arr2: Array<T>): boolean => {
  if (arr1.length != arr2.length) return false;
  for (let i = 0; i != arr1.length; i++) {
    if (JSON.stringify(arr1[i]) != JSON.stringify(arr2[i]) || arr1[i] === undefined) return false;
  }
  return true;
};

/**
 * Compares two objects for equality based on a filtered subset of properties. Checks for equality
 * on the provided properties only, enabling masked equality checks between complex objects.
 *
 * @param obj1 A JavaScript object.
 * @param obj2 A JavaScript object.
 * @param props An array of keys derived from the type definition of comparable objects.
 * @returns {boolean} A boolean indicating true if the objects are equal among all selected
 *   properties, or false otherwise.
 */
export const filteredObjectEquality = <T, K extends keyof T>(
  obj1: T,
  obj2: T,
  props: K[]
): boolean => {
  return props.every(p => obj1[p] === obj2[p]);
};

/**
 * Compares two arrays of object for equality based on a filtered subset of object properties.
 * Checks for equality on the provided properties only, enabling masked equality checks between
 * arrays of complex objects.
 *
 * @param arr1 An `Array` object containing JavaScript objects.
 * @param arr2 An `Array` object containing JavaScript objects.
 * @param props An array of keys derived from the type definition of comparable objects.
 * @returns {boolean} A boolean indicating true if all objects in both arrays are equal among all
 *   selected properties, or false otherwise.
 */
export const filteredArrayEquality = <T, K extends keyof T>(
  arr1: T[],
  arr2: T[],
  props: K[]
): boolean => {
  if (arr1.length != arr2.length) return false;
  for (let i = 0; i != arr1.length; i++) {
    const [a, b] = [arr1[i], arr2[i]];
    if (isDefined(a) && isDefined(b) && !filteredObjectEquality(a, b, props)) return false;
  }
  return true;
};

/**
 * Compares two `ArrayBufferLike` objects for equality; compatible objects include `TypedArray`,
 * `DataView`, and `Buffer`. However, `Buffer` has `.equals()` and `.compare()` functions for
 * comparisons and these should be used in lieu of this function. `TypedArray` is a class of
 * objects, which includes all of the following: `Int8Array`, `Uint8Array`, `Uint8ClampedArray`,
 * `Int16Array` ,`Int32Array`, `Uint32Array`, `Float32Array`, `Float64Array`, `BigInt64Array`,
 * `BigUint64Array`.
 *
 * @param buf1 An `ArrayBufferLike` object.
 * @param buf2 An `ArrayBufferLike` object.
 * @returns {boolean} A boolean indicating true if the `ArrayBufferLike` objects are equal, or false
 *   otherwise.
 */
export const equalArrayBuffers = (buf1: ArrayBufferLike, buf2: ArrayBufferLike): boolean => {
  if (buf1.byteLength != buf2.byteLength) return false;
  const dv1 = new Int8Array(buf1);
  const dv2 = new Int8Array(buf2);
  for (let i = 0; i != buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) return false;
  }
  return true;
};

/**
 * Convert a `Buffer` object into an `ArrayBuffer` object.
 *
 * @param buf A `Buffer` object representing binary data in the form of a sequence of bytes.
 * @returns {ArrayBuffer} A new `ArrayBuffer` object containing a copy of all data in `Buffer`
 *   object.
 */
export const toArrayBuffer = (buf: Buffer): ArrayBuffer => {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; i++) {
    view[i] = buf[i] as number;
  }
  return ab;
};

/**
 * Generates a pseudo-random number bounded by inclusive minimum and maximum bounds. Reused from:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values_inclusive
 *
 * @param min Minimum range value.
 * @param max Maximum range value.
 * @returns {number} A pseudo-random number between `min` and `max` (inclusive).
 */
export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Scheduled execution of a one-time no-op callback after a delay of `ms` milliseconds. Since this
 * relies on [`setTimeout()`](https://nodejs.org/api/timers.html#settimeoutcallback-delay-args) from
 * Node.js, we do not guarantee the exact timing of when the callback will fire, nor of their
 * ordering. The callback will be called as close as possible to the time specified.
 *
 * @param ms The number of milliseconds to wait before callback returns.
 * @returns {Promise<unknown>} A Promise object containing a no-op callback.
 */
export const delay = (ms: number): Promise<unknown> =>
  new Promise(resolve => setTimeout(resolve, ms));
