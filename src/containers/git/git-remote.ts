import { PathLike } from 'fs-extra';
import { isDefined, removeUndefined, removeNullableProperties } from '../utils';
import { execute } from '../exec';

export type RemoteOutput = {
  remote: string;
  url?: URL | PathLike;
  type?: 'fetch' | 'push';
};

const isRemoteType = (type: string | undefined): type is 'fetch' | 'push' => {
  return type === 'fetch' || type === 'push';
};

/**
 * Manage the set of remote repositories whoe branches are tracked.
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.verbose - More verbose output that includes remote URL and type.
 * @returns {Promise<ReturnType<typeof processRemoteOutput>>} A Promise object containing an array of
 * {@link RemoteOutput} objects representing tracked repositories.
 */
export const getRemote = async ({
  dir,
  verbose = false
}: {
  dir: PathLike;
  verbose?: boolean;
}): Promise<ReturnType<typeof processRemoteOutput>> => {
  const options = removeUndefined([verbose ? '--verbose' : undefined]).join(' ');

  const output = await execute(`git remote ${options}`, dir.toString());
  if (output.stderr.length > 0) console.error(output.stderr);
  return processRemoteOutput(output.stdout);
};

export const processRemoteOutput = (output: string): RemoteOutput[] => {
  const result: RemoteOutput[] = output
    .split(/\r?\n/)
    .map(line => {
      /**
       * Regex pattern matches with the following capture groups:
       * [1] remote name
       * [2] remote URL (or path if locally hosted)
       * [3] remote type (`fetch` or `pull`)
       */
      const linePattern = new RegExp('^(\\S*)(?:\\t(\\S*))?(?: \\((\\S*)\\))?', 'g');

      const lineResult = linePattern.exec(line);
      const name = lineResult?.[1];
      const url = lineResult?.[2];
      const type = lineResult?.[3];
      return name
        ? {
            remote: name,
            ...removeNullableProperties({ url: url, type: isRemoteType(type) ? type : undefined })
          }
        : undefined;
    })
    .filter(isDefined);
  return result;
};
