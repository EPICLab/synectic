import { PathLike } from 'fs';
import { relative, sep } from 'path';

/**
 * Evaluate whether a filepath is a descendant of a root path. Enabling `direct` flag further
 * constrains this function to only consider direct children.
 * @param root The relative or absolute path to evaluate `{from}`.
 * @param filepath The relative or absolute path to evaluate `{to}`.
 * @param direct Optional flag for constraining the defintion of descendant to only directly
 * descending children; defaults to false.
 * @returns {boolean} A boolean indicating true if the `filepath` descends from the `root` path,
 * or false otherwise.
 */
export const isDescendant = (root: PathLike, filepath: PathLike, direct = false): boolean => {
  const relativePath = relative(root.toString(), filepath.toString());
  // equivalent paths should not be considered descendant from each other
  if (relativePath.length === 0) return false;
  return direct
    ? !relativePath.startsWith('..') && !relativePath.includes(sep)
    : !relativePath.startsWith('..');
};
