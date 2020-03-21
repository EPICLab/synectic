/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Flattens an n-depth array into a single level array containing all sub-array elements. Solutions for the problem of 
 * flattening n-depth arrays in JavaScript are fairly simple, but the TypeScript compiler requires closed type guarding
 * and cannot currently resolve infinite recursive typing (@link https://github.com/Microsoft/TypeScript/issues/3496). 
 * For JavaScript, the most cannonical solution would be to use Array.prototype.flat() function included in Node.js 
 * v11.0.0+ (@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat). 
 * However, using this solution in TypeScript results in a <any> typed return object. 
 * 
 * The following solution is type-aware and uses an efficient recursive reduce function. The array uses types to 
 * prevent non-array inputs, but can only guarantee that the output is an array (until we can recursively infer
 * the types of each sub-array and bubble those types up to a combined intersection type). This solution was 
 * originally posted by @maroun-baydoun (@link https://qiita.com/maroun-baydoun/items/dbd65b56b3ef2365f583).
 * @param arr Array containing primitive values, objects, and other arrays.
 * @return Array of depth 1, containing all sub-array elements.
 */
export const flatten = <T = any>(arr: T[]) => {
  const reducer = <T = any>(prev: T[], curr: T | T[]): any => {
    if (!Array.isArray(curr)) {
      return [...prev, curr];
    }
    return curr.reduce(reducer, prev);
  };
  return arr.reduce(reducer, []) as any[];
};