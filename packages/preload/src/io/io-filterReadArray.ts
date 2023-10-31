import type {PathLike} from 'fs-extra';
import {isDirectory} from './io-isDirectory';

/**
 * Asynchronously filter for either directories or files from an array of both. Returns filepaths of
 * all child directories (default), or all child files if `fileOnly` option is enabled.
 *
 * @param filepaths Array containing filepaths for directories and files.
 * @param fileOnly Flag for returning only filepaths for files; defaults to false.
 * @returns {Promise<PathLike[]>} A Promise object for an array containing filepaths for either all
 *   child directories or all child files.
 */

export const filterReadArray = async (
  filepaths: PathLike[],
  fileOnly = false,
): Promise<PathLike[]> => {
  return await filepaths.reduce(
    async (previousPromise: Promise<PathLike[]>, filepath: PathLike) => {
      const collection = await previousPromise;
      const directory = await isDirectory(filepath);
      if (fileOnly && !directory) collection.push(filepath);
      if (!fileOnly && directory) collection.push(filepath);
      return collection;
    },
    Promise.resolve([]),
  );
};
