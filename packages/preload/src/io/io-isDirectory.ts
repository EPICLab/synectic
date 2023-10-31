import {stat, type PathLike} from 'fs-extra';

/**
 * Asynchronously checks for the existence of a directory at the path.
 *
 * @param filepath The relative or absolute path to evaluate.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating true if the filepath
 *   is a directory, or false otherwise. Throws ENOENT error on non-existent filepath.
 */
export const isDirectory = async (filepath: PathLike): Promise<boolean> =>
  (await stat(filepath.toString())).isDirectory();
