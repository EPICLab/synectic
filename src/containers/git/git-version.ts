import execute from '../exec';
import { coerce, satisfies } from 'semver';

/**
 * Check for a locally installed version of git and verify that it satisfies a minimum version for specific functionality.
 * @param range A range comparator string (satisfying {@link https://github.com/npm/node-semver#ranges node-semver#ranges} format).
 * @param verbose Optional flag to provide feedback messages in `console.log` on success; errors are always shown in `console.error`.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether git is installed and has a version that
 * satisfies the provided version range.
 */
export const checkGitVersion = async (range: string, verbose = false): Promise<boolean> => {
  const output = await execute({ command: 'git', args: ['version'] });
  if (output.stderr) {
    console.error(output.stderr);
    return false;
  }

  const version = coerce(output.stdout);
  if (!version) {
    console.error(`unable to detect git installation...`);
    return false;
  }

  const satisfied = satisfies(version, range);
  if (!satisfied)
    console.error(`git version ${version.version} does not meet minimum range ${range}`);
  if (verbose && satisfied)
    console.log(`git version ${version.version} satisfies minimum range ${range}`);
  return satisfied;
};
