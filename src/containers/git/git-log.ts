import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';
import { CommitObject } from '../../store/types';
import { execute, isDefined } from '../utils';
import { revParse } from './git-rev-parse';

/**
 * Show commit logs.
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.ref - The commit to begin walking backwards through the history from.
 * @param obj.maxCount - Optional limit of the number of commits to output; defaults to infinity.
 * @param obj.until - Optional threshold to limit commits older than a specific date.
 * @param obj.paths - Optional simplication for only including commits modifying the given paths.
 * @returns {Promise<string>} A Promise object containing an array of {@link CommitObject} objects
 * representing commit information.
 */
export const log = async ({
    dir, ref, maxCount = Infinity, until,
}: {
    dir: PathLike;
    ref?: string;
    maxCount?: number;
    until?: DateTime;
    paths?: PathLike[];
}): Promise<CommitObject[]> => {
    const maxCountOption = maxCount ? `--max-count=${maxCount}` : '';
    const untilOption = until ? `--until=${until.toHTTP()}` : '';
    const refOption = ref ?? '';
    const output = await execute(`git log ${maxCountOption} ${untilOption} ${refOption}`, dir.toString());

    if (output.stderr.length > 0) console.error(output.stderr);
    return processLogOutput(output.stdout, dir);
};

export const processLogOutput = async (output: string, dir: PathLike): Promise<CommitObject[]> => {
    /**
     * Regex patterns that matches the following capture groups:
     * [1] sha1 hash for the commit (e.g. `e629b39c2`)
     * [2] list of branch refs pointing to this commit (e.g. `HEAD -> main, origin/main, origin/HEAD, good-branch`)
     * [3] author name
     * [4] author email
     * [5] timestamp for commit (in RFC2822 format, including timezone offset)
     */
    const linePattern = new RegExp('^(?:commit )(\\w*)(?:(?: \\()(.*?)(?:\\)))?(?:\\r?\\nAuthor: )(.*?)(?:<)(.*)?(?:>)(?:\\r?\\nDate: {3})(.*)$', 'gm');

    return (await Promise.all(Array.from(output.matchAll(linePattern), async line => {
        const oid = line[1];
        // line[2] contains refs that are not currently being used
        const authorName = line[3];
        const authorEmail = line[4];
        const timestamp = line[5];
        const message = line[6];
        const parents = oid ? (await revParse({ dir: dir, args: `${oid}^@` })).split(/\r?\n/) : [];
        return oid && message ? {
            oid: oid,
            message: message,
            parents: parents,
            author: {
                name: authorName ?? '',
                email: authorEmail ?? '',
                timestamp: timestamp ? DateTime.fromRFC2822(timestamp) : undefined,
            },
        } : undefined;
    }))).filter(isDefined);
};