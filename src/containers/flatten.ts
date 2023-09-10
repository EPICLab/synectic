export type ArrayElementType<T> = T extends Array<infer U> ? ArrayElementType<U> : T;
export type ObjectElementType<T> = T extends Record<string | number | symbol, infer U>
  ? ObjectElementType<U>
  : T;

/**
 * Flattens an n-depth array into a single level array containing all sub-array elements. Solutions
 * for the problem of flattening n-depth arrays in JavaScript are fairly simple, but the TypeScript
 * compiler requires closed type guarding in order to bubble up sub-types from within the sub-array
 * elements. Luckily, TypeScript 4.1 includes recursive conditional types (
 * [TS4.1 Recursive Conditional Types](https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/#recursive-conditional-types)),
 * which allows for deferred type checking while recursive sub-typing resolves the type
 * intersections for individual element depths. Some type casting is required (but should be
 * type-safe) in order to handle the gradual typing of `<unknown>` within the reducer function, but
 * this is an issue that could be solved in the future if TypeScript adds gradual inferred typing.
 *
 * Originally, this solution was a partial type enhancement that resulted in a `<any[]>`-typed
 * return array. This previous solution was type-aware and used an efficient recursive reduce
 * function in order to prevent non-array inputs, but could only guarantee that the output is an
 * array (prior to TS 4.1, we could not recursively infer the types of each sub-array and bubble
 * those types up to a combined intersection type). This solution was originally posted by
 * [`@maroun-baydoun`](@link https://qiita.com/maroun-baydoun/items/dbd65b56b3ef2365f583).
 * @param arr Array containing primitive values, objects, and other arrays.
 * @returns {ArrayElementType[]} Array of depth 1, containing all sub-array elements.
 */
export const flattenArray = <T extends unknown[]>(arr: T): ArrayElementType<T>[] => {
  const reducer = (prev: ArrayElementType<T>[], curr: unknown): ArrayElementType<T>[] => {
    return Array.isArray(curr)
      ? (curr as ArrayElementType<T>[]).reduce(reducer, prev)
      : [...prev, curr as ArrayElementType<T>];
  };
  return arr.reduce<ArrayElementType<T>[]>(reducer, []);
};

/**
 * Flattens an n-depth object into a single level object containing all sub-object elements. When
 * flattening key-value pairs that contain an object value, it is necessary to discard the key name
 * of the outer container object and only hoist the inner pair. Some type casting is required (but
 * should be type-safe) in order to handle the gradual typing of results from square bracket
 * property accessors.
 * @param obj Object containing key-value pairs that point to primitives, arrays, and other objects.
 * @returns {Record<string | number | symbol, ObjectElementType>} d Object of depth 1, containing
 * all sub-object elements (excluding keys for container objects).
 */
export const flattenObject = <T extends Record<string | number | symbol, unknown>>(
  obj: T
): Record<string | number | symbol, ObjectElementType<T>> => {
  const flattened: Record<string, ObjectElementType<T>> = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(flattened, flattenObject(obj[key] as Record<string, ObjectElementType<T>>));
    } else {
      flattened[key] = obj[key] as ObjectElementType<T>;
    }
  });
  return flattened;
};
