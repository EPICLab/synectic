import { PathLike, Stats, stat } from 'fs-extra';

/**
 * Extracts the file stats information from the filepath. Returns an
 * [`fs.Stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats) class object and injects a `isDir`
 * field for use in contexts without FS access (i.e. `renderer` processes); contains the same
 * information as if calling `fs.stat().isDirectory()`.
 *
 * @param filepath The relative or absolute path to evaluate.
 * @returns {Promise<Stats | undefined>} A Promise object for a fs.Stats object containing
 *   information about a file, or undefined if filepath refers to a nonexistent file or directory
 *   (or read permissions are missing).
 */
export const extractStats = (
  filepath: PathLike
): Promise<(Stats & { isDir: boolean }) | undefined> => {
  return stat(filepath.toString())
    .then(stat => ({ ...stat, isDir: stat.isDirectory() }))
    .catch(() => undefined);
};
