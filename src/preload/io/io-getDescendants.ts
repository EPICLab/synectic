import { PathLike } from 'fs-extra';
import { filterIgnore } from '../git';
import { readDirAsyncDepth } from './io-readDir';

/**
 * Asynchronously read filenames contained within a target directory and filter any paths that
 * should be masked according to ignore rules in `.gitignore` files.
 *
 * @param filepath A valid directory path to read from.
 * @returns {Promise<string[]>} A Promise object for an array of filenames.
 */
export const getDescendantPaths = async (filepath: PathLike): Promise<string[]> => {
  const filepaths = (await readDirAsyncDepth(filepath, 1)).filter(p => p != filepath);
  return (await filterIgnore(filepath, filepaths, true)).map(p => p.toString());
};
