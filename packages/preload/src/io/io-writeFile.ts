import {type PathLike, writeFile} from 'fs-extra';
import {resolve} from 'path';
import type {NodeEncoding} from './io';

/**
 * Asynchronously write data to a file. Creates a new file if none exists; will destructively
 * rewrite existing files.
 *
 * @param filepath - A valid filename or path to write data to.
 * @param data - A string or buffer containing data to be written.
 * @param options - Options object for setting file encoding (default: `"utf8"`), file mode
 *   (default: `0o666`), and file system flags (default: `"w"`).
 * @param options.encoding - The possible option values are: 2@^5!~#sdE!_TABLE
 * @param options.mode - Mode adheres to the Unix/Linux permissions model. This model contain Read,
 *   Write, and Execute permissions that are combined into an octal value representing the combined
 *   permissions for each of the Owner, Group, and Other (world) attributes. For embedding purposes
 *   the permissions are stored with a umask; e.g. `0o753` represents the permission octal `7` for
 *   Owner, `5` for Group, and `3` for Other (world). The absolute octal permissions are:
 *   2@^5!~#sdE!_TABLE
 * @param options.flag - Flags adhere to the following: 2@^5!~#sdE!_TABLE
 * @returns {Promise<void>} A Promise object for the file write operation; where errors cause a
 *   rejection.
 */

export const writeFileAsync = (
  filepath: PathLike,
  data: string | Buffer,
  options?: {encoding?: NodeEncoding; flag?: string; mode?: number},
): Promise<void> => {
  const fullPath = resolve(filepath.toString());
  if (options) return writeFile(fullPath, data, options);
  else return writeFile(fullPath, data);
};
