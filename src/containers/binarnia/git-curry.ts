/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** @deprecated */
type PartialTuple<TUPLE extends any[], EXTRACTED extends any[] = []> =
    TUPLE extends [infer NEXT_PARAM, ...infer REMAINING] ?
    PartialTuple<REMAINING, [...EXTRACTED, NEXT_PARAM?]> :
    [...EXTRACTED, ...TUPLE];

/** @deprecated */
type PartialParameters<FN extends (...args: any[]) => any> = PartialTuple<Parameters<FN>>;

/** @deprecated */
type RemainingParameters<PROVIDED extends any[], EXPECTED extends any[]> =
    EXPECTED extends [infer E1, ...infer EX] ?
    PROVIDED extends [infer P1, ...infer PX] ?
    RemainingParameters<PX, EX> : EXPECTED : [];

/** @deprecated */
type CurriedFunction<PROVIDED extends any[], FN extends (...args: any[]) => any> =
    <NEW_ARGS extends PartialTuple<
        RemainingParameters<PROVIDED, Parameters<FN>>
    >>(...args: NEW_ARGS) =>
        CurriedFunctionOrReturnValue<[...PROVIDED, ...NEW_ARGS], FN>;

/** @deprecated */
type CurriedFunctionOrReturnValue<PROVIDED extends any[], FN extends (...args: any[]) => any> =
    RemainingParameters<PROVIDED, Parameters<FN>> extends [any, ...any[]] ?
    CurriedFunction<PROVIDED, FN> :
    ReturnType<FN>;

/**
 * @deprecated This implementation is an internal rewrite of the `binarnia` package into TypeScript, please use `git ls-files` or 
 * similar functionality found in the `containers/git/*` directory.  
 * @param targetFn - X
 * @param existingArgs - X
 * @returns {CurriedFunction} X
 */
export const curry = <
    FN extends (...args: any[]) => any,
    STARTING_ARGS extends PartialParameters<FN>
>(targetFn: FN, ...existingArgs: STARTING_ARGS): CurriedFunction<STARTING_ARGS, FN> => {
    return (...args) => {
        const totalArgs = [...existingArgs, ...args];
        if (totalArgs.length >= targetFn.length) {
            return targetFn(...totalArgs);
        }
        return curry(targetFn, ...totalArgs as PartialParameters<FN>);
    };
}