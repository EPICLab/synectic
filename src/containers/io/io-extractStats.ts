import * as fs from 'fs-extra';

/**
 * Extracts the file stats information from the filepath. Returns an [`fs.Stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats)
 * class object.
 *
 * @param filepath The relative or absolute path to evaluate.
 * @returns {Promise<fs.Stats | undefined>} A Promise object for a fs.Stats object containing information about
 * a file, or undefined if filepath refers to a nonexistent file or directory (or read permissions are missing).
 */

export const extractStats = (filepath: fs.PathLike): Promise<fs.Stats | undefined> => {
  return new Promise<fs.Stats | undefined>(resolve => {
    fs.stat(filepath.toString())
      .then(stat => resolve(stat))
      .catch(() => resolve(undefined));
  });
};
