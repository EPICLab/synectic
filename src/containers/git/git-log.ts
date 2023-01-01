import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';
import { CommitObject } from '../../store/types';
import { execute, isDefined } from '../utils';
import { revParse } from './git-rev-parse';

/**
 * Show commit logs. List commits that are reachable by following the parent links from the given commit(s), but exclude commits that are 
 * reachable from the one(s) given with a ^ in front of them. The output is given in reverse chronological order by default. 
 * 
 * You can think of this as a set operation. Commits reachable from any of the commits given on the command line form a set, and then 
 * commits reachable from any of the ones given with ^ in front are subtracted from that set. The remaining commits are what comes out 
 * in the command’s output. Various other options and paths parameters can be used to further limit the result.
 * 
 * Thus, the following command:
 * ```
 * $ git log foo bar ^baz
 * ```
 * 
 * means "list all the commits which are reachable from foo or bar, but not from baz".
 * 
 * A special notation `"<commit1>..<commit2>"` can be used as a short-hand for `"^<commit1> <commit2>"`. For example, either of the 
 * following may be used interchangeably:
 * ```
 * $ git log origin..HEAD
 * $ git log HEAD ^origin
 * ```
 * 
 * Another special notation is `"<commit1>...<commit2>"` which is useful for merges. The resulting set of commits is the symmetric 
 * difference between the two operands. The following two commands are equivalent:
 * ```
 * $ git log A B --not $(git merge-base --all A B)
 * $ git log A...B
 * ```
 * 
 * The command takes options applicable to the `git-rev-list` command to control what is shown and how, and options applicable to the 
 * `git-diff` command to control how the changes each commit introduces are shown.
 * 
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.revRange - The revision range (or just SHA-1 commit hash) to begin walking backwards through the history from.
 * @param obj.maxCount - Optional limit of the number of commits to output; defaults to infinity.
 * @param obj.until - Optional threshold to limit commits older than a specific date.
 * @param obj.paths - Optional simplication for only including commits modifying the given paths.
 * @returns {Promise<string>} A Promise object containing an array of {@link CommitObject} objects
 * representing commit information.
 */
export const log = async ({
    dir, revRange, maxCount, until,
}: {
    dir: PathLike;
    revRange?: string;
    maxCount?: number;
    until?: DateTime;
    paths?: PathLike[];
}): Promise<CommitObject[]> => {
    const maxCountOption = maxCount ? `--max-count=${maxCount}` : '';
    const untilOption = until ? `--until=${until.toHTTP()}` : '';
    const revOption = revRange ?? '';
    const output = await execute(`git log ${maxCountOption} ${untilOption} ${revOption}`, dir.toString());
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
     * [6] commit message (e.g. `Bump dot-prop from 6.0.1 to 7.2.0 (#1070)`)
     */
    const linePattern = new RegExp('^(?:commit )(\\w*)(?:(?: \\()(.*?)(?:\\)))?(?:\\r?\\nAuthor: )(.*?)(?:<)(.*)?(?:>)(?:\\r?\\nDate: {3})(.*)(?:\\r?\\n){2} {4}(.*)$', 'gm');

    return (await Promise.all(Array.from(output.matchAll(linePattern), async line => {
        const oid = line[1];
        // line[2] contains refs that are not currently being used
        const authorName = line[3];
        const authorEmail = line[4];
        const timestamp = line[5];
        const message = line[6];
        const parentRevs = oid ?? (await revParse({ dir: dir, args: `${oid}^@` }));
        const parents = parentRevs !== undefined ? parentRevs.split(/\r?\n/) : [];
        return oid && message ? {
            oid: oid,
            message: message,
            parents: parents,
            author: {
                name: authorName ?? '',
                email: authorEmail ?? '',
                timestamp: timestamp ? DateTime.fromRFC2822(timestamp).valueOf() : undefined,
            },
        } : undefined;
    }))).filter(isDefined);
};