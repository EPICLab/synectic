/**
 * Expand and flatten nested types; which has the side effect that IntelliSense will pull up any
 * nested subtypes and expand them into a single type for cleaner type debugging. Reused from:
 * https://www.youtube.com/shorts/2lCCKiWGlC0
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {}; // eslint-disable-line @typescript-eslint/ban-types

/**
 * Expand object types one level deep; which has the side effect that IntelliSense will infer the
 * resolved type of a complex type (i.e. types that use TS Utility Types). Reused from:
 * https://stackoverflow.com/a/57683652
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * Expand object types recursively; which has the side effect that IntelliSense will infer the
 * resolved type of a complex type (i.e. types that use TS Utility Types). Reused from:
 * https://stackoverflow.com/a/57683652
 */
export type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

/**
 * Extract keys from all leaf properties in an object and converts them into a tuple of string
 * literals. For example, `{ a: number; b: { c: string; d: { e: string; }; }; }` would be turned
 * into the type `["a", "c", "e"]`. This function uses mapped types, conditional types, lookup
 * types, and recursive typing to accomplish this conversion. Inspired by:
 * https://stackoverflow.com/a/68244131
 */
export type NestedKeys<T extends object> = ExpandRecursively<
  {
    [K in Exclude<keyof T, symbol>]: T[K] extends object ? NestedKeys<T[K]> : `${K}`;
  }[Exclude<keyof T, symbol>]
>;

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;
/**
 * Extract dot-prefixed path keys from all leaf properties in and object and converts them into a
 * tuple of string literals. For example, `{ a: number; b: { c: string; d: { e: string; }; }; }`
 * would be turned into the type `["a", "b.c", "b.d.e"]`. This function is similar to
 * {@link NestedKeys}, but accomplishes the results through recursive descent and infering the
 * resulting paths. Inspired by: https://stackoverflow.com/a/68404823
 */
export type NestedDotKeys<T> = (
  T extends object
    ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<NestedDotKeys<T[K]>>}` }[Exclude<
        keyof T,
        symbol
      >]
    : ''
) extends infer D
  ? Extract<D, string>
  : never;

/**
 * Requires all properties in U to override types in the intersection of T & U. Reused from:
 * https://dev.to/vborodulin/ts-how-to-override-properties-with-type-intersection-554l
 */
export type Override<T, U> = Omit<T, keyof U> & U;

/**
 * Requires all properties to be nullable (i.e. `null` or `undefined` or `void`); the inverse of
 * `NonNullable<T>`. Inspired by:
 * https://javascript.plainenglish.io/typescript-advanced-mapped-and-conditional-types-2d10c96042fe
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null | undefined;
};

/**
 * Requires all properties in T to be non-nullable; either through type narrowing to exclude
 * nullable types or excluding the property entirely when it resolves to only nullable types
 * (`undefined | null | void`). Inspired by: https://stackoverflow.com/a/69338644
 */
export type NonNullableObject<T extends object> = {
  [P in keyof T]: Exclude<T[P], null | undefined | void>;
};

/**
 * Requires at least one type property, similar to `Partial<T>` but excludes the empty object.
 * Inspired by:
 * https://stackoverflow.com/questions/48230773/how-to-create-a-partial-like-that-requires-a-single-property-to-be-set/48244432#48244432
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

/**
 * Requires exactly one type property in an object, no more and no less. Inspired by:
 * https://github.com/sindresorhus/type-fest/blob/main/source/require-exactly-one.d.ts
 */
export type ExactlyOne<T, U extends keyof T = keyof T> = {
  [K in U]: Required<Pick<T, K>> & Partial<Record<Exclude<U, K>, never>>;
}[U] &
  Omit<T, U>;

/**
 * From T, set as required all properties whose keys are in the union K Inspired by:
 * https://github.com/bkinseyx/testing-react-redux-toolkit/blob/610c8a676b7e799ea20047bf46dc35c47b3b988b/src/utils/types.ts
 */
export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * From T, set as optional all properties whose keys are in the union K Inspired by:
 * https://github.com/bkinseyx/testing-react-redux-toolkit/blob/610c8a676b7e799ea20047bf46dc35c47b3b988b/src/utils/types.ts
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * From T, set the value to never and optional for all properties that are exclusive to T (i.e. are
 * not assignable to U). Reused from:
 * https://github.com/ts-essentials/ts-essentials/blob/e0307a2e54bb6ae55666dfe434f840ccfc04e0c5/lib/types.ts
 */
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

/**
 * Require type to exclusively match either T or U, but not both. This is a `mutually exclusive or`
 * (XOR) operation between types. Reused from:
 * https://github.com/ts-essentials/ts-essentials/blob/e0307a2e54bb6ae55666dfe434f840ccfc04e0c5/lib/types.ts
 * Inspired from: https://github.com/Microsoft/TypeScript/issues/14094
 */
export type Either<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export type GitProgressEvent = {
  phase: string;
  loaded: number;
  total: number;
};

export type ProgressCallback = (progress: GitProgressEvent) => void | Promise<void>;
