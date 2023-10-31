import type {PathLike} from 'fs-extra';
import {relative} from 'path';

/**
 * Evaluates whether two paths are equivalent.
 *
 * @param path1 The relative or absolute path to evaluate.
 * @param path2 The other relative or absolute path to evaluate.
 * @returns {boolean} A boolean indicating true if the paths are equivalent, or false otherwise.
 */
export const isEqualPaths = (path1: PathLike, path2: PathLike): boolean => {
  return relative(path1.toString(), path2.toString()).length === 0;
};
