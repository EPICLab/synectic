import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';
import { CommitObject, SHA1 } from '../../store/types';
import { isNumber } from '../utils';
import { execute } from '../exec';

/**
 * Provide content or type and size information for repository objects.
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.objectRef - The name of the object to show.
 * @param obj.exists - Return with zero status if `objectRef` exists and is a valid object. If `objectRef` is of an invalid format exit
 * with non-zero and emits an error on stderr.
 * @param obj.pretty - Pretty-print the contents of `objectRef` based on its type.
 * @returns {Promise<CommitObject | undefined>} A Promise object containing a {@link CommitObject} object representing the
 * contents of the `objectRef`` based on its type.
 */
export const catFile = async ({
  dir,
  objectRef,
  exists = false,
  pretty = false
}: {
  dir: PathLike;
  objectRef: SHA1;
  exists?: boolean;
  pretty?: boolean;
}): Promise<CommitObject | undefined> => {
  const type = exists ? '-e' : pretty ? '-p' : '';
  const output = await execute(`git cat-file ${type} ${objectRef.toString()}`, dir.toString());

  if (output.stderr.length > 0) {
    console.error(output.stderr);
    return undefined;
  }
  return processCatFileOutput(output.stdout);
};

export const processCatFileOutput = (output: string): CommitObject | undefined => {
  /**
   * Regex pattern matches with the following capture groups:
   * [1] tree SHA1 hash (e.g. `8aad4dcd6aea0b8be81727e2aa957a65f08c4e4e`)
   * [2] parent SHA1 hashes, possibly muliple (e.g. `parent 8c15dc790f09eb1ace54e675bce092c8a5de361c`)
   * [3] author name
   * [4] author email
   * [5] author timestamp (Unix timestamp in seconds, with timezone offset)
   * [6] committer name
   * [7] committer email
   * [8] committer timestamp (Unix timestamp in seconds, with timezone offset)
   * [9] commit message (e.g. `Merge branch 'feature' into main`)
   */
  const linePattern = new RegExp(
    '^(?:tree (.*)\\r?\\n)((?:parent \\w*\\r?\\n)+)?(?:author (?:(.*?) \\<(.*?)\\> (\\d*) (-\\d*))\\r?\\n)(?:committer (?:(.*?) \\<(.*?)\\> (.*))\\r?\\n)?(?:\\r?\\n(.*))$',
    'gm'
  );

  /**
   * Regex pattern matches (possibly multiple matches) with the following capture groups:
   * [1] parent SHA1 hash (e.g. `4796a15ce2b758a86297ab40f90d89cea5a5e499`)
   */
  const parentPattern = new RegExp('parent (.*?)\\r?\\n', 'gm');

  const lineResult = linePattern.exec(output);
  const tree = lineResult?.[1];
  const parentRefs = lineResult?.[2];
  const parentResult = parentRefs ? parentPattern.exec(parentRefs) : undefined;
  const parents = parentResult ? Array.from(parentResult) : undefined;
  const authorName = lineResult?.[3];
  const authorEmail = lineResult?.[4];
  const authorTimestampRaw = lineResult?.[5];
  const authorTimestamp =
    authorTimestampRaw && isNumber(authorTimestampRaw)
      ? DateTime.fromSeconds(Number(authorTimestampRaw)).valueOf()
      : undefined;
  const committerName = lineResult?.[6];
  const committerEmail = lineResult?.[7];
  const committerTimestampRaw = lineResult?.[8];
  const committerTimestamp =
    committerTimestampRaw && isNumber(committerTimestampRaw)
      ? DateTime.fromSeconds(Number(committerTimestampRaw)).valueOf()
      : undefined;
  const message = lineResult?.[9];

  return tree
    ? {
        oid: tree,
        message: message ?? '',
        parents: parents ?? [],
        author: {
          name: authorName ?? '',
          email: authorEmail ?? '',
          timestamp: authorTimestamp
        },
        committer: {
          name: committerName ?? '',
          email: committerEmail ?? '',
          timestamp: committerTimestamp
        }
      }
    : undefined;
};
