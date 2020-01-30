import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
isogit.plugins.set('fs', fs);
import { v4 } from 'uuid';
import parsePath from 'parse-path';

import * as io from './io';
import { Repository, NarrowType } from '../types';
import { ActionKeys, Actions } from '../store/actions';

type ExistingRepoActions = NarrowType<Actions, ActionKeys.ADD_REPO | ActionKeys.UPDATE_REPO>;

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
};

/**
 * Parse a URL to extract Git repository name, typically based on the remote origin URL.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns The repository name (e.g. 'username/repo').
 */
export const extractRepoName = (url: URL | string) => {
  const parsedPath = (typeof url === 'string') ? parsePath(url) : parsePath(url.href);
  return parsedPath.pathname.replace(/^(\/*)(?:snippets\/)?/, '').replace(/\.git$/, '');
};

/**
 * Parse a URL to extract components and protocols, along with the OAuth resource authority 
 * (GitHub, BitBucket, or GitLab) for processing with the isomorphic-git library module.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns A tuple containing the parsePath.ParsedPath object and OAuth resource name.
 */
export const extractFromURL = (url: URL | string): [parsePath.ParsedPath, Repository['oauth']] => {
  const parsedPath = (typeof url === 'string') ? parsePath(url) : parsePath(url.href);
  let oauth: Repository['oauth'] = 'github';
  switch (parsedPath.resource) {
    case (parsedPath.resource.match(/github\.com/) ? parsedPath.resource : undefined):
      oauth = 'github';
      break;
    case (parsedPath.resource.match(/bitbucket\.org/) ? parsedPath.resource : undefined):
      oauth = 'bitbucket';
      break;
    case (parsedPath.resource.match(/gitlab.*\.com/) ? parsedPath.resource : undefined):
      oauth = 'gitlab';
      break;
  }
  return [parsedPath, oauth];
}

/**
 * Determines whether a specific file is currently tracked by Git version control.
 * @param filepath The relative or absolute path to evaluate.
 */
export const isGitTracked = async (filepath: fs.PathLike) => {
  const repoRoot = await getRepoRoot(filepath);
  return isogit.status({ dir: '/', gitdir: repoRoot, filepath: filepath.toString() });
}

/**
 * Extract all necessary Git repository metadata from the root Git directory associated with the filepath,
 * either by locating an existing repository and branch ref in the Redux state or creating Redux actions
 * to add and update the state as needed.
 * @param filepath The relative or absolute path to evaluate; must be resolvable to a root Git directory.
 * @param repos The list of currently known Git repositories found in the Redux store.
 * @param ref (Optional) Git branch name; defaults to 'HEAD'.
 * @return A Promise object containing a tuple which contains the new or existing Repository object
 * related to the root Git directory of the filepath, and any Redux actions that update state for either
 * a new repository or an updated repository with a new branch ref. If the first element is undefined, 
 * either no root Git directory exists or no remote origin URL has been set for the repo. If the second
 * element is undefined, no updates to the Redux store are necessary.
 */
export const extractRepo = async (filepath: fs.PathLike, repos: Repository[], ref = 'HEAD'): Promise<[(Repository | undefined), (ExistingRepoActions | undefined)]> => {
  const rootDir = await getRepoRoot(filepath);
  if (!rootDir) return [undefined, undefined];
  const remoteOriginUrls: string[] = await isogit.config({ dir: rootDir.toString(), path: 'remote.origin.url', all: true });
  if (remoteOriginUrls.length <= 0) return [undefined, undefined];
  const [url, oauth] = extractFromURL(remoteOriginUrls[0]);
  const currentBranch = await isogit.currentBranch({ dir: rootDir.toString() });
  const username = await isogit.config({ dir: rootDir.toString(), path: 'user.name' });
  const password = await isogit.config({ dir: rootDir.toString(), path: 'credential.helper' });

  const newRepo: Repository = {
    id: v4(),
    name: extractRepoName(url.href),
    corsProxy: new URL('https://cors-anywhere.herokuapp.com/'),
    url: url,
    refs: currentBranch ? [currentBranch] : [],
    oauth: oauth,
    username: username ? username : '',
    password: password ? password : '',
    token: ''
  };

  const existingRepo = repos.find(r => r.name === newRepo.name);
  const existingRef = existingRepo ? existingRepo.refs.find(r => r === ref) : undefined;

  if (existingRepo && existingRef) return [existingRepo, undefined];
  else if (existingRepo && !existingRef) {
    const updatedRepo = { ...existingRepo, refs: [...existingRepo.refs, ref] };
    return [updatedRepo, { type: ActionKeys.UPDATE_REPO, id: existingRepo.id, repo: updatedRepo }];
  } else return [newRepo, { type: ActionKeys.ADD_REPO, id: newRepo.id, repo: newRepo }];
}