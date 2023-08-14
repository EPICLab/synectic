import { PathLike } from 'fs-extra';
import execute from '../exec';

type RevParseOption = 'verify' | 'isBareRepository' | 'isShallowRepository' | 'abbrevRef';

/**
 * Pick out and massage parameters for accessing porcelainish commands.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.opts - The options fo distinguishing particular parameters.
 * @param obj.args - Flags and parameters to be parsed.
 * @returns {Promise<string | undefined>} A Promise object containing a string version of the output results,
 * or `undefined` if execute failed. If `verify` option is used, this becomes `true`/`false` strings.
 */
export const revParse = async ({
  dir,
  opts,
  args
}: {
  dir: PathLike;
  opts?: RevParseOption[];
  args?: string[];
}): Promise<string | undefined> => {
  const options = opts?.map(opt => processRevParseOption(opt)) ?? [];
  const argument = args ?? [];

  const output = await execute({
    command: 'git',
    args: ['rev-parse', ...options, ...argument],
    cwd: dir.toString()
  });
  if (output.stderr) {
    if (options.includes('--verify')) return 'false';
    console.error(output.stderr);
  }
  if (options.includes('--verify')) return 'true';
  if (output.stdout) return output.stdout.trim();
  return undefined;
};

const processRevParseOption = (option: RevParseOption) => {
  switch (option) {
    case 'isBareRepository': {
      return '--is-bare-repository';
    }
    case 'isShallowRepository': {
      return '--is-shallow-repository';
    }
    case 'abbrevRef': {
      return '--abbrev-ref';
    }
    case 'verify': {
      return '--verify';
    }
  }
};
