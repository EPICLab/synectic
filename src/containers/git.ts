import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
isogit.plugins.set('fs', fs);

import * as io from './io';

export * from 'isomorphic-git';

/**
 * Find the root Git directory. Starting at filepath, walks upward until it finds a directory that 
 * contains a subdirectory called '.git'.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing the root Git directory path, or undefined if no root Git
 * directory exists for the filepath (i.e. the filepath is not part of a Git repo).
 */
export const getRepoRoot = async (filepath: fs.PathLike) => {
  try {
    const root = await isogit.findRoot({ filepath: filepath.toString() });
    return root;
  }
  catch (e) {
    return undefined;
  }
};

/**
 * Asynchronous check for presence of .git within directory to validate Git version control.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing true if filepath contains a .git subdirectory (or points 
 * directly to the .git directory), and false otherwise.
 */
export const isGitRepo = async (filepath: fs.PathLike) => {
  const stats = await io.extractStats(filepath);
  const directory = stats?.isDirectory() ? filepath.toString() : path.dirname(filepath.toString());
  if (directory === undefined) return false;
  const gitPath = (path.basename(directory) === '.git') ? directory : path.join(directory, '/.git');
  const gitStats = await io.extractStats(gitPath);
  if (gitStats === undefined) return false;
  else return true;
}

/**
 * Determines whether a specific file is currently tracked by Git version control.
 * @param filepath The relative or absolute path to evaluate.
 */
export const isGitTracked = async (filepath: fs.PathLike) => {
  const repoRoot = await getRepoRoot(filepath);
  return isogit.status({ dir: '/', gitdir: repoRoot, filepath: filepath.toString() });
}