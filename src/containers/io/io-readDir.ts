import * as fs from 'fs-extra';
import * as path from 'path';
import { flattenArray } from '../flatten';
import { isDirectory } from './io-isDirectory';

/**
 * Asynchronously read filenames contained within a target directory.
 * @param filepath A valid directory path to read from.
 * @returns {Promise<string[]>} A Promise object for an array of filenames. Throws ENOENT error on
 * non-existent filepath, and ENOTDIR error on a filepath pointing to a file.
 */
export const readDirAsync = (filepath: fs.PathLike): Promise<string[]> => {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(path.resolve(filepath.toString()), (error, files) => {
      if (error) reject(error);
      else resolve(files);
    });
  });
};

/**
 * Asynchronously and recursively descends from a root directory to read filenames and child directories.
 * Descends to `depth` level, if specified, otherwise defaults to recursively visiting all sub-directories.
 * @param filepath A valid directory path to read from.
 * @param depth Number of sub-directories to descend; defaults to infinity.
 * @returns {Promise<string[]>} A Promise object for an array of filenames. Throws ENOENT error on
 * non-existent filepath, and ENOTDIR error on a filepath pointing to a file.
 */
export const readDirAsyncDepth = async (
  filepath: fs.PathLike,
  depth = Infinity
): Promise<string[]> => {
  const files = await Promise.all(
    (
      await fs.readdir(filepath.toString())
    ).map(async f => {
      const fullPath = path.join(filepath.toString(), f);
      return depth > 1 && (await isDirectory(fullPath))
        ? await readDirAsyncDepth(fullPath, depth - 1)
        : fullPath;
    })
  );
  return [...flattenArray(files), filepath.toString()];
};
