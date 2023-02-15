import { PathLike } from 'fs-extra';
import { execute } from '../utils';

type RevParseOption = 'isBareRepository' | 'isShallowRepository' | 'abbrevRef';

/**
 * Pick out and massage parameters for accessing porcelainish commands.
 * 
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.options - The options fo distinguishing particular parameters.
 * @param obj.args - Flags and parameters to be parsed.
 * @returns {Promise<string | undefined>} A Promise object containing a string version of the output results,
 * or `undefined` if execute failed.
 */
export const revParse = async ({
    dir, options, args
}: {
    dir: PathLike;
    options?: RevParseOption[];
    args?: string;
}): Promise<string | undefined> => {
    const opts = options?.map(option => processRevParseOption(option)).join(' ') ?? '';
    const output = await execute(`git rev-parse ${opts} ${args ?? ''}`, dir.toString());
    // execute output can result in `{ stdout: undefined, stderr: undefined }`
    if (output.stderr !== undefined && output.stderr.length > 0) console.error(output.stderr);
    return output.stdout;
}

const processRevParseOption = (option: RevParseOption) => {
    switch (option) {
        case 'isBareRepository': {
            return '--is-bare-repository';
        }
        case 'isShallowRepository': {
            return '--is-shallow-repository';
        }
        case 'abbrevRef': {
            return '--abbrev-ref'
        }
        default: {
            return '';
        }
    }
}