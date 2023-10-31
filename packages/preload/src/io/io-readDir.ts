import {type PathLike, readdir} from 'fs-extra';
import {join, resolve as resolvePath} from 'path';
import {isDirectory} from './io-isDirectory';
import {flattenArray} from '../flatten';

/**
 * Asynchronously read filenames contained within a target directory.
 *
 * @param filepath A valid directory path to read from.
 * @returns {Promise<string[]>} A Promise object for an array of filenames. Throws ENOENT error on
 *   non-existent filepath, and ENOTDIR error on a filepath pointing to a file.
 */
export const readDirAsync = (filepath: PathLike): Promise<string[]> => {
  return new Promise<string[]>((resolve, reject) => {
    readdir(resolvePath(filepath.toString()), (error, files) => {
      if (error) reject(error);
      else resolve(files);
    });
  });
};

/**
 * Asynchronously and recursively descends from a root directory to read filenames and child
 * directories. Descends to `depth` level, if specified, otherwise defaults to recursively visiting
 * all sub-directories.
 *
 * @param filepath A valid directory path to read from.
 * @param depth Number of sub-directories to descend; defaults to infinity.
 * @returns {Promise<string[]>} A Promise object for an array of filenames. Throws ENOENT error on
 *   non-existent filepath, and ENOTDIR error on a filepath pointing to a file.
 */
export const readDirAsyncDepth = async (
  filepath: PathLike,
  depth = Infinity,
): Promise<string[]> => {
  const files = await Promise.all(
    (
      await readdir(filepath.toString())
    ).map(async f => {
      const fullPath = join(filepath.toString(), f);
      return depth > 1 && (await isDirectory(fullPath))
        ? await readDirAsyncDepth(fullPath, depth - 1)
        : fullPath;
    }),
  );
  return [...flattenArray(files), filepath.toString()];
};
